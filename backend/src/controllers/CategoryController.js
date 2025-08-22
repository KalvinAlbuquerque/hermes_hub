// Arquivo: backend/src/controllers/CategoryController.js
const prisma = require('../database/prisma');
const { logAction } = require('../services/AuditLogService');

module.exports = {
  // Criar uma nova categoria
  async create(request, response) {
    try {
      const { name, reminderMode, reminderIntervalHours, reminderSpecificTime, reminderTemplateBody } = request.body;
      const category = await prisma.category.create({
        data: {
          name,
          reminderMode,
          reminderIntervalHours: reminderIntervalHours ? parseInt(reminderIntervalHours) : null,
          reminderSpecificTime,
          reminderTemplateBody,
        },
      });

      await logAction({ userId: request.user.id, action: 'CATEGORY_CREATE', details: { categoryId: category.id, categoryName: category.name } });
      return response.status(201).json(category);
    } catch (error) {
      if (error.code === 'P2002') {
        return response.status(409).json({ message: 'Uma categoria com este nome já existe.' });
      }
      console.error("Erro ao criar categoria:", error);
      return response.status(500).json({ message: 'Erro ao criar categoria.' });
    }
  },

  // Listar todas as categorias
  async index(request, response) {
    try {
      const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
      return response.json(categories);
    } catch (error) {
        return response.status(500).json({ message: 'Erro ao listar categorias.' });
    }
  },

  // Atualizar uma categoria
  async update(request, response) {
    try {
      const { id } = request.params;
      const { name, reminderMode, reminderIntervalHours, reminderSpecificTime, reminderTemplateBody } = request.body;
      const category = await prisma.category.update({
        where: { id },
        data: {
            name,
            reminderMode,
            reminderIntervalHours: reminderIntervalHours ? parseInt(reminderIntervalHours) : null,
            reminderSpecificTime,
            reminderTemplateBody,
        },
      });

      await logAction({ userId: request.user.id, action: 'CATEGORY_UPDATE', details: { categoryId: category.id, newName: category.name } });
      return response.json(category);
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao atualizar categoria.' });
    }
  },

  // Deletar uma categoria
  async destroy(request, response) {
    try {
      const { id } = request.params;
      
      const templatesInCategory = await prisma.template.count({ where: { categoryId: id } });
      if (templatesInCategory > 0) {
        return response.status(400).json({ message: 'Não é possível excluir uma categoria que está em uso por um ou mais templates.' });
      }

      const categoryToDelete = await prisma.category.findUnique({ where: { id } });
      if(!categoryToDelete) return response.status(404).send();

      await prisma.category.delete({ where: { id } });

      await logAction({ userId: request.user.id, action: 'CATEGORY_DELETE', details: { deletedCategoryId: id, deletedCategoryName: categoryToDelete.name } });
      return response.status(204).send();
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao deletar categoria.' });
    }
  },
};