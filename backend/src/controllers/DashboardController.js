// Arquivo: backend/src/controllers/DashboardController.js
const prisma = require('../database/prisma');

/**
 * Calcula a data de início com base no período solicitado.
 * @param {string} period - O período ('24h', '7d', '30d').
 * @returns {Date|null} A data de início ou nulo se o período for 'all'.
 */
function getStartDate(period) {
  const now = new Date();
  if (period === '24h') {
    return new Date(now.setDate(now.getDate() - 1));
  }
  if (period === '7d') {
    return new Date(now.setDate(now.getDate() - 7));
  }
  if (period === '30d') {
    return new Date(now.setDate(now.getDate() - 30));
  }
  return null; // Retorna nulo para 'all' ou qualquer outro valor
}

module.exports = {
  async getStats(request, response) {
    try {
      const { period } = request.query;
      const startDate = getStartDate(period);

      // Objeto de filtro de data para ser reutilizado nas queries
      const dateFilter = startDate ? { createdAt: { gte: startDate } } : {};

      // --- 1. Contagens Simples ---
      const [sentCount, pendingCount, rejectedCount] = await Promise.all([
        prisma.notificationLog.count({ where: { status: 'SENT', ...dateFilter } }),
        prisma.notificationLog.count({ where: { status: 'PENDING', ...dateFilter } }),
        prisma.notificationLog.count({ where: { status: 'REJECTED', ...dateFilter } }),
      ]);

      // --- 2. Top Templates ---
      const topTemplatesData = await prisma.notificationLog.groupBy({
        where: dateFilter,
        by: ['templateId'],
        _count: { templateId: true },
        orderBy: { _count: { templateId: 'desc' } },
        take: 5,
      });
      const templateIds = topTemplatesData.map(item => item.templateId);
      const templates = await prisma.template.findMany({
        where: { id: { in: templateIds } },
        select: { id: true, name: true },
      });
      const topTemplates = topTemplatesData.map(item => ({
        name: templates.find(t => t.id === item.templateId)?.name || 'Desconhecido',
        count: item._count.templateId,
      }));

      // --- 3. Top Clientes ---
      // Para clientes, a lógica de filtro é um pouco diferente
      const topClientesData = await prisma.cliente.findMany({
        where: startDate ? { notificationLogs: { some: { createdAt: { gte: startDate } } } } : {},
        select: {
          name: true,
          _count: {
            select: { notificationLogs: { where: dateFilter } },
          },
        },
      });
      const topClientes = topClientesData
        .map(c => ({
          name: c.name,
          count: c._count.notificationLogs,
        }))
        .filter(c => c.count > 0) // Mostra apenas clientes com notificações no período
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);


      // --- 4. Top Submissores (Geral) & Incidentes Abertos por Analista ---
      const topSubmittersData = await prisma.notificationLog.groupBy({
        where: dateFilter,
        by: ['submittedByUserId'],
        _count: { submittedByUserId: true },
        orderBy: { _count: { submittedByUserId: 'desc' } },
        take: 5,
      });

      const openIncidentsByAnalystData = await prisma.notificationLog.groupBy({
        where: { incidentStatus: 'OPEN', ...dateFilter },
        by: ['submittedByUserId'],
        _count: { submittedByUserId: true },
        orderBy: { _count: { submittedByUserId: 'desc' } },
        take: 5,
      });

      // Otimização: Busca os nomes dos usuários de uma só vez
      const userIds = [...new Set([
        ...topSubmittersData.map(item => item.submittedByUserId),
        ...openIncidentsByAnalystData.map(item => item.submittedByUserId)
      ])];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
      });

      const topSubmitters = topSubmittersData.map(item => ({
        name: users.find(u => u.id === item.submittedByUserId)?.name || 'Desconhecido',
        count: item._count.submittedByUserId,
      }));
      const openIncidentsByAnalyst = openIncidentsByAnalystData.map(item => ({
        name: users.find(u => u.id === item.submittedByUserId)?.name || 'Desconhecido',
        count: item._count.submittedByUserId,
      }));


      // --- 5. Notificações por Categoria ---
      const templatesWithCategoryCounts = await prisma.template.findMany({
        where: {
          categoryId: { not: null },
          notificationLogs: { some: dateFilter }
        },
        include: {
          category: { select: { name: true } },
          _count: { select: { notificationLogs: { where: dateFilter } } }
        }
      });

      const categoryCounts = templatesWithCategoryCounts.reduce((acc, template) => {
        if (template.category) {
          const categoryName = template.category.name;
          const count = template._count.notificationLogs;
          if (count > 0) {
            acc[categoryName] = (acc[categoryName] || 0) + count;
          }
        }
        return acc;
      }, {});

      const notificationsByCategory = Object.entries(categoryCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const repliedNotifications = await prisma.notificationLog.findMany({
        where: {
          ...dateFilter,
          replyStatus: 'REPLIED',
          repliedAt: { not: null },
          clientes: { some: {} } // Garante que apenas notificações com clientes associados sejam consideradas
        },
        select: {
          createdAt: true,
          repliedAt: true,
          clientes: {
            select: { name: true }
          }
        }
      });

      const responseTimes = {};
      repliedNotifications.forEach(notification => {
        const responseTime = new Date(notification.repliedAt).getTime() - new Date(notification.createdAt).getTime();
        notification.clientes.forEach(cliente => {
          if (!responseTimes[cliente.name]) {
            responseTimes[cliente.name] = { totalTime: 0, count: 0 };
          }
          responseTimes[cliente.name].totalTime += responseTime;
          responseTimes[cliente.name].count++;
        });
      });

      const averageResponseTimeByClient = Object.entries(responseTimes)
        .map(([name, data]) => ({
          name,
          // Converte o tempo médio de milissegundos para horas
          averageHours: (data.totalTime / data.count) / (1000 * 60 * 60)
        }))
        .sort((a, b) => a.averageHours - b.averageHours); // Ordena do mais rápido para o mais lento

      // --- 6. Monta o objeto final de resposta ---
      const stats = {
        notificationCounts: { sent: sentCount, pending: pendingCount, rejected: rejectedCount },
        topTemplates,
        topClientes,
        topSubmitters,
        openIncidentsByAnalyst,
        notificationsByCategory,
        averageResponseTimeByClient, // Adiciona o novo dado
      };

      return response.json(stats);

    } catch (error) {
      console.error("Erro ao calcular estatísticas do dashboard:", error);
      return response.status(500).json({ message: 'Erro ao buscar dados do dashboard.' });
    }
  },
};