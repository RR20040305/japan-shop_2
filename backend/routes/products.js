const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth').authMiddleware;
const roleMiddleware = require('../middleware/roles').roleMiddleware;
const { cacheMiddleware, clearCache } = require('../utils/cache');
const { Product } = require('../utils/db-sql');

const router = express.Router();

const validateProduct = [
  body('title').isString().notEmpty(),
  body('category').isString().notEmpty(),
  body('price').isFloat({ gt: 0 }),
  body('amount').isInt({ min: 0 }),
  body('description').optional().isString(),
];

// GET /api/products – кэш 10 минут (600 секунд)
router.get('/', authMiddleware, cacheMiddleware(600), async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id – кэш 10 минут
router.get('/:id', authMiddleware, cacheMiddleware(600), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products
router.post('/', authMiddleware, roleMiddleware(['seller', 'admin']), validateProduct, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, category, description, price, amount } = req.body;
    const newProduct = await Product.create({
      title,
      category,
      description: description || '',
      price,
      amount
    });

    // Инвалидация кэша всех товаров
    clearCache('/api/products');

    const io = req.app.get('io');
    if (io) io.emit('productAdded', newProduct);
    const pushSender = req.app.get('pushSender');
    if (pushSender) {
      pushSender.sendToAllSubscribers({
        title: 'Новый товар!',
        body: `${title} — ${price} ₽`
      });
    }

    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id
router.put('/:id', authMiddleware, roleMiddleware(['seller', 'admin']), validateProduct, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const { title, category, description, price, amount } = req.body;
    await product.update({ title, category, description, price, amount });

    clearCache('/api/products');
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    await product.destroy();
    clearCache('/api/products');
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;