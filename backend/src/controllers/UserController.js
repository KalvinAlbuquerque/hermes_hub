// Arquivo: backend/src/controllers/UserController.js
const prisma = require('../database/prisma');
const bcrypt = require('bcryptjs');

module.exports = {
  // Listar todos os usuários (sem a senha)
  async index(request, response) {
    try {
      const users = await prisma.user.findMany({
        orderBy: { name: 'asc' },
        select: { // Seleciona os campos para retornar, omitindo a senha
          id: true,
          name: true,
          login: true,
          email: true,
          status: true,
          profile: { // Inclui os dados do perfil relacionado
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      return response.json(users);
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao listar usuários.' });
    }
  },

  // Atualizar um usuário
  async update(request, response) {
    try {
      const { id } = request.params;
      const { name, login, email, status, profileId, password } = request.body;

      const dataToUpdate = { name, login, email, status, profileId };

      // Apenas atualiza a senha se uma nova for fornecida
      if (password) {
        dataToUpdate.password = await bcrypt.hash(password, 10);
      }

      const user = await prisma.user.update({
        where: { id },
        data: dataToUpdate,
      });

      delete user.password; // Garante que a senha nunca seja retornada
      return response.json(user);
    } catch (error) {
      if (error.code === 'P2002') {
        const field = error.meta.target.includes('email') ? 'e-mail' : 'login';
        return response.status(409).json({ message: `Este ${field} já está em uso.` });
      }
      return response.status(500).json({ message: 'Erro ao atualizar usuário.' });
    }
  },

  // Criar usuário já está em legacyRoutes.js, não precisamos recriar aqui.
  // Futuramente, podemos mover para cá se quisermos refatorar.
};