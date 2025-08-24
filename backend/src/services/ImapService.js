// Arquivo: backend/src/services/ImapService.js
const Imap = require('node-imap');
const { simpleParser } = require('mailparser');
const prisma = require('../database/prisma');
const { decrypt } = require('./SettingsService');
const { logAction } = require('./AuditLogService');

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
        };
        if (!imapConfig.user || !imapConfig.password || !imapConfig.host) {
            console.log('IMAP não configurado no banco de dados. O serviço de leitura de respostas não será iniciado.');
            return;
        }

        const imap = new Imap(imapConfig);

        const processReply = async (parsedEmail) => {
            const messageIdToFind = parsedEmail.inReplyTo || (parsedEmail.references && parsedEmail.references[0]);
            if (!messageIdToFind) return;

            console.log(`[IMAP] E-mail de resposta detectado. Procurando pelo Message-ID: ${messageIdToFind}`);
            try {
                const originalNotification = await prisma.notificationLog.findFirst({
                    where: { messageId: messageIdToFind },
                });

                if (originalNotification) {
                    console.log(`[IMAP] Incidente correspondente encontrado: ${originalNotification.protocol}. Atualizando status.`);
                    await prisma.notificationLog.update({
                        where: { id: originalNotification.id },
                        data: {
                            replyStatus: 'REPLIED',
                            incidentStatus: 'PAUSED',
                            repliedAt: new Date(),
                            senderHasReadReply: false, // Define como não lido para o remetente
                        },
                    });
                    await logAction({
                        userId: originalNotification.submittedByUserId,
                        action: 'INCIDENT_REPLIED',
                        details: {
                            notificationId: originalNotification.id,
                            subject: originalNotification.subject,
                            repliedFrom: parsedEmail.from.text,
                        },
                    });
                    console.log(`[IMAP] Status do incidente ${originalNotification.protocol} atualizado para PAUSED e REPLIED.`);
                } else {
                    console.log(`[IMAP] Nenhuma notificação correspondente encontrada para o Message-ID.`);
                }
            } catch (dbError) {
                console.error(`[IMAP] Erro ao processar resposta no banco de dados:`, dbError);
            }
        };
        
        imap.once('ready', () => {
            console.log('✅ Serviço de leitura de e-mails (IMAP) conectado.');
            imap.openBox('INBOX', true, (err, box) => {
                if (err) throw err;
                console.log(`[IMAP] Caixa de entrada aberta. ${box.messages.total} mensagens.`);
                imap.on('mail', () => {
                    console.log('[IMAP] Novo e-mail recebido, re-verificando caixa de entrada...');
                    imap.openBox('INBOX', true, (err, box) => {
                         if (err) throw err;
                         const f = imap.seq.fetch(box.messages.total + ':*', { bodies: '' });
                         f.on('message', (msg) => {
                             msg.on('body', (stream) => {
                                 simpleParser(stream, async (err, parsed) => {
                                     if (err) { console.error('[IMAP] Erro ao parsear e-mail:', err); return; }
                                     await processReply(parsed);
                                 });
                             });
                         });
                    });
                });
            });
        });

        imap.once('error', (err) => console.error('Erro no IMAP:', err) );
        imap.once('end', () => console.log('Conexão IMAP encerrada.') );
        imap.connect();
    } catch (error) { console.error("Falha ao inicializar o serviço IMAP:", error); }
};

module.exports = { initialize };