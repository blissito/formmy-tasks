# Formmy Tasks

Asistentes, Chatflows, Agentflows y marketplace para Formmy IA

## 📚 Tabla de Contenidos

-   [⚡ Inicio Rápido](#-inicio-rápido)
-   [🐳 Docker](#-docker)
-   [👨‍💻 Desarrolladores](#-desarrolladores)
-   [🌱 Variables de Entorno](#-variables-de-entorno)
-   [🚀 Deploy](#-deploy)
-   [📄 Licencia](#-licencia)

## ⚡ Inicio Rápido

**Aplicación en vivo:** https://formmy-tasks.fly.dev/

Para desarrollo local, descarga e instala [NodeJS](https://nodejs.org/en/download) >= 18.15.0

1. Clona el repositorio:
    ```bash
    git clone https://github.com/blissito/formmy-tasks.git
    cd formmy-tasks
    ```

2. Instala las dependencias:
    ```bash
    npm i -g pnpm
    pnpm install
    ```

3. Configura las variables de entorno:
    ```bash
    cp .env.example .env
    # Edita .env con tus API keys
    ```

4. Construye y ejecuta:
    ```bash
    pnpm build
    pnpm start
    ```

5. Abre [http://localhost:3000](http://localhost:3000)

## 🐳 Docker

### Docker Compose

1. Clona el proyecto
2. Ve a la carpeta `docker`  
3. Copia `.env.example` a `.env` y configura tus variables
4. Ejecuta: `docker compose up -d`
5. Abre [http://localhost:3000](http://localhost:3000)

### Imagen Docker

```bash
# Construir la imagen
docker build --no-cache -t formmy-tasks .

# Ejecutar contenedor
docker run -d --name formmy-tasks -p 3000:3000 formmy-tasks
```

## 👨‍💻 Desarrolladores

Formmy Tasks tiene 4 módulos principales:

-   `server`: Backend Node.js con APIs
-   `ui`: Frontend React
-   `components`: Integraciones de nodos y herramientas
-   `api-documentation`: Documentación Swagger auto-generada

### Configuración para Desarrollo

1. Instala [PNPM](https://pnpm.io/installation):
    ```bash
    npm i -g pnpm
    ```

2. Instala dependencias:
    ```bash
    pnpm install
    ```

3. Construye el proyecto:
    ```bash
    export NODE_OPTIONS="--max-old-space-size=4096"
    pnpm build
    ```

4. Para desarrollo con hot-reload:
    ```bash
    pnpm dev
    ```
    
    La app estará disponible en [http://localhost:8080](http://localhost:8080)

## 🌱 Variables de Entorno

Configura las variables en el archivo `.env` basándote en `.env.example`. 

**Variables principales:**
- `ANTHROPIC_API_KEY`: Para modelos Claude (recomendado)
- `OPENAI_API_KEY`: Para modelos GPT
- `DATABASE_PATH`: Ruta de la base de datos SQLite
- `SECRETKEY_OVERWRITE`: Clave secreta para cifrado

## 🚀 Deploy

La aplicación está desplegada en Fly.io con:
- Node v3 para mejor rendimiento
- Base de datos SQLite con volumen persistente
- 2GB de memoria RAM
- Health checks optimizados

**Deploy automático:** Los cambios en `main` se despliegan automáticamente

## 📄 Licencia

Este código está disponible bajo la [Licencia Apache 2.0](LICENSE.md).
