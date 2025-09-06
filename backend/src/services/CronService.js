// Arquivo: backend/src/services/CronService.js

const cron = require('node-cron');
const prisma = require('../database/prisma');
const { sendMail } = require('./EmailService');

/**
 * Calcula a próxima data e hora para um lembrete com base nas regras da categoria.
 * @param {object} category - O objeto da categoria com as regras de SLA.
 * @returns {Date|null} A data/hora do próximo lembrete, ou null se não houver lembrete.
 */
function calculateNextReminder(category) {
  // Se não houver categoria ou o modo for 'NONE', não agenda lembrete.
  if (!category || category.reminderMode === 'NONE') {
    return null;
  }

  const now = new Date();

  if (category.reminderMode === 'INTERVAL') {
    // Adiciona o número de horas do intervalo à hora atual.
    return new Date(now.getTime() + category.reminderIntervalHours * 60 * 60 * 1000);
  }

  if (category.reminderMode === 'SPECIFIC_TIME') {
    // Lógica para agendar para a próxima ocorrência do horário específico.
    const [hours, minutes] = category.reminderSpecificTime.split(':').map(Number);
    const nextReminder = new Date();
    nextReminder.setHours(hours, minutes, 0, 0);

    // Se o horário de hoje já passou, agenda para o mesmo horário amanhã.
    if (nextReminder <= now) {
      nextReminder.setDate(nextReminder.getDate() + 1);
    }
    return nextReminder;
  }

  // Retorna nulo se nenhum modo válido for encontrado
  return null;
}


/**
 * Função principal que verifica e envia os lembretes agendados.
 */
const processScheduledReminders = async () => {
  console.log('[CRON] Executando verificação de lembretes agendados...');

  // Busca apenas incidentes ABERTOS cujo `nextReminderAt` está no passado.
  const incidentsToRemind = await prisma.notificationLog.findMany({
    where: {
      incidentStatus: 'OPEN',
      nextReminderAt: {
        lte: new Date(), // "less than or equal to" a hora atual
      },
    },
    include: {
      template: {
        include: {
          category: true, // Inclui os dados da categoria associada ao template
        },
      },
    },
  });

  if (incidentsToRemind.length === 0) {
    console.log('[CRON] Nenhum lembrete pendente encontrado.');
    return;
  }

  console.log(`[CRON] ${incidentsToRemind.length} incidente(s) com lembretes pendentes. Processando...`);

  for (const incident of incidentsToRemind) {
    try {
      const category = incident.template?.category;

      // Pula se o incidente, por algum motivo, não tiver uma categoria com regras.
      // E agora, também se a categoria for NONE (calculateNextReminder retornará null)
      if (!category || !category.reminderTemplateBody) {
        // Para evitar loops infinitos, marca como nulo para não tentar novamente.
        await prisma.notificationLog.update({
          where: { id: incident.id },
          data: { nextReminderAt: null },
        });
        continue;
      }

      const protocol = incident.protocol || `HERMES-${incident.id.substring(0, 8).toUpperCase()}`;

      // Substitui o placeholder no corpo do e-mail
      const finalHtmlBody = category.reminderTemplateBody.replace(/\[PROTOCOLO\]/g, protocol);
      
      const finalSubject = category.reminderSubject
        .replace(/\[ASSUNTO\]/gi, incident.subject)
        .replace(/\[PROTOCOLO\]/gi, protocol);

      // Envia o e-mail usando o corpo do template da categoria
      await sendMail({
        to: incident.recipients,
        subject: finalSubject,
        html: finalHtmlBody,
        accountId: incident.emailAccountId,
      });

      // Calcula a data/hora do PRÓXIMO lembrete
      const nextReminderDate = calculateNextReminder(category);

      // Atualiza o incidente com a nova data do próximo lembrete (ou null se for NONE)
      await prisma.notificationLog.update({
        where: { id: incident.id },
        data: { nextReminderAt: nextReminderDate },
      });

      // Adiciona um registro ao histórico de lembretes
      await prisma.reminderLog.create({
        data: {
          notificationLogId: incident.id,
        },
      });

      if(nextReminderDate) {
        console.log(`[CRON] Lembrete para o incidente ${incident.id} enviado. Próximo agendado para: ${nextReminderDate.toLocaleString()}`);
      } else {
        console.log(`[CRON] Lembrete para o incidente ${incident.id} enviado. Nenhum outro lembrete será agendado.`);
      }


    } catch (error) {
      console.error(`[CRON] Erro ao processar lembrete para o incidente ${incident.id}:`, error);
    }
  }
  console.log('[CRON] Tarefa de lembretes finalizada.');
};
/**
 * Inicializa o serviço de agendamento.
 */
const initialize = () => {
  // Executa a verificação a cada minuto.
  cron.schedule('* * * * *', processScheduledReminders, {
    scheduled: true,
    timezone: "America/Sao_Paulo",
  });
  console.log('⏰ Serviço de agendamento (Cron) inteligente inicializado. Verificando a cada minuto.');
};

module.exports = { initialize, calculateNextReminder };