// Arquivo: backend/src/controllers/TemplateController.js
const prisma = require('../database/prisma');
const { logAction } = require('../services/AuditLogService'); 
module.exports = {
  // Criar um template
  async create(request, response) {
    try {
      const { name, subject, body } = request.body;
      const authorId = request.user.id; // Pegamos o ID do usuário logado (do middleware)

      const newTemplate = await prisma.template.create({
        data: { name, subject, body, authorId },
      });

       await logAction({
        userId: authorId,
        action: 'TEMPLATE_CREATE',
        details: { templateId: newTemplate.id, templateName: newTemplate.name }
      });

      return response.status(201).json(newTemplate);
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao criar template.' });
    }
  },

  // Listar todos os templates
  async index(request, response) {
    // 1. Pega os parâmetros da URL, com valores padrão caso não sejam fornecidos
    const { page = 1, pageSize = 10 } = request.query;

    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);

    try {
      // 2. Faz duas chamadas ao banco em paralelo para otimizar
      const [templates, total] = await Promise.all([
        // Busca os templates da página atual
        prisma.template.findMany({
          skip: (pageNum - 1) * pageSizeNum, // Pula os registros das páginas anteriores
          take: pageSizeNum,               // Pega o número de registros para a página
          orderBy: { createdAt: 'desc' },
        }),
        // Conta o total de templates no banco
        prisma.template.count(),
      ]);

      // 3. Retorna os dados e também o total de páginas
      return response.json({
        data: templates,
        total,
        totalPages: Math.ceil(total / pageSizeNum),
      });
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao listar templates.' });
    }
  },


  // Atualizar um template
  async update(request, response) {
    try {
      const { id } = request.params;
      const { name, subject, body } = request.body;

      const updatedTemplate = await prisma.template.update({
        where: { id },
        data: { name, subject, body },
      });

        await logAction({
        userId: request.user.id,
        action: 'TEMPLATE_UPDATE',
        details: { templateId: updatedTemplate.id, newTemplateName: updatedTemplate.name }
      });

      return response.json(updatedTemplate);
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao atualizar template.' });
    }
  },

  // Deletar um template
  async destroy(request, response) {
    try {
      const { id } = request.params;
      await prisma.template.delete({ where: { id } });

      await logAction({
        userId: request.user.id,
        action: 'TEMPLATE_DELETE',
        details: { deletedTemplateId: id, deletedTemplateName: templateToDelete.name }
      });
      
      return response.status(204).send(); // 204 = Sucesso, sem conteúdo
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao deletar template.' });
    }
  }
};