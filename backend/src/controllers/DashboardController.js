// Arquivo: backend/src/controllers/DashboardController.js
const prisma = require('../database/prisma');

module.exports = {
  async getStats(request, response) {
    try {
      // 1. Cálculos de contagens simples em paralelo
      const [sentCount, pendingCount, rejectedCount] = await Promise.all([
        prisma.notificationLog.count({ where: { status: 'SENT' } }),
        prisma.notificationLog.count({ where: { status: 'PENDING' } }),
        prisma.notificationLog.count({ where: { status: 'REJECTED' } }),
      ]);

      // 2. Agrupa por template para encontrar os mais usados
      const topTemplatesData = await prisma.notificationLog.groupBy({
        by: ['templateId'],
        _count: {
          templateId: true,
        },
        orderBy: {
          _count: {
            templateId: 'desc',
          },
        },
        take: 5,
      });

      // Busca os nomes dos templates para enriquecer os dados
      const templateIds = topTemplatesData.map(item => item.templateId);
      const templates = await prisma.template.findMany({
        where: { id: { in: templateIds } },
        select: { id: true, name: true },
      });
      const topTemplates = topTemplatesData.map(item => {
        const template = templates.find(t => t.id === item.templateId);
        return {
          name: template ? template.name : 'Template Desconhecido',
          count: item._count.templateId,
        };
      });

      // 3. Busca os clientes mais notificados
      const topClientes = await prisma.cliente.findMany({
        take: 5,
        orderBy: {
          notificationLogs: {
            _count: 'desc',
          },
        },
        select: {
          name: true,
          _count: {
            select: { notificationLogs: true },
          },
        },
      });

      // Formata os dados para o frontend
      const formattedTopClientes = topClientes.map(cliente => ({
        name: cliente.name,
        count: cliente._count.notificationLogs,
      }));

      // 4. Monta o objeto final de resposta
      const stats = {
        notificationCounts: {
          sent: sentCount,
          pending: pendingCount,
          rejected: rejectedCount,
        },
        topTemplates: topTemplates,
        topClientes: formattedTopClientes,
      };

      return response.json(stats);

    } catch (error) {
      console.error("Erro ao calcular estatísticas do dashboard:", error);
      return response.status(500).json({ message: 'Erro ao buscar dados do dashboard.' });
    }
  },
};