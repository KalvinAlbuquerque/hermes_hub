// Arquivo: backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o processo de seeding...');

  // 1. Criar (ou garantir que existe) o Perfil Super Admin
  const superAdminProfile = await prisma.profile.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      name: 'Super Admin',
      permissions: {
        canManageUsers: true,
        canManageProfiles: true,
        canManageTemplates: true,
        canSendNotifications: true,
        canApproveNotifications: true,
      },
    },
  });
  console.log(`Perfil "${superAdminProfile.name}" criado/confirmado.`);

  // 2. Criar (ou garantir que existe) o Usuário Super Admin
  // Tenta ler a senha do .env, se não encontrar, usa 'admin123' como último recurso.
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  console.log(`Usando a senha encontrada no ambiente para o usuário admin...`);
  
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const superAdminUser = await prisma.user.upsert({
    where: { email: 'admin@hermes.hub' },
    update: {},
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