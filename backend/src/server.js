// Arquivo: backend/src/server.js
const express = require('express');
const cors = require('cors');
const legacyRoutes = require('./legacyRoutes');
const newRoutes = require('./routes');
const adminRoutes = require('./adminRoutes');
const logRoutes = require('./logRoutes'); // <-- A linha que causa o erro se o ficheiro não for encontrado
const app = express();
const PORT = 3333;

app.use(express.json());
app.use(cors());

// Usando as rotas
app.use(legacyRoutes);
app.use(newRoutes);
app.use(adminRoutes);
app.use(logRoutes); // <-- A linha que usa as rotas

app.listen(PORT, () => {
  console.log(`🚀 Servidor Hermes Hub rodando na porta ${PORT}`);
});