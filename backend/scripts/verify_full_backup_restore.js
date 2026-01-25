
const prisma = require('../src/database/prisma');

async function main() {
    console.log('--- Starting Full Backup Verification Script ---');

    // 1. Setup: Create Dependencies
    console.log('Step 1: Creating dependencies...');

    // Create a Client
    const client = await prisma.cliente.create({
        data: {
            name: 'Test Client ' + Date.now(),
            emails: ['test@client.com'],
            status: 'ACTIVE'
        }
    });

    // Create a Template
    const template = await prisma.template.create({
        data: {
            name: 'Test Template ' + Date.now(),
            subject: 'Test Subject',
            body: 'Test Body'
        }
    });

    // Create an Email Account
    const emailAccount = await prisma.emailAccount.create({
        data: {
            name: 'Test Account ' + Date.now(),
            email: 'test@account.com', // Added required email field
            authType: 'PASSWORD'
        }
    });

    // Create a Notification Log linked to Client
    const logId = 'log-' + Date.now();
    const notificationLog = await prisma.notificationLog.create({
        data: {
            id: logId,
            status: 'SENT',
            subject: 'Test Notification',
            body: 'Body',
            recipients: ['test@client.com'],
            templateId: template.id,
            emailAccountId: emailAccount.id,
            clientes: {
                connect: [{ id: client.id }]
            }
        },
        include: { clientes: { select: { id: true } } }
    });

    console.log('Created NotificationLog:', notificationLog.id);

    // 2. Mock Backup Data
    const backupData = {
        version: 1,
        data: {
            clientes: [client],
            templates: [template], // Included template
            emailAccounts: [emailAccount], // Included account
            // Note: notificationLogs needs to be in the format { ...log, clientes: [{ id: ... }] }
            notificationLogs: [
                {
                    ...notificationLog,
                    // Prisma returns dates as objects, JSON keys them as strings. Restore handles strings.
                    sentAt: new Date().toISOString(),
                    createdAt: new Date().toISOString()
                }
            ],
            reminderLogs: []
        }
    };

    // 3. Logic: Delete Everything then Restore
    console.log('Step 2: Executing Restore Logic...');

    const RESTORE_ORDER = [
        'profiles', 'users', 'clientes', 'categories', 'templates', 'emailAccounts', 'systemSettings', 'notificationLogs', 'reminderLogs'
    ];

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

    try {
        await prisma.$transaction(async (tx) => {
            // CLEAR
            const DELETE_ORDER = [...RESTORE_ORDER].reverse();
            for (const dataKey of DELETE_ORDER) {
                // Only clearing what we created to avoid nuking the whole DB if this runs in dev?
                // Actually, let's just delete the specific records we created to be safe, 
                // BUT use the restore logic to recreate them.

                // For valid test of the restore logic, we should simulate the state where they don't exist.
                // So we will delete them by ID first.
            }

            // Delete specific created items
            await tx.notificationLog.delete({ where: { id: logId } });
            await tx.emailAccount.delete({ where: { id: emailAccount.id } });
            await tx.template.delete({ where: { id: template.id } });
            await tx.cliente.delete({ where: { id: client.id } });

            console.log('Deleted test data. Now restoring...');

            // RESTORE
            for (const dataKey of RESTORE_ORDER) {
                const records = backupData.data[dataKey];
                if (!records) continue;

                const prismaModelName = modelMap[dataKey];

                for (const record of records) {
                    // THE NEW LOGIC
                    if (dataKey === 'notificationLogs' && record.clientes && Array.isArray(record.clientes)) {
                        record.clientes = { connect: record.clientes.map(c => ({ id: c.id })) };
                    }

                    await tx[prismaModelName].upsert({
                        where: { id: record.id },
                        update: record,
                        create: record
                    });
                }
            }
        });

        console.log('Restore transaction completed.');

        // 4. Verification
        const restoredLog = await prisma.notificationLog.findUnique({
            where: { id: logId },
            include: { clientes: true }
        });

        if (restoredLog && restoredLog.clientes.length === 1 && restoredLog.clientes[0].id === client.id) {
            console.log('SUCCESS: NotificationLog restored and linked to Client.');
        } else {
            console.error('FAILURE: NotificationLog not found or not linked.');
            console.log('Restored Log:', restoredLog);
            process.exit(1);
        }

    } catch (error) {
        console.error('FAILURE:', error);
        process.exit(1);
    } finally {
        // Cleanup if needed, but let's leave it to verify manually if we want
        await prisma.$disconnect();
    }
}

main();
