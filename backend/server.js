require('dotenv').config({ path: '../.env' });
const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const socketIo = require('socket.io');
const { sequelize, Reminder, PushSubscription } = require('./utils/db-sql');
const { setupPush } = require('./utils/push');
const authRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const authMiddleware = require('./middleware/auth').authMiddleware;
const { Op } = require('sequelize');
const { cacheMiddleware, clearCache } = require('./utils/cache');

const app = express();
app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.setHeader('X-Server-ID', process.env.SERVER_ID || 'unknown');
  next();
});
const PORT = process.env.PORT || 3000;

// ---------- ВАЖНО: CORS и парсинг JSON ДО ВСЕХ МАРШРУТОВ ----------
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ---------- Простое API для управления пользователями (PostgreSQL) ----------
app.use('/api/simple-users', require('./routes/simpleUsers'));

// ---------- Планировщик напоминаний ----------
const cron = require('node-cron');
const webpush = require('web-push');

cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const reminders = await Reminder.findAll({
      where: {
        fire_date: { [Op.lte]: now },
        is_sent: false
      }
    });

    for (const reminder of reminders) {
      const [updatedCount] = await Reminder.update(
        { is_sent: true },
        { where: { id: reminder.id, is_sent: false } }
      );
      if (updatedCount === 0) continue;

      const subscriptions = await PushSubscription.findAll({
        where: { user_id: reminder.user_id }
      });

      const payload = JSON.stringify({
        title: 'Напоминание',
        body: reminder.text,
        tag: `reminder-${reminder.id}`,
        data: { reminderId: reminder.id },
        actions: [{ action: 'delay', title: 'Отложить на 5 минут' }]
      });

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            payload
          );
        } catch (err) {
          console.error('Push failed:', err.message);
          await PushSubscription.destroy({ where: { id: sub.id } });
        }
      }
    }
  } catch (err) {
    console.error('Cron error:', err);
  }
});

// Логирование запросов
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// Тестовый маршрут для балансировки
app.get('/server', (req, res) => {
  res.json({ server: `backend-${process.env.SERVER_ID || 'unknown'}` });
});

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Healthcheck
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// ---------- Маршруты напоминаний ----------
const reminderRoutes = express.Router();

reminderRoutes.get('/', authMiddleware, async (req, res) => {
  const reminders = await Reminder.findAll({ where: { user_id: req.user.sub } });
  res.json(reminders);
});

reminderRoutes.post('/', authMiddleware, async (req, res) => {
  const { text, fire_date } = req.body;
  if (!text || !fire_date) return res.status(400).json({ error: 'text and fire_date required' });

  const reminder = await Reminder.create({
    user_id: req.user.sub,
    text,
    fire_date: new Date(fire_date),
    is_sent: false
  });
  res.status(201).json(reminder);
});

reminderRoutes.delete('/:id', authMiddleware, async (req, res) => {
  await Reminder.destroy({ where: { id: req.params.id, user_id: req.user.sub } });
  res.json({ message: 'Deleted' });
});

reminderRoutes.delete('/:id/close', async (req, res) => {
  try {
    const deleted = await Reminder.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.json({ message: 'Reminder deleted on close' });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

reminderRoutes.put('/:id/delay', authMiddleware, async (req, res) => {
  const reminder = await Reminder.findOne({ where: { id: req.params.id, user_id: req.user.sub } });
  if (!reminder) return res.status(404).json({ error: 'Not found' });
  reminder.fire_date = new Date(Date.now() + 5 * 60 * 1000);
  reminder.is_sent = false;
  await reminder.save();
  res.json(reminder);
});

app.use('/api/reminders', reminderRoutes);

// ---------- Push-подписки ----------
app.post('/api/push/subscribe', authMiddleware, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys) return res.status(400).json({ error: 'endpoint and keys required' });

    await PushSubscription.create({
      user_id: req.user.sub,
      endpoint,
      keys
    });
    res.status(201).json({ message: 'Subscribed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/push/unsubscribe', authMiddleware, async (req, res) => {
  try {
    await PushSubscription.destroy({
      where: { user_id: req.user.sub, endpoint: req.body.endpoint }
    });
    res.json({ message: 'Unsubscribed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/push-key', (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY || 'BG90E6k2oX4JjTYgamzn9N-SBENQaFomVluew97_wgh9eok6dClwTUFCgcQgluF4y3ONeRUGcntnCHQF5ZM-isQ';
  res.json({ publicKey });
});

// ---------- MongoDB API (нативный драйвер) ----------
app.use('/api/mongo-users', require('./routes/mongoUsers'));

// ---------- Товары и пользователи ----------
app.use('/api/products', productRoutes);
app.use('/api', authRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ---------- Настройка HTTPS / HTTP ----------
let server;
if (process.env.NODE_ENV === 'production') {
  server = http.createServer(app);
} else {
  const certPath = path.join(__dirname, '..', 'certs');
  const options = {
    key: fs.readFileSync(path.join(certPath, 'localhost-key.pem')),
    cert: fs.readFileSync(path.join(certPath, 'localhost.pem'))
  };
  server = https.createServer(options, app);
}

// ---------- Socket.IO ----------
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  allowEIO3: true,
  transports: ['websocket', 'polling']
});

io.engine.on("connection_error", (err) => {
  console.log("❌ Socket.IO connection error:", err.code, err.message, err.context);
});

app.set('io', io);
const pushManager = setupPush();
app.set('pushSender', pushManager);

io.on('connection', (socket) => {
  console.log('🟢 Client connected:', socket.id);
  socket.on('newProduct', (product) => {
    console.log(`📦 New product from ${socket.id}: ${product.title}`);
    socket.broadcast.emit('productAdded', product);
  });
  socket.on('disconnect', () => console.log('WebSocket disconnected'));
});

// ---------- Запуск с повторными попытками подключения к БД ----------
async function startServer() {
  const maxRetries = 10;
  const retryDelay = 3000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connected');
      break;
    } catch (err) {
      console.error(`❌ Database connection attempt ${attempt} failed: ${err.message}`);
      if (attempt === maxRetries) {
        console.error('❌ All connection attempts exhausted');
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  if (process.env.SERVER_ID === '3') {
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced (master)');
  } else {
    console.log('ℹ️ Skipping sync (non‑master)');
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});