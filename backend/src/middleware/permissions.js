// Arquivo: backend/src/middleware/permissions.js
const prisma = require('../database/prisma');

/**
 * Middleware para verificar se o usuário tem uma permissão específica.
 * @param {string} permission - O nome da permissão necessária (ex: 'canManageUsers').
 */
const can = (permission) => {
  return async (request, response, next) => {
    const userId = request.user.id;

    try {
      // Busca o usuário e seu perfil com as permissões
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: {
            select: {
              permissions: true,
            },
          },
        },
      });

      // Se o usuário não for encontrado ou não tiver perfil, nega o acesso
      if (!user || !user.profile) {
        return response.status(403).json({ message: 'Acesso negado: Perfil não encontrado.' });
      }

      // Verifica se a permissão existe e está definida como 'true'
      const hasPermission = user.profile.permissions?.[permission] === true;

      if (!hasPermission) {
        // --- ALTERAÇÃO AQUI ---
        return response.status(403).json({ message: 'Você não tem permissão para acessar este recurso.' });
      }

      // Se tiver a permissão, continua para a próxima função (o controller)
      return next();

    } catch (error) {
      return response.status(500).json({ message: 'Erro interno ao verificar permissões.' });
    }
  };
};

module.exports = { can };