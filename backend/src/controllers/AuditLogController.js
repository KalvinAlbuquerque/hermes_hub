// Arquivo: backend/src/controllers/AuditLogController.js
const prisma = require('../database/prisma');

module.exports = {
  async index(request, response) {
    // 1. Extrai os parâmetros de filtro da URL, além da paginação
    const { page = 1, pageSize = 15, userId, action, startDate, endDate } = request.query;
    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);

    // 2. Constrói o objeto de filtro dinamicamente
    const where = {};
    if (userId) {
      where.userId = userId;
    }
    if (action) {
      // Usamos 'contains' para buscas parciais e 'insensitive' para não diferenciar maiúsculas/minúsculas
      where.action = { contains: action, mode: 'insensitive' };
    }
    if (startDate) {
      // Adiciona a condição de data de início (maior ou igual a)
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }
    if (endDate) {
      // Adiciona a condição de data de fim (menor ou igual a)
      // Adicionamos 1 dia para incluir o dia inteiro selecionado
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.createdAt = { ...where.createdAt, lte: nextDay };
    }

    try {
      // 3. Usa o objeto 'where' nas duas consultas (para os dados e para a contagem total)
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where, // <-- APLICA OS FILTROS AQUI
          skip: (pageNum - 1) * pageSizeNum,
          take: pageSizeNum,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true } } },
        }),
        prisma.auditLog.count({ where }), // <-- E APLICA AQUI TAMBÉM
      ]);

      return response.json({
        data: logs,
        total,
        totalPages: Math.ceil(total / pageSizeNum),
      });
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error);
      return response.status(500).json({ message: 'Erro ao listar logs de auditoria.' });
    }
  },
};