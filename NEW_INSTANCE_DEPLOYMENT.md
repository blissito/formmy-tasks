# Guía Rápida: Desplegar Nueva Instancia de Formmy Tasks

Esta guía te ayudará a crear una nueva instancia de Formmy Tasks en Fly.io con usuarios admin personalizados.

## Pre-requisitos

- Fly.io CLI instalado y autenticado (`flyctl auth login`)
- Repositorio actualizado y con build exitoso

## Pasos de Deployment

### 1. Configurar App Name

Edita `fly.toml` y cambia el nombre de la app:

```toml
app = 'tu-nueva-app'  # Cambia esto
```

### 2. Build

```bash
export NODE_OPTIONS="--max-old-space-size=8192"
pnpm build
```

### 3. Crear App y Volumen en Fly.io

```bash
# Crear la app
flyctl apps create tu-nueva-app

# Crear volumen persistente (3GB recomendado)
flyctl volumes create flowise_data --app tu-nueva-app --region iad --size 3 --yes
```

### 4. Deploy

```bash
flyctl deploy --app tu-nueva-app
```

Espera a que el deployment termine exitosamente.

### 5. Crear Usuarios Admin

**Prepara tus usuarios:**
- Formato: `email1@example.com:Nombre Completo,email2@example.com:Otro Nombre`
- La contraseña debe cumplir: 8+ caracteres, mayúsculas, minúsculas, números, caracteres especiales

**Ejecuta el script de seed:**

```bash
flyctl ssh console --app tu-nueva-app -C "sh -c 'ADMIN_USERS=\"usuario1@example.com:Usuario Uno,usuario2@example.com:Usuario Dos,usuario3@example.com:Usuario Tres\" ADMIN_PASSWORD=\"TuPassword@123\" DATABASE_PATH=/data/database.sqlite/database.sqlite node /usr/src/seed-admin-users-simple.js'"
```

Reemplaza:
- `tu-nueva-app` con el nombre de tu app
- Los emails y nombres de usuarios
- `TuPassword@123` con tu contraseña segura

### 6. Verificar

```bash
# Estado de la app
flyctl status --app tu-nueva-app

# Health checks
flyctl checks list --app tu-nueva-app

# Test endpoint
curl https://tu-nueva-app.fly.dev/api/v1/ping
```

### 7. Login

Accede a `https://tu-nueva-app.fly.dev` con cualquiera de los usuarios creados.

## Ejemplo Completo

```bash
# 1. Editar fly.toml
# app = 'cliente-flows'

# 2. Build
export NODE_OPTIONS="--max-old-space-size=8192"
pnpm build

# 3. Crear app y volumen
flyctl apps create cliente-flows
flyctl volumes create flowise_data --app cliente-flows --region iad --size 3 --yes

# 4. Deploy
flyctl deploy --app cliente-flows

# 5. Crear usuarios
flyctl ssh console --app cliente-flows -C "sh -c 'ADMIN_USERS=\"admin@cliente.com:Admin Principal,user1@cliente.com:Usuario Uno,user2@cliente.com:Usuario Dos\" ADMIN_PASSWORD=\"ClienteSecure@2025\" DATABASE_PATH=/data/database.sqlite/database.sqlite node /usr/src/seed-admin-users-simple.js'"

# 6. Verificar
curl https://cliente-flows.fly.dev/api/v1/ping
```

## Troubleshooting

### "Role Not Found" al hacer login

Si ves este error, necesitas actualizar los roles:

```bash
flyctl ssh console --app tu-nueva-app

sqlite3 /data/database.sqlite/database.sqlite

UPDATE workspace_user SET roleId = '6f7bd0ef-adda-1a3c-8e46-09c46c405638'
WHERE roleId NOT IN (SELECT id FROM role WHERE organizationId IS NULL);

UPDATE organization_user SET roleId = '52f2429c-74c8-1b1b-8dd4-9aa632a0afe8'
WHERE roleId NOT IN (SELECT id FROM role WHERE organizationId IS NULL);

.quit
exit

flyctl apps restart tu-nueva-app
```

### Reset password de usuario

```bash
flyctl ssh console --app tu-nueva-app -C "sh -c 'cd /usr/src && pnpm user --email \"usuario@example.com\" --password \"NewPassword@123\"'"
```

### Ver logs

```bash
flyctl logs --app tu-nueva-app
```

## Instancias Desplegadas

Mantén un registro de tus instancias:

| App Name | URL | Fecha Creación | Usuarios | Notas |
|----------|-----|----------------|----------|-------|
| m-flows | https://m-flows.fly.dev | Oct 2025 | 3 admins | Primera instancia |
| tu-nueva-app | https://tu-nueva-app.fly.dev | - | - | - |

---

📖 **Documentación completa**: Ver `CLAUDE.md`
