// Arquivo: backend/src/controllers/TemplateController.js
const prisma = require('../database/prisma');
const { logAction } = require('../services/AuditLogService');

module.exports = {
  // Criar um template
  async create(request, response) {
    try {
      // 1. Adicionar categoryId à desestruturação
      const { name, subject, body, categoryId } = request.body;
      const authorId = request.user.id;

      if (!categoryId) {
        return response.status(400).json({ message: 'A seleção de uma categoria é obrigatória.' });
      }

      if (!authorId) {
        return response.status(401).json({ message: 'Não foi possível identificar o autor. Sessão inválida.' });
      }

      const newTemplate = await prisma.template.create({
        // 2. Adicionar categoryId aos dados
        data: { name, subject, body, authorId, categoryId },
      });

      await logAction({
        userId: authorId,
        action: 'TEMPLATE_CREATE',
        details: { templateId: newTemplate.id, templateName: newTemplate.name }
      });

      return response.status(201).json(newTemplate);
    } catch (error) {
      console.error("Falha ao criar template:", error);
      return response.status(500).json({
        message: 'Erro interno ao criar o template.',
        errorDetails: process.env.NODE_ENV !== 'production' ? error.message : undefined
      });
    }
  },

  // Listar todos os templates
  async index(request, response) {
    const { page = 1, pageSize = 10 } = request.query;
    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);

    try {
      const [templates, total] = await Promise.all([
        prisma.template.findMany({
          skip: (pageNum - 1) * pageSizeNum,
          take: pageSizeNum,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.template.count(),
      ]);

      return response.json({
        data: templates,
        total,
        totalPages: Math.ceil(total / pageSizeNum),
      });
    } catch (error) {
      console.error("Falha ao listar templates:", error);
      return response.status(500).json({ message: 'Erro ao listar templates.' });
    }
  },

  // Atualizar um template
  async update(request, response) {
    try {
      const { id } = request.params;
      // 1. Adicionar categoryId à desestruturação
      const { name, subject, body, categoryId } = request.body;
      if (!categoryId) {
        return response.status(400).json({ message: 'A seleção de uma categoria é obrigatória.' });
      }
      const updatedTemplate = await prisma.template.update({
        where: { id },
        // 2. Adicionar categoryId aos dados
        data: { name, subject, body, categoryId },
      });

      await logAction({
        userId: request.user.id,
        action: 'TEMPLATE_UPDATE',
        details: { templateId: updatedTemplate.id, newTemplateName: updatedTemplate.name }
      });

      return response.json(updatedTemplate);
    } catch (error) {
      console.error("Falha ao atualizar template:", error);
      return response.status(500).json({ message: 'Erro ao atualizar template.' });
    }
  },

  // Deletar um template
   async destroy(request, response) {
    try {
      const { id } = request.params;

      const templateToDelete = await prisma.template.findUnique({ where: { id } });
      if (!templateToDelete) {
        return response.status(404).json({ message: 'Template não encontrado.' });
      }

      // REMOVEMOS A VERIFICAÇÃO DE USO EM NOTIFICAÇÕES
      await prisma.template.delete({ where: { id } });

      await logAction({
        userId: request.user.id,
        action: 'TEMPLATE_DELETE',
        details: { deletedTemplateId: id, deletedTemplateName: templateToDelete.name }
      });

      return response.status(204).send();
    } catch (error) {
      console.error("Falha ao deletar template:", error);
      return response.status(500).json({ message: 'Erro ao deletar template.' });
    }
  }
};
