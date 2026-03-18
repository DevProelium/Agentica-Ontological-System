# ═══════════════════════════════════════════════════════════════
# Dockerfile (KISS & Alpine) - Aegis PWA y API
# ═══════════════════════════════════════════════════════════════
FROM node:20-alpine

# Establecer el directorio de trabajo ("El Taller")
WORKDIR /app

# Instalar dependencias necesarias para compilar módulos de Node y acceso utilitario
RUN apk add --no-cache bash python3 make g++ 

# Copiar la definición de dependencias para aprovechar la caché de capas de Docker
COPY package*.json ./
# Si se usan workspaces para frontend y bridge, idealmente los copias primero:
# COPY packages/bridge/package*.json packages/bridge/
# COPY packages/frontend/package*.json packages/frontend/

# Copiar el resto del código del Agente
COPY . .

# Instalar dependencias puras 
RUN npm install

# Exponer el puerto interno en el que escucha el Bridge/PWA
EXPOSE 3001

# Comando por defecto para iniciar (Ajustar al script del package.json de tu root/bridge)
CMD ["npm", "run", "start"]
