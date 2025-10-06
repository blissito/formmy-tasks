# Formmy Tasks - Deploy a Fly.io

## Pre-requisitos

1. Instalar Fly.io CLI:
```bash
# macOS
brew install flyctl

# Linux/WSL  
curl -L https://fly.io/install.sh | sh

# Windows
iwr https://fly.io/install.ps1 -useb | iex
```

2. Hacer login en Fly.io:
```bash
flyctl auth login
```

## Deploy Steps

### 1. Crear la aplicación en Fly.io
```bash
flyctl apps create formmy-tasks
```

### 2. Crear volumen para base de datos SQLite
```bash
flyctl volumes create formmy_data --size 1 --app formmy-tasks
```

### 3. Configurar secrets
```bash
# Secret key (mínimo 32 caracteres)
flyctl secrets set SECRETKEY_OVERWRITE="your-super-secret-key-min-32-chars" --app formmy-tasks

# Credenciales admin
flyctl secrets set FLOWISE_USERNAME="admin" --app formmy-tasks
flyctl secrets set FLOWISE_PASSWORD="tu-password-seguro" --app formmy-tasks

# OpenAI API Key (opcional pero recomendado)
flyctl secrets set OPENAI_API_KEY="sk-your-openai-key-here" --app formmy-tasks

# Desactivar telemetría
flyctl secrets set TELEMETRY_ENABLED="false" --app formmy-tasks
```

### 4. Deploy inicial
```bash
flyctl deploy --app formmy-tasks
```

### 5. Abrir la aplicación
```bash
flyctl open --app formmy-tasks
```

## URLs de Acceso

- **App**: https://formmy-tasks.fly.dev
- **Dashboard**: https://formmy-tasks.fly.dev  
- **Login**: admin / tu-password-seguro

## Comandos Útiles

```bash
# Ver logs en tiempo real
flyctl logs --app formmy-tasks

# Reiniciar app
flyctl restart --app formmy-tasks

# Ver estado de máquinas
flyctl status --app formmy-tasks

# Conectar a base de datos
flyctl ssh console --app formmy-tasks

# Ver secrets configurados
flyctl secrets list --app formmy-tasks

# Escalar (cambiar recursos)
flyctl scale memory 1024 --app formmy-tasks

# Configurar dominio personalizado (opcional)
flyctl certs add formmy.app --app formmy-tasks
```

## Configuración Personalizada

Para usar tu propio dominio `formmy.app`:

1. Agregar certificado SSL:
```bash
flyctl certs add formmy.app --app formmy-tasks
```

2. Configurar DNS:
```
CNAME: formmy.app -> formmy-tasks.fly.dev
```

## Troubleshooting

### Si el build falla:
```bash
# Build local para debuggear
flyctl deploy --build-only --app formmy-tasks

# Ver logs de build
flyctl logs --app formmy-tasks
```

### Si la app no arranca:
```bash
# Verificar que el volumen existe
flyctl volumes list --app formmy-tasks

# Conectar por SSH para debuggear
flyctl ssh console --app formmy-tasks
```

### Para actualizar después de cambios:
```bash
# Commit cambios
git add .
git commit -m "Update Formmy Tasks"

# Deploy nueva versión
flyctl deploy --app formmy-tasks
```