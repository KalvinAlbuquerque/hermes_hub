// Arquivo: backend/src/services/OAuthService.js
require('dotenv').config(); 
const { google } = require('googleapis');
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  process.env.OAUTH_REDIRECT_URI
);

// Define os escopos de permissão que a aplicação irá solicitar
const scopes = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly', // Para IMAP futuro
];

/**
 * Gera a URL de autorização do Google.
 * @param {string} emailAccountId - O ID da conta de e-mail para associar o token.
 */
function generateAuthUrl(emailAccountId) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Pede um refresh_token
    scope: scopes,
    prompt: 'consent', // Força o usuário a consentir sempre
    state: emailAccountId, // Passa o ID da conta para o callback
  });
}

/**
 * Troca o código de autorização por tokens de acesso e de atualização.
 * @param {string} code - O código recebido do Google.
 */
async function getTokens(code) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Cria um cliente OAuth2 autenticado para uma conta específica.
 * @param {object} account - O objeto EmailAccount do Prisma.
 */
function createTransporter(account) {
    const client = new google.auth.OAuth2(
        process.env.GOOGLE_OAUTH_CLIENT_ID,
        process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        process.env.OAUTH_REDIRECT_URI
    );

    client.setCredentials({
        access_token: account.accessToken,
        refresh_token: account.refreshToken,
    });

    return client;
}


module.exports = {
  generateAuthUrl,
  getTokens,
  createTransporter,
  oauth2Client,
};