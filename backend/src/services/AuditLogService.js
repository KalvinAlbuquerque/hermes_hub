// Arquivo: backend/src/services/AuditLogService.js
const prisma = require('../database/prisma');

/**
 * Registra uma ação de auditoria no banco de dados.
 * @param {object} logData - Os dados para o log.
 * @param {string} logData.userId - O ID do usuário que realizou a ação.
 * @param {string} logData.action - Um código para a ação (ex: 'PROFILE_CREATE').
 * @param {object} [logData.details] - Um objeto JSON com detalhes extras (ex: { profileName: 'Admin' }).
 * @param {string} [logData.ipAddress] - O endereço IP da requisição.
 */
async function logAction({ userId, action, details = null, ipAddress = null }) {
  // Usamos um try...catch para garantir que uma falha no log de auditoria
  // nunca quebre a funcionalidade principal da aplicação.
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
        ipAddress,
      },
    });
  } catch (error) {
    // Em um cenário de produção real, você poderia logar esse erro em um
    // sistema de monitoramento (Sentry, Datadog, etc.)
    console.error('Falha ao gravar no log de auditoria:', error);
  }
}

module.exports = { logAction };