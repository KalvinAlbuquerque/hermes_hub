// Arquivo: backend/src/controllers/AttachmentController.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.resolve(__dirname, '..', '..', 'public', 'attachments');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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
  handleUpload(request, response, next) {
    upload(request, response, (err) => {
      if (err) {
        return response.status(400).json({ message: "Erro no upload dos ficheiros.", error: err });
      }
      next();
    });
  },

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
      const extension = fileType.split('/')[1] || 'png';
      
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      
      // LINHA CORRIGIDA/ADICIONADA: A variável 'filename' agora é definida.
      const filename = `pasted-${uniqueSuffix}.${extension}`;
      
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, imageData);

      const publicUrl = `/files/attachments/${filename}`;
      // Usa a variável de ambiente para criar o URL completo e público
      const fullUrl = `${process.env.BACKEND_URL || 'http://localhost:3333'}${publicUrl}`;

      return response.json({ url: fullUrl });

    } catch (error) {
      console.error("Erro ao processar imagem colada:", error);
      return response.status(500).json({ message: 'Erro ao processar imagem.' });
    }
  },
};