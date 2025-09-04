// Arquivo: backend/src/controllers/MfaController.js
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const prisma = require('../database/prisma');
const jwt = require('jsonwebtoken'); // 1. Importar a biblioteca JWT

module.exports = {
  // Gera o segredo e um token de setup temporário
  async setup(request, response) {
    const userId = request.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const secret = speakeasy.generateSecret({
      name: `Hermes Hub (${user.email})`,
    });

    // 2. NÃO salvar o segredo no banco de dados ainda.
    // Em vez disso, criamos um token de configuração com validade de 5 minutos.
    const mfaSetupToken = jwt.sign(
      { userId: user.id, mfaSecret: secret.base32 },
      process.env.JWT_SECRET,
      { expiresIn: '5m' } 
    );

    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) {
        return response.status(500).json({ message: 'Erro ao gerar QR Code.' });
      }
      // 3. Enviamos o QR Code e o token de configuração para o frontend
      return response.json({ 
        secret: secret.base32, 
        qrCodeUrl: data_url, 
        mfaSetupToken: mfaSetupToken 
      });
    });
  },

  // Verifica o token e, se for válido, ativa o MFA permanentemente
  async verifyAndEnable(request, response) {
    // 4. Recebemos o token do usuário E o token de configuração
    const { token, mfaSetupToken } = request.body;
    const userId = request.user.id;

    if (!mfaSetupToken) {
      return response.status(400).json({ message: 'Token de configuração MFA ausente.' });
    }

    try {
      // 5. Verificamos se o token de configuração é válido e não expirou
      const decoded = jwt.verify(mfaSetupToken, process.env.JWT_SECRET);
      
      if (decoded.userId !== userId) {
        return response.status(403).json({ message: 'Token de configuração inválido.' });
      }
      
      const tempSecret = decoded.mfaSecret;

      // 6. Verificamos o código de 6 dígitos do usuário contra o segredo temporário
      const verified = speakeasy.totp.verify({
        secret: tempSecret,
        encoding: 'base32',
        token,
        window: 1, // Permite uma pequena variação de tempo
      });

      if (verified) {
        // 7. SUCESSO! Agora salvamos o segredo permanentemente no banco de dados
        await prisma.user.update({
          where: { id: userId },
          data: { mfaSecret: tempSecret },
        });
        return response.json({ verified: true, message: 'MFA ativado com sucesso!' });
      } else {
        return response.status(400).json({ verified: false, message: 'Token inválido.' });
      }
    } catch (err) {
      // Captura erros de token expirado ou malformado
      return response.status(401).json({ message: 'Sessão de configuração expirou. Por favor, gere um novo código.' });
    }
  },
};