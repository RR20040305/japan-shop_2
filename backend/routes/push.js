const express = require('express');
const router = express.Router();

// Глобальный объект подписок будет передан из server.js
let pushManager = null;

router.post('/subscribe', (req, res) => {
  if (!pushManager) {
    return res.status(500).json({ error: 'Push not configured' });
  }
  pushManager.addSubscription(req.body);
  res.status(201).json({ message: 'Subscribed' });
});

router.post('/unsubscribe', (req, res) => {
  if (!pushManager) {
    return res.status(500).json({ error: 'Push not configured' });
  }
  pushManager.removeSubscription(req.body.endpoint);
  res.status(200).json({ message: 'Unsubscribed' });
});

module.exports = (manager) => {
  pushManager = manager;
  return router;
};