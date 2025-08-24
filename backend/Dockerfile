# Arquivo: backend/Dockerfile

# 1. Usamos uma imagem base oficial do Node.js.
FROM node:18-alpine

# 2. Definimos o diretório de trabalho.
WORKDIR /usr/app

# 3. Copiamos os arquivos de definição do projeto.
COPY package*.json ./

# 4. Instalamos as dependências. O script 'postinstall' foi removido,
# então isso apenas instalará os pacotes.
RUN npm install

# 5. AGORA, copiamos o RESTO do código, incluindo a pasta 'prisma'.
COPY . .

# 6. E SÓ AGORA, com tudo no lugar, geramos o cliente Prisma.
RUN npx prisma generate

# 7. Definimos o comando padrão para iniciar.
CMD [ "npm", "run", "dev" ]