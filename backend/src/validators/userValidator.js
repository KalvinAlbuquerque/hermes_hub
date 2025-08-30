// Arquivo: backend/src/validators/userValidator.js
const { z } = require('zod');

// Define as regras para a criação de um novo utilizador
const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(3, { message: "O nome deve ter no mínimo 3 caracteres." }),
    email: z.string().email({ message: "Formato de e-mail inválido." }),
    login: z.string().min(3, { message: "O login deve ter no mínimo 3 caracteres." }),
    password: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres." }),
    profileId: z.string().uuid({ message: "ID de perfil inválido." }),
  }),
});

// Middleware genérico para validação
const validate = (schema) => (request, response, next) => {
  try {
    schema.parse({
      body: request.body,
      query: request.query,
      params: request.params,
    });
    next();
  } catch (err) {
    return response.status(400).send(err.errors);
  }
};

module.exports = {
  createUserSchema,
  validate,
};