// Arquivo: backend/src/controllers/BackupController.js
const prisma = require('../database/prisma');
const { logAction } = require('../services/AuditLogService');

// Define a ordem de importância para a restauração, garantindo que as dependências existam.
const RESTORE_ORDER = [
  'profiles',
  'users',
  'clientes',
  'categories',
  'templates',
  'emailAccounts',
  'systemSettings',
  'notificationLogs',
  'reminderLogs'
];

module.exports = {
  /**
   * Coleta todos os dados de configuração e os envia como um ficheiro JSON.
   */
  async createBackup(request, response) {
    try {
      const backupData = {
        version: 1,
        createdAt: new Date().toISOString(),
        data: {
          profiles: await prisma.profile.findMany(),
          users: await prisma.user.findMany(),
          clientes: await prisma.cliente.findMany(),
          categories: await prisma.category.findMany(),
          templates: await prisma.template.findMany(),
          emailAccounts: await prisma.emailAccount.findMany(),
          systemSettings: await prisma.systemSetting.findMany(),
          notificationLogs: await prisma.notificationLog.findMany({ include: { clientes: { select: { id: true } } } }),
          reminderLogs: await prisma.reminderLog.findMany(),
        },
      };

      await logAction({
        userId: request.user.id,
        action: 'BACKUP_CREATED',
        details: { message: 'Backup das configurações do sistema foi criado com sucesso.' }
      });

      response.setHeader('Content-Type', 'application/json');
      response.setHeader('Content-Disposition', `attachment; filename="hermes_hub_backup_${new Date().toISOString()}.json"`);
      response.status(200).json(backupData);

    } catch (error) {
      console.error("Erro ao criar backup:", error);
      response.status(500).json({ message: "Ocorreu um erro inesperado ao gerar o backup." });
    }
  },

  /**
   * Recebe um ficheiro JSON de backup e restaura os dados no banco de dados.
   */
  async restoreBackup(request, response) {
    if (!request.file) {
      return response.status(400).json({ message: 'Nenhum ficheiro de backup enviado.' });
    }

    try {
      const backupContent = request.file.buffer.toString('utf-8');
      const backupData = JSON.parse(backupContent);

      if (backupData.version !== 1 || !backupData.data) {
        return response.status(400).json({ message: 'Ficheiro de backup inválido ou incompatível.' });
      }

      // Mapeia os nomes do backup para os nomes de modelo corretos do Prisma.
      const modelMap = {
        profiles: 'profile',
        users: 'user',
        clientes: 'cliente',
        categories: 'category',
        templates: 'template',
        emailAccounts: 'emailAccount',
        systemSettings: 'systemSetting',
        notificationLogs: 'notificationLog',
        reminderLogs: 'reminderLog'
      };

      // Executa a restauração dentro de uma transação para garantir a integridade
      await prisma.$transaction(async (tx) => {
        // 1. Limpeza: Remove dados existentes na ordem inversa de dependência
        const DELETE_ORDER = [...RESTORE_ORDER].reverse();
        console.log("Iniciando limpeza da base de dados antes da restauração...");

        for (const dataKey of DELETE_ORDER) {
          const prismaModelName = modelMap[dataKey];
          if (prismaModelName && tx[prismaModelName]) {
            // console.log(`A limpar tabela: ${dataKey}`);
            await tx[prismaModelName].deleteMany();
          }
        }
        console.log("Limpeza concluída. Iniciando restauração...");

        // 2. Restauração: Insere os dados na ordem correta
        for (const dataKey of RESTORE_ORDER) {
          const records = backupData.data[dataKey];

          const prismaModelName = modelMap[dataKey];
          if (!prismaModelName || !tx[prismaModelName]) {
            console.warn(`[Restore] Modelo '${dataKey}' não encontrado no Prisma. A ignorar.`);
            continue;
          }

          if (records && records.length > 0) {
            console.log(`Restaurando ${records.length} registos para o modelo: ${dataKey}`);

            // O `upsert` é crucial aqui: ele cria se não existir, ou atualiza se já existir.
            for (const record of records) {
              // Tratamento especial para relações (NotificationLog -> Clientes)
              if (dataKey === 'notificationLogs' && record.clientes && Array.isArray(record.clientes)) {
                record.clientes = { connect: record.clientes.map(c => ({ id: c.id })) };
              }

              await tx[prismaModelName].upsert({
                where: { id: record.id },
                update: record,
                create: record,
              });
            }
          }
        }
      });

      await logAction({
        userId: request.user.id,
        action: 'BACKUP_RESTORED',
        details: { message: 'As configurações do sistema foram restauradas a partir de um backup.' }
      });

      return response.json({ message: "Restauração concluída com sucesso! As configurações foram aplicadas." });

    } catch (error) {
      console.error("Erro ao restaurar backup:", error);
      if (error instanceof SyntaxError) {
        return response.status(400).json({ message: "O ficheiro enviado não é um JSON válido." });
      }
      return response.status(500).json({ message: "Ocorreu um erro inesperado durante a restauração." });
    }
  },
};