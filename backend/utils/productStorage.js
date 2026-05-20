const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '../products.json');

let products = [];

// Загрузка товаров из файла
function loadProducts() {
  try {
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    products = JSON.parse(data);
    console.log(`✅ Loaded ${products.length} products from products.json`);
  } catch (err) {
    console.error('Failed to load products.json:', err);
    products = [];
  }
}

// Сохранение товаров в файл
function saveProducts() {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
    console.log(`💾 Saved ${products.length} products to products.json`);
  } catch (err) {
    console.error('Failed to save products:', err);
  }
}

// Инициализация (загружаем при старте)
loadProducts();

module.exports = {
  getAll: () => [...products],
  getById: (id) => products.find(p => p.id == id),
  create: (product) => {
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const newProduct = { id: newId, ...product };
    products.push(newProduct);
    saveProducts();
    return newProduct;
  },
  update: (id, updates) => {
    const index = products.findIndex(p => p.id == id);
    if (index === -1) return null;
    products[index] = { ...products[index], ...updates };
    saveProducts();
    return products[index];
  },
  delete: (id) => {
    const index = products.findIndex(p => p.id == id);
    if (index === -1) return false;
    products.splice(index, 1);
    saveProducts();
    return true;
  }
};