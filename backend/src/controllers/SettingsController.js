// Arquivo: backend/src/controllers/SettingsController.js
const { getSettings, updateSettings } = require('../services/SettingsService');
const { logAction } = require('../services/AuditLogService');
const nodemailer = require('nodemailer'); 
module.exports = {
  // Busca as configurações atuais (sem a palavra-passe)
  async get(request, response) {
    try {
      const settings = await getSettings();
      delete settings.smtpPass; // Nunca envie a palavra-passe para o frontend
      return response.json(settings);
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao buscar configurações.' });
    }
  },

  async testSmtp(request, response) {
    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure } = request.body;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      return response.status(400).json({ message: 'Todos os campos de SMTP são necessários para o teste.' });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        // Adiciona timeouts para evitar que a requisição fique presa
        connectionTimeout: 5000, // 5 segundos
        greetingTimeout: 5000,
        socketTimeout: 5000,
      });

      // O Nodemailer tem uma função própria para verificar a conexão
      await transporter.verify();

      // Se a verificação for bem-sucedida, tentamos enviar um e-mail de teste
      // para o próprio utilizador que está a fazer o teste.
      await transporter.sendMail({
        from: `"${smtpUser}" <${smtpUser}>`,
        to: request.user.email, // E-mail do admin logado
        subject: 'Hermes Hub - Teste de Conexão SMTP',
        html: `
          <h1>Olá!</h1>
          <p>Esta é uma mensagem de teste enviada a partir da sua nova configuração SMTP no Hermes Hub.</p>
          <p>Se recebeu este e-mail, as suas credenciais estão corretas!</p>
        `,
      });

      return response.json({ message: 'Conexão bem-sucedida! Um e-mail de teste foi enviado para o seu endereço.' });

    } catch (error) {
      console.error("Falha no teste de SMTP:", error);
      // Retorna uma mensagem de erro mais amigável
      return response.status(500).json({ message: `Falha na conexão: ${error.message}` });
    }
  },

  // Atualiza as configurações
  async update(request, response) {
    try {
      const newSettings = request.body;

      // Se uma nova palavra-passe não for enviada, não atualize o campo.
      // Isso evita que a palavra-passe seja apagada se o campo vier vazio.
      if (newSettings.smtpPass === '' || newSettings.smtpPass === null) {
        delete newSettings.smtpPass;
      }

      await updateSettings(newSettings);

      await logAction({
        userId: request.user.id,
        action: 'SETTINGS_UPDATE',
        details: { updatedKeys: Object.keys(newSettings) }
      });

      return response.json({ message: 'Configurações atualizadas com sucesso!' });
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao atualizar configurações.' });
    }
  },
};