// Arquivo: backend/src/controllers/NotificationLogController.js

const prisma = require('../database/prisma');
const { logAction } = require('../services/AuditLogService');
const { calculateNextReminder } = require('../services/CronService');
const { sendMail } = require('../services/EmailService');

module.exports = {
  async index(request, response) {
    const { page = 1, pageSize = 15, templateId, clienteId, status, submittedByUserId, approvedByUserId, subject, startDate, endDate, incidentStatus, protocol } = request.query;
    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);
    const where = {};
    if (subject) where.subject = { contains: subject, mode: 'insensitive' };
    if (status) where.status = status;
    if (templateId) where.templateId = templateId;
    if (submittedByUserId) where.submittedByUserId = submittedByUserId;
    if (approvedByUserId) where.approvedByUserId = approvedByUserId;
    if (clienteId) where.clientes = { some: { id: clienteId } };
    if (incidentStatus) where.incidentStatus = incidentStatus;
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) {
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.createdAt = { ...where.createdAt, lte: nextDay };
    }
    if (protocol) where.protocol = { contains: protocol, mode: 'insensitive' };
    try {
      const [logs, total] = await Promise.all([
        prisma.notificationLog.findMany({
          where,
          skip: (pageNum - 1) * pageSizeNum,
          take: pageSizeNum,
          orderBy: { createdAt: 'desc' },
          include: {
            template: { select: { name: true } },
            submittedByUser: { select: { name: true } },
            approvedByUser: { select: { name: true } },
            clientes: { select: { name: true } },
          },
        }),
        prisma.notificationLog.count({ where }),
      ]);
      return response.json({
        data: logs,
        total,
        totalPages: Math.ceil(total / pageSizeNum),
      });
    } catch (error) {
      console.error("Erro ao buscar logs de notificação:", error);
      return response.status(500).json({ message: 'Erro ao listar logs de notificação.' });
    }
  },

  async show(request, response) {
    try {
      const { id } = request.params;
      const log = await prisma.notificationLog.findUnique({
        where: { id },
        include: {
          template: { select: { name: true } },
          submittedByUser: { select: { name: true } },
          approvedByUser: { select: { name: true } },
          clientes: { select: { name: true, emails: true } },
          emailAccount: { select: { name: true, email: true } },
        },
      });
      if (!log) { return response.status(404).json({ message: 'Log de notificação não encontrado.' }); }
      return response.json(log);
    } catch (error) { return response.status(500).json({ message: 'Erro ao buscar detalhes do log.' }); }
  },

  async getRecentRepliesForUser(request, response) {
    try {
        const userId = request.user.id;
        const recentReplies = await prisma.notificationLog.findMany({
            where: {
                replyStatus: 'REPLIED',
                submittedByUserId: userId,
            },
            orderBy: {
                repliedAt: 'desc',
            },
            take: 15,
            select: {
                id: true,
                protocol: true,
                subject: true,
                senderHasReadReply: true,
            },
        });
        return response.json(recentReplies);
    } catch (error) {
        console.error("Erro ao buscar respostas recentes:", error);
        return response.status(500).json({ message: 'Erro ao buscar respostas recentes.' });
    }
  },

  async markRepliesAsRead(request, response) {
    try {
        const userId = request.user.id;
        const { notificationIds } = request.body;
        if (!notificationIds || !Array.isArray(notificationIds)) {
            return response.status(400).json({ message: 'IDs de notificação inválidos.' });
        }
        await prisma.notificationLog.updateMany({
            where: {
                id: { in: notificationIds },
                submittedByUserId: userId,
            },
            data: {
                senderHasReadReply: true,
            },
        });
        return response.status(204).send();
    } catch (error) {
        console.error("Erro ao marcar respostas como lidas:", error);
        return response.status(500).json({ message: 'Erro ao marcar respostas como lidas.' });
    }
  },

  async sendManualReminder(request, response) {
    try {
      const { id } = request.params;
      const userId = request.user.id;
      const incident = await prisma.notificationLog.findUnique({ where: { id }, include: { template: { include: { category: true } } } });
      if (!incident) { return response.status(404).json({ message: 'Incidente não encontrado.' }); }
      if (!incident.template?.category) { return response.status(400).json({ message: 'Incidente não possui uma categoria de SLA para enviar lembretes.' }); }
      
      const category = incident.template.category;
      const protocol = incident.protocol || `HERMES-${incident.id.substring(0, 8).toUpperCase()}`;

      // Constrói o assunto e o corpo do e-mail a partir da categoria
      const finalSubject = category.reminderSubject
        .replace(/\[ASSUNTO\]/gi, incident.subject)
        .replace(/\[PROTOCOLO\]/gi, protocol);

      const finalHtmlBody = category.reminderTemplateBody.replace(/\[PROTOCOLO\]/g, protocol);

      // --- CORREÇÃO AQUI ---
      // Garantimos que o envio do lembrete também use o campo 'to'
      // para que todos os destinatários possam interagir.
      await sendMail({
        to: incident.recipients,
        subject: finalSubject,
        html: finalHtmlBody,
        accountId: incident.emailAccountId,
        notificationId: incident.id,
      });
      // --- FIM DA CORREÇÃO ---

      const nextReminderDate = calculateNextReminder(category);
      await prisma.notificationLog.update({ where: { id: incident.id }, data: { nextReminderAt: nextReminderDate } });
      await prisma.reminderLog.create({ data: { notificationLogId: incident.id } });
      await logAction({ userId: userId, action: 'MANUAL_REMINDER_SENT', details: { notificationId: id, subject: incident.subject } });
      return response.json({ message: 'Lembrete enviado com sucesso!' });
    } catch (error) {
      console.error("Erro ao enviar lembrete manual:", error);
      return response.status(500).json({ message: 'Erro ao enviar lembrete manual.' });
    }
  },

  async closeIncident(request, response) {
    try {
      const { id } = request.params;
      const userId = request.user.id;
      const notificationLog = await prisma.notificationLog.update({ where: { id }, data: { incidentStatus: 'CLOSED' } });
      await logAction({ userId: userId, action: 'INCIDENT_CLOSED', details: { notificationId: id, subject: notificationLog.subject } });
      return response.json({ message: 'Incidente fechado com sucesso!' });
    } catch (error) {
      console.error("Erro ao fechar incidente:", error);
      return response.status(500).json({ message: 'Erro ao fechar o incidente.' });
    }
  },

  async reopenIncident(request, response) {
    try {
      const { id } = request.params;
      const userId = request.user.id;
      const notificationLog = await prisma.notificationLog.update({ where: { id }, data: { incidentStatus: 'OPEN' } });
      await logAction({ userId: userId, action: 'INCIDENT_REOPENED', details: { notificationId: id, subject: notificationLog.subject } });
      return response.json({ message: 'Incidente reaberto com sucesso!' });
    } catch (error) {
      console.error("Erro ao reabrir incidente:", error);
      return response.status(500).json({ message: 'Erro ao reabrir o incidente.' });
    }
  },

  async getReminders(request, response) {
    try {
      const { id } = request.params;
      const reminders = await prisma.reminderLog.findMany({ where: { notificationLogId: id }, orderBy: { sentAt: 'asc' } });
      return response.json(reminders);
    } catch (error) { return response.status(500).json({ message: 'Erro ao buscar histórico de lembretes.' }); }
  },

  async pauseIncident(request, response) {
    try {
      const { id } = request.params;
      const userId = request.user.id;
      const notificationLog = await prisma.notificationLog.update({ where: { id }, data: { incidentStatus: 'PAUSED' } });
      await logAction({ userId: userId, action: 'INCIDENT_PAUSED', details: { notificationId: id, subject: notificationLog.subject } });
      return response.json({ message: 'Incidente pausado com sucesso!' });
    } catch (error) {
      console.error("Erro ao pausar incidente:", error);
      return response.status(500).json({ message: 'Erro ao pausar o incidente.' });
    }
  },
};