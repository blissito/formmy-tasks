# Guía de Deployment en Fly.io - SOLUCIÓN FUNCIONAL ✅

## ❌ Problema Principal
```
[PC01] instance refused connection. is your app listening on 0.0.0.0:3000?
Error: Server colgado usando ./run start
```

**Causa Real**: El CLI de Flowise (`./run start`) no funciona correctamente en Docker/Fly.io. Necesitamos ejecutar Node.js directamente.

## 🚀 SOLUCIÓN QUE FUNCIONA

### 1. Dockerfile Correcto (Ejecutar Node Directamente)
```dockerfile
FROM node:20-alpine
WORKDIR /app

# Instalar pnpm
RUN npm i -g pnpm

# Copiar archivos
COPY . .

# Instalar dependencias y construir
RUN pnpm install --frozen-lockfile
RUN pnpm build

# Variables críticas
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=4096

EXPOSE 3000

# 🔥 SOLUCIÓN: Ejecutar Node directamente, NO usar ./run start
CMD ["node", "packages/server/dist/index.js"]
```

### 2. Alternativa: Script de Inicio Personalizado
Si prefieres usar un script, crea `start-server.js` en la raíz:
```javascript
// start-server.js
process.env.HOST = '0.0.0.0';
process.env.PORT = process.env.PORT || '3000';
process.env.NODE_ENV = 'production';

// Importar y ejecutar Flowise directamente
const { start } = require('./packages/server/dist/index.js');

start().catch(error => {
    console.error('Server failed to start:', error);
    process.exit(1);
});
```

Entonces en el Dockerfile:
```dockerfile
CMD ["node", "start-server.js"]
```

### 3. fly.toml Optimizado
```toml
app = "formmy-tasks"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "3000"
  HOST = "0.0.0.0"
  NODE_ENV = "production"
  NODE_OPTIONS = "--max-old-space-size=4096"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0

[[services.ports]]
  port = 443
  handlers = ["tls", "http"]

[[services.ports]]
  port = 80
  handlers = ["http"]

[services.http_checks]
  interval = "30s"
  timeout = "10s"
  grace_period = "60s"  # Importante para builds lentos
  method = "GET"
  path = "/"

[[vm]]
  size = "shared-cpu-2x"
  memory = "2gb"  # Aumentado para evitar OOM
```

### 4. package.json Scripts (Opcional)
```json
{
  "scripts": {
    "start": "node packages/server/dist/index.js",
    "start:prod": "NODE_ENV=production HOST=0.0.0.0 PORT=3000 node packages/server/dist/index.js"
  }
}
```

## 🚀 Comandos de Deployment

```bash
# Deploy inicial
flyctl launch --name tu-app-flowise

# Deploy subsiguiente
flyctl deploy

# Verificar logs
flyctl logs

# SSH para debug
flyctl ssh console
```

## 🔍 Checklist de Debug

1. **¿El servidor imprime `0.0.0.0:3000` en los logs?**
   - Si dice `127.0.0.1:3000` → Falta HOST=0.0.0.0

2. **¿El health check responde?**
   ```bash
   flyctl ssh console
   curl http://0.0.0.0:3000/
   ```

3. **¿El proceso está corriendo?**
   ```bash
   flyctl ssh console
   ps aux | grep node
   ```

## 💡 Diagnóstico Rápido

Si el deployment falla:

1. **Verifica que el server compile correctamente:**
   ```bash
   pnpm build
   ls -la packages/server/dist/index.js  # Debe existir
   ```

2. **Prueba local con Node directo:**
   ```bash
   HOST=0.0.0.0 PORT=3000 NODE_ENV=production node packages/server/dist/index.js
   ```

3. **Revisa los logs de Fly:**
   ```bash
   flyctl logs --app formmy-tasks
   ```

## 📝 Diferencias Clave

❌ **No funciona**:
- `CMD ["./run", "start"]` → Se cuelga en Docker
- `CMD ["pnpm", "start"]` → Usa el CLI problemático
- Memoria insuficiente (< 2GB)

✅ **Funciona**:
- `CMD ["node", "packages/server/dist/index.js"]` → Ejecuta directo
- HOST=0.0.0.0 configurado correctamente
- Memoria suficiente (2GB+)

## 🔧 Script de Inicio Mejorado (start-server.js)

Para mayor control, crea este script en la raíz del proyecto:

```javascript
#!/usr/bin/env node
// start-server.js

console.log('🚀 Iniciando Formmy Tasks...');

// Configurar variables de entorno críticas
process.env.HOST = '0.0.0.0';
process.env.PORT = process.env.PORT || '3000';
process.env.NODE_ENV = 'production';

console.log(`📍 Host: ${process.env.HOST}`);
console.log(`🔌 Puerto: ${process.env.PORT}`);
console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);

// Verificar que el archivo compilado existe
const fs = require('fs');
const serverPath = './packages/server/dist/index.js';

if (!fs.existsSync(serverPath)) {
    console.error(`❌ Error: No existe ${serverPath}`);
    console.error('Ejecuta: pnpm build');
    process.exit(1);
}

// Importar y ejecutar el servidor
const { start } = require(serverPath);

start()
    .then(() => {
        console.log('✅ Servidor iniciado correctamente');
    })
    .catch(error => {
        console.error('❌ Error al iniciar servidor:', error);
        process.exit(1);
    });
```

---

**Problema Solucionado**: El CLI de Flowise (`./run start`) no es compatible con contenedores Docker. La solución es ejecutar Node.js directamente contra el archivo compilado.