// Arquivo: backend/src/services/CronService.js

const cron = require('node-cron');
const prisma = require('../database/prisma');
const { sendMail } = require('./EmailService');

const checkOpenIncidents = async () => {
  console.log('[CRON] Executando verificação de incidentes abertos...');

  try {
    const openIncidents = await prisma.notificationLog.findMany({
      where: { incidentStatus: 'OPEN' },
    });

    if (openIncidents.length === 0) {
      console.log('[CRON] Nenhum incidente aberto encontrado.');
      return;
    }

    console.log(`[CRON] ${openIncidents.length} incidente(s) aberto(s) encontrado(s). Processando...`);

    for (const incident of openIncidents) {
      // 1. REGISTAR O LEMBRETE NO HISTÓRICO
      // Esta ação substitui o envio de e-mail para o analista.
      await prisma.reminderLog.create({
        data: {
          notificationLogId: incident.id,
        },
      });

      // 2. ENVIAR O E-MAIL "AMEAÇADOR" AOS DESTINATÁRIOS
      if (incident.recipients && incident.recipients.length > 0 && incident.emailAccountId) {
        
        // Cria um identificador único para a notificação (ex: HERMES-12345)
        const notificationNumber = `HERMES-${incident.id.substring(0, 8).toUpperCase()}`;
        const subject = `[LEMBRETE] Pendência em Aberto: ${incident.subject}`;
        const html = `
          <div style="font-family: sans-serif; text-align: center; padding: 40px;">
            <h1 style="color: red; font-size: 24px; border: 2px solid red; padding: 10px;">
              ---- NOTIFICAÇÃO ${notificationNumber} ----
            </h1>
            <p style="margin-top: 20px; color: #555;">Este é um lembrete automático sobre uma pendência que continua em aberto.</p>
          </div>
        `;

        // Envia para todos os destinatários originais do incidente
        for (const recipient of incident.recipients) {
            await sendMail({
                to: recipient,
                subject: subject,
                html: html,
                accountId: incident.emailAccountId,
            });
        }
      }
    }
    console.log('[CRON] Tarefa de lembretes finalizada com sucesso.');
  } catch (error) {
    console.error('[CRON] Erro ao executar a tarefa de verificação de incidentes:', error);
  }
};

const initialize = () => {
  cron.schedule('0 9 * * *', checkOpenIncidents, {
    scheduled: true,
    timezone: "America/Sao_Paulo",
  });
  console.log('⏰ Serviço de agendamento (Cron) de incidentes inicializado. A verificação ocorrerá diariamente às 09:00.');
};

module.exports = { initialize };