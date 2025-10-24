# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Formmy Tasks** - a rebranded and customized AI-powered forms and chat platform. Originally based on Flowise, this application has been fully rebranded with Formmy's visual identity and deployed as a SaaS solution.

**Live URL**: Multiple instances (see Deployment Pipeline section)
**Brand Color**: #9A99EA (Formmy purple)  
**Original base**: Flowise (https://github.com/FlowiseAI/Flowise)

## Architecture

**Mono-repository structure with 4 main modules:**

- `server/`: Node.js backend serving API logic, authentication, and database connections
- `ui/`: React frontend with visual workflow builder
- `components/`: Third-party node integrations and custom AI components  
- `api-documentation/`: Auto-generated Swagger UI API documentation

## Essential Commands

### Development Setup
```bash
# Install PNPM globally (required)
npm i -g pnpm

# Install all dependencies
pnpm install

# Build all modules
pnpm build

# Start development server
pnpm start

# Access at http://localhost:3000
```

### Common Development Tasks
```bash
# Build specific module
pnpm build:server
pnpm build:ui
pnpm build:components

# Development mode with hot reload
pnpm dev

# Lint code
pnpm lint

# Run tests
pnpm test
```

### Memory Issues Fix
If encountering JavaScript heap out of memory errors:
```bash
# macOS/Linux
export NODE_OPTIONS="--max-old-space-size=4096"

# Windows PowerShell  
$env:NODE_OPTIONS="--max-old-space-size=4096"
```

## Technology Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Frontend**: React, TypeScript  
- **Database**: SQLite (with persistent volumes on Fly.io)
- **Package Manager**: PNPM (required, not npm/yarn)
- **Deployment**: Fly.io
- **Node Version**: >=18.15.0 <19.0.0 || >=20.0.0
- **Memory**: 1GB VM (configured in fly.toml)

## Rebranding Completed (Sept 4, 2025)

### Visual Identity Changes
- **Logo**: Formmy SVG logo implemented (`formmy_white.svg`, `formmy_dark.svg`)
- **Colors**: Primary color changed to #9A99EA (Formmy purple)
- **Favicons**: Updated to Formmy brand icons
- **GitHub Star Button**: Removed from header
- **Page Title**: "Formmy Tasks - Formularios y chat IA para tu sitio web"
- **Meta Tags**: Updated with Formmy descriptions and URLs

### Key Modified Files
- `ui/src/ui-component/extended/Logo.jsx` - Logo component
- `ui/src/layout/MainLayout/Header/index.jsx` - Removed GitHub button
- `ui/public/index.html` - Updated metadata and titles
- `fly.toml` - Configured with 1GB memory, 2 CPUs and proper host binding

### Deployment Configuration
- **App Name**: Variable per instance (m-flows, etc.)
- **Host Binding**: 0.0.0.0:3000 (fixed load balancer issues)
- **Health Checks**: Optimized timeouts (grace_period: 60s)
- **Database**: SQLite at /data/database.sqlite

## Key Development Notes

- All UI customization should maintain existing component structure
- Database changes must support multi-tenant architecture
- API endpoints need authentication middleware for SaaS features
- Frontend state management uses existing Flowise patterns
- Custom branding should not break core AI workflow functionality

## Deployment Pipeline

### Creating a New Instance

📖 **Guía Rápida**: Ver `NEW_INSTANCE_DEPLOYMENT.md` para instrucciones paso a paso.

Follow these steps to deploy a new Formmy Tasks instance with custom users:

#### 1. Update Configuration
```bash
# Edit fly.toml to set the new app name
app = 'your-app-name'  # Change this to your desired app name
```

#### 2. Build the Project
```bash
export NODE_OPTIONS="--max-old-space-size=8192"
pnpm build
```

#### 3. Deploy to Fly.io

**IMPORTANTE**: Debes crear el volumen persistente ANTES del primer deploy, o la aplicación fallará al iniciar.

```bash
# 1. Create the app (if it doesn't exist)
flyctl apps create your-app-name

# 2. Create persistent volume for SQLite database
#    - flowise_data: nombre del volumen (debe coincidir con fly.toml)
#    - --region iad: región de Virginia (USA East)
#    - --size 3: tamaño en GB (3GB es suficiente para empezar)
#    - --yes: confirma automáticamente
flyctl volumes create flowise_data --app your-app-name --region iad --size 3 --yes

# 3. Deploy the application
#    El volumen debe existir antes del deploy o la app no arrancará
flyctl deploy --app your-app-name
```

**Nota sobre el volumen:**
- El volumen es **REQUERIDO** para almacenar la base de datos SQLite
- Debe crearse en la misma región que la app (`iad` por defecto)
- El nombre `flowise_data` está configurado en `fly.toml` bajo `[[mounts]]`
- Los datos persisten entre deployments y reinios de la aplicación

#### 4. Seed Admin Users
After deployment, create admin users using the seed script:

```bash
# SSH into the container and run the seed script
flyctl ssh console --app your-app-name -C "sh -c 'ADMIN_USERS=\"email1@example.com:Name One,email2@example.com:Name Two,email3@example.com:Name Three\" ADMIN_PASSWORD=\"YourSecure@Pass123\" DATABASE_PATH=/data/database.sqlite/database.sqlite node /usr/src/seed-admin-users-simple.js'"
```

**Password Requirements:**
- Minimum 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- At least one special character (!@#$%^&*)

**Script Environment Variables:**
- `ADMIN_USERS`: Comma-separated list of `email:Name` pairs
- `ADMIN_PASSWORD`: Password for all admin users (must meet requirements)
- `DATABASE_PATH`: Path to SQLite database (default: `/data/database.sqlite/database.sqlite`)

#### 5. Verify Deployment
```bash
# Check app status
flyctl status --app your-app-name

# Check health
flyctl checks list --app your-app-name

# Test the endpoint
curl https://your-app-name.fly.dev/api/v1/ping
```

### Deployed Instances

| Instance | URL | Created | Users | RAM |
|----------|-----|---------|-------|-----|
| m-flows | https://m-flows.fly.dev | Oct 2025 | 3 admin users | 1GB |
| agentes | https://agentes.fly.dev | Oct 2025 | No users yet | 2GB |

### Standard Deployment (Legacy)

1. Local development with `pnpm dev`
2. Build with `pnpm build`
3. Test deployment locally
4. Deploy to Fly.io
5. Configure custom domain and SSL

## Important File Locations

### Application Files
- Main server entry: `packages/server/src/index.ts`
- React app root: `packages/ui/src/App.tsx`
- Logo component: `packages/ui/src/ui-component/extended/Logo.jsx`
- Header component: `packages/ui/src/layout/MainLayout/Header/index.jsx`
- API routes: `packages/server/src/routes/`
- Database models: `packages/server/src/database/entities/`

### Deployment & DevOps
- **fly.toml**: Fly.io deployment configuration (update `app` name for new instances)
- **seed-admin-users-simple.js**: Reusable script to create admin users in new deployments
- **Dockerfile**: Container build configuration
- **sync-with-upstream.sh**: Script to sync with Flowise upstream

### User Management
- User entity: `packages/server/src/enterprise/database/entities/user.entity.ts`
- User service: `packages/server/src/enterprise/services/user.service.ts`
- User command: `packages/server/src/commands/user.ts` (for password resets)

## Upstream Synchronization Strategy

**Formmy Tasks** se mantiene sincronizado con el repositorio oficial de Flowise mientras preserva el branding y personalización de Formmy.

### Quick Sync
```bash
# Sincronización automática (recomendado)
./sync-with-upstream.sh
```

### Manual Sync
```bash
# 1. Fetch cambios del upstream
git fetch upstream

# 2. Merge cambios del repositorio oficial
git merge upstream/main

# 3. Aplicar branding de Formmy
git merge formmy-branding
```

### Archivos Protegidos (Branding Formmy)
- `packages/ui/src/ui-component/extended/Logo.jsx` - Componente logo
- `packages/ui/public/index.html` - Meta tags y títulos
- `packages/ui/public/formmy_*.svg` - Logos de Formmy
- `packages/ui/src/layout/MainLayout/Header/index.jsx` - Header customizado
- `packages/server/.env` - Configuración servidor
- `improved-limesurvey-tool.js` - Herramienta LimeSurvey

### Remotes Configurados
- `origin`: Tu fork de Formmy Tasks
- `upstream`: Repositorio oficial Flowise

📖 **Documentación completa**: Ver `UPSTREAM_SYNC_STRATEGY.md`

## Troubleshooting Deployment

### Common Issues Resolved:

#### Build & Deployment Issues
1. **OOM Errors**: Increased memory from 512MB to 2GB in fly.toml
2. **Connection Refused**: Added HOST=0.0.0.0 environment variable
3. **Health Check Timeouts**: Adjusted grace_period to 60s
4. **Build Memory**: Set NODE_OPTIONS=--max-old-space-size=8192
5. **"Malformed UTF-8 data" Error**: Almost always caused by corrupted/invalid OpenAI API keys, not actual UTF-8 encoding issues

#### User & Authentication Issues

**"Role Not Found" Error After Login:**
- **Problem**: Custom roles created by seed script don't match existing system roles
- **Solution**: Update workspace_user and organization_user tables to use system roles:
  ```bash
  # SSH into container
  flyctl ssh console --app your-app-name

  # Update roles in database
  sqlite3 /data/database.sqlite/database.sqlite

  -- For workspace users (use personal workspace role)
  UPDATE workspace_user SET roleId = '6f7bd0ef-adda-1a3c-8e46-09c46c405638'
  WHERE roleId NOT IN (SELECT id FROM role WHERE organizationId IS NULL);

  -- For organization users (use owner role)
  UPDATE organization_user SET roleId = '52f2429c-74c8-1b1b-8dd4-9aa632a0afe8'
  WHERE roleId NOT IN (SELECT id FROM role WHERE organizationId IS NULL);

  .quit

  # Restart the app
  exit
  flyctl apps restart your-app-name
  ```

**Reset User Password:**
```bash
# Use the built-in user command
flyctl ssh console --app your-app-name -C "sh -c 'cd /usr/src && pnpm user --email \"user@example.com\" --password \"NewPass@123\"'"
```

**Database Location in Container:**
- SQLite database is located at: `/data/database.sqlite/database.sqlite`
- Note the nested path: the volume mounts to `/data/`, and creates a `database.sqlite` directory inside

### Deploy Commands:
```bash
# Standard deployment
flyctl deploy --app your-app-name

# Force rebuild (no cache)
flyctl deploy --app your-app-name --no-cache
```