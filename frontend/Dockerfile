# Arquivo: frontend/Dockerfile (Versão Corrigida para NPM)

# --- Estágio 1: Build ---
FROM node:18-alpine AS build

WORKDIR /usr/app

ARG NEXT_PUBLIC_API_URL
# Define a variável de ambiente DENTRO do build a partir do argumento
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# Copia os arquivos de definição do projeto

COPY package.json ./
# Copia o lock file correto: package-lock.json
COPY package-lock.json ./

# Instala as dependências de forma otimizada para CI/CD
RUN npm ci

# Copia o restante do código-fonte
COPY . .

# Constrói a aplicação para produção
RUN npm run build

# --- Estágio 2: Produção ---
FROM node:18-alpine

WORKDIR /usr/app

# Copia os artefatos construídos do estágio de build
COPY --from=build /usr/app/.next ./.next
COPY --from=build /usr/app/node_modules ./node_modules
COPY --from=build /usr/app/package.json ./package.json
COPY --from=build /usr/app/public ./public

# Expõe a porta que o Next.js usa
EXPOSE 3000

# O comando para iniciar a aplicação em modo de produção com npm
CMD ["npm", "start"]