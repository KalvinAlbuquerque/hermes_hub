// Arquivo: backend/src/controllers/MfaController.js
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const prisma = require('../database/prisma');

module.exports = {
  // Gera o segredo e o QR Code para o utilizador configurar o MFA
  async setup(request, response) {
    const userId = request.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Gera um novo segredo
    const secret = speakeasy.generateSecret({
      name: `Hermes Hub (${user.email})`,
    });

    // Salva o segredo (ainda não verificado) no banco de dados
    await prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret.base32 },
    });

    // Gera o QR Code como uma imagem em base64
    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) {
        return response.status(500).json({ message: 'Erro ao gerar QR Code.' });
      }
      return response.json({ secret: secret.base32, qrCodeUrl: data_url });
    });
  },

  // Verifica o token e ativa o MFA para o utilizador
  async verifyAndEnable(request, response) {
    const { token } = request.body;
    const userId = request.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaSecret) {
      return response.status(400).json({ message: 'MFA não configurado.' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
    });

    if (verified) {
      // Se o token for válido, podemos considerar o MFA como ativo.
      // (Opcional: adicionar uma flag 'mfaEnabled' no modelo User)
      return response.json({ verified: true });
    } else {
      return response.status(400).json({ verified: false, message: 'Token inválido.' });
    }
  },
};