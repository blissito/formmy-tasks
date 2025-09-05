# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Formmy Tasks** - a rebranded and customized AI-powered forms and chat platform. Originally based on Flowise, this application has been fully rebranded with Formmy's visual identity and deployed as a SaaS solution.

**Live URL**: https://formmy-tasks.fly.dev/  
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
- **App Name**: formmy-tasks
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

1. Local development with `pnpm dev`
2. Build with `pnpm build` 
3. Test deployment locally
4. Deploy to Fly.io with MongoDB Atlas connection
5. Configure custom domain and SSL

## Important File Locations

- Main server entry: `packages/server/src/index.ts`
- React app root: `packages/ui/src/App.tsx`
- Logo component: `packages/ui/src/ui-component/extended/Logo.jsx`
- Header component: `packages/ui/src/layout/MainLayout/Header/index.jsx`
- API routes: `packages/server/src/routes/`
- Database models: `packages/server/src/database/entities/`

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
1. **OOM Errors**: Increased memory from 512MB to 2GB in fly.toml
2. **Connection Refused**: Added HOST=0.0.0.0 environment variable
3. **Health Check Timeouts**: Adjusted grace_period to 60s
4. **Build Memory**: Set NODE_OPTIONS=--max-old-space-size=8192
5. **"Malformed UTF-8 data" Error**: Almost always caused by corrupted/invalid OpenAI API keys, not actual UTF-8 encoding issues

### Deploy Command:
```bash
flyctl deploy --app formmy-tasks
```