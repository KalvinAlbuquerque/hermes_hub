// Arquivo: backend/src/services/OAuthService.js
require('dotenv').config();
const { google } = require('googleapis');
const jwt = require('jsonwebtoken'); // NOVO: Importar JWT

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  process.env.OAUTH_REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
];

/**
 * Gera a URL de autorização do Google.
 * @param {object} accountData - Dados da conta (pode ser ID ou dados de uma nova conta).
 */
function generateAuthUrl(accountData) {
  // ALTERADO: Usar um JWT para o estado, permitindo passar mais dados
  const stateToken = jwt.sign(accountData, process.env.JWT_SECRET, { expiresIn: '10m' });

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: stateToken, // Passa o token JWT como estado
  });
}

// ... o resto do arquivo permanece igual ...
async function getTokens(code) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

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