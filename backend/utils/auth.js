const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

module.exports.generateAccessToken = (user) => {
  const role = user.role || 'user';
  return jwt.sign(
    { sub: user.id, email: user.email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_EXPIRES_IN || '15m' }
  );
};

module.exports.generateRefreshToken = (user) => {
  const role = user.role || 'user';
  return jwt.sign(
    { sub: user.id, role },
    process.env.REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_EXPIRES_IN || '7d' }
  );
};

module.exports.hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

module.exports.verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};