// Arquivo: backend/src/controllers/MfaController.js
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const prisma = require('../database/prisma');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // <-- ESTA LINHA FOI ADICIONADA

module.exports = {
  // Gera o segredo e um token de setup temporário
  async setup(request, response) {
    const userId = request.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const secret = speakeasy.generateSecret({
      name: `Hermes Hub (${user.email})`,
    });

    const mfaSetupToken = jwt.sign(
      { userId: user.id, mfaSecret: secret.base32 },
      process.env.JWT_SECRET,
      { expiresIn: '5m' } 
    );

    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) {
        return response.status(500).json({ message: 'Erro ao gerar QR Code.' });
      }
      return response.json({ 
        secret: secret.base32, 
        qrCodeUrl: data_url, 
        mfaSetupToken: mfaSetupToken 
      });
    });
  },

  // Verifica o token e, se for válido, ativa o MFA permanentemente
  async verifyAndEnable(request, response) {
    const { token, mfaSetupToken } = request.body;
    const userId = request.user.id;

    if (!mfaSetupToken) {
      return response.status(400).json({ message: 'Token de configuração MFA ausente.' });
    }

    try {
      const decoded = jwt.verify(mfaSetupToken, process.env.JWT_SECRET);
      
      if (decoded.userId !== userId) {
        return response.status(403).json({ message: 'Token de configuração inválido.' });
      }
      
      const tempSecret = decoded.mfaSecret;

      const verified = speakeasy.totp.verify({
        secret: tempSecret,
        encoding: 'base32',
        token,
        window: 1,
      });

      if (verified) {
        await prisma.user.update({
          where: { id: userId },
          data: { mfaSecret: tempSecret },
        });
        return response.json({ verified: true, message: 'MFA ativado com sucesso!' });
      } else {
        return response.status(400).json({ verified: false, message: 'Token inválido.' });
      }
    } catch (err) {
      return response.status(401).json({ message: 'Sessão de configuração expirou. Por favor, gere um novo código.' });
    }
  },

  // Retorna se o MFA está ativo para o usuário logado
  async getStatus(request, response) {
    try {
      const user = await prisma.user.findUnique({ where: { id: request.user.id } });
      return response.json({ mfaEnabled: !!user.mfaSecret });
    } catch (error) {
      return response.status(500).json({ message: 'Erro ao verificar status do MFA.' });
    }
  },

  // Desativa o MFA para o usuário logado após verificar a senha
  async disable(request, response) {
    try {
      const { password } = request.body;
      const userId = request.user.id;

      if (!password) {
        return response.status(400).json({ message: 'A senha é obrigatória para desativar o MFA.' });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return response.status(404).json({ message: 'Usuário não encontrado.' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return response.status(401).json({ message: 'Senha inválida.' });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { mfaSecret: null },
      });

      return response.json({ message: 'MFA desativado com sucesso!' });

    } catch (error) {
      console.error("Erro ao desativar MFA:", error);
      return response.status(500).json({ message: 'Erro interno ao desativar o MFA.' });
    }
  },
};