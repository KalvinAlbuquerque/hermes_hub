// Arquivo: backend/src/controllers/AuditLogController.js
const prisma = require('../database/prisma');

module.exports = {
  async index(request, response) {
    const { page = 1, pageSize = 15 } = request.query; // Padrão de 15 por página
    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);

    try {
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          skip: (pageNum - 1) * pageSizeNum,
          take: pageSizeNum,
          orderBy: { createdAt: 'desc' }, // Mais recentes primeiro
          include: {
            user: { // Inclui o nome do usuário relacionado
              select: { name: true },
            },
          },
        }),
        prisma.auditLog.count(),
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