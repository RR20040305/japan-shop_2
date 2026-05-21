FROM node:20-alpine
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY backend/package*.json ./
RUN npm install

# Копируем весь бэкенд
COPY backend/ .

# Копируем папку public (для статических файлов)
COPY public /app/public

COPY products.json .

EXPOSE 3000
CMD ["node", "server.js"]

COPY public /public