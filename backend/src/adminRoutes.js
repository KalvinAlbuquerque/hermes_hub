// Arquivo: backend/src/adminRoutes.js
const { Router } = require('express');
const authMiddleware = require('./middleware/auth');
const { can } = require('./middleware/permissions');
const ProfileController = require('./controllers/ProfileController');
const UserController = require('./controllers/UserController');
const AuditLogController = require('./controllers/AuditLogController');
const ClienteController = require('./controllers/ClienteController');
const ReportController = require('./controllers/ReportController');
const EmailAccountController = require('./controllers/EmailAccountController');
const CompanyController = require('./controllers/CompanyController');
const CategoryController = require('./controllers/CategoryController');

const adminRoutes = Router();
adminRoutes.use(authMiddleware); // Primeiro, garante que o usuário está logado

// Perfis (Precisa de 'canManageProfiles')
adminRoutes.post('/profiles', can('canManageProfiles'), ProfileController.create);
adminRoutes.get('/profiles', can('canManageProfiles'), ProfileController.index);
adminRoutes.put('/profiles/:id', can('canManageProfiles'), ProfileController.update);
adminRoutes.delete('/profiles/:id', can('canManageProfiles'), ProfileController.destroy);

// Usuários (Precisa de 'canManageUsers')
adminRoutes.get('/users', can('canManageUsers'), UserController.index);
adminRoutes.put('/users/:id', can('canManageUsers'), UserController.update);
adminRoutes.delete('/users/:id', can('canManageUsers'), UserController.destroy);

// Clientes (Vamos assumir que 'canManageUsers' também gerencia clientes)
adminRoutes.post('/clientes', can('canManageUsers'), ClienteController.create);
adminRoutes.get('/clientes', can('canManageUsers'), ClienteController.index);
adminRoutes.put('/clientes/:id', can('canManageUsers'), ClienteController.update);
adminRoutes.delete('/clientes/:id', can('canManageUsers'), ClienteController.destroy);

// Contas de E-mail e Templates (Precisa de 'canManageTemplates')
adminRoutes.post('/email-accounts', can('canManageTemplates'), EmailAccountController.create);
adminRoutes.get('/email-accounts', can('canManageTemplates'), EmailAccountController.index);
adminRoutes.get('/email-accounts/:id', can('canManageTemplates'), EmailAccountController.show);
adminRoutes.put('/email-accounts/:id', can('canManageTemplates'), EmailAccountController.update);
adminRoutes.delete('/email-accounts/:id', can('canManageTemplates'), EmailAccountController.destroy);
adminRoutes.post('/email-accounts/test-connection', can('canManageTemplates'), EmailAccountController.testConnection);

// Categorias (Precisa de 'canManageTemplates')
adminRoutes.post('/categories', can('canManageTemplates'), CategoryController.create);
adminRoutes.get('/categories', can('canManageTemplates'), CategoryController.index);
adminRoutes.put('/categories/:id', can('canManageTemplates'), CategoryController.update);
adminRoutes.delete('/categories/:id', can('canManageTemplates'), CategoryController.destroy);

// Gestão da Empresa (Vamos assumir que só quem pode gerenciar perfis pode gerenciar a empresa)
adminRoutes.get('/company/settings', can('canManageProfiles'), CompanyController.getSettings);
adminRoutes.post('/company/settings', can('canManageProfiles'), CompanyController.updateSettings);
adminRoutes.post('/company/logo', can('canManageProfiles'), CompanyController.uploadMiddleware, CompanyController.processLogoUpload);
adminRoutes.post('/company/test-imap', can('canManageProfiles'), CompanyController.testImapConnection);

// Rotas de Relatórios e Auditoria
adminRoutes.get('/audit-logs', AuditLogController.index);
adminRoutes.get('/reports/audit-logs/csv', ReportController.generateAuditLogsCSV);
adminRoutes.get('/reports/audit-logs/pdf', ReportController.generateAuditLogsPDF);

module.exports = adminRoutes;