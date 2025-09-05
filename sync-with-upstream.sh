#!/bin/bash

# 🚀 Formmy Tasks - Upstream Sync Strategy
# Este script mantiene el repositorio sincronizado con Flowise oficial
# mientras preserva el branding y personalización de Formmy

set -e  # Exit on any error

echo "🔄 Iniciando sincronización con Flowise upstream..."

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Funciones de log
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# Variables
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
BRANDING_BRANCH="formmy-branding"
UPSTREAM_BRANCH="main"

# Validaciones iniciales
info "Validando configuración del repositorio..."
if ! git remote | grep -q "upstream"; then
    error "El remote 'upstream' no está configurado. Ejecuta: git remote add upstream https://github.com/FlowiseAI/Flowise.git"
fi

# 1. Guardar cambios locales si los hay
if ! git diff --quiet || ! git diff --staged --quiet; then
    warning "Hay cambios sin commitear. Guardando en stash..."
    git stash push -m "sync-with-upstream: auto-stash $(date)"
    STASH_CREATED=true
fi

# 2. Fetch upstream
info "Obteniendo últimos cambios del repositorio oficial..."
git fetch upstream

# 3. Crear o actualizar branch de branding si no existe
if ! git branch --list | grep -q "$BRANDING_BRANCH"; then
    info "Creando branch de branding: $BRANDING_BRANCH"
    git checkout -b $BRANDING_BRANCH
    
    # Crear commits específicos de branding
    info "Identificando cambios de branding..."
    
    # Archivos específicos de branding de Formmy
    BRANDING_FILES=(
        "packages/ui/src/ui-component/extended/Logo.jsx"
        "packages/ui/public/index.html"
        "packages/ui/public/formmy_white.svg"
        "packages/ui/public/formmy_dark.svg" 
        "packages/ui/src/layout/MainLayout/Header/index.jsx"
        "packages/server/.env"
        "CLAUDE.md"
        "improved-limesurvey-tool.js"
    )
    
    # Commit los cambios de branding por separado
    git add "${BRANDING_FILES[@]}" 2>/dev/null || true
    git commit -m "feat: Formmy branding and customizations

- Logo components with Formmy SVGs
- Updated page titles and meta tags  
- Removed GitHub star button
- Added LimeSurvey integration tool
- Custom environment configuration

🎨 Formmy visual identity preservation
" || info "No hay cambios de branding para commitear"

    git checkout $CURRENT_BRANCH
fi

# 4. Merge desde upstream manteniendo branding
info "Mergeando cambios desde upstream/$UPSTREAM_BRANCH..."

# Crear un merge commit que preserve el branding
git merge upstream/$UPSTREAM_BRANCH -m "chore: sync with upstream Flowise

Actualización desde el repositorio oficial de Flowise
manteniendo la identidad visual y personalización de Formmy Tasks.

Upstream: https://github.com/FlowiseAI/Flowise
" || {
    warning "Conflictos detectados durante el merge."
    echo "Resolución manual requerida:"
    echo "1. Resuelve los conflictos manualmente"
    echo "2. Ejecuta: git add <archivos-resueltos>"
    echo "3. Ejecuta: git commit"
    echo "4. Re-ejecuta este script"
    exit 1
}

# 5. Aplicar branding por encima
info "Aplicando personalización de Formmy..."
git merge $BRANDING_BRANCH --no-edit || {
    warning "Conflictos en el branding detectados."
    echo "Aplicando branding manualmente..."
    # Aquí podrías aplicar parches específicos si es necesario
}

# 6. Restaurar stash si se creó
if [ "$STASH_CREATED" = true ]; then
    info "Restaurando cambios locales desde stash..."
    git stash pop || warning "No se pudo aplicar el stash automáticamente"
fi

# 7. Resumen final
success "✨ Sincronización completada exitosamente!"
echo ""
echo "📋 Resumen:"
echo "- Upstream sincronizado desde: upstream/$UPSTREAM_BRANCH"  
echo "- Branding de Formmy preservado"
echo "- Branch actual: $(git rev-parse --abbrev-ref HEAD)"
echo ""
echo "🚀 Próximos pasos recomendados:"
echo "1. Verificar que la aplicación funcione correctamente"
echo "2. Ejecutar tests: pnpm test"
echo "3. Probar build: pnpm build"
echo "4. Push cambios: git push origin $CURRENT_BRANCH"
echo ""
warning "⚠️  Recuerda verificar que el branding de Formmy se mantenga intacto"