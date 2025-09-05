// Arquivo: backend/src/controllers/OAuthController.js
const jwt = require('jsonwebtoken'); // NOVO
const { generateAuthUrl, getTokens } = require('../services/OAuthService');
const { encrypt } = require('../services/SettingsService');
const prisma = require('../database/prisma');

module.exports = {
  async startAuth(request, response) {
    // ALTERADO: Recebe os dados completos da conta
    const { accountData } = request.body;
    if (!accountData || (!accountData.id && !accountData.email)) {
      return response.status(400).json({ message: 'Dados da conta de e-mail são obrigatórios.' });
    }
    const authUrl = generateAuthUrl(accountData);
    return response.json({ authUrl });
  },

  async handleCallback(request, response) {
    // ALTERADO: O 'state' agora é um token JWT
    const { code, state: stateToken } = request.query;

    try {
      // 1. Verifica o token JWT do estado
      const decodedState = jwt.verify(stateToken, process.env.JWT_SECRET);
      const { id: emailAccountId, name, email, authType } = decodedState;

      // 2. Obtém os tokens do Google
      const tokens = await getTokens(code);

      // 3. Prepara os dados para salvar
      const accountDbData = {
        accessToken: encrypt(tokens.access_token),
        refreshToken: encrypt(tokens.refresh_token),
        tokenExpiresAt: new Date(tokens.expiry_date),
        status: 'ACTIVE'
      };
      
      // 4. Se for uma nova conta, adiciona os dados do state. Se for existente, apenas atualiza.
      if (emailAccountId) {
        // Atualiza uma conta existente (reconectar)
        await prisma.emailAccount.update({
          where: { id: emailAccountId },
          data: accountDbData,
        });
      } else {
        // Cria uma nova conta
        await prisma.emailAccount.create({
          data: {
            ...accountDbData,
            name,
            email,
            authType: authType || 'OAUTH2',
          },
        });
      }
      
      // Retorna uma página simples para fechar a janela pop-up e notificar o pai
      return response.send("<script>window.opener.postMessage('auth-success', '*'); window.close();</script>");

    } catch (error) {
      console.error('Erro no callback do OAuth2:', error);
      return response.status(500).send('<h1>Erro de Autenticação</h1><p>Não foi possível obter os tokens. Tente novamente.</p>');
    }
  },
};