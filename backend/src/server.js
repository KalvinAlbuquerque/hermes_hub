// Arquivo: backend/src/server.js

const express = require('express');
const cors = require('cors'); // 1. Importa o cors
const legacyRoutes = require('./legacyRoutes');
const newRoutes = require('./routes');

const app = express();
const PORT = 3333;

app.use(express.json());
app.use(cors()); // 2. Usa o middleware cors. Agora nosso backend aceita requisições de outras origens.

// Usando as rotas
app.use(legacyRoutes);
app.use(newRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor Hermes Hub rodando na porta ${PORT}`);
});