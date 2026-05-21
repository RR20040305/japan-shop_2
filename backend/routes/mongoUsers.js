const express = require('express');
const router = express.Router();
const model = require('../models/MongoUser');

// POST /api/mongo-users
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, age } = req.body;
    if (!first_name || !last_name || age == null) {
      return res.status(400).json({ error: 'first_name, last_name и age обязательны' });
    }
    const user = await model.create({ first_name, last_name, age });
    res.status(201).json(user);
  } catch (err) {
    console.error('MongoDB create error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/mongo-users
router.get('/', async (req, res) => {
  try {
    const users = await model.findAll();
    res.json(users);
  } catch (err) {
    console.error('MongoDB find error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/mongo-users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await model.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(user);
  } catch (err) {
    console.error('MongoDB findById error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/mongo-users/:id
router.patch('/:id', async (req, res) => {
  try {
    const user = await model.updateById(req.params.id, req.body);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(user);
  } catch (err) {
    console.error('MongoDB update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/mongo-users/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await model.deleteById(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ message: 'Пользователь удалён' });
  } catch (err) {
    console.error('MongoDB delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;