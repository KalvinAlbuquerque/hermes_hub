// Arquivo: frontend/src/hooks/usePermissions.ts
import { useAuth } from '@/contexts/AuthContext';

export function usePermissions() {
  const { user } = useAuth();

  /**
   * Verifica se o usuário logado possui uma permissão específica.
   * @param {string} permission - A string da permissão a ser verificada (ex: 'users:read').
   * @returns {boolean} - Retorna `true` se o usuário tiver a permissão, caso contrário `false`.
   */
  const hasPermission = (permission: string): boolean => {
    // Se não houver usuário, perfil ou objeto de permissões, nega o acesso.
    if (!user || !user.profile || !user.profile.permissions) {
      return false;
    }
    
    // Retorna true apenas se a chave da permissão existir e seu valor for explicitamente 'true'.
    return user.profile.permissions[permission] === true;
  };

  return { hasPermission };
}