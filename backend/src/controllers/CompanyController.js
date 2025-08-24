// Arquivo: backend/src/controllers/CompanyController.js
const multer = require('multer');
const path = require('path');
const Imap = require('node-imap');
const prisma = require('../database/prisma');
const { encrypt, decrypt } = require('../services/SettingsService');

// Configuração do Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, path.resolve(__dirname, '..', '..', 'public', 'uploads')); },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Middleware do Multer para ser usado nas rotas
const upload = multer({ storage: storage }).single('logo');

// Função que processa o arquivo após o upload
async function processLogoUpload(request, response) {
  if (!request.file) {
    return response.status(400).json({ message: "Nenhum ficheiro enviado." });
  }
  const filePath = `/uploads/${request.file.filename}`;
  try {
    await prisma.systemSetting.upsert({
      where: { key: 'companyLogo' },
      update: { value: filePath },
      create: { key: 'companyLogo', value: filePath }
    });
    return response.json({ message: "Logo enviado com sucesso!", filePath: filePath });
  } catch (dbError) {
    return response.status(500).json({ message: "Erro ao salvar o caminho do ficheiro no banco de dados." });
  }
}

module.exports = {
  // Mantemos as outras funções
  async getSettings(request, response) {
    try {
        const settingKeys = ['companyLogo', 'companyCCEmails', 'imapHost', 'imapPort', 'imapUser', 'imapPassword', 'imapTls'];
        const settings = await prisma.systemSetting.findMany({ where: { key: { in: settingKeys } } });
        const settingsMap = settings.reduce((acc, setting) => {
            if (setting.key === 'imapPassword' && setting.value) {
                acc[setting.key] = decrypt(setting.value);
            } else {
                acc[setting.key] = setting.value;
            }
            return acc;
        }, {});
        return response.json({
            logoUrl: settingsMap.companyLogo || null,
            companyCCEmails: settingsMap.companyCCEmails || '',
            imapHost: settingsMap.imapHost || '',
            imapPort: settingsMap.imapPort || '993',
            imapUser: settingsMap.imapUser || '',
            imapPassword: settingsMap.imapPassword || '',
            imapTls: settingsMap.imapTls ? settingsMap.imapTls === 'true' : true,
        });
    } catch (error) { return response.status(500).json({ message: "Erro ao buscar configurações da empresa." }); }
  },

  async updateSettings(request, response) {
    try {
      const { companyCCEmails, imapHost, imapPort, imapUser, imapPassword, imapTls } = request.body;
      const settingsToUpdate = {
          companyCCEmails: companyCCEmails || '',
          imapHost: imapHost || '',
          imapPort: imapPort || '993',
          imapUser: imapUser || '',
          imapTls: String(imapTls),
      };
      if (imapPassword) {
          settingsToUpdate.imapPassword = encrypt(imapPassword);
      }
      const updatePromises = Object.entries(settingsToUpdate).map(([key, value]) => {
          return prisma.systemSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
      });
      await prisma.$transaction(updatePromises);
      return response.json({ message: "Configurações atualizadas com sucesso!" });
    } catch (dbError) {
      console.error("Erro ao salvar configurações:", dbError);
      return response.status(500).json({ message: "Erro ao salvar as configurações no banco de dados." });
    }
  },

  async testImapConnection(request, response) {
    const { host, port, user, password, tls } = request.body;
    if (!host || !port || !user || !password) {
        return response.status(400).json({ message: 'Host, Porta, Usuário e Senha são obrigatórios para o teste.' });
    }
    const imap = new Imap({ user, password, host, port, tls });

    const connectionPromise = new Promise((resolve, reject) => {
        imap.once('ready', () => resolve());
        imap.once('error', err => reject(err));
        imap.connect();
    });

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timed out while authenticating with server')), 10000);
    });

    try {
        await Promise.race([connectionPromise, timeoutPromise]);
        imap.end();
        return response.json({ message: 'Conexão IMAP bem-sucedida!' });
    } catch (err) {
        return response.status(500).json({ message: `Falha na conexão: ${err.message}` });
    }
  },

  // Exportamos o middleware e a função de processamento separadamente
  uploadMiddleware: upload,
  processLogoUpload,
};