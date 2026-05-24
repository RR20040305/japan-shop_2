# -------------------- STAGE 1: сборка React --------------------
FROM node:20-alpine AS react-builder
WORKDIR /react-app

# Копируем package.json и устанавливаем зависимости
COPY react-app/package*.json ./
RUN npm install

# Копируем исходники и собираем
COPY react-app/ .
RUN npm run build

# -------------------- STAGE 2: backend --------------------
FROM node:20-alpine
WORKDIR /app

# Копируем package.json и устанавливаем зависимости backend
COPY backend/package*.json ./
RUN npm install

# Копируем весь backend
COPY backend/ .

# Копируем статику основного приложения (PWA)
COPY public /app/public

# Копируем готовую React‑сборку из первого этапа
COPY --from=react-builder /react-app/dist /app/public/react

# Копируем products.json
COPY products.json .

EXPOSE 3000
CMD ["node", "server.js"]