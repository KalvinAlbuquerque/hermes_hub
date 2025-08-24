# Arquivo: backend/Dockerfile

# 1. Usamos uma imagem base oficial do Node.js.
FROM node:18-alpine

# 2. Definimos o diretório de trabalho.
WORKDIR /usr/app

# 3. Copiamos os arquivos de definição do projeto.
COPY package*.json ./

# 4. Instalamos as dependências.
RUN npm install

# 5. Copiamos o RESTO do código, incluindo a pasta 'prisma'.
COPY . .

# 6. Geramos o cliente Prisma.
RUN npx prisma generate

# 7. Copia o script de entrypoint
COPY entrypoint.sh .
# 8. Garante que o script é executável DENTRO do container
RUN chmod +x ./entrypoint.sh

# 9. Define o entrypoint para ser executado com 'sh'
ENTRYPOINT ["sh", "./entrypoint.sh"]

# 10. Define o comando padrão para iniciar.
CMD ["npm", "start"]