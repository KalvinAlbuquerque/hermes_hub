// Arquivo: backend/src/adminRoutes.js
const { Router } = require('express');
const authMiddleware = require('./middleware/auth');
const ProfileController = require('./controllers/ProfileController');
const UserController = require('./controllers/UserController');
const AuditLogController = require('./controllers/AuditLogController');
const ClienteController = require('./controllers/ClienteController'); 
const ReportController = require('./controllers/ReportController');
const EmailAccountController = require('./controllers/EmailAccountController');
const CompanyController = require('./controllers/CompanyController'); 
const CategoryController = require('./controllers/CategoryController');

const adminRoutes = Router();
adminRoutes.use(authMiddleware);

// Perfis
adminRoutes.post('/profiles', ProfileController.create);
adminRoutes.get('/profiles', ProfileController.index);
adminRoutes.put('/profiles/:id', ProfileController.update);
adminRoutes.delete('/profiles/:id', ProfileController.destroy);

// Usuários
adminRoutes.get('/users', UserController.index);
adminRoutes.put('/users/:id', UserController.update);
adminRoutes.delete('/users/:id', UserController.destroy);

// Auditoria e Clientes
adminRoutes.get('/audit-logs', AuditLogController.index);
adminRoutes.post('/clientes', ClienteController.create);
adminRoutes.get('/clientes', ClienteController.index);
adminRoutes.put('/clientes/:id', ClienteController.update);
adminRoutes.delete('/clientes/:id', ClienteController.destroy)

// Relatórios
adminRoutes.get('/reports/audit-logs/csv', ReportController.generateAuditLogsCSV);
adminRoutes.get('/reports/audit-logs/pdf', ReportController.generateAuditLogsPDF);
adminRoutes.get('/reports/audit-logs/json', ReportController.generateAuditLogsJSON);
// Contas de E-mail
adminRoutes.post('/email-accounts', EmailAccountController.create);
adminRoutes.get('/email-accounts', EmailAccountController.index);
adminRoutes.get('/email-accounts/:id', EmailAccountController.show);
adminRoutes.put('/email-accounts/:id', EmailAccountController.update);
adminRoutes.delete('/email-accounts/:id', EmailAccountController.destroy);
adminRoutes.post('/email-accounts/test-connection', EmailAccountController.testConnection);

// Gestão da Empresa
adminRoutes.get('/company/settings', CompanyController.getSettings);
adminRoutes.post('/company/settings', CompanyController.updateSettings);
adminRoutes.post('/company/logo', CompanyController.uploadLogo);
adminRoutes.post('/company/test-imap', CompanyController.testImapConnection); // NOVA ROTA

// Categorias
adminRoutes.post('/categories', CategoryController.create);
adminRoutes.get('/categories', CategoryController.index);
adminRoutes.put('/categories/:id', CategoryController.update);
adminRoutes.delete('/categories/:id', CategoryController.destroy);

module.exports = adminRoutes;