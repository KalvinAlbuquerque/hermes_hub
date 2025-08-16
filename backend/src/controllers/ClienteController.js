// Arquivo: backend/src/controllers/ClienteController.js
const prisma = require('../database/prisma');
const { logAction } = require('../services/AuditLogService');

module.exports = {
  // Criar um novo cliente
  async create(request, response) {
    try {
      const { name, emails } = request.body;
      const cliente = await prisma.cliente.create({
        data: { name, emails },
      });

      await logAction({
        userId: request.user.id,
        action: 'CLIENTE_CREATE',
        details: { clienteId: cliente.id, clienteName: cliente.name }
      });

      return response.status(201).json(cliente);
    } catch (error) {
      if (error.code === 'P2002') {
        return response.status(409).json({ message: 'Um cliente com este nome já existe.' });
      }
      return response.status(500).json({ message: 'Erro ao criar cliente.' });
    }
  },

  // Listar todos os clientes
  async index(request, response) {
    const clientes = await prisma.cliente.findMany({
      orderBy: { name: 'asc' },
    });
    return response.json(clientes);
  },

  // Atualizar um cliente
  async update(request, response) {
    try {
      const { id } = request.params;
      const { name, emails, status } = request.body;
      const cliente = await prisma.cliente.update({
        where: { id },
        data: { name, emails, status },
      });

      await logAction({
        userId: request.user.id,
        action: 'CLIENTE_UPDATE',
        details: { clienteId: cliente.id, newName: cliente.name }
      });

      return response.json(cliente);
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao atualizar cliente.' });
    }
  },

  // Deletar um cliente
  async destroy(request, response) {
    try {
      const { id } = request.params;
      const clienteToDelete = await prisma.cliente.findUnique({ where: { id } });

      await prisma.cliente.delete({ where: { id } });

      await logAction({
        userId: request.user.id,
        action: 'CLIENTE_DELETE',
        details: { deletedClienteId: id, deletedClienteName: clienteToDelete.name }
      });

      return response.status(204).send();
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao deletar cliente.' });
    }
  },
};