const express = require('express');
const { SimpleUser } = require('../utils/db-sql');
const { cacheMiddleware, clearCache } = require('../utils/cache');

const router = express.Router();

// POST /api/simple-users
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, age } = req.body;
    if (!first_name || !last_name || age == null) {
      return res.status(400).json({ error: 'first_name, last_name и age обязательны' });
    }
    const user = await SimpleUser.create({ first_name, last_name, age });
    clearCache('/api/simple-users');                     // инвалидация кэша
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/simple-users (кэш 1 минута)
router.get('/', cacheMiddleware(60), async (req, res) => {
  const users = await SimpleUser.findAll();
  res.json(users);
});

// GET /api/simple-users/:id (кэш 1 минута)
router.get('/:id', cacheMiddleware(60), async (req, res) => {
  const user = await SimpleUser.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json(user);
});

// PATCH /api/simple-users/:id
router.patch('/:id', async (req, res) => {
  try {
    const user = await SimpleUser.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    const { first_name, last_name, age } = req.body;
    if (first_name !== undefined) user.first_name = first_name;
    if (last_name !== undefined) user.last_name = last_name;
    if (age !== undefined) user.age = age;
    await user.save();
    clearCache('/api/simple-users');                     // инвалидация кэша
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/simple-users/:id
router.delete('/:id', async (req, res) => {
  const deleted = await SimpleUser.destroy({ where: { id: req.params.id } });
  if (!deleted) return res.status(404).json({ error: 'Пользователь не найден' });
  clearCache('/api/simple-users');                       // инвалидация кэша
  res.json({ message: 'Пользователь удалён' });
});

module.exports = router;