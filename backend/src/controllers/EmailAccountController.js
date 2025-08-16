// Arquivo: backend/src/controllers/EmailAccountController.js
const prisma = require('../database/prisma');
const { logAction } = require('../services/AuditLogService');
const { encrypt, decrypt } = require('../services/SettingsService'); // Reutilizamos a lógica de encriptação

module.exports = {
  // Criar uma nova conta de e-mail
  async create(request, response) {
    try {
      const { name, email, smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure } = request.body;
      const encryptedPass = encrypt(smtpPass); // Encripta a senha antes de salvar

      const account = await prisma.emailAccount.create({
        data: { name, email, smtpHost, smtpPort: parseInt(smtpPort), smtpUser, smtpPass: encryptedPass, smtpSecure },
      });

      await logAction({ userId: request.user.id, action: 'EMAIL_ACCOUNT_CREATE', details: { accountId: account.id, accountName: account.name } });
      return response.status(201).json(account);
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao criar conta de e-mail.' });
    }
  },

  // Listar todas as contas (sem enviar as senhas)
  async index(request, response) {
    const accounts = await prisma.emailAccount.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, status: true }, // Nunca retorna a senha
    });
    return response.json(accounts);
  },

  // Buscar uma conta específica para edição (também sem a senha)
  async show(request, response) {
    const { id } = request.params;
    const account = await prisma.emailAccount.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, status: true, smtpHost: true, smtpPort: true, smtpUser: true, smtpSecure: true },
    });
    return response.json(account);
  },

  // Atualizar uma conta
  async update(request, response) {
    try {
      const { id } = request.params;
      const { name, email, smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, status } = request.body;

      const dataToUpdate = { name, email, smtpHost, smtpPort: parseInt(smtpPort), smtpUser, smtpSecure, status };

      // --- ALTERAÇÃO AQUI ---
      // Agora, a senha é atualizada mesmo que seja uma string vazia.
      // O 'if' verifica se a propriedade 'smtpPass' foi realmente enviada no pedido.
      // Se não foi (undefined), não a alteramos. Se foi (incluindo ''), nós atualizamo-la.
      if (smtpPass !== undefined) {
        dataToUpdate.smtpPass = encrypt(smtpPass);
      }

      const account = await prisma.emailAccount.update({ where: { id }, data: dataToUpdate });

      await logAction({ userId: request.user.id, action: 'EMAIL_ACCOUNT_UPDATE', details: { accountId: account.id, accountName: account.name } });
      return response.json(account);
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao atualizar conta de e-mail.' });
    }
  },

  // Deletar uma conta
  async destroy(request, response) {
    try {
      const { id } = request.params;
      const accountToDelete = await prisma.emailAccount.findUnique({ where: { id } });
      await prisma.emailAccount.delete({ where: { id } });

      await logAction({ userId: request.user.id, action: 'EMAIL_ACCOUNT_DELETE', details: { deletedAccountId: id, deletedAccountName: accountToDelete.name } });
      return response.status(204).send();
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao deletar conta de e-mail.' });
    }
  },
};