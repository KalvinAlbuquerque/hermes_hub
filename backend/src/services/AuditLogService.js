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
  try {
    // Busca o nome do usuário ANTES de criar o log
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    });
    const userName = user ? user.name : 'Usuário Desconhecido';

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        // Salva uma cópia do nome do usuário diretamente no JSON de detalhes
        details: {
          ...details,
          userNameAtTheTime: userName, // Grava o nome no momento da ação
        },
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