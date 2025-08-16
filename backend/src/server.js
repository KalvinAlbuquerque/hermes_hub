// Arquivo: backend/src/server.js
const express = require('express');
const cors = require('cors');
const path = require('path'); // 1. Importa o 'path' do Node.js
const legacyRoutes = require('./legacyRoutes');
const newRoutes = require('./routes');
const adminRoutes = require('./adminRoutes');
const logRoutes = require('./logRoutes');
const app = express();
const PORT = 3333;

app.use(cors());
app.use(express.json());

// --- CORREÇÃO IMPORTANTE ---
// 2. A linha para servir ficheiros estáticos deve vir ANTES das rotas da API.
// Isto faz com que qualquer pedido para '/files' seja tratado como público e não passe pela autenticação.
app.use('/files', express.static(path.resolve(__dirname, '..', 'public')));

// Usando as rotas da API (agora depois dos ficheiros estáticos)
app.use(legacyRoutes);
app.use(newRoutes);
app.use(adminRoutes);
app.use(logRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor Hermes Hub rodando na porta ${PORT}`);
});