// Arquivo: backend/src/server.js (trecho modificado)
const express = require('express');
const cors = require('cors');
const path = require('path');
const legacyRoutes = require('./legacyRoutes');
const newRoutes = require('./routes');
const adminRoutes = require('./adminRoutes');
const logRoutes = require('./logRoutes');
const reportRoutes = require('./reportRoutes'); // <-- ADICIONADO
const cronService = require('./services/CronService');
const imapService = require('./services/ImapService');
const app = express();
const PORT = 3333;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/files', express.static(path.resolve(__dirname, '..', 'public')));

app.use(legacyRoutes);
app.use(newRoutes);
app.use(adminRoutes);
app.use(logRoutes);
app.use(reportRoutes); // <-- ADICIONADO

cronService.initialize();
imapService.initialize();

app.listen(PORT, () => {
  console.log(`🚀 Servidor Hermes Hub rodando na porta ${PORT}`);
});