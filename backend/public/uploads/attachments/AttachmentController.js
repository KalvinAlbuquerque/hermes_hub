// Arquivo: backend/src/controllers/AttachmentController.js
const multer = require('multer');
const path = require('path');

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
  // Função de middleware para usar nas rotas
  handleUpload(request, response) {
    upload(request, response, (err) => {
      if (err) {
        return response.status(400).json({ message: "Erro no upload dos ficheiros.", error: err });
      }
      // Se o upload for bem-sucedido, a informação dos ficheiros estará em 'request.files'
      // A lógica de envio de e-mail continuará no NotificationController
      // Aqui apenas processamos os ficheiros e os disponibilizamos para a próxima função.

      // Por agora, apenas retornamos os caminhos para teste
      const filePaths = request.files.map(file => ({
          filename: file.originalname,
          path: file.path, // O caminho absoluto no servidor
          storedFilename: file.filename // O nome único guardado
      }));

      return response.json({ message: "Ficheiros recebidos com sucesso!", files: filePaths });
    });
  },
};