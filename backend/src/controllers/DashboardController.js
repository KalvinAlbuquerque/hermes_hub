// Arquivo: backend/src/controllers/DashboardController.js
const prisma = require('../database/prisma');

module.exports = {
  async getStats(request, response) {
    try {
      // 1. Cálculos de contagens simples (sem alterações)
      const [sentCount, pendingCount, rejectedCount] = await Promise.all([
        prisma.notificationLog.count({ where: { status: 'SENT' } }),
        prisma.notificationLog.count({ where: { status: 'PENDING' } }),
        prisma.notificationLog.count({ where: { status: 'REJECTED' } }),
      ]);

      // 2. Agrupa por template para encontrar os mais usados (sem alterações)
      const topTemplatesData = await prisma.notificationLog.groupBy({
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

      // 3. Busca os clientes mais notificados (sem alterações)
      const topClientesData = await prisma.cliente.findMany({
        take: 5,
        orderBy: { notificationLogs: { _count: 'desc' } },
        select: { name: true, _count: { select: { notificationLogs: true } } },
      });
      const topClientes = topClientesData.map(c => ({
        name: c.name,
        count: c._count.notificationLogs,
      }));

      // --- 4. ALTERAÇÃO 1: NOVA LÓGICA PARA BUSCAR OS ANALISTAS QUE MAIS SUBMETERAM <<<< ---
      const topSubmittersData = await prisma.notificationLog.groupBy({
        by: ['submittedByUserId'],
        _count: { submittedByUserId: true },
        orderBy: { _count: { submittedByUserId: 'desc' } },
        take: 5,
      });
      const userIds = topSubmittersData.map(item => item.submittedByUserId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
      });
      const topSubmitters = topSubmittersData.map(item => ({
        name: users.find(u => u.id === item.submittedByUserId)?.name || 'Desconhecido',
        count: item._count.submittedByUserId,
      }));
      // ----------------------------------------------------------------

      // 5. ALTERAÇÃO 2: Monta o objeto final de resposta com a nova métrica <<<<
      const stats = {
        notificationCounts: { sent: sentCount, pending: pendingCount, rejected: rejectedCount },
        topTemplates: topTemplates,
        topClientes: topClientes,
        topSubmitters: topSubmitters, // <-- ADICIONADO
      };

      return response.json(stats);

    } catch (error) {
      console.error("Erro ao calcular estatísticas do dashboard:", error);
      return response.status(500).json({ message: 'Erro ao buscar dados do dashboard.' });
    }
  },
};