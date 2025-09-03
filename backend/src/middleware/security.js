// Arquivo: backend/src/middleware/security.js
const rateLimit = require('express-rate-limit');

// Configura um limitador para a rota de login.
// Irá permitir 10 tentativas a cada 15 minutos por endereço IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Limite de 10 requisições
  standardHeaders: true, // Retorna a informação do limite nos cabeçalhos `RateLimit-*`
  legacyHeaders: false, // Desativa os cabeçalhos antigos `X-RateLimit-*`
  message: { message: 'Muitas tentativas de login a partir deste IP. Por favor, tente novamente após 15 minutos.' },
});

module.exports = {
  loginLimiter,
};