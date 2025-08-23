// Arquivo: backend/src/adminRoutes.js
const { Router } = require('express');
const authMiddleware = require('./middleware/auth');
const ProfileController = require('./controllers/ProfileController');
const UserController = require('./controllers/UserController');
const AuditLogController = require('./controllers/AuditLogController');
const ClienteController = require('./controllers/ClienteController'); 
const ReportController = require('./controllers/ReportController'); 
// A linha do SettingsController foi removida daqui
const EmailAccountController = require('./controllers/EmailAccountController');
const CompanyController = require('./controllers/CompanyController'); 
const CategoryController = require('./controllers/CategoryController');
const adminRoutes = Router();
adminRoutes.use(authMiddleware);

// Rotas para Perfis (Profiles)
adminRoutes.post('/profiles', ProfileController.create);
adminRoutes.get('/profiles', ProfileController.index);
adminRoutes.put('/profiles/:id', ProfileController.update);
adminRoutes.delete('/profiles/:id', ProfileController.destroy);

// --- ROTAS PARA USUÁRIOS (USERS) ---
adminRoutes.get('/users', UserController.index);
adminRoutes.put('/users/:id', UserController.update);
adminRoutes.delete('/users/:id', UserController.destroy);

adminRoutes.get('/audit-logs', AuditLogController.index);
adminRoutes.post('/clientes', ClienteController.create);
adminRoutes.get('/clientes', ClienteController.index);
adminRoutes.put('/clientes/:id', ClienteController.update);
adminRoutes.delete('/clientes/:id', ClienteController.destroy)

// --- ROTAS PARA RELATÓRIOS ---
adminRoutes.get('/reports/audit-logs/csv', ReportController.generateAuditLogsCSV);
adminRoutes.get('/reports/audit-logs/pdf', ReportController.generateAuditLogsPDF);

// --- ROTAS PARA CONTAS DE E-MAIL (ATUALIZADO) ---
adminRoutes.post('/email-accounts', EmailAccountController.create);
adminRoutes.get('/email-accounts', EmailAccountController.index);
adminRoutes.get('/email-accounts/:id', EmailAccountController.show);
adminRoutes.put('/email-accounts/:id', EmailAccountController.update);
adminRoutes.delete('/email-accounts/:id', EmailAccountController.destroy);
adminRoutes.post('/email-accounts/test-connection', EmailAccountController.testConnection);

// --- ROTAS PARA GESTÃO DA EMPRESA ---
adminRoutes.get('/company/settings', CompanyController.getSettings);
adminRoutes.post('/company/settings', CompanyController.updateSettings); // <-- ADICIONE ESTA LINHA
adminRoutes.post('/company/logo', CompanyController.uploadLogo); 

// Rotas para Categorias
adminRoutes.post('/categories', CategoryController.create);
adminRoutes.get('/categories', CategoryController.index);
adminRoutes.put('/categories/:id', CategoryController.update);
adminRoutes.delete('/categories/:id', CategoryController.destroy);

module.exports = adminRoutes;