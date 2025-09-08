// Arquivo: backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o processo de seeding...');

  // 1. Criar (ou garantir que existe) o Perfil Super Admin com todas as permissões
  const superAdminProfile = await prisma.profile.upsert({
    where: { name: 'Super Admin' },
    update: {
      // Garante que o perfil existente seja atualizado com todas as permissões
      permissions: {
        'users:read': true,
        'users:create': true,
        'users:update': true,
        'users:delete': true,
        'profiles:read': true,
        'profiles:create': true,
        'profiles:update': true,
        'profiles:delete': true,
        'templates:read': true,
        'templates:write': true,
        'templates:delete': true,
        'notifications:send': true,
        'notifications:approve': true,
        'clientes:read': true,
        'clientes:write': true,
        'clientes:delete': true,
        'audit:read': true,
        'system:backup': true,
        'system:settings': true,
        'email_accounts:read': true,
      },
    },
    create: {
      name: 'Super Admin',
      permissions: {
        // Permissões para um novo perfil
        'users:read': true,
        'users:create': true,
        'users:update': true,
        'users:delete': true,
        'profiles:read': true,
        'profiles:create': true,
        'profiles:update': true,
        'profiles:delete': true,
        'templates:read': true,
        'templates:write': true,
        'templates:delete': true,
        'notifications:send': true,
        'notifications:approve': true,
        'clientes:read': true,
        'clientes:write': true,
        'clientes:delete': true,
        'audit:read': true,
        'system:backup': true,
        'system:settings': true,
        'email_accounts:read': true,
      },
    },
  });
  console.log(`Perfil "${superAdminProfile.name}" criado/atualizado com todas as permissões.`);

  // 2. Criar (ou garantir que existe) o Usuário Super Admin
  const adminPassword = process.env.ADMIN_PASSWORD || 'telema123';
  console.log(`Usando a senha encontrada no ambiente para o usuário admin...`);
  
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const superAdminUser = await prisma.user.upsert({
    where: { email: 'admin@hermes.hub' },
    update: {
      // Garante que o usuário admin esteja sempre associado ao perfil de Super Admin
      profileId: superAdminProfile.id,
    },
    create: {
      name: 'Administrador Padrão',
      email: 'admin@hermes.hub',
      login: 'admin',
      password: hashedPassword,
      profileId: superAdminProfile.id,
      status: 'ENABLED',
    },
  });
  console.log(`Usuário "${superAdminUser.name}" criado/confirmado com o e-mail "${superAdminUser.email}".`);

  console.log('Seeding concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });