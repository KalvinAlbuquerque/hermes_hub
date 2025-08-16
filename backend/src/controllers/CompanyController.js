// Arquivo: backend/src/controllers/CompanyController.js
const multer = require('multer');
const path = require('path');
const prisma = require('../database/prisma');

// Configuração do Multer para guardar os ficheiros
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Caminho absoluto para a pasta de uploads
    cb(null, path.resolve(__dirname, '..', '..', 'public', 'uploads'));
  },
  filename: function (req, file, cb) {
    // Cria um nome de ficheiro único para evitar conflitos
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage }).single('logo'); // 'logo' é o nome do campo no formulário

module.exports = {
  // Função para buscar as configurações da empresa (incluindo o logo)
  async getSettings(request, response) {
    try {
        const logoSetting = await prisma.systemSetting.findUnique({
            where: { key: 'companyLogo' }
        });
        return response.json({ logoUrl: logoSetting ? logoSetting.value : null });
    } catch (error) {
        return response.status(500).json({ message: "Erro ao buscar configurações da empresa." });
    }
  },

  // Função para fazer o upload do logo
  async uploadLogo(request, response) {
    upload(request, response, async (err) => {
      if (err) {
        return response.status(400).json({ message: "Erro no upload do ficheiro.", error: err });
      }
      if (!request.file) {
        return response.status(400).json({ message: "Nenhum ficheiro enviado." });
      }

      // CORREÇÃO: Garante que o caminho guardado no banco começa com uma barra
      const filePath = `/uploads/${request.file.filename}`;

      try {
        await prisma.systemSetting.upsert({
          where: { key: 'companyLogo' },
          update: { value: filePath },
          create: { key: 'companyLogo', value: filePath },
        });

        return response.json({
          message: "Logo enviado com sucesso!",
          filePath: filePath,
        });
      } catch (dbError) {
        return response.status(500).json({ message: "Erro ao salvar o caminho do ficheiro no banco de dados." });
      }
    });
  },
};