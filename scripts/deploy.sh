#!/bin/bash
# Formmy Tasks - Deploy Script para Fly.io

set -e

echo "🚀 Desplegando Formmy Tasks a Fly.io..."

# Verificar que fly CLI esté instalado
if ! command -v flyctl &> /dev/null; then
    echo "❌ Fly CLI no está instalado. Instalando..."
    curl -L https://fly.io/install.sh | sh
    export PATH="$HOME/.fly/bin:$PATH"
fi

echo "✅ Fly CLI encontrado: $(flyctl version)"

# Verificar login
if ! flyctl auth whoami &> /dev/null; then
    echo "🔐 Necesitas hacer login a Fly.io..."
    flyctl auth login
fi

echo "✅ Autenticado en Fly.io: $(flyctl auth whoami)"

# Crear volumen para base de datos
echo "💾 Creando volumen para base de datos..."
flyctl volumes create formmy_data --size 1 --app formmy-tasks || echo "Volumen ya existe"

# Lanzar aplicación
echo "🚀 Lanzando Formmy Tasks..."
flyctl launch --name formmy-tasks --no-deploy

# Configurar secrets
echo "🔐 Configurando secrets..."
flyctl secrets set \
  SECRETKEY_OVERWRITE="formmy-tasks-super-secret-key-2024-min-32-chars" \
  FLOWISE_USERNAME="admin" \
  FLOWISE_PASSWORD="FormMyTasks2024!" \
  TELEMETRY_ENABLED="false" \
  --app formmy-tasks

# Deploy final
echo "📦 Haciendo deploy..."
flyctl deploy --app formmy-tasks

# Abrir aplicación
echo "🎉 ¡Deploy completado!"
echo "🌐 Abriendo https://formmy-tasks.fly.dev..."
flyctl open --app formmy-tasks

echo ""
echo "✅ Formmy Tasks está online!"
echo "🔗 URL: https://formmy-tasks.fly.dev"
echo "👤 Usuario: admin"
echo "🔑 Password: FormMyTasks2024!"