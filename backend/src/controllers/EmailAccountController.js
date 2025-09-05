// Arquivo: backend/src/controllers/EmailAccountController.js
const prisma = require('../database/prisma');
const { logAction } = require('../services/AuditLogService');
const { encrypt, decrypt } = require('../services/SettingsService'); // Reutilizamos a lógica de encriptação
const nodemailer = require('nodemailer');
module.exports = {
  // Criar uma nova conta de e-mail
  async create(request, response) {
    try {
      // 1. Recebe o novo campo authType
      const { name, email, authType, smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, status } = request.body;

      const data = {
        name,
        email,
        authType: authType || 'PASSWORD',
        status: status || 'ACTIVE',
      };

      // 2. Só adiciona dados de SMTP se o tipo for 'PASSWORD'
      if (data.authType === 'PASSWORD') {
        data.smtpHost = smtpHost;
        data.smtpPort = parseInt(smtpPort);
        data.smtpUser = smtpUser;
        data.smtpPass = encrypt(smtpPass || '');
        data.smtpSecure = smtpSecure;
      }

      const account = await prisma.emailAccount.create({ data });

      await logAction({ /* ... */ });
      return response.status(201).json(account);

    } catch (error) {
      // ADICIONADO LOG DETALHADO E TRATAMENTO DE ERRO ESPECIALIZADO
      console.error("Erro ao criar conta de e-mail:", error); // Loga o erro completo no terminal do backend

      // Verifica se o erro é de violação de campo único (ex: nome duplicado)
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0]; // Pega o nome do campo que falhou
        return response.status(409).json({ message: `Uma conta com este '${field}' já existe.` });
      }

      // Para todos os outros erros, retorna uma mensagem genérica
      return response.status(500).json({ message: 'Erro interno ao criar conta de e-mail.' });
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
      const { name, email, authType, smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, status } = request.body;

      const dataToUpdate = { name, email, status, authType: authType || 'PASSWORD' };

      if (dataToUpdate.authType === 'PASSWORD') {
        dataToUpdate.smtpHost = smtpHost;
        dataToUpdate.smtpPort = parseInt(smtpPort);
        dataToUpdate.smtpUser = smtpUser;
        dataToUpdate.smtpSecure = smtpSecure;
        if (smtpPass !== undefined) {
          dataToUpdate.smtpPass = encrypt(smtpPass);
        }
      } else {
        // Se mudar para OAuth2, limpa os dados de senha antigos
        dataToUpdate.smtpHost = null;
        dataToUpdate.smtpPort = null;
        dataToUpdate.smtpUser = null;
        dataToUpdate.smtpPass = null;
        dataToUpdate.smtpSecure = null;
      }

      const account = await prisma.emailAccount.update({ where: { id }, data: dataToUpdate });

      await logAction({ /* ... */ });
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

  async testConnection(request, response) {
    // Os dados vêm diretamente do formulário, não do banco
    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, email } = request.body;

    if (!smtpHost || !smtpPort || !smtpUser || !email) {
      return response.status(400).json({ message: 'Host, Porta, Usuário e E-mail do remetente são necessários para o teste.' });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure, // O frontend enviará true/false diretamente
        tls: {
          rejectUnauthorized: false
        },
        auth: {
          user: smtpUser,
          pass: smtpPass, // A senha virá descriptografada do formulário
        },
        connectionTimeout: 10000, // 10 segundos
      });

      // Verifica a conexão
      await transporter.verify();

      // Envia um e-mail de teste para o próprio e-mail do remetente
      await transporter.sendMail({
        from: `"${smtpUser}" <${email}>`,
        to: email,
        subject: 'Hermes Hub - Teste de Conexão SMTP',
        html: `<h1>Sucesso!</h1><p>Se você recebeu este e-mail, a sua configuração SMTP está correta!</p>`,
      });

      return response.json({ message: 'Conexão bem-sucedida! Um e-mail de teste foi enviado.' });

    } catch (error) {
      console.error("Falha no teste de SMTP:", error);
      return response.status(500).json({ message: `Falha na conexão: ${error.message}` });
    }
  },
};