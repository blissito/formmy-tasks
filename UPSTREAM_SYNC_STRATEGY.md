# 🔄 Estrategia de Sincronización con Upstream

Este documento describe la estrategia para mantener **Formmy Tasks** sincronizado con el repositorio oficial de **Flowise** mientras se preserva toda la identidad visual y personalización de Formmy.

## 🎯 Objetivo

Mantener siempre los últimos avances, características y correcciones del repositorio oficial de Flowise, pero **conservando al 100% el branding y personalización de Formmy**.

## 🏗️ Arquitectura de Branches

```
main (formmy-tasks)
├── formmy-branding (commits específicos de branding)
└── upstream/main (repositorio oficial de Flowise)
```

### Branch Structure

1. **`main`**: Branch principal con código de Formmy Tasks (fusión de upstream + branding)
2. **`formmy-branding`**: Branch dedicado exclusivamente a cambios de branding y personalización
3. **`upstream/main`**: Remote del repositorio oficial de Flowise

## 📁 Archivos de Branding Protegidos

Los siguientes archivos contienen personalización de Formmy y deben preservarse siempre:

```
packages/ui/src/ui-component/extended/Logo.jsx       # Componente de logo
packages/ui/public/index.html                       # Meta tags y títulos  
packages/ui/public/formmy_white.svg                 # Logo blanco
packages/ui/public/formmy_dark.svg                  # Logo oscuro
packages/ui/src/layout/MainLayout/Header/index.jsx  # Header sin GitHub button
packages/server/.env                                # Configuración del servidor
CLAUDE.md                                           # Instrucciones del proyecto  
improved-limesurvey-tool.js                        # Herramienta LimeSurvey
```

## 🚀 Proceso de Sincronización

### Automático (Recomendado)

Ejecutar el script de sincronización:

```bash
./sync-with-upstream.sh
```

### Manual

Si prefieres control total:

```bash
# 1. Fetch cambios del upstream  
git fetch upstream

# 2. Merge cambios principales
git merge upstream/main

# 3. Resolver conflictos si existen
# 4. Aplicar branding encima
git merge formmy-branding

# 5. Verificar que el branding se mantiene
# 6. Push cambios
git push origin main
```

## ⚙️ Configuración Inicial

### Una sola vez, ejecutar:

```bash
# Agregar remote upstream
git remote add upstream https://github.com/FlowiseAI/Flowise.git

# Fetch branches del upstream
git fetch upstream

# Hacer el script ejecutable
chmod +x sync-with-upstream.sh
```

## 🔍 Verificación Post-Sincronización

Después de cada sincronización, verificar que:

### ✅ Frontend (http://localhost:8080)
- [ ] Logo muestra "Formmy" (no Flowise)
- [ ] Título de página: "Formmy Tasks - Formularios y chat IA para tu sitio web"
- [ ] Color primario: #9A99EA (púrpura de Formmy)
- [ ] No aparece botón "Star on GitHub"
- [ ] Favicons son de Formmy

### ✅ Backend
- [ ] Servidor inicia correctamente en puerto 3000
- [ ] Base de datos SQLite funciona
- [ ] APIs responden correctamente
- [ ] Autenticación funciona

### ✅ Funcionalidad
- [ ] Creación de chatflows
- [ ] Herramienta LimeSurvey disponible 
- [ ] Todas las características de Flowise funcionan

## 📅 Frecuencia Recomendada

- **Semanal**: Para proyectos en desarrollo activo
- **Mensual**: Para proyectos en mantenimiento
- **Antes de releases importantes**: Siempre sincronizar

## 🚨 Resolución de Conflictos

### Conflictos Comunes

1. **Package.json**: Mantener versiones y deps específicas de Formmy
2. **Archivos de configuración**: Preservar configuración de Formmy  
3. **Componentes UI**: Mantener personalización visual

### Estrategia de Resolución

```bash
# Durante conflictos
git status                    # Ver archivos en conflicto
git diff                     # Revisar diferencias
# Editar archivos manualmente preservando branding de Formmy
git add <archivos-resueltos>
git commit
```

## 🔧 Comandos Útiles

```bash
# Ver estado de remotes
git remote -v

# Ver diferencias con upstream
git diff upstream/main

# Ver commits únicos de Formmy
git log upstream/main..HEAD

# Ver archivos modificados vs upstream
git diff --name-only upstream/main

# Revisar último commit de upstream
git log upstream/main -1
```

## 📚 Recursos

- [Repositorio oficial Flowise](https://github.com/FlowiseAI/Flowise)
- [Documentación Git Workflows](https://git-scm.com/book/en/v2/Git-Branching-Branching-Workflows)
- [Resolución de conflictos Git](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts)

## 🤝 Contribuciones

Si encuentras mejoras para esta estrategia:

1. Documenta el problema/mejora
2. Propone la solución
3. Actualiza este documento
4. Actualiza el script si es necesario

---

**⚠️ Importante**: Siempre probar en local antes de hacer push a producción. El branding de Formmy es crítico para la identidad de la marca.