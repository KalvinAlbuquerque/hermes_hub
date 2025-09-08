// Arquivo: backend/src/controllers/CategoryController.js
const prisma = require('../database/prisma');
const { logAction } = require('../services/AuditLogService');
const { calculateNextReminder } = require('../services/CronService'); // 1. Importar a função de cálculo

module.exports = {
  // Criar uma nova categoria
  async create(request, response) {
    try {
      const { name, reminderSubject, reminderMode, reminderIntervalHours, reminderSpecificTime, reminderTemplateBody } = request.body;
      const category = await prisma.category.create({
        data: {
          name,
          reminderSubject,
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
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { templates: true },
          },
        },
      });
      return response.json(categories);
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao listar categorias.' });
    }
  },

  async getReferences(request, response) {
    try {
      const { id } = request.params;
      const templates = await prisma.template.findMany({
        where: { categoryId: id },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
      return response.json(templates);
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao buscar referências da categoria.' });
    }
  },

  // Atualizar uma categoria
  async update(request, response) {
    try {
      const { id } = request.params;
      const { name, reminderSubject, reminderMode, reminderIntervalHours, reminderSpecificTime, reminderTemplateBody } = request.body;
      
      // --- INÍCIO DA LÓGICA DE ATUALIZAÇÃO ---
      // 2. Usar uma transação para garantir que ambas as operações (update e updateMany) sejam bem-sucedidas
      const updatedCategory = await prisma.$transaction(async (tx) => {
        const category = await tx.category.update({
          where: { id },
          data: {
            name,
            reminderSubject,
            reminderMode,
            reminderIntervalHours: reminderIntervalHours ? parseInt(reminderIntervalHours) : null,
            reminderSpecificTime,
            reminderTemplateBody,
          },
        });

        // 3. Calcula a data do próximo lembrete com base nas NOVAS regras da categoria
        const nextReminderDate = calculateNextReminder(category);

        // 4. Encontra todos os templates que usam esta categoria
        const templatesInCategory = await tx.template.findMany({
          where: { categoryId: id },
          select: { id: true },
        });
        const templateIds = templatesInCategory.map(t => t.id);

        // 5. Atualiza TODOS os incidentes ABERTOS que usam templates desta categoria
        if (templateIds.length > 0) {
          await tx.notificationLog.updateMany({
            where: {
              templateId: { in: templateIds },
              incidentStatus: 'OPEN',
            },
            data: {
              nextReminderAt: nextReminderDate, // Aplica a nova data de lembrete
            },
          });
        }
        
        return category;
      });
      // --- FIM DA LÓGICA DE ATUALIZAÇÃO ---

      await logAction({ userId: request.user.id, action: 'CATEGORY_UPDATE', details: { categoryId: updatedCategory.id, newName: updatedCategory.name } });
      return response.json(updatedCategory);
    } catch (error) {
      console.error("Erro ao atualizar categoria e reagendar lembretes:", error);
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
      if (!categoryToDelete) return response.status(404).send();

      await prisma.category.delete({ where: { id } });

      await logAction({ userId: request.user.id, action: 'CATEGORY_DELETE', details: { deletedCategoryId: id, deletedCategoryName: categoryToDelete.name } });
      return response.status(204).send();
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao deletar categoria.' });
    }
  },
};