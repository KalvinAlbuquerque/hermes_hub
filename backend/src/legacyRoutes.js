// Arquivo: backend/src/legacyRoutes.js

const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('./database/prisma');
const authMiddleware = require('./middleware/auth');

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
router.post('/users', async (request, response) => {
  try {
    const { name, email, password } = request.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });
    delete newUser.password;
    return response.status(201).json(newUser);
  } catch (error) {
    if (error.code === 'P2002') {
      return response.status(409).json({ message: 'Este e-mail já está em uso.' });
    }
    console.error("Erro ao criar usuário:", error);
    return response.status(500).json({ message: 'Erro interno ao criar usuário.' });
  }
});

// --- NOVA ROTA PARA LISTAR USUÁRIOS ---
router.get('/users', authMiddleware, async (request, response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        name: 'asc', // Ordena os usuários por nome em ordem alfabética
      },
      select: {
        // SELECIONA apenas os campos seguros para retornar. NUNCA retorne a senha!
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return response.json(users);

  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return response.status(500).json({ message: 'Erro interno ao listar usuários.' });
  }
});

// --- ROTA DE LOGIN ---
router.post('/login', async (request, response) => {
    try {
        const { email, password } = request.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          return response.status(401).json({ message: 'E-mail ou senha inválidos.' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return response.status(401).json({ message: 'E-mail ou senha inválidos.' });
        }
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
          select: { id: true, email: true, name: true, createdAt: true }
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