// ---------- DOM элементы ----------
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');
const remindersBtn = document.getElementById('reminders-btn');
const usersBtn = document.getElementById('users-btn');
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
const VAPID_PUBLIC_KEY = 'BG90E6k2oX4JjTYgamzn9N-SBENQaFomVluew97_wgh9eok6dClwTUFCgcQgluF4y3ONeRUGcntnCHQF5ZM-isQ';

// ---------- Глобальные функции ----------
window.login = login;
window.register = register;
window.logout = logout;

const reactBtn = document.getElementById('react-btn');
if (reactBtn) {
  reactBtn.addEventListener('click', () => {
    window.location.href = '/react/';
  });
}

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
      if (usersBtn) usersBtn.style.display = (userRole === 'admin') ? 'inline-block' : 'none';
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
  unsubscribeFromPush();          // вызываем до очистки токена
  accessToken = null;
  userRole = null;
  localStorage.removeItem('token');
  showAuthForms(true);
  showLogoutButton(false);
  if (pushControls) pushControls.style.display = 'none';
  if (usersBtn) usersBtn.style.display = 'none';
  if (appDiv) appDiv.innerHTML = '';
  showLoginForm();
}

// ---------- WebSocket ----------
function initSocket() {
  if (socket) socket.disconnect();
  socket = io(`${location.protocol}//${location.host}`, {
    path: '/socket.io',
    transports: ['websocket', 'polling']
  });
  socket.on('connect', () => console.log('WebSocket connected'));
  socket.on('productAdded', (product) => {
    showToast(`Новый товар: ${product.title} – ${product.price} ₽`);
    loadProducts();
  });
  socket.on('disconnect', () => console.log('WebSocket disconnected'));
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

// ---------- Push ----------
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Push не поддерживается в этом браузере');
    return;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify(subscription)
    });
    console.log('Push subscription saved');
    if (enablePushBtn) enablePushBtn.style.display = 'none';
    if (disablePushBtn) disablePushBtn.style.display = 'inline-block';
  } catch (err) {
    console.error('Push subscription error:', err);
    alert('Не удалось подписаться на уведомления');
  }
}

async function unsubscribeFromPush() {
  if (!accessToken) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
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

// ---------- Товары ----------
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

  // Очищаем ошибку
  if (errorDiv) errorDiv.textContent = '';

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

      // Добавляем полученный от сервера товар в локальный список
      const products = loadProductsFromLocal();
      products.push(serverProduct);
      saveProductsToLocal(products);
      displayProducts(products);

      // Отправляем событие через WebSocket
      if (socket) socket.emit('newProduct', serverProduct);

      // Очищаем поля формы
      document.getElementById('prod-title').value = '';
      document.getElementById('prod-category').value = '';
      document.getElementById('prod-description').value = '';
      document.getElementById('prod-price').value = '';
      document.getElementById('prod-amount').value = '';
    } else {
      const err = await res.json();
      if (errorDiv) errorDiv.textContent = err.error || 'Ошибка добавления';
    }
  } catch (err) {
    if (errorDiv) errorDiv.textContent = 'Ошибка соединения';
  }
}

async function editProduct(id) {
  const products = loadProductsFromLocal();
  const product = products.find(p => p.id == id);
  if (!product) return;

  // Находим карточку товара и заменяем её формой редактирования
  const card = document.querySelector(`.product-card[data-id="${id}"]`);
  if (!card) return;

  card.innerHTML = `
    <div class="product-card__content">
      <input type="text" id="edit-title-${id}" value="${escapeHtml(product.title)}" class="input">
      <input type="text" id="edit-category-${id}" value="${escapeHtml(product.category)}" class="input">
      <textarea id="edit-description-${id}" class="input">${escapeHtml(product.description || '')}</textarea>
      <input type="number" id="edit-price-${id}" value="${product.price}" class="input" step="0.01">
      <input type="number" id="edit-amount-${id}" value="${product.amount}" class="input">
      <button class="save-edit-btn" data-id="${id}">Сохранить</button>
      <button class="cancel-edit-btn" data-id="${id}">Отмена</button>
    </div>
  `;

  document.querySelector(`.save-edit-btn[data-id="${id}"]`).addEventListener('click', () => saveEdit(id));
  document.querySelector(`.cancel-edit-btn[data-id="${id}"]`).addEventListener('click', () => loadProducts());
}

async function saveEdit(id) {
  const title = document.getElementById(`edit-title-${id}`)?.value;
  const category = document.getElementById(`edit-category-${id}`)?.value;
  const description = document.getElementById(`edit-description-${id}`)?.value;
  const price = parseFloat(document.getElementById(`edit-price-${id}`)?.value);
  const amount = parseInt(document.getElementById(`edit-amount-${id}`)?.value);

  if (!title || !category || isNaN(price) || isNaN(amount)) {
    alert('Заполните все обязательные поля');
    return;
  }

  try {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ title, category, description, price, amount })
    });
    if (res.ok) {
      loadProducts(); // обновить список
    } else {
      alert('Ошибка сохранения');
    }
  } catch (err) {
    alert('Ошибка соединения');
  }
}

async function deleteProduct(id) {
  if (!confirm('Удалить товар?')) return;
  await fetch(`/api/products/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  loadProducts();
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
        <div class="product-card" data-id="${p.id}">
          <div class="product-card__content">
            <h3 class="product-card__title">${escapeHtml(p.title)}</h3>
            <span class="product-card__category">${escapeHtml(p.category)}</span>
            <span class="product-card__amount">Остаток: ${p.amount}</span>
            <p class="product-card__description">${escapeHtml(p.description || '')}</p>
            <p class="product-card__price">${p.price} ₽</p>
            ${(userRole === 'seller' || userRole === 'admin') ? `<button class="edit-product-btn" data-id="${p.id}">Редактировать</button>` : ''}
            ${userRole === 'admin' ? `<button class="delete-product-btn" data-id="${p.id}">Удалить</button>` : ''}
          </div>
        </div>
      `;
    });
    html += '</div>';
  }
  appDiv.innerHTML = html;

  if (userRole === 'seller' || userRole === 'admin') {
    document.getElementById('add-product-btn')?.addEventListener('click', addProduct);
    document.querySelectorAll('.edit-product-btn').forEach(btn => {
      btn.addEventListener('click', (e) => editProduct(e.target.dataset.id));
    });
  }
  if (userRole === 'admin') {
    document.querySelectorAll('.delete-product-btn').forEach(btn => {
      btn.addEventListener('click', (e) => deleteProduct(e.target.dataset.id));
    });
  }
}

// ---------- Напоминания ----------
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
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(serverReminders));
  renderReminders(serverReminders);
}

function showReminders() {
  if (!accessToken) { appDiv.innerHTML = '<p>Пожалуйста, войдите.</p>'; return; }
  const cached = localStorage.getItem(REMINDERS_KEY);
  renderReminders(cached ? JSON.parse(cached) : []);
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
    btn.addEventListener('click', (e) => deleteReminder(parseInt(e.target.dataset.id)));
  });
}

async function addReminder() {
  const text = document.getElementById('reminder-text').value.trim();
  const datetimeValue = document.getElementById('reminder-datetime').value;
  const errorDiv = document.getElementById('add-reminder-error');
  if (!text) { errorDiv.textContent = 'Введите текст заметки'; return; }
  if (datetimeValue) {
    const fireDate = new Date(datetimeValue).getTime();
    if (fireDate <= Date.now()) { errorDiv.textContent = 'Дата и время должны быть в будущем'; return; }
    try {
      await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ text, fire_date: new Date(datetimeValue).toISOString() })
      });
    } catch (err) { errorDiv.textContent = 'Ошибка соединения'; return; }
  }
  syncReminders();
}

async function deleteReminder(id) {
  await fetch(`/api/reminders/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  syncReminders();
}

function setupPushSync() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SYNC_REMINDERS') syncReminders();
    });
  }
}

// ---------- Админ-панель (пользователи) ----------
async function showUsers() {
  if (!accessToken || userRole !== 'admin') return;
  try {
    const res = await fetch('/api', { headers: { 'Authorization': `Bearer ${accessToken}` } });
    if (!res.ok) throw new Error('Ошибка загрузки');
    const users = await res.json();
    renderUsers(users);
  } catch (err) {
    appDiv.innerHTML = '<p class="error">Ошибка загрузки пользователей</p>';
  }
}

function renderUsers(users) {
  let html = `<h2>Управление пользователями</h2>
    <div class="user-list" style="display:grid; gap:1rem; margin-top:1rem;">`;
  users.forEach(u => {
    html += `
      <div class="product-card" style="display:flex; align-items:center; justify-content:space-between; padding:1rem;">
        <div>
          <strong>${escapeHtml(u.email)}</strong> (${escapeHtml(u.first_name)} ${escapeHtml(u.last_name)})<br>
          Роль: <span id="role-${u.id}">${escapeHtml(u.role)}</span> 
          ${u.isBlocked ? '<span style="color:red;"> [Заблокирован]</span>' : ''}
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          ${!u.isBlocked ? 
            `<button class="block-btn" data-id="${u.id}">Заблокировать</button>` :
            `<button class="unblock-btn" data-id="${u.id}">Разблокировать</button>`
          }
          <select class="role-select" data-id="${u.id}">
            <option value="user" ${u.role === 'user' ? 'selected' : ''}>Пользователь</option>
            <option value="seller" ${u.role === 'seller' ? 'selected' : ''}>Продавец</option>
            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Админ</option>
          </select>
        </div>
      </div>`;
  });
  html += '</div>';
  appDiv.innerHTML = html;
  document.querySelectorAll('.block-btn').forEach(btn => btn.addEventListener('click', () => blockUser(btn.dataset.id)));
  document.querySelectorAll('.unblock-btn').forEach(btn => btn.addEventListener('click', () => unblockUser(btn.dataset.id)));
  document.querySelectorAll('.role-select').forEach(sel => sel.addEventListener('change', () => changeRole(sel.dataset.id, sel.value)));
}

async function blockUser(id) {
  await fetch(`/api/${id}/block`, { method: 'PUT', headers: { 'Authorization': `Bearer ${accessToken}` } });
  showUsers();
}
async function unblockUser(id) {
  await fetch(`/api/${id}/unblock`, { method: 'PUT', headers: { 'Authorization': `Bearer ${accessToken}` } });
  showUsers();
}
async function changeRole(id, newRole) {
  await fetch(`/api/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
    body: JSON.stringify({ role: newRole })
  });
  showUsers();
}

// ---------- Навигация ----------
function showHome() {
  if (!accessToken) { appDiv.innerHTML = '<p>Пожалуйста, войдите.</p>'; return; }
  loadProducts();
}
function showAbout() {
  appDiv.innerHTML = '<h2>О приложении</h2><p>PWA магазин "Токийский дрифт". Версия 1.0</p>';
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m] || m));
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
  usersBtn?.addEventListener('click', showUsers);
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
      if (usersBtn) usersBtn.style.display = (userRole === 'admin') ? 'inline-block' : 'none';
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