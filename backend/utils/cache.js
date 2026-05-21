const cacheStore = {};

function cacheMiddleware(ttlSeconds) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next(); // кэшируем только GET-запросы

    const key = req.originalUrl;
    const cached = cacheStore[key];

    if (cached && cached.expires > Date.now()) {
      console.log(`⚡ Cache hit: ${key}`);
      return res.json(cached.data); // отдаём закэшированный ответ
    }

    // Перехватываем res.json, чтобы сохранить ответ в кэш
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      cacheStore[key] = {
        data: body,
        expires: Date.now() + ttlSeconds * 1000
      };
      originalJson(body);
    };

    next();
  };
}

function clearCache(prefix = '') {
  Object.keys(cacheStore).forEach(key => {
    if (key.startsWith(prefix)) delete cacheStore[key];
  });
}

module.exports = { cacheMiddleware, clearCache };