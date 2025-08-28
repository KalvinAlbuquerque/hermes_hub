// Arquivo: backend/src/services/ImapService.js
const Imap = require('node-imap');
const { simpleParser } = require('mailparser');
const prisma = require('../database/prisma');
const { decrypt } = require('./SettingsService');
const { logAction } = require('./AuditLogService');

/**
 * Tenta extrair um Message-ID limpo, removendo os caracteres "<" e ">".
 * @param {string} idString - O ID do e-mail (ex: "<id-do-email@servidor.com>").
 * @returns {string|null} O ID limpo ou nulo.
 */
const cleanMessageId = (idString) => {
    if (!idString) return null;
    const match = idString.match(/<([^>]+)>/);
    return match ? match[1] : idString;
};

const initialize = async () => {
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
            tlsOptions: { rejectUnauthorized: false } // Adicionado para flexibilidade
        };
        if (!imapConfig.user || !imapConfig.password || !imapConfig.host) {
            console.log('IMAP não configurado. O serviço de leitura de respostas não será iniciado.');
            return;
        }

        const imap = new Imap(imapConfig);

        const processReply = async (parsedEmail, uid) => {
            const inReplyTo = cleanMessageId(parsedEmail.inReplyTo);

            // --- CORREÇÃO 1: Garante que 'references' seja sempre um array ---
            const referencesHeader = parsedEmail.references;
            const referencesArray = Array.isArray(referencesHeader)
                ? referencesHeader
                : (typeof referencesHeader === 'string' ? [referencesHeader] : []);

            const references = referencesArray.map(cleanMessageId).filter(Boolean);
            // --- FIM DA CORREÇÃO 1 ---

            console.log(`[IMAP] Processando e-mail UID ${uid}. Assunto: "${parsedEmail.subject}"`);
            console.log(`[IMAP] In-Reply-To: ${inReplyTo}`);
            console.log(`[IMAP] References: ${references.join(', ')}`);

            const potentialIds = [...new Set([inReplyTo, ...references])].filter(Boolean);

            // --- CORREÇÃO 2: Previne a busca no banco se não houver IDs ---
            if (potentialIds.length === 0) {
                console.log(`[IMAP] E-mail UID ${uid} não é uma resposta ou não tem referências válidas, ignorando.`);
                return; // Pula para o próximo e-mail
            }
            // --- FIM DA CORREÇÃO 2 ---

            try {
                const originalNotification = await prisma.notificationLog.findFirst({
                    where: { messageId: { in: potentialIds } },
                });

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

                    imap.addFlags(uid, ['\\Seen'], (err) => {
                        if (err) console.error(`[IMAP] Erro ao marcar UID ${uid} como lido:`, err);
                    });

                } else {
                    console.log(`[IMAP] Nenhuma notificação correspondente encontrada para os IDs: ${potentialIds.join(', ')}.`);
                }
            } catch (dbError) {
                console.error(`[IMAP] Erro ao processar resposta no banco de dados para UID ${uid}:`, dbError);
            }
        };


        const scanUnreadEmails = () => {
            imap.openBox('INBOX', false, (err, box) => {
                if (err) {
                    console.error('[IMAP] Erro ao abrir a caixa de entrada:', err);
                    return;
                }
                imap.search(['UNSEEN'], (searchErr, results) => {
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
                        const f = imap.fetch(results, { bodies: '' });

                        f.on('message', (msg, seqno) => {
                            console.log(`[IMAP DEBUG] A processar mensagem #${seqno}`);

                            let emailBuffer = '';
                            let uid = '';

                            msg.once('attributes', (attrs) => {
                                uid = attrs.uid;
                                console.log(`[IMAP DEBUG] Atributos recebidos para mensagem #${seqno}, UID: ${uid}`);
                            });

                            msg.on('body', (stream) => {
                                stream.on('data', (chunk) => {
                                    emailBuffer += chunk.toString('utf8');
                                });
                            });

                            msg.once('end', () => {
                                console.log(`[IMAP DEBUG] Fim do corpo da mensagem UID ${uid}. A iniciar o parser.`);
                                simpleParser(emailBuffer, async (err, parsed) => {
                                    if (err) {
                                        console.error(`[IMAP] Erro ao parsear e-mail UID ${uid}:`, err);
                                        return;
                                    }
                                    await processReply(parsed, uid);
                                });
                            });
                        });

                        f.once('error', (fetchErr) => {
                            console.error('[IMAP] Erro ao buscar mensagens:', fetchErr);
                        });

                        f.once('end', () => {
                            console.log('[IMAP] Concluído o processamento dos e-mails não lidos.');
                        });

                    } catch (fetchError) {
                        console.error('[IMAP] Erro fatal ao iniciar o fetch:', fetchError);
                    }
                });
            });
        };


        imap.once('ready', () => {
            console.log('✅ Serviço de leitura de e-mails (IMAP) conectado.');
            scanUnreadEmails(); // Primeira verificação ao conectar
            imap.on('mail', () => {
                console.log('[IMAP] Novo e-mail recebido, a re-verificar a caixa de entrada...');
                scanUnreadEmails(); // Verifica novamente quando um novo e-mail chega
            });
        });

        imap.once('error', (err) => console.error('Erro no IMAP:', err));
        imap.once('end', () => console.log('Conexão IMAP encerrada.'));
        imap.connect();
    } catch (error) { console.error("Falha ao inicializar o serviço IMAP:", error); }
};

module.exports = { initialize };