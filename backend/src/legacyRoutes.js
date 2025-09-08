// Arquivo: backend/src/legacyRoutes.js

const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('./database/prisma');
const authMiddleware = require('./middleware/auth');
const { loginLimiter } = require('./middleware/security');
const { validate, createUserSchema } = require('./validators/userValidator');
const speakeasy = require('speakeasy');
const { logAction } = require('./services/AuditLogService');
// 1. Criamos uma instância do Router em vez de usar o 'app'
const router = Router();

// --- ROTA DE TESTE DO BANCO ---
router.get('/db-test', async (request, response) => {
  const userCount = await prisma.user.count();
  response.json({
    message: 'Conexão com o banco via Prisma bem-sucedida!',
    userCount: userCount,
  });
});

// --- ROTA DE LOGIN ---
router.post('/login', loginLimiter, async (request, response) => {
  try {
    const { email, password, token: mfaToken } = request.body; // <-- Recebe o token MFA
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return response.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return response.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    // --- LÓGICA DO MFA ---
    if (user.mfaSecret) {
      if (!mfaToken) {
        // Senha correta, mas MFA está ativo e nenhum token foi enviado.
        // Sinalize ao frontend que a próxima etapa é necessária.
        return response.status(200).json({ mfaRequired: true });
      }

      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: mfaToken,
        window: 1, // Permite uma pequena variação de tempo
      });

      if (!verified) {
        return response.status(401).json({ message: 'Token de autenticação inválido.' });
      }
    }
    // --- FIM DA LÓGICA DO MFA ---


    await logAction({
      userId: user.id,
      action: 'USER_LOGIN',
      details: { message: `Usuário ${user.name} efetuou login.` }
    });
    // Se passou por tudo, gera o token JWT final
    if (user.mustChangePassword) {
      // Geramos um token temporário que só permite a troca de senha.
      const tempToken = jwt.sign(
        { id: user.id, action: 'change-password' }, // Payload específico
        process.env.JWT_SECRET,
        { expiresIn: '15m' } // Token de curta duração
      );
      // Retornamos um status especial para o frontend.
      return response.json({
        message: 'Troca de senha necessária.',
        forceChangePassword: true,
        token: tempToken
      });
    }

    // Se mustChangePassword for false, o fluxo de login continua normalmente.
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '3h' }
    );

    return response.json({ message: 'Login bem-sucedido!', token: token });

  } catch (error) {
    console.error("Erro no login:", error);
    return response.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

// --- ROTA PROTEGIDA '/me' ---
router.get('/me', authMiddleware, async (request, response) => {
  const userId = request.user.id;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        profile: { // <-- INCLUÍDO AQUI
          select: {
            permissions: true
          }
        }
      }
    });
    if (!user) {
      return response.status(404).json({ message: 'Usuário não encontrado.' });
    }
    return response.json(user);
  } catch (error) {
    return response.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

// 2. Exportamos o router configurado
module.exports = router;