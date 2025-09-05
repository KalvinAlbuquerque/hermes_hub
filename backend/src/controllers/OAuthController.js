// Arquivo: backend/src/controllers/OAuthController.js
const { generateAuthUrl, getTokens, oauth2Client } = require('../services/OAuthService');
const { encrypt } = require('../services/SettingsService');
const prisma = require('../database/prisma');

module.exports = {
  // Inicia o fluxo, gerando e enviando a URL de autorização
  async startAuth(request, response) {
    const { emailAccountId } = request.body;
    if (!emailAccountId) {
      return response.status(400).json({ message: 'ID da conta de e-mail é obrigatório.' });
    }
    const authUrl = generateAuthUrl(emailAccountId);
    return response.json({ authUrl });
  },

  // Rota de callback que o Google irá chamar
  async handleCallback(request, response) {
    const { code, state: emailAccountId } = request.query;

    try {
      const tokens = await getTokens(code);

      // Salva os tokens no banco de dados para a conta correta
      await prisma.emailAccount.update({
        where: { id: emailAccountId },
        data: {
          accessToken: encrypt(tokens.access_token),
          refreshToken: encrypt(tokens.refresh_token),
          tokenExpiresAt: new Date(tokens.expiry_date),
          status: 'ACTIVE' // Ativa a conta
        },
      });

      // Retorna uma página simples para fechar a janela pop-up
      return response.send('<script>window.close();</script>');
    } catch (error) {
      console.error('Erro no callback do OAuth2:', error);
      return response.status(500).send('<h1>Erro de Autenticação</h1><p>Não foi possível obter os tokens de autorização. Por favor, tente novamente.</p>');
    }
  },
};