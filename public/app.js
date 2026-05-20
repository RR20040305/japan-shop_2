// ---------- DOM элементы ----------
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');
const remindersBtn = document.getElementById('reminders-btn');
const logoutBtn = document.getElementById('logout-btn');
const appDiv = document.getElementById('app');
const loginFormDiv = document.getElementById('login-form');
const registerFormDiv = document.getElementById('register-form');
const authContainer = document.getElementById('auth-container');
const pushControls = document.getElementById('push-controls');
const enablePushBtn = document.getElementById('enable-push-btn');
const disablePushBtn = document.getElementById('disable-push-btn');

let accessToken = null;
let userRole = null;
let socket = null;

// ---------- VAPID публичный ключ (из .env) ----------
const VAPID_PUBLIC_KEY = 'BOLQIbeN6CmamaRULTsakQ_7Oxwa1NZJhEzGAkEOQeyl9YKbHwIixobnpjSfBwsixVcmewo4aMcSfedUQWQUIRA';

// ---------- Глобальные функции ----------
window.login = login;
window.register = register;
window.logout = logout;

console.log('app.js loaded');

// ---------- Вспомогательные ----------
function showAuthForms(show) {
  if (authContainer) authContainer.style.display = show ? 'block' : 'none';
}
function showLogoutButton(show) {
  if (logoutBtn) logoutBtn.style.display = show ? 'inline-block' : 'none';
}
function showLoginForm() {
  if (loginFormDiv) loginFormDiv.classList.remove('hidden');
  if (registerFormDiv) registerFormDiv.classList.add('hidden');
}
function showRegisterForm() {
  if (loginFormDiv) loginFormDiv.classList.add('hidden');
  if (registerFormDiv) registerFormDiv.classList.remove('hidden');
}

// ---------- Auth ----------
async function register() {
  const email = document.getElementById('reg-email')?.value;
  const password = document.getElementById('reg-password')?.value;
  const first_name = document.getElementById('reg-firstname')?.value;
  const last_name = document.getElementById('reg-lastname')?.value;
  const errorDiv = document.getElementById('register-error');
  if (!email || !password || !first_name || !last_name) {
    if (errorDiv) errorDiv.textContent = 'Заполните все поля';
    return;
  }
  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, first_name, last_name })
    });
    if (res.ok) {
      if (errorDiv) errorDiv.textContent = '';
      alert('Регистрация успешна! Теперь войдите.');
      showLoginForm();
    } else {
      const err = await res.json();
      if (errorDiv) errorDiv.textContent = err.error || 'Ошибка регистрации';
    }
  } catch (err) {
    if (errorDiv) errorDiv.textContent = 'Ошибка соединения';
  }
}

async function login() {
  const email = document.getElementById('login-email')?.value;
  const password = document.getElementById('login-password')?.value;
  const errorDiv = document.getElementById('login-error');
  if (!email || !password) {
    if (errorDiv) errorDiv.textContent = 'Введите email и пароль';
    return;
  }
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) {
      const data = await res.json();
      accessToken = data.accessToken;
      localStorage.setItem('token', accessToken);
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      userRole = payload.role;
      showAuthForms(false);
      showLogoutButton(true);
      if (pushControls) pushControls.style.display = 'block';
      setupPushSync();
      initSocket();
      checkPushSubscription();
      loadProducts();
      if (homeBtn) homeBtn.click();
    } else {
      const err = await res.json();
      if (errorDiv) errorDiv.textContent = err.error || 'Неверные учётные данные';
    }
  } catch (err) {
    if (errorDiv) errorDiv.textContent = 'Ошибка соединения';
  }
}

function logout() {
  if (socket) socket.disconnect();
  unsubscribeFromPush();          // вызов до обнуления токена (токен ещё жив)
  accessToken = null;
  userRole = null;
  localStorage.removeItem('token');
  showAuthForms(true);
  showLogoutButton(false);
  if (pushControls) pushControls.style.display = 'none';
  if (appDiv) appDiv.innerHTML = '';
  showLoginForm();
}

// ---------- WebSocket (реальный) ----------
function initSocket() {
  if (socket) socket.disconnect();                // отключаем старое соединение
  socket = io(`${location.protocol}//${location.host}`, {
    path: '/socket.io',
    transports: ['websocket', 'polling']
  });
  socket.on('connect', () => console.log('✅ WebSocket connected'));
  socket.on('productAdded', (product) => {
    console.log('🆕 New product via WebSocket:', product);
    showToast(`Новый товар: ${product.title} – ${product.price} ₽`);
    loadProducts();
  });
  socket.on('disconnect', () => console.log('❌ WebSocket disconnected'));
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed; bottom: 20px; right: 20px;
    background: #4285f4; color: white; padding: 12px 20px;
    border-radius: 8px; z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ---------- Push уведомления ----------
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Push не поддерживается в этом браузере');
    return;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    // Всегда получаем новую подписку (старая будет заменена)
    if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY === 'ВАШ_ПУБЛИЧНЫЙ_VAPID_КЛЮЧ') {
      alert('VAPID ключ не настроен. Свяжитесь с администратором.');
      return;
    }
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(subscription)
    });
    if (res.ok) {
      console.log('Push subscription saved on server');
      if (enablePushBtn) enablePushBtn.style.display = 'none';
      if (disablePushBtn) disablePushBtn.style.display = 'inline-block';
    } else {
      console.error('Failed to save subscription');
    }
  } catch (err) {
    console.error('Push subscription error:', err);
    alert('Не удалось подписаться на уведомления');
  }
}

async function unsubscribeFromPush() {
  if (!accessToken) return;        // <-- новая строка
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
      await subscription.unsubscribe();
      console.log('Unsubscribed from push');
      if (enablePushBtn) enablePushBtn.style.display = 'inline-block';
      if (disablePushBtn) disablePushBtn.style.display = 'none';
    }
  } catch (err) {
    console.error('Unsubscribe error:', err);
  }
}

async function checkPushSubscription() {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    if (enablePushBtn) enablePushBtn.style.display = 'none';
    if (disablePushBtn) disablePushBtn.style.display = 'inline-block';
  } else {
    if (enablePushBtn) enablePushBtn.style.display = 'inline-block';
    if (disablePushBtn) disablePushBtn.style.display = 'none';
  }
}

// ---------- Товары (с локальным резервом) ----------
const LOCAL_PRODUCTS_KEY = 'tokyo_drift_products';

function saveProductsToLocal(products) {
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
}
function loadProductsFromLocal() {
  const stored = localStorage.getItem(LOCAL_PRODUCTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

async function loadProducts() {
  if (!accessToken) return;
  try {
    const res = await fetch('/api/products', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (res.ok) {
      const products = await res.json();
      saveProductsToLocal(products);
      displayProducts(products);
    } else {
      displayProducts(loadProductsFromLocal());
    }
  } catch (err) {
    displayProducts(loadProductsFromLocal());
  }
}

async function addProduct() {
  const title = document.getElementById('prod-title')?.value;
  const category = document.getElementById('prod-category')?.value;
  const description = document.getElementById('prod-description')?.value;
  const price = parseFloat(document.getElementById('prod-price')?.value);
  const amount = parseInt(document.getElementById('prod-amount')?.value);
  const errorDiv = document.getElementById('add-product-error');
  if (!title || !category || isNaN(price) || isNaN(amount)) {
    if (errorDiv) errorDiv.textContent = 'Заполните все обязательные поля';
    return;
  }
  const newProduct = { id: Date.now(), title, category, description, price, amount };
  const products = loadProductsFromLocal();
  products.push(newProduct);
  saveProductsToLocal(products);
  displayProducts(products);
  // Очистка формы
  document.getElementById('prod-title').value = '';
  document.getElementById('prod-category').value = '';
  document.getElementById('prod-description').value = '';
  document.getElementById('prod-price').value = '';
  document.getElementById('prod-amount').value = '';
  if (errorDiv) errorDiv.textContent = '';
  // Отправка на сервер
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ title, category, description, price, amount })
    });
    if (res.ok) {
      const serverProduct = await res.json();
      const updated = loadProductsFromLocal().map(p => p.id === newProduct.id ? serverProduct : p);
      saveProductsToLocal(updated);
      displayProducts(updated);
    }
  } catch (err) {
    console.warn('Товар сохранён только локально');
  }
}

function displayProducts(products) {
  let html = '<h2>Товары</h2>';
  if (userRole === 'seller' || userRole === 'admin') {
    html += `
      <div class="add-product-form">
        <h3>Добавить товар</h3>
        <input type="text" id="prod-title" placeholder="Название" class="input">
        <input type="text" id="prod-category" placeholder="Категория" class="input">
        <textarea id="prod-description" placeholder="Описание" class="input"></textarea>
        <input type="number" id="prod-price" placeholder="Цена" class="input">
        <input type="number" id="prod-amount" placeholder="Количество" class="input">
        <button id="add-product-btn" class="button primary">Добавить</button>
        <div id="add-product-error" class="error"></div>
      </div>
    `;
  }
  if (!products.length) {
    html += '<p>Товаров пока нет</p>';
  } else {
    html += '<div class="product-container">';
    products.forEach(p => {
      html += `
        <div class="product-card">
          <div class="product-card__content">
            <h3 class="product-card__title">${escapeHtml(p.title)}</h3>
            <span class="product-card__category">${escapeHtml(p.category)}</span>
            <span class="product-card__amount">Остаток: ${p.amount}</span>
            <p class="product-card__description">${escapeHtml(p.description || '')}</p>
            <p class="product-card__price">${p.price} ₽</p>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }
  appDiv.innerHTML = html;
  if (userRole === 'seller' || userRole === 'admin') {
    document.getElementById('add-product-btn')?.addEventListener('click', addProduct);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m] || m));
}

// ---------- Напоминания (синхронизация с сервером) ----------
const REMINDERS_KEY = 'tokyo_drift_reminders';

async function loadRemindersFromServer() {
  if (!accessToken) return [];
  try {
    const res = await fetch('/api/reminders', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return [];
}

async function syncReminders() {
  const serverReminders = await loadRemindersFromServer();
  // Всегда обновляем локальный кэш (даже если сервер вернул пустой массив)
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(serverReminders));
  renderReminders(serverReminders);
}

function showReminders() {
  if (!accessToken) {
    appDiv.innerHTML = '<p>Пожалуйста, войдите.</p>';
    return;
  }
  // Показываем кэш сразу
  const cached = localStorage.getItem(REMINDERS_KEY);
  renderReminders(cached ? JSON.parse(cached) : []);
  // Затем синхронизируемся с сервером
  syncReminders();
}

function renderReminders(reminders) {
  let html = `
    <h2>Напоминания</h2>
    <div class="add-product-form" id="add-reminder-form">
      <h3>Новое напоминание</h3>
      <input type="text" id="reminder-text" placeholder="Текст заметки" class="input">
      <input type="datetime-local" id="reminder-datetime" class="input">
      <button id="add-reminder-btn" class="button primary">Добавить</button>
      <div id="add-reminder-error" class="error"></div>
    </div>
    <div class="product-container">
  `;
  if (!reminders || reminders.length === 0) {
    html += '<p>Нет напоминаний</p>';
  } else {
    reminders.forEach(r => {
      const date = new Date(r.fire_date).toLocaleString();
      html += `
        <div class="product-card" data-id="${r.id}">
          <div class="product-card__content">
            <h3 class="product-card__title">${escapeHtml(r.text)}</h3>
            <p>Напомнить: ${date}</p>
            <button class="delete-reminder-btn" data-id="${r.id}">Удалить</button>
          </div>
        </div>
      `;
    });
  }
  html += '</div>';
  appDiv.innerHTML = html;

  document.getElementById('add-reminder-btn')?.addEventListener('click', addReminder);
  document.querySelectorAll('.delete-reminder-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.id);
      deleteReminder(id);
    });
  });
}

async function addReminder() {
  const text = document.getElementById('reminder-text').value.trim();
  const datetimeValue = document.getElementById('reminder-datetime').value;
  const errorDiv = document.getElementById('add-reminder-error');
  if (!text) {
    errorDiv.textContent = 'Введите текст заметки';
    return;
  }
  if (datetimeValue) {
    const fireDate = new Date(datetimeValue).getTime();
    if (fireDate <= Date.now()) {
      errorDiv.textContent = 'Дата и время должны быть в будущем';
      return;
    }
    try {
      await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ text, fire_date: new Date(datetimeValue).toISOString() })
      });
    } catch (err) {
      errorDiv.textContent = 'Ошибка соединения';
      return;
    }
  }
  syncReminders(); // обновить список
}

async function deleteReminder(id) {
  await fetch(`/api/reminders/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  syncReminders();
}

// Обработчик сообщений от Service Worker (для синхронизации после push)
function setupPushSync() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SYNC_REMINDERS') {
        syncReminders();
      }
    });
  }
}

// ---------- Страницы ----------
function showHome() {
  if (!accessToken) { appDiv.innerHTML = '<p>Пожалуйста, войдите.</p>'; return; }
  loadProducts();
}
function showAbout() {
  appDiv.innerHTML = '<h2>О приложении</h2><p>PWA магазин "Токийский дрифт". Версия 1.0</p>';
}

// ---------- Инициализация ----------
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-btn')?.addEventListener('click', login);
  document.getElementById('register-btn')?.addEventListener('click', register);
  document.getElementById('show-register-btn')?.addEventListener('click', showRegisterForm);
  document.getElementById('show-login-btn')?.addEventListener('click', showLoginForm);
  logoutBtn?.addEventListener('click', logout);
  homeBtn?.addEventListener('click', showHome);
  aboutBtn?.addEventListener('click', showAbout);
  remindersBtn?.addEventListener('click', showReminders);
  enablePushBtn?.addEventListener('click', subscribeToPush);
  disablePushBtn?.addEventListener('click', unsubscribeFromPush);

  const savedToken = localStorage.getItem('token');
  if (savedToken) {
    accessToken = savedToken;
    try {
      const payload = JSON.parse(atob(savedToken.split('.')[1]));
      userRole = payload.role;
      showAuthForms(false);
      showLogoutButton(true);
      if (pushControls) pushControls.style.display = 'block';
      initSocket();
      checkPushSubscription();
      loadProducts();
      showHome();
    } catch (e) { logout(); }
  } else {
    showAuthForms(true);
    showLogoutButton(false);
    if (pushControls) pushControls.style.display = 'none';
    showLoginForm();
  }
});