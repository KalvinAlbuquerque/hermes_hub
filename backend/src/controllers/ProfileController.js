// Arquivo: backend/src/controllers/ProfileController.js
const prisma = require('../database/prisma');
const { logAction } = require('../services/AuditLogService');
module.exports = {
  // Criar um novo perfil
  async create(request, response) {
    try {
      const { name, permissions } = request.body;
      const profile = await prisma.profile.create({
        data: { name, permissions },
      });

      // --- 2. USE O SERVIÇO DE LOG ---
      await logAction({
        userId: request.user.id,
        action: 'PROFILE_CREATE',
        details: { profileId: profile.id, profileName: profile.name }
      });

      // ---------------------------------

      return response.status(201).json(profile);
    } catch (error) {
      if (error.code === 'P2002') {
        return response.status(409).json({ message: 'Um perfil com este nome já existe.' });
      }
      return response.status(500).json({ message: 'Erro ao criar perfil.' });
    }
  },


  // Listar todos os perfis
  async index(request, response) {
    const profiles = await prisma.profile.findMany({
      orderBy: { name: 'asc' },
      // Inclui a contagem de usuários diretamente na listagem
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
    return response.json(profiles);
  },
  // Atualizar um perfil
  async update(request, response) {
    try {
      const { id } = request.params;
      const { name, permissions } = request.body;
      const profile = await prisma.profile.update({
        where: { id },
        data: { name, permissions },
      });

      await logAction({
        userId: request.user.id,
        action: 'PROFILE_UPDATE',
        details: { profileId: profile.id, newName: profile.name }
      });

      return response.json(profile);
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao atualizar perfil.' });
    }
  },

  // Deletar um perfil
  async destroy(request, response) {
    try {
      const { id } = request.params;

      const usersInProfile = await prisma.user.count({ where: { profileId: id } });
      if (usersInProfile > 0) {
        return response.status(400).json({ message: 'Não é possível excluir um perfil que está em uso por um ou mais usuários.' });
      }

      const profileToDelete = await prisma.profile.findUnique({ where: { id } });
      if (!profileToDelete) {
        return response.status(404).json({ message: 'Perfil não encontrado.' });
      }

      await prisma.profile.delete({ where: { id } });

      await logAction({
        userId: request.user.id,
        action: 'PROFILE_DELETE',
        // --- CORREÇÃO AQUI ---
        details: { deletedProfileId: id, deletedProfileName: profileToDelete.name }
      });

      return response.status(204).send();
    } catch (error) {
      console.error("Erro ao deletar perfil:", error);
      return response.status(500).json({ message: 'Erro ao deletar perfil.' });
    }
  },

   async getReferences(request, response) {
    try {
      const { id } = request.params;
      const users = await prisma.user.findMany({
        where: { profileId: id },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
      return response.json(users);
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao buscar referências do perfil.' });
    }
  },

}

