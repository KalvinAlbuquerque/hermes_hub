// Arquivo: backend/src/controllers/OAuthController.js
const jwt = require('jsonwebtoken');
const { getTokens } = require('../services/OAuthService');
const { encrypt } = require('../services/SettingsService');
const prisma = require('../database/prisma');

module.exports = {
  async startAuth(request, response) {
    const { accountData } = request.body;
    if (!accountData || (!accountData.id && !accountData.email)) {
      return response.status(400).json({ message: 'Dados da conta de e-mail são obrigatórios.' });
    }
    const { generateAuthUrl } = require('../services/OAuthService'); // Movido para dentro para evitar dependência circular se houver
    const authUrl = generateAuthUrl(accountData);
    return response.json({ authUrl });
  },

  async handleCallback(request, response) {
    const { code, state: stateToken } = request.query;

    try {
      const decodedState = jwt.verify(stateToken, process.env.JWT_SECRET);
      const { id: emailAccountId, name, email, authType } = decodedState;

      const tokens = await getTokens(code);

      // --- INÍCIO DA CORREÇÃO ---
      // Prepara os dados que SEMPRE serão atualizados
      const accountDbData = {
        accessToken: encrypt(tokens.access_token),
        tokenExpiresAt: new Date(tokens.expiry_date),
        status: 'ACTIVE'
      };

      // SÓ atualiza o refreshToken se um NOVO for recebido do Google
      if (tokens.refresh_token) {
        accountDbData.refreshToken = encrypt(tokens.refresh_token);
      }
      // --- FIM DA CORREÇÃO ---

      if (emailAccountId) {
        await prisma.emailAccount.update({
          where: { id: emailAccountId },
          data: accountDbData,
        });
      } else {
        // Se for uma conta nova, o refresh_token é obrigatório
        if (!accountDbData.refreshToken) {
            throw new Error("Refresh token não foi recebido do Google na primeira autorização.");
        }
        await prisma.emailAccount.create({
          data: {
            ...accountDbData,
            name,
            email,
            authType: authType || 'OAUTH2',
          },
        });
      }

      return response.send("<script>window.opener.postMessage('auth-success', '*'); window.close();</script>");

    } catch (error) {
      console.error('Erro no callback do OAuth2:', error);
      return response.status(500).send('<h1>Erro de Autenticação</h1><p>Não foi possível obter os tokens. Tente novamente.</p>');
    }
  },
};