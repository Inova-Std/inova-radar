FROM node:20-alpine

WORKDIR /app

# Instala dependências básicas
RUN apk add --no-cache libc6-compat

# Copia arquivos de configuração
COPY package*.json ./
COPY prisma ./prisma/

# Instala dependências (incluindo dev para o build)
RUN npm install

# Copia o restante do código
COPY . .

# Argumento para o Prisma
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Build
RUN npx prisma generate
RUN npm run build

# Configurações de execução
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

EXPOSE 3000

CMD ["npm", "start"]
