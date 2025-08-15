# 1. Usamos uma imagem base oficial do Node.js. A versão "alpine" é leve e segura.
FROM node:18-alpine

# 2. Definimos o diretório de trabalho dentro do contêiner.
WORKDIR /usr/app

# 3. Copiamos os arquivos de definição do projeto.
#    Fazemos isso em um passo separado para aproveitar o cache do Docker.
#    Se não mudarmos as dependências, o Docker não roda o 'npm install' de novo.
COPY package*.json ./

# 4. Instalamos as dependências do projeto.
RUN npm install

# 5. Copiamos todo o resto do código do nosso projeto para o diretório de trabalho.
COPY . .

# 6. Definimos o comando padrão que será executado quando o contêiner iniciar.
CMD [ "npm", "run", "dev" ]