// Arquivo: backend/src/controllers/UserController.js
const prisma = require('../database/prisma');
const bcrypt = require('bcryptjs');
const { logAction } = require('../services/AuditLogService');
const { validate, createUserSchema } = require('../validators/userValidator');

// Nova função auxiliar para validar a senha
const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) {
    errors.push("A senha deve ter no mínimo 8 caracteres.");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Deve conter pelo menos uma letra minúscula.");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Deve conter pelo menos uma letra maiúscula.");
  }
  if (!/\d/.test(password)) {
    errors.push("Deve conter pelo menos um número.");
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push("Deve conter pelo menos um caractere especial (ex: !@#$%).");
  }
  return errors;
};

module.exports = {

  async create(request, response) {
    try {
      const { name, email, login, password, profileId } = request.body;

      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        return response.status(400).json({ message: "A senha fornecida não cumpre os requisitos.", errors: passwordErrors });
      }

      if (!profileId) {
        return response.status(400).json({ message: 'O perfil é obrigatório.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: { name, email, login, password: hashedPassword, profileId },
      });

      // --- INÍCIO DA MELHORIA NO LOG ---

      // 1. Busca o nome do administrador que está realizando a ação
      const actor = await prisma.user.findUnique({
        where: { id: request.user.id },
        select: { name: true }
      });

      const actorName = actor ? actor.name : 'Sistema';

      // 2. Cria um objeto de detalhes mais descritivo
      await logAction({
        userId: request.user.id,
        action: 'USER_CREATE',
        details: {
          actor: {
            id: request.user.id,
            name: actorName,
          },
          createdUser: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
          },
          message: `O usuário '${actorName}' criou o novo usuário '${newUser.name}'.`
        },
      });
      // --- FIM DA MELHORIA NO LOG ---

      delete newUser.password;
      return response.status(201).json(newUser);
    } catch (error) {
      if (error.code === 'P2002') {
        const field = error.meta.target.includes('email') ? 'e-mail' : 'login';
        return response.status(409).json({ message: `Este ${field} já está em uso.` });
      }
      console.error("Erro ao criar usuário:", error);
      return response.status(500).json({ message: 'Erro interno ao criar usuário.' });
    }
  },

  async forceChangePassword(request, response) {
    if (request.user.action !== 'change-password') {
      return response.status(403).json({ message: 'Ação não permitida com este token.' });
    }

    const userId = request.user.id;
    const { newPassword } = request.body;

    // --- LÓGICA DE VALIDAÇÃO ADICIONADA ---
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      return response.status(400).json({ message: "A senha não cumpre os requisitos.", errors: passwordErrors });
    }
    // --- FIM DA VALIDAÇÃO ---

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          mustChangePassword: false, // <-- A flag é desativada aqui
        },
      });

      // Após a troca, o utilizador pode fazer o login normalmente
      return response.status(200).json({ message: 'Senha alterada com sucesso! Por favor, faça o login novamente.' });
    } catch (error) {
      console.error("Erro ao forçar a troca de senha:", error);
      return response.status(500).json({ message: 'Erro interno ao atualizar a senha.' });
    }
  },
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
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
          return response.status(400).json({ message: "A nova senha não cumpre os requisitos.", errors: passwordErrors });
        }
        dataToUpdate.password = await bcrypt.hash(password, 10);
      }

      const user = await prisma.user.update({
        where: { id },
        data: dataToUpdate,
      });

      await logAction({
        userId: request.user.id, // O admin que está fazendo a edição
        action: 'USER_UPDATE',
        details: {
          updatedUserId: user.id,
          updatedUserName: user.name,
          updatedFields: Object.keys(dataToUpdate) // Registra quais campos foram alterados
        }
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

  async destroy(request, response) {
    try {
      const { id } = request.params;

      // Mantém a proteção para não se auto-excluir
      if (id === request.user.id) {
        return response.status(400).json({ message: 'Você não pode excluir a sua própria conta.' });
      }

      const userToDelete = await prisma.user.findUnique({ where: { id } });
      if (!userToDelete) {
        return response.status(404).json({ message: 'Usuário não encontrado.' });
      }

      // REMOVEMOS AS VERIFICAÇÕES DE HISTÓRICO DAQUI
      // Agora, a exclusão é tentada diretamente
      await prisma.user.delete({ where: { id: id } });

      // O log da ação de exclusão é mantido
      await logAction({
        userId: request.user.id,
        action: 'USER_DELETE',
        details: { deletedUserId: id, deletedUserName: userToDelete.name }
      });

      return response.status(204).send();
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      // Fallback para caso o DB restrinja por algum motivo (ex: perfil ainda associado)
      if (error.code === 'P2003') {
        return response.status(400).json({ message: 'Este usuário não pode ser excluído pois está associado a um perfil. Remova a associação antes de tentar novamente.' });
      }
      return response.status(500).json({ message: 'Erro interno ao deletar usuário.' });
    }
  },
};

