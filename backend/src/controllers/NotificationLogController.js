// Arquivo: backend/src/controllers/NotificationLogController.js
const prisma = require('../database/prisma');
const { logAction } = require('../services/AuditLogService');
module.exports = {
  // Busca e filtra os logs de notificação
  async index(request, response) {
    const { page = 1, pageSize = 15, templateId, clienteId, status, submittedByUserId, approvedByUserId, subject, startDate, endDate } = request.query;
    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);

    const where = {};
    if (subject) where.subject = { contains: subject, mode: 'insensitive' };
    if (status) where.status = status;
    if (templateId) where.templateId = templateId;
    if (submittedByUserId) where.submittedByUserId = submittedByUserId;
    if (approvedByUserId) where.approvedByUserId = approvedByUserId;
    if (clienteId) where.clientes = { some: { id: clienteId } };

    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) {
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.createdAt = { ...where.createdAt, lte: nextDay };
    }

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

  // Busca os detalhes de um único log de notificação
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

      if (!log) {
        return response.status(404).json({ message: 'Log de notificação não encontrado.' });
      }

      return response.json(log);
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao buscar detalhes do log.' });
    }
  },

  async closeIncident(request, response) {
    try {
      const { id } = request.params;
      const userId = request.user.id; // O analista que está a fechar o caso

      const notificationLog = await prisma.notificationLog.update({
        where: { id },
        data: {
          incidentStatus: 'CLOSED',
        },
      });

      // Regista a ação no log de auditoria
      await logAction({
        userId: userId,
        action: 'INCIDENT_CLOSED',
        details: {
          notificationId: id,
          subject: notificationLog.subject,
        },
      });

      return response.json({ message: 'Incidente fechado com sucesso!' });
    } catch (error) {
      console.error("Erro ao fechar incidente:", error);
      return response.status(500).json({ message: 'Erro ao fechar o incidente.' });
    }
  }
};