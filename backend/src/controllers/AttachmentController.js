// Arquivo: backend/src/controllers/AttachmentController.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- ALTERAÇÃO 1: Define o caminho da pasta de uploads numa variável <<<< ---
const uploadsDir = path.resolve(__dirname, '..', '..', 'public', 'attachments');

// Garante que o diretório de uploads existe
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuração do Multer para anexos normais (sem alterações)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage }).array('attachments', 10);

module.exports = {
  // Middleware de upload de ficheiros (sem alterações)
  handleUpload(request, response, next) {
    upload(request, response, (err) => {
      if (err) {
        return response.status(400).json({ message: "Erro no upload dos ficheiros.", error: err });
      }
      next();
    });
  },

  // Função para lidar com imagens coladas (sem alterações na lógica principal)
  async handlePaste(request, response) {
    try {
      const { image } = request.body;
      if (!image) {
        return response.status(400).json({ message: 'Nenhuma imagem fornecida.' });
      }

      const matches = image.match(/^data:(.+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return response.status(400).json({ message: 'Formato de imagem inválido.' });
      }
      
      const fileType = matches[1];
      const imageData = Buffer.from(matches[2], 'base64');
      const extension = fileType.split('/')[1];
      
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `pasted-${uniqueSuffix}.${extension}`;
      const filePath = path.join(uploadsDir, filename); // Usa path.join para segurança

      // Guarda os dados da imagem num ficheiro
      fs.writeFileSync(filePath, imageData);

      // Retorna o URL público para o frontend
      const publicUrl = `/attachments/${filename}`;
      return response.json({ url: `http://localhost:3333/files${publicUrl}` });

    } catch (error) {
      console.error("Erro ao processar imagem colada:", error);
      return response.status(500).json({ message: 'Erro ao processar imagem.' });
    }
  },
};