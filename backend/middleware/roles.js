module.exports.roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    // Временно пропускаем всех
    console.log('⚠️ roleMiddleware disabled, skipping check');
    return next();
  };
};