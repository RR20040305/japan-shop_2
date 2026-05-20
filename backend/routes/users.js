const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');          // <-- добавлено
const { UserSQL } = require('../utils/db-sql');
const authMiddleware = require('../middleware/auth').authMiddleware;
const roleMiddleware = require('../middleware/roles').roleMiddleware;
const { generateAccessToken, generateRefreshToken, hashPassword, verifyPassword } = require('../utils/auth');

const router = express.Router();

const validateRegistration = [
  body('email').isEmail().withMessage('Valid email required'),
  body('first_name').isString().notEmpty(),
  body('last_name').isString().notEmpty(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars'),
];

router.post('/register', validateRegistration, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, first_name, last_name, password } = req.body;
  try {
    const existing = await UserSQL.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const hashedPassword = await hashPassword(password);
    const newUser = await UserSQL.create({
      email,
      first_name,
      last_name,
      password: hashedPassword,
      role: 'user',
      isBlocked: false,
    });
    const { password: _, ...userWithoutPassword } = newUser.toJSON();
    res.status(201).json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const user = await UserSQL.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isBlocked) return res.status(403).json({ error: 'Account blocked' });

    const valid = await verifyPassword(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    res.json({ accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });
  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const user = await UserSQL.findByPk(payload.sub);
    if (!user || user.isBlocked) return res.status(401).json({ error: 'Invalid refresh token' });
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await UserSQL.findByPk(req.user.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...userData } = user.toJSON();
    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const users = await UserSQL.findAll({ attributes: { exclude: ['password'] } });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const user = await UserSQL.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const { email, first_name, last_name, role } = req.body;
  try {
    const user = await UserSQL.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (email) user.email = email;
    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    if (role && ['user', 'seller', 'admin'].includes(role)) user.role = role;
    await user.save();
    const { password, ...updated } = user.toJSON();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const deleted = await UserSQL.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/block', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const user = await UserSQL.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isBlocked) return res.status(400).json({ error: 'User already blocked' });
    user.isBlocked = true;
    await user.save();
    const { password, ...userData } = user.toJSON();
    res.json({ message: 'User blocked', user: userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/unblock', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const user = await UserSQL.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.isBlocked) return res.status(400).json({ error: 'User is not blocked' });
    user.isBlocked = false;
    await user.save();
    const { password, ...userData } = user.toJSON();
    res.json({ message: 'User unblocked', user: userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;