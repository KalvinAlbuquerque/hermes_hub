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
      
      // Verifica se TODAS as permissões necessárias estão presentes e são 'true'
      const hasAllPermissions = requiredPermissions.every(
        (permission) => userPermissions[permission] === true
      );

      if (!hasAllPermissions) {
        return response.status(403).json({ message: 'Você não tem permissão para executar esta ação.' });
      }

      return next();

    } catch (error) {
      console.error("Erro ao verificar permissões:", error);
      return response.status(500).json({ message: 'Erro interno ao verificar permissões.' });
    }
  };
};

module.exports = { can };