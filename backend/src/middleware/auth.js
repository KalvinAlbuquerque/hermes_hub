// Arquivo: backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');

function authMiddleware(request, response, next) {
  // 1. Pega o cabeçalho de autorização da requisição
  const authHeader = request.headers.authorization;

  // 2. Verifica se o cabeçalho existe
  if (!authHeader) {
    return response.status(401).json({ message: 'Token de autenticação não fornecido.' });
  }

  // 3. O token vem no formato "Bearer <token>". Vamos separar as duas partes.
  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    return response.status(401).json({ message: 'Erro no formato do token.' });
  }

  const [scheme, token] = parts;

  // Verifica se o formato é "Bearer"
  if (!/^Bearer$/i.test(scheme)) {
    return response.status(401).json({ message: 'Token mal formatado.' });
  }

  // 4. Verifica se o token é válido (assinatura e tempo de expiração)
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return response.status(401).json({ message: 'Token inválido ou expirado.' });
    }

    // 5. Se o token for válido, anexa os dados do usuário (o payload) à requisição
    request.user = decoded; // Agora, toda rota protegida saberá qual usuário a está acessando

    // 6. Chama o próximo passo (a rota principal)
    return next();
  });
}

module.exports = authMiddleware;