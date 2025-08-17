// Arquivo: backend/src/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const legacyRoutes = require('./legacyRoutes');
const newRoutes = require('./routes');
const adminRoutes = require('./adminRoutes');
const logRoutes = require('./logRoutes');
const app = express();
const PORT = 3333;

app.use(cors());

// --- ALTERAÇÃO 1: AUMENTA O LIMITE PARA O CORPO DA REQUISIÇÃO <<<< ---
// Aumenta o limite para 50mb para aceitar imagens grandes em base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// Serve ficheiros estáticos da pasta 'public'
app.use('/files', express.static(path.resolve(__dirname, '..', 'public')));

// Usando as rotas da API
app.use(legacyRoutes);
app.use(newRoutes);
app.use(adminRoutes);
app.use(logRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor Hermes Hub rodando na porta ${PORT}`);
});