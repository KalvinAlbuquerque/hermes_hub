// Arquivo: backend/src/adminRoutes.js
const { Router } = require('express');
const authMiddleware = require('./middleware/auth');
const ProfileController = require('./controllers/ProfileController');
const UserController = require('./controllers/UserController'); // 1. Importa o UserController
const AuditLogController = require('./controllers/AuditLogController');
const adminRoutes = Router();
const ClienteController = require('./controllers/ClienteController'); 
const ReportController = require('./controllers/ReportController'); 
const SettingsController = require('./controllers/SettingsController');
const EmailAccountController = require('./controllers/EmailAccountController');


adminRoutes.post('/settings/test-smtp', SettingsController.testSmtp);
adminRoutes.use(authMiddleware);
// Rotas para Perfis (Profiles)
adminRoutes.post('/profiles', ProfileController.create);
adminRoutes.get('/profiles', ProfileController.index);
adminRoutes.put('/profiles/:id', ProfileController.update);
adminRoutes.delete('/profiles/:id', ProfileController.destroy);

// --- NOVAS ROTAS PARA USUÁRIOS (USERS) ---
adminRoutes.get('/users', UserController.index);
adminRoutes.put('/users/:id', UserController.update);
// A rota POST /users já existe em legacyRoutes, por isso não a adicionamos aqui.

adminRoutes.get('/audit-logs', AuditLogController.index);
adminRoutes.post('/clientes', ClienteController.create);
adminRoutes.get('/clientes', ClienteController.index);
adminRoutes.put('/clientes/:id', ClienteController.update);
adminRoutes.delete('/clientes/:id', ClienteController.destroy)

// --- NOVAS ROTAS PARA RELATÓRIOS ---
adminRoutes.get('/reports/audit-logs/csv', ReportController.generateAuditLogsCSV);
adminRoutes.get('/reports/audit-logs/pdf', ReportController.generateAuditLogsPDF);

adminRoutes.get('/settings', SettingsController.get);
adminRoutes.put('/settings', SettingsController.update);

adminRoutes.post('/settings/test-smtp', SettingsController.testSmtp);


// --- ROTAS PARA CONTAS DE E-MAIL ---
adminRoutes.post('/email-accounts', EmailAccountController.create);
adminRoutes.get('/email-accounts', EmailAccountController.index);
adminRoutes.get('/email-accounts/:id', EmailAccountController.show);
adminRoutes.put('/email-accounts/:id', EmailAccountController.update);
adminRoutes.delete('/email-accounts/:id', EmailAccountController.destroy);

module.exports = adminRoutes;