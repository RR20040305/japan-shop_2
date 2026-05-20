const jwt = require('jsonwebtoken');

module.exports.authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('[auth] Authorization header:', authHeader);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[auth] Missing or invalid header, returning 401');
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[auth] Decoded token:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('[auth] Token verify error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};