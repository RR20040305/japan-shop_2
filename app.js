const bcrypt = require('bcrypt');
const path = require('path');
const express = require('express');
const fs = require('fs').promises;
const { body, validationResult } = require('express-validator');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const PRODUCTS_FILE = process.env.PRODUCTS_FILE || path.join(__dirname, 'products.json');
const USERS_FILE = process.env.USERS_FILE || path.join(__dirname, 'users.json');

let products = [];
let users = [];
let refreshTokens = new Set();

// Конфигурация JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-access-secret-key-change-me';
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret-key-change-me';
const REFRESH_EXPIRES_IN = '7d';

async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

// Генерация access-токена (включает роль)
function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

// Генерация refresh-токена (включает роль)
function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

// Middleware аутентификации
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }
}

// Middleware для проверки ролей
function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: insufficient role' });
    }
    next();
  };
}

// CORS
app.use(cors({ origin: 'http://localhost:3001', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Загрузка данных
async function loadProducts() {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
    products = JSON.parse(data);
    console.log('Товары загружены');
  } catch { products = []; }
}

async function saveProducts() {
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

async function loadUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    users = JSON.parse(data);
    console.log('Пользователи загружены');
  } catch { users = []; }
}

async function saveUsers() {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

// ---------- Swagger ----------
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'API магазина "Токийский дрифт"', version: '1.0.0' },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: [__filename],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ---------- Аутентификация ----------
app.post('/api/auth/register',
  body('email').isEmail(),
  body('first_name').isString().notEmpty(),
  body('last_name').isString().notEmpty(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, first_name, last_name, password } = req.body;
    if (users.find(u => u.email === email)) return res.status(409).json({ error: 'User already exists' });

    const hashedPassword = await hashPassword(password);
    const maxId = users.reduce((max, u) => (u.id > max ? u.id : max), 0);
    const newUser = {
      id: maxId + 1,
      email,
      first_name,
      last_name,
      password: hashedPassword,
      role: 'user'          // роль по умолчанию
    };
    users.push(newUser);
    await saveUsers();

    const { password: _, ...createdUser } = newUser;
    res.status(201).json(createdUser);
  }
);

app.post('/api/auth/login',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.add(refreshToken);

    res.json({ accessToken, refreshToken });
  }
);

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });
  if (!refreshTokens.has(refreshToken)) return res.status(401).json({ error: 'Invalid refresh token' });

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = users.find(u => u.id === payload.sub);
    if (!user) return res.status(401).json({ error: 'User not found' });

    refreshTokens.delete(refreshToken);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    refreshTokens.add(newRefreshToken);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const userId = req.user.sub;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// ---------- Управление пользователями (только admin) ----------
app.get('/api/users', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const usersWithoutPassword = users.map(({ password, ...rest }) => rest);
  res.json(usersWithoutPassword);
});

app.get('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const id = parseInt(req.params.id);
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password, ...userData } = user;
  res.json(userData);
});

app.put('/api/users/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const id = parseInt(req.params.id);
  const { email, first_name, last_name, role } = req.body;
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

  if (email) users[userIndex].email = email;
  if (first_name) users[userIndex].first_name = first_name;
  if (last_name) users[userIndex].last_name = last_name;
  if (role && ['user', 'seller', 'admin'].includes(role)) users[userIndex].role = role;

  await saveUsers();
  const { password, ...updated } = users[userIndex];
  res.json(updated);
});

app.delete('/api/users/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const id = parseInt(req.params.id);
  const initialLength = users.length;
  users = users.filter(u => u.id !== id);
  if (users.length < initialLength) {
    await saveUsers();
    res.json({ message: 'User deleted' });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// ---------- Товары (CRUD с ролями) ----------
app.get('/api/products', authMiddleware, (req, res) => {
  res.json(products);
});

app.get('/api/products/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const product = products.find(p => p.id === id);
  product ? res.json(product) : res.status(404).json({ error: 'Product not found' });
});

app.post('/api/products',
  authMiddleware,
  roleMiddleware(['seller', 'admin']),
  body('title').isString().notEmpty(),
  body('category').isString().notEmpty(),
  body('description').optional().isString(),
  body('price').isFloat({ gt: 0 }),
  body('amount').isInt({ min: 0 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, category, description, price, amount } = req.body;
    const maxId = products.reduce((max, p) => (p.id > max ? p.id : max), 0);
    const newProduct = { id: maxId + 1, title, category, description: description || '', price, amount };
    products.push(newProduct);
    await saveProducts();
    res.status(201).json(newProduct);
  }
);

app.put('/api/products/:id',
  authMiddleware,
  roleMiddleware(['seller', 'admin']),
  body('title').isString().notEmpty(),
  body('category').isString().notEmpty(),
  body('description').optional().isString(),
  body('price').isFloat({ gt: 0 }),
  body('amount').isInt({ min: 0 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: 'Product not found' });

    const { title, category, description, price, amount } = req.body;
    products[index] = { id, title, category, description: description || '', price, amount };
    await saveProducts();
    res.json(products[index]);
  }
);

app.delete('/api/products/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    const id = parseInt(req.params.id);
    const initialLength = products.length;
    products = products.filter(p => p.id !== id);
    if (products.length < initialLength) {
      await saveProducts();
      res.json({ message: 'Product deleted' });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  }
);

// 404 и обработка ошибок
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

// Запуск
Promise.all([loadProducts(), loadUsers()]).then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Swagger: http://localhost:${PORT}/api-docs`);
  });
});