// Arquivo: backend/src/legacyRoutes.js

const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('./database/prisma');
const authMiddleware = require('./middleware/auth');
const { logAction } = require('./services/AuditLogService');
const { loginLimiter } = require('./middleware/security');
const { validate, createUserSchema } = require('./validators/userValidator');
const speakeasy = require('speakeasy'); 
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

// --- ROTA DE CADASTRO DE USUÁRIO ---
router.post('/users', validate(createUserSchema), async (request, response) => {
  try {
    // Agora esperamos login e profileId no corpo da requisição
    const { name, email, login, password, profileId } = request.body;

    // Verifica se um perfil foi fornecido
    if (!profileId) {
      return response.status(400).json({ message: 'O perfil é obrigatório.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        login, // Adicionado
        password: hashedPassword,
        profileId, // Adicionado
      },
    });
    await logAction({
      userId: newUser.id,
      action: 'USER_CREATE',
      details: {
        createdUserId: newUser.id,
        createdUserName: newUser.name,
        createdUserEmail: newUser.email,
      },
    });

    delete newUser.password;
    return response.status(201).json(newUser);
  } catch (error) {
    if (error.code === 'P2002') {
      // Verifica qual campo único causou o conflito (email ou login)
      const field = error.meta.target.includes('email') ? 'e-mail' : 'login';
      return response.status(409).json({ message: `Este ${field} já está em uso.` });
    }
    console.error("Erro ao criar usuário:", error);
    return response.status(500).json({ message: 'Erro interno ao criar usuário.' });
  }
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

        // Se passou por tudo, gera o token JWT final
        const token = jwt.sign(
          { id: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '8h' }
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