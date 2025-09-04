// Arquivo: backend/src/services/ImapService.js
const Imap = require('node-imap');
const { simpleParser } = require('mailparser');
const prisma = require('../database/prisma');
const { decrypt } = require('./SettingsService');
const { logAction } = require('./AuditLogService');

// Variáveis globais para controlar a conexão e o estado do serviço
let imapConnection = null;
let connectionStatus = 'stopped'; // 'stopped', 'connecting', 'connected', 'error'

/**
 * Limpa o Message-ID, removendo os caracteres "<" e ">".
 * @param {string} idString O ID do e-mail.
 * @returns {string|null} O ID limpo ou nulo.
 */
const cleanMessageId = (idString) => {
    if (!idString) return null;
    const match = idString.match(/<([^>]+)>/);
    return match ? match[1] : idString;
};

/**
 * Processa um e-mail para verificar se é uma resposta a um incidente.
 * @param {object} parsedEmail O objeto do e-mail parseado.
 * @param {number} uid O ID único do e-mail na caixa de entrada.
 */
const processReply = async (parsedEmail, uid) => {
    const inReplyTo = cleanMessageId(parsedEmail.inReplyTo);
    const referencesHeader = parsedEmail.references;
    const referencesArray = Array.isArray(referencesHeader)
        ? referencesHeader
        : (typeof referencesHeader === 'string' ? [referencesHeader] : []);
    const references = referencesArray.map(cleanMessageId).filter(Boolean);
    const potentialIds = [...new Set([inReplyTo, ...references])].filter(Boolean);

    console.log(`[IMAP] Processando e-mail UID ${uid}. Assunto: "${parsedEmail.subject}"`);

    let originalNotification = null;

    try {
        // 1. Primeira tentativa: Buscar pelo Message-ID (método principal)
        if (potentialIds.length > 0) {
            console.log(`[IMAP] Tentando encontrar por Message-ID(s): ${potentialIds.join(', ')}`);
            originalNotification = await prisma.notificationLog.findFirst({
                where: { messageId: { in: potentialIds } },
            });
        }

        // 2. Segunda tentativa (Fallback): Buscar pelo Protocolo no Assunto do e-mail
        if (!originalNotification && parsedEmail.subject) {
            const protocolMatch = parsedEmail.subject.match(/([A-Z0-9]{8})/i);
            if (protocolMatch && protocolMatch[0]) {
                const protocol = protocolMatch[0].toUpperCase();
                console.log(`[IMAP] Message-ID não encontrado. Tentando encontrar por Protocolo: ${protocol}`);
                originalNotification = await prisma.notificationLog.findFirst({
                    where: { protocol: protocol },
                });
            }
        }

        // 3. Processar a notificação se ela foi encontrada por qualquer um dos métodos
        if (originalNotification) {
            console.log(`[IMAP] Incidente correspondente encontrado: ${originalNotification.protocol}. Atualizando status.`);
            await prisma.notificationLog.update({
                where: { id: originalNotification.id },
                data: {
                    replyStatus: 'REPLIED',
                    incidentStatus: 'PAUSED',
                    repliedAt: new Date(),
                    senderHasReadReply: false,
                },
            });
            await logAction({
                userId: originalNotification.submittedByUserId,
                action: 'INCIDENT_REPLIED',
                details: {
                    notificationId: originalNotification.id,
                    protocol: originalNotification.protocol,
                    repliedFrom: parsedEmail.from.text,
                },
            });
            console.log(`[IMAP] Status do incidente ${originalNotification.protocol} atualizado para PAUSED e REPLIED.`);

            if (imapConnection) {
                imapConnection.addFlags(uid, ['\\Seen'], (err) => {
                    if (err) console.error(`[IMAP] Erro ao marcar UID ${uid} como lido:`, err);
                });
            }

        } else {
            console.log(`[IMAP] Nenhuma notificação correspondente encontrada para o e-mail UID ${uid}. Ignorando.`);
        }
    } catch (dbError) {
        console.error(`[IMAP] Erro ao processar resposta no banco de dados para UID ${uid}:`, dbError);
    }
};


/**
 * Inicia a conexão e o monitoramento da caixa de entrada IMAP.
 */
const start = async () => {
    if (connectionStatus === 'connected' || connectionStatus === 'connecting') {
        console.log('[IMAP] O serviço já está conectado ou conectando. Nenhuma ação necessária.');
        return;
    }

    console.log('[IMAP] Iniciando serviço de leitura de e-mails...');
    connectionStatus = 'connecting';

    try {
        const settingKeys = ['imapHost', 'imapPort', 'imapUser', 'imapPassword', 'imapTls'];
        const settingsFromDb = await prisma.systemSetting.findMany({ where: { key: { in: settingKeys } } });
        const settingsMap = settingsFromDb.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {});

        const imapConfig = {
            user: settingsMap.imapUser,
            password: settingsMap.imapPassword ? decrypt(settingsMap.imapPassword) : null,
            host: settingsMap.imapHost,
            port: parseInt(settingsMap.imapPort, 10) || 993,
            tls: settingsMap.imapTls ? settingsMap.imapTls === 'true' : true,
            tlsOptions: { rejectUnauthorized: false }
        };

        if (!imapConfig.user || !imapConfig.password || !imapConfig.host) {
            console.log('[IMAP] Configurações de IMAP ausentes. O serviço não será iniciado.');
            connectionStatus = 'stopped';
            return;
        }

        const imap = new Imap(imapConfig);
        imapConnection = imap;

        const scanUnreadEmails = () => {
            if (!imapConnection) return;
            imapConnection.openBox('INBOX', false, (err, box) => {
                if (err) {
                    console.error('[IMAP] Erro ao abrir a caixa de entrada:', err);
                    return;
                }
                imapConnection.search(['UNSEEN'], (searchErr, results) => {
                    if (searchErr) {
                        console.error('[IMAP] Erro ao procurar e-mails não lidos:', searchErr);
                        return;
                    }
                    if (results.length === 0) {
                        console.log('[IMAP] Nenhum e-mail não lido encontrado.');
                        return;
                    }
                    console.log(`[IMAP] Encontrados ${results.length} e-mails não lidos. A processar...`);
                    try {
                        const f = imapConnection.fetch(results, { bodies: '' });
                        f.on('message', (msg, seqno) => {
                            let emailBuffer = '';
                            let uid = '';
                            msg.once('attributes', (attrs) => { uid = attrs.uid; });
                            msg.on('body', (stream) => { stream.on('data', (chunk) => { emailBuffer += chunk.toString('utf8'); }); });
                            msg.once('end', () => {
                                simpleParser(emailBuffer, async (err, parsed) => {
                                    if (err) { console.error(`[IMAP] Erro ao parsear e-mail UID ${uid}:`, err); return; }
                                    await processReply(parsed, uid);
                                });
                            });
                        });
                        f.once('error', (fetchErr) => { console.error('[IMAP] Erro ao buscar mensagens:', fetchErr); });
                        f.once('end', () => { console.log('[IMAP] Concluído o processamento dos e-mails não lidos.'); });
                    } catch (fetchError) { console.error('[IMAP] Erro fatal ao iniciar o fetch:', fetchError); }
                });
            });
        };

        imap.once('ready', () => {
            connectionStatus = 'connected';
            console.log('✅ Serviço de leitura de e-mails (IMAP) conectado.');
            scanUnreadEmails();
            imap.on('mail', () => {
                console.log('[IMAP] Novo e-mail recebido, a re-verificar a caixa de entrada...');
                scanUnreadEmails();
            });
        });

        imap.once('error', (err) => {
            console.error('[IMAP] Erro na conexão:', err);
            connectionStatus = 'error';
            imapConnection = null;
        });

        imap.once('end', () => {
            console.log('[IMAP] Conexão encerrada.');
            connectionStatus = 'stopped';
            imapConnection = null;
        });

        imap.connect();

    } catch (error) {
        console.error("Falha ao inicializar o serviço IMAP:", error);
        connectionStatus = 'error';
        imapConnection = null;
    }
};

/**
 * Para a conexão IMAP ativa, se existir.
 */
const stop = () => {
    if (imapConnection) {
        console.log('[IMAP] Parando serviço de leitura de e-mails...');
        connectionStatus = 'stopped';
        imapConnection.end();
        imapConnection = null;
    }
};

/**
 * Para a conexão atual e inicia uma nova, útil para aplicar novas configurações.
 */
const restart = async () => {
    console.log('[IMAP] Reiniciando serviço...');
    stop();
    // Adiciona um pequeno delay para garantir que a conexão antiga seja totalmente encerrada
    setTimeout(start, 2000);
};

module.exports = { start, stop, restart };