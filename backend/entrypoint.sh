#!/bin/sh
# Aborta o script se qualquer comando falhar
set -e

# Espera um pouco mais para garantir que o BD está 100% pronto (opcional, mas seguro)
sleep 2

# Executa as migrações do Prisma. 'deploy' é o comando ideal para ambientes de produção/staging.
echo "Running database migrations..."
npx prisma migrate deploy

# Executa o comando principal do Dockerfile (npm start)
exec "$@"