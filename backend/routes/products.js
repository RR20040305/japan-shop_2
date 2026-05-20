const express = require('express');
const { body, validationResult } = require('express-validator');
const productStorage = require('../utils/productStorage');
const authMiddleware = require('../middleware/auth').authMiddleware;
const roleMiddleware = require('../middleware/roles').roleMiddleware;

const router = express.Router();

const validateProduct = [
  body('title').isString().notEmpty(),
  body('category').isString().notEmpty(),
  body('price').isFloat({ gt: 0 }),
  body('amount').isInt({ min: 0 }),
  body('description').optional().isString(),
];

router.get('/', authMiddleware, async (req, res) => {
  console.log('[products] GET /, user:', req.user);
  try {
    const products = productStorage.getAll();
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  const product = productStorage.getById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

router.post('/', authMiddleware, roleMiddleware(['seller', 'admin']), validateProduct, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, category, description, price, amount } = req.body;
    const newProduct = { title, category, description: description || '', price, amount };
    const inserted = productStorage.create(newProduct);
    const io = req.app.get('io');
    if (io) io.emit('productAdded', inserted);
    const pushSender = req.app.get('pushSender');
    if (pushSender) {
      pushSender.sendToAllSubscribers({ title: 'Новый товар!', body: `${title} — ${price} ₽` });
    }
    res.status(201).json(inserted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, roleMiddleware(['seller', 'admin']), validateProduct, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, category, description, price, amount } = req.body;
    const updated = productStorage.update(req.params.id, { title, category, description, price, amount });
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const deleted = productStorage.delete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Product not found' });
  res.json({ message: 'Product deleted' });
});

module.exports = router;