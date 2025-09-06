#!/bin/sh
# Aborta o script se qualquer comando falhar
set -e

echo "Waiting for the database to be ready..."
sleep 5

# Verifica se o diretório de migrações existe e não está vazio
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
  # Modo Produção: Executa as migrações existentes
  echo "Migrations directory found. Running 'prisma migrate deploy'..."
  npx prisma migrate deploy
else
  # Modo Desenvolvimento: Sincroniza o schema diretamente
  echo "Migrations directory not found or is empty. Running 'prisma db push'..."
  npx prisma db push
fi

# Inicia o servidor da aplicação
echo "Starting the application server..."
exec "$@"