// Arquivo: backend/src/controllers/ProfileController.js
const prisma = require('../database/prisma');

module.exports = {
  // Criar um novo perfil
  async create(request, response) {
    try {
      const { name, permissions } = request.body;
      const profile = await prisma.profile.create({
        data: { name, permissions },
      });
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
      return response.json(profile);
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao atualizar perfil.' });
    }
  },

  // Deletar um perfil
  async destroy(request, response) {
    try {
      const { id } = request.params;
      // Adicionar verificação para não deixar deletar perfis em uso
      const usersInProfile = await prisma.user.count({ where: { profileId: id } });
      if (usersInProfile > 0) {
        return response.status(400).json({ message: 'Não é possível excluir um perfil que está em uso por um ou mais usuários.' });
      }
      await prisma.profile.delete({ where: { id } });
      return response.status(204).send();
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao deletar perfil.' });
    }
  },

  async create(request, response) {
    try {
      const { name, permissions } = request.body;
      const profile = await prisma.profile.create({
        data: { name, permissions },
      });
      return response.status(201).json(profile);
    } catch (error) {
      // Adicionamos esta linha para ver o erro no terminal
      console.error("DETALHES DO ERRO AO CRIAR PERFIL:", error); 

      if (error.code === 'P2002') {
        return response.status(409).json({ message: 'Um perfil com este nome já existe.' });
      }
      return response.status(500).json({ message: 'Erro ao criar perfil.' });
    }
  },
};

