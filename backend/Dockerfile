# backend/Dockerfile

# 1. Usamos uma imagem base oficial do Node.js.
FROM node:18-alpine

# 2. Definimos o diretório de trabalho.
WORKDIR /usr/app

# 3. Copiamos os arquivos de definição do projeto.
COPY package*.json ./

# 4. Instalamos as dependências do projeto.
RUN npm install

# 5. Copiamos o schema do Prisma para a imagem
COPY prisma ./prisma/

# 6. Geramos o cliente Prisma DENTRO da imagem
RUN npx prisma generate

# 7. Copiamos o resto do código.
COPY . .

# 8. Definimos o comando padrão para iniciar.
CMD [ "npm", "run", "dev" ]