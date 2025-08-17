// Arquivo: backend/src/controllers/AttachmentController.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração do Multer para guardar os anexos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, '..', '..', 'public', 'attachments'));
  },
  filename: function (req, file, cb) {
    // Garante um nome de ficheiro único para evitar conflitos, mas mantém o nome original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Middleware para processar até 10 ficheiros com o nome de campo 'attachments'
const upload = multer({ storage: storage }).array('attachments', 10);

module.exports = {
  // Middleware de upload de ficheiros
  handleUpload(request, response, next) {
    upload(request, response, (err) => {
      if (err) {
        return response.status(400).json({ message: "Erro no upload dos ficheiros.", error: err });
      }
      // Passa para o próximo middleware (o NotificationController.submit)
      next();
    });
  },

  // Função para lidar com imagens coladas
  async handlePaste(request, response) {
    try {
      // O frontend enviará a imagem como uma string base64
      const { image } = request.body;
      if (!image) {
        return response.status(400).json({ message: 'Nenhuma imagem fornecida.' });
      }

      // Remove o cabeçalho da string base64 (ex: "data:image/png;base64,")
      const matches = image.match(/^data:(.+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return response.status(400).json({ message: 'Formato de imagem inválido.' });
      }
      
      const fileType = matches[1];
      const imageData = Buffer.from(matches[2], 'base64');
      const extension = fileType.split('/')[1];
      
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `pasted-${uniqueSuffix}.${extension}`;
      const filePath = path.resolve(__dirname, '..', '..', 'public', 'attachments', filename);

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