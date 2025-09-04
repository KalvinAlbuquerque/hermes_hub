// Arquivo: backend/src/controllers/UserController.js
const prisma = require('../database/prisma');
const bcrypt = require('bcryptjs');
const { logAction } = require('../services/AuditLogService');
const { validate, createUserSchema } = require('../validators/userValidator');
module.exports = {

 async create(request, response) {
    try {
      const { name, email, login, password, profileId } = request.body;

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

      // Não permite que um usuário se auto-delete
      if (id === request.user.id) {
        return response.status(400).json({ message: 'Você не pode excluir a sua própria conta.' });
      }

      const userToDelete = await prisma.user.findUnique({ where: { id } });
      if (!userToDelete) {
        return response.status(404).json({ message: 'Usuário não encontrado.' });
      }

      // Verifica se o usuário tem registros importantes associados
      const submittedNotifications = await prisma.notificationLog.count({ where: { submittedByUserId: id } });
      const createdTemplates = await prisma.template.count({ where: { authorId: id } });

      if (submittedNotifications > 0 || createdTemplates > 0) {
        return response.status(400).json({ message: 'Não é possível excluir um usuário que já criou templates ou enviou notificações.' });
      }

      // Verifica os logs de auditoria
      const auditLogs = await prisma.auditLog.findMany({ where: { userId: id } });

      // A exclusão só é permitida se não houver logs, ou se houver apenas UM log e a ação for 'USER_CREATE'
      const canBeHardDeleted = auditLogs.length === 0 || (auditLogs.length === 1 && auditLogs[0].action === 'USER_CREATE');

      if (!canBeHardDeleted) {
        return response.status(400).json({ message: 'Não é possível excluir este usuário pois ele já realizou outras ações no sistema.' });
      }

      // Usamos uma transação para garantir que ambas as operações (apagar logs e usuário) funcionem ou falhem juntas
      await prisma.$transaction(async (tx) => {
        // 1. Deleta os logs de auditoria associados (que sabemos que são seguros para deletar neste ponto)
        if (auditLogs.length > 0) {
          await tx.auditLog.deleteMany({ where: { userId: id } });
        }

        // 2. Agora, deleta o usuário
        await tx.user.delete({ where: { id: id } });
      });

      // Loga a ação de exclusão (realizada pelo admin logado)
      await logAction({
        userId: request.user.id,
        action: 'USER_DELETE',
        details: { deletedUserId: id, deletedUserName: userToDelete.name }
      });

      return response.status(204).send();
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      return response.status(500).json({ message: 'Erro interno ao deletar usuário.' });
    }
  },
};
