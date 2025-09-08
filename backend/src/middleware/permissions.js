// Arquivo: backend/src/middleware/permissions.js
const prisma = require('../database/prisma');

/**
 * Middleware para verificar se o usuário tem uma ou mais permissões.
 * @param {...string} requiredPermissions - Uma ou mais strings de permissão necessárias (ex: 'users:read', 'users:create').
 */
const can = (...requiredPermissions) => {
  return async (request, response, next) => {
    const userId = request.user.id;

    if (!userId) {
        return response.status(401).json({ message: 'Acesso não autorizado: ID de usuário não encontrado no token.' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          profile: {
            select: {
              permissions: true,
            },
          },
        },
      });

      if (!user || !user.profile || typeof user.profile.permissions !== 'object') {
        return response.status(403).json({ message: 'Acesso negado: Perfil ou permissões não configurados.' });
      }

      const userPermissions = user.profile.permissions;
      
      // --- CORREÇÃO DA LÓGICA ---
      // Verifica se o usuário tem PELO MENOS UMA das permissões necessárias (lógica OU)
      const hasPermission = requiredPermissions.some(
        (permission) => userPermissions[permission] === true
      );

      if (!hasPermission) {
        return response.status(403).json({ message: 'Você não tem permissão para executar esta ação.' });
      }
      // --- FIM DA CORREÇÃO ---

      return next();

    } catch (error) {
      console.error("Erro ao verificar permissões:", error);
      return response.status(500).json({ message: 'Erro interno ao verificar permissões.' });
    }
  };
};

module.exports = { can };