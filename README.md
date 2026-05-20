# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)




# Отчет по КР1  
## Выполненные работы

В ходе выполнения практических занятий №1–5 были реализованы:

- **Практическое занятие №1** – использование CSS-препроцессора SASS для стилизации интернет-магазина.
- **Практическое занятие №2** – разработка серверной части на Node.js + Express с CRUD операциями для товаров.
- **Практическое занятие №4** – интеграция фронтенда (React/HTML) с бэкендом, взаимодействие через API.
- **Практическое занятие №5** – подключение Swagger для документирования REST API.

## Используемые технологии

- **Frontend**: HTML5, CSS3, SASS (SCSS), React (частично), Fetch API.
- **Backend**: Node.js, Express.js, express-validator, CORS, Swagger (swagger-jsdoc, swagger-ui-express).
- **Инструменты**: npm, Git.

## Реализация
### 1. CSS-препроцессор SASS (Практическое занятие №1)

В файле [`styles.scss`](./styles.scss) применены основные возможности SASS:

- **Переменные** – для хранения цветовой схемы, отступов, радиусов:
  ```scss
  $primary-color: #7d5a5a;
  $bg1-color: #fff3f3;
  $border-color: #efb1c3;
  $space-md: 1rem;
  $border-radius: 16px;
  ```

- **Миксины** – для переиспользования стилей (например, тени карточек):
  ```scss
  @mixin card-shadow($color, $blur: 20px) {
    box-shadow: 0 4px $blur rgba($color, 0.08);
    transition: box-shadow 0.3s ease, transform 0.3s ease;
    &:hover {
      box-shadow: 0 8px $blur * 1.5 rgba($color, 0.12);
      transform: translateY(-2px);
    }
  }
  ```

- **Вложенность** – иерархическая структура селекторов, повторяющая HTML:
  ```scss
  .site-header {
    background: linear-gradient(...);
    &::after { ... }
  }
  .title {
    .title-text { ... }
    .title-des { ... }
  }
  ```

Эти возможности позволили упростить поддержку стилей и сделать код более читаемым.

---

### 2. Сервер на Node.js + Express (Практическое занятие №2)

Сервер реализован в файле [`app.js`](./app.js). Основные моменты:

- **Подключение необходимых модулей**:
  ```js
  const express = require('express');
  const { body, validationResult } = require('express-validator');
  const cors = require('cors');
  ```

- **Middleware**:
  - `express.json()` – парсинг JSON тела запроса.
  - `cors` – разрешение запросов с фронтенда (`http://localhost:3001`).
  - Статические файлы из папки `public`.

- **CRUD для товаров** (массив `products` загружается из `products.json` и сохраняется обратно):
  - **GET /products** – получение всех товаров.
  - **GET /products/:id** – получение товара по id.
  - **POST /products** – создание нового товара с валидацией полей (name, price, category, amount, description).
  - **PATCH /products/:id** – частичное обновление товара.
  - **DELETE /products/:id** – удаление товара.

  Пример маршрута создания товара:
  ```js
  app.post('/products',
    body('name').isString().notEmpty(),
    body('price').isFloat({ gt: 0 }),
    // ...
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      // создание и сохранение товара
    }
  );
  ```

- **Валидация** выполнена с помощью `express-validator`, что обеспечивает корректность входных данных.

- **Хранение данных** – в JSON-файлах (`products.json`, `users.json`), чтение и запись асинхронны.

---

### 3. Интеграция фронтенда и бэкенда (Практическое занятие №4)

#### Клиентская часть на чистом HTML/JavaScript

В файле [`public/index.html`](./public/index.html) реализован интерфейс для управления товарами:

- **Загрузка товаров** при загрузке страницы через `fetch`:
  ```js
  async function loadProducts() {
    const response = await fetch('/products');
    const products = await response.json();
    renderProducts(products);
  }
  ```

- **Отображение товаров** в виде карточек с кнопками «Редактировать» и «Удалить».

- **Добавление товара** через форму – отправка POST-запроса с JSON.

- **Редактирование** – через PATCH-запрос с обновлёнными полями.

- **Удаление** – DELETE-запрос с подтверждением.

Пример обработчика удаления:
```js
const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
if (!response.ok) throw new Error('Ошибка при удалении');
loadProducts(); // обновить список
```

#### React-версия

Клиентская часть на React находится в папке src. Основной компонент – ProductsPage.jsx. Он использует хуки для управления состоянием и загрузки данных.
Загрузка товаров при монтировании
```jsx
useEffect(() => {
  loadProducts();
}, []);

const loadProducts = async () => {
  setLoading(true);
  const data = await api.getProducts();
  setProducts(data);
  setLoading(false);
};
```

Управление модальным окном (создание/редактирование)
```jsx
const [modalOpen, setModalOpen] = useState(false);
const [modalMode, setModalMode] = useState('create');
const [editingProduct, setEditingProduct] = useState(null);

const openCreate = () => {
  setModalMode('create');
  setEditingProduct(null);
  setModalOpen(true);
};

const openEdit = (product) => {
  setModalMode('edit');
  setEditingProduct(product);
  setModalOpen(true);
};
```

Обработка удаления
```jsx
const handleDelete = async (id) => {
  if (!window.confirm('Удалить товар?')) return;
  await api.deleteProduct(id);
  setProducts(prev => prev.filter(p => p.id !== id));
};
```

Отправка данных в API
```jsx
const handleSubmitModal = async (payload) => {
  if (modalMode === 'create') {
    const newProduct = await api.createProduct(payload);
    setProducts(prev => [...prev, newProduct]);
  } else {
    const updated = await api.updateProduct(payload.id, payload);
    setProducts(prev => prev.map(p => p.id === payload.id ? updated : p));
  }
  closeModal();
};
```

Компоненты-помощники
ProductList – отображает список карточек товаров, передаёт события редактирования/удаления.

ProductModal – универсальное модальное окно для создания и редактирования товара.

### 4. Документирование API с помощью Swagger (Практическое занятие №5)

В серверное приложение добавлена поддержка Swagger:

- Установлены пакеты `swagger-jsdoc` и `swagger-ui-express`.
- В `app.js` настроена генерация спецификации:
  ```js
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'API магазина "Токийский дрифт"',
        version: '1.0.0',
        description: 'Документация для управления товарами и пользователями',
      },
      servers: [{ url: `http://localhost:${PORT}` }],
    },
    apis: [__filename], // файлы с JSDoc-комментариями
  };
  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  ```

- Для каждого маршрута добавлены JSDoc-комментарии с описанием параметров, тела запроса и ответов.  
  *Пример (в коде комментарии не приведены, но предполагается их наличие):*
  ```js
  /**
   * @swagger
   * /products:
   *   get:
   *     summary: Возвращает список всех товаров
   *     responses:
   *       200:
   *         description: Успешный ответ
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Product'
   */
  ```

После запуска сервера документация доступна по адресу:  
[http://localhost:3000/api-docs](http://localhost:3000/api-docs) (интерактивный интерфейс).

---

## Запуск проекта

1. **Клонировать репозиторий**:
   ```bash
   git clone <URL репозитория>
   cd <папка проекта>
   ```

2. **Установить зависимости** (для сервера):
   ```bash
   npm install
   ```

3. **Запустить сервер**:
   ```bash
   node app.js
   ```
   Сервер будет доступен на `http://localhost:3000`.

4. **Открыть клиентскую часть**:
   - Простая HTML-версия: перейти по `http://localhost:3000` (файлы из папки `public` обслуживаются статически).
   - React-версия: требуется отдельный запуск (например, `npm start` в папке клиента на порту 3001).

---

## Выводы

В результате выполнения практических работ был создан полноценный интернет-магазин с тематикой японских товаров «Токийский дрифт»:

- Применён **SASS** для современной, модульной стилизации.
- Разработано **REST API** на Express с полным набором CRUD операций.
- Реализована **связка клиента и сервера** через Fetch API.
- Добавлена **документация Swagger**, упрощающая тестирование и взаимодействие с API.

Все исходные коды находятся в данном репозитории.

-------------------------------------------------------------------
-------------------------------------------------------------------

## Отчет по КР2
### Практические занятия 7, 8, 9, 10, 11, 12

### Используемые технологии

- **Backend**: Node.js, Express.js, bcrypt, express-validator, CORS, файловое хранилище JSON.
- **Frontend**: React (Create React App), Axios, React Router, SCSS.
- **Документация**: Swagger (OpenAPI) для автоматической генерации документации API.

### Реализация серверной части
#### 1. Подключение bcrypt и вспомогательные функции

В файле `app.js` добавлены функции хеширования и проверки пароля:

```javascript
const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}
```

#### 2. Маршруты аутентификации
##### Регистрация (`POST /api/auth/register`)

Принимает `email`, `first_name`, `last_name`, `password`. Проверяет уникальность email, хеширует пароль и сохраняет пользователя.

```javascript
app.post('/api/auth/register',
  body('email').isEmail(),
  body('first_name').isString().notEmpty(),
  body('last_name').isString().notEmpty(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, first_name, last_name, password } = req.body;
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const maxId = users.reduce((max, u) => (u.id > max ? u.id : max), 0);
    const newUser = {
      id: maxId + 1,
      email,
      first_name,
      last_name,
      password: hashedPassword
    };

    users.push(newUser);
    await saveUsers();

    const { password: _, ...createdUser } = newUser;
    res.status(201).json(createdUser);
  }
);
```

##### Вход (`POST /api/auth/login`)
Проверяет существование пользователя по email и сравнивает пароль с хешем.

```javascript
app.post('/api/auth/login',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ login: true });
  }
);
```

#### 3. CRUD для товаров
Реализованы маршруты в соответствии с заданием:

- `GET /api/products` – получение всех товаров.
- `GET /api/products/:id` – получение товара по id.
- `POST /api/products` – создание товара (поля: title, category, description, price, amount).
- `PUT /api/products/:id` – полное обновление товара.
- `DELETE /api/products/:id` – удаление товара.

Пример создания товара с валидацией:

```javascript
app.post('/api/products',
  body('title').isString().notEmpty(),
  body('category').isString().notEmpty(),
  body('description').optional().isString(),
  body('price').isFloat({ gt: 0 }),
  body('amount').isInt({ min: 0 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, category, description, price, amount } = req.body;
    const maxId = products.reduce((max, p) => (p.id > max ? p.id : max), 0);
    const newProduct = {
      id: maxId + 1,
      title,
      category,
      description: description || '',
      price,
      amount
    };

    products.push(newProduct);
    await saveProducts();
    res.status(201).json(newProduct);
  }
);
```

#### 4. Хранение данных

Данные сохраняются в JSON-файлах `products.json` и `users.json` с использованием `fs.promises`. При старте сервера файлы загружаются, при изменениях – перезаписываются.

```javascript
async function loadUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    users = JSON.parse(data);
  } catch {
    users = [];
  }
}
```

#### 5. Swagger-документация

Подключена для автоматического описания API. Доступна по адресу `/api-docs`.

```javascript
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

---

### Реализация клиентской части (React)

#### 1. Компонент модального окна аутентификации (`AuthModal.jsx`)

Позволяет переключаться между формами входа и регистрации. При успешном действии закрывается и передаёт данные в родительский компонент.

```jsx
export default function AuthModal({ open, onClose, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const result = await api.login({ email, password });
        if (result.login) {
          onLoginSuccess({ email });
          onClose();
        }
      } else {
        const userData = await api.register({ email, first_name: firstName, last_name: lastName, password });
        onLoginSuccess(userData);
        onClose();
      }
    } catch (err) {
      // обработка ошибок
    }
  };

  if (!open) return null;
  // рендер формы с использованием классов backdrop, modal и т.д.
}
```

#### 2. Взаимодействие с API (`api/index.js`)

Создан экземпляр Axios с базовым URL. Методы для товаров и пользователей используют корректные пути.

```javascript
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

export const api = {
  getProducts: async () => (await apiClient.get('/products')).data,
  createProduct: async (product) => (await apiClient.post('/products', product)).data,
  // ... другие методы
  register: async (userData) => (await apiClient.post('/auth/register', userData)).data,
  login: async (credentials) => (await apiClient.post('/auth/login', credentials)).data,
};
```

#### 3. Управление состоянием аутентификации в `ProductsPage.jsx`

Добавлены состояния `isAuthenticated`, `user` и `authModalOpen`. Кнопка «Вход / Регистрация» открывает модальное окно, после успеха отображается приветствие и кнопка выхода.

```jsx
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [user, setUser] = useState(null);
const [authModalOpen, setAuthModalOpen] = useState(false);

const handleAuthSuccess = (userData) => {
  setIsAuthenticated(true);
  setUser(userData);
};

// В шапке:
{!isAuthenticated ? (
  <button className="btn btn--primary" onClick={() => setAuthModalOpen(true)}>
    Вход / Регистрация
  </button>
) : (
  <div className="user-info">
    <span>Добро пожаловать, {user?.first_name || user?.email}!</span>
    <button onClick={handleLogout}>Выйти</button>
  </div>
)}

<AuthModal
  open={authModalOpen}
  onClose={() => setAuthModalOpen(false)}
  onLoginSuccess={handleAuthSuccess}
/>
```

#### 4. Страница управления пользователями (`UsersPage.jsx` и `UsersList.jsx`)

Отображает список зарегистрированных пользователей с возможностью удаления. Данные загружаются с сервера через `api.getUsers()`.

```jsx
// UsersPage.jsx – загрузка пользователей
const loadUsers = async () => {
  const data = await api.getUsers();
  setUsers(data);
};

// UsersList.jsx – отрисовка таблицы
{users.map(user => (
  <tr key={user.id}>
    <td>{user.id}</td>
    <td>{user.email}</td>
    <td>{user.first_name}</td>
    <td>{user.last_name}</td>
    <td><button onClick={() => onDelete(user.id)}>Удалить</button></td>
  </tr>
))}
```

## Отчет по практическому занятию №8  
### Реализация серверной части

#### 1. Установка библиотеки `jsonwebtoken`

```bash
npm install jsonwebtoken
```

#### 2. Конфигурация JWT в `app.js`

```javascript
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ACCESS_EXPIRES_IN = '15m';
```

#### 3. Обновление маршрута входа (`POST /api/auth/login`)

При успешной аутентификации генерируется access-токен и возвращается клиенту.

```javascript
app.post('/api/auth/login',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: ACCESS_EXPIRES_IN }
    );

    res.json({ accessToken });
  }
);
```

#### 4. Middleware для проверки токена

```javascript
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { sub, email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

#### 5. Защищённый маршрут `GET /api/auth/me`

```javascript
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const userId = req.user.sub;
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});
```

---

### Реализация клиентской части (React)

#### 1. Адаптация `api/index.js` для работы с токеном

Добавлен перехватчик, добавляющий токен из localStorage в заголовки всех запросов.

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // ... остальные методы
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data; // { accessToken }
  },
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};
```

#### 2. Компонент `AuthModal.jsx` (фрагмент)

При успешном входе токен сохраняется в localStorage, затем запрашиваются данные пользователя через `/me`.

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    if (isLogin) {
      const data = await api.login({ email, password });
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        const userData = await api.getCurrentUser();
        onLoginSuccess(userData);
        onClose();
      }
    } else {
      // регистрация
      const userData = await api.register({ email, first_name: firstName, last_name: lastName, password });
      onLoginSuccess(userData);
      onClose();
    }
  } catch (err) {
    setError(err.response?.data?.error || 'Ошибка');
  } finally {
    setLoading(false);
  }
};
```

#### 3. Восстановление сессии в `ProductsPage.jsx`

При загрузке страницы проверяется наличие токена, и если он есть, выполняется запрос `/me` для получения данных пользователя.

```javascript
useEffect(() => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    api.getCurrentUser()
      .then(userData => {
        setIsAuthenticated(true);
        setUser(userData);
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
      });
  }
}, []);
```

#### 4. Выход из системы

```javascript
const handleLogout = () => {
  localStorage.removeItem('accessToken');
  setIsAuthenticated(false);
  setUser(null);
};
```

---

### Проверка работоспособности

1. **Регистрация пользователя** – через модальное окно (кнопка «Вход / Регистрация» → переключение на «Регистрация»).
2. **Вход в систему** – после отправки формы вкладка Network (F12) показывает запрос `/login` с ответом, содержащим поле `accessToken` (длинная строка).
3. **Автоматическое восстановление сессии** – после перезагрузки страницы запрос `/me` выполняется с заголовком `Authorization: Bearer <токен>`, возвращает данные пользователя, и интерфейс отображает приветствие.
4. **Защищённый маршрут `/me` без токена** – возвращает 401.

## Отчет по практическому занятию №9  

### Используемые технологии

- **Backend**: Node.js, Express.js, bcrypt, jsonwebtoken, express-validator, CORS, файловое хранилище JSON.
- **Документация**: Swagger (OpenAPI) для описания API.
- **Инструменты тестирования**: Postman, браузерный инструментарий (Network, Application).

### Реализация серверной части

#### 1. Дополнительные константы и хранилище

Добавлены секреты и время жизни для refresh-токенов, а также множество `refreshTokens` для хранения валидных токенов (в памяти сервера). В реальном проекте рекомендуется использовать базу данных.

```javascript
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret-key';
const REFRESH_EXPIRES_IN = '7d'; // 7 дней

let refreshTokens = new Set(); // хранилище выданных refresh-токенов
```

#### 2. Функции генерации токенов

Вынесены в отдельные функции для переиспользования.

```javascript
function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user.id },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}
```

#### 3. Обновлённый маршрут входа (`POST /api/auth/login`)

Теперь возвращает оба токена и сохраняет refresh-токен в хранилище.

```javascript
app.post('/api/auth/login',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    // ... валидация, поиск пользователя, проверка пароля

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.add(refreshToken);

    res.json({ accessToken, refreshToken });
  }
);
```

#### 4. Новый маршрут обновления токенов (`POST /api/auth/refresh`)

Выполняет ротацию: удаляет старый refresh-токен, генерирует новую пару и сохраняет новый refresh-токен.

```javascript
app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken is required' });
  }

  if (!refreshTokens.has(refreshToken)) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = users.find(u => u.id === payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Ротация: удаляем старый, создаём новый
    refreshTokens.delete(refreshToken);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    refreshTokens.add(newRefreshToken);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});
```

#### 5. Защита маршрутов

Маршрут `/api/auth/me` и другие защищённые эндпоинты по-прежнему используют middleware `authMiddleware`, проверяющий access-токен.

```javascript
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const userId = req.user.sub;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});
```

---

### Доработка клиентской части (React)

Для полноценной работы с refresh-токенами на клиенте были внесены изменения в `api/index.js`:

- Добавлен перехватчик ответов, который при получении ошибки 401 (истекший access-токен) автоматически отправляет запрос на `/auth/refresh` с сохранённым refresh-токеном, обновляет токены в localStorage и повторяет исходный запрос.
- В методы `login` и `register` добавлено сохранение обоих токенов.
- Функция `logout` очищает оба токена.

Пример обработки очереди запросов во время обновления токена:

```javascript
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    // ... логика обновления токена и повторения запросов
  }
);
```

---

### Тестирование

1. **Регистрация пользователя**  
   `POST /api/auth/register` → 201 Created.

2. **Вход в систему**  
   `POST /api/auth/login` → возвращает `{ accessToken, refreshToken }`.  
   Проверено в Postman и в браузере (вкладка Network).

3. **Обновление токенов**  
   `POST /api/auth/refresh` с телом `{ "refreshToken": "..." }` → возвращает новую пару токенов. Старый refresh-токен становится недействительным (проверено повторным запросом – ошибка 401).

4. **Доступ к защищённому ресурсу**  
   `GET /api/auth/me` с заголовком `Authorization: Bearer <accessToken>` → возвращает данные пользователя.  
   При истекшем access-токене клиент автоматически выполняет refresh и повторяет запрос (проверено установкой короткого времени жизни токена).

5. **Выход из системы**  
   Клиент очищает токены из localStorage; сервер автоматически инвалидирует refresh-токен при следующей попытке его использования (если он не был удалён, но при выходе клиент просто перестаёт его посылать).

---

# Отчёт по практической работе №11  

## Задачи

1. Доработать серверную часть (Node.js + Express):
   - Добавить поле `role` в модель пользователя.
   - Включить роль в payload access и refresh токенов.
   - Реализовать middleware `roleMiddleware` для проверки прав.
   - Защитить все маршруты согласно таблице доступа.
   - Добавить CRUD операции для пользователей (только для администратора).

2. Доработать клиентскую часть (React):
   - Создать `AuthContext` для хранения информации о пользователе и его роли.
   - Реализовать компоненты `ProtectedRoute` и `RoleProtectedRoute`.
   - Адаптировать навигацию (Header) в зависимости от роли.
   - Условно отображать кнопки «Добавить», «Редактировать», «Удалить» в карточках товаров.
   - Создать страницу управления пользователями для администратора.

3. Протестировать работу системы с разными ролями.

---

## 3. Реализация

### 3.1. Серверная часть (бэкенд)

**Исходные файлы:** `app.js`, `users.json`, `products.json`

#### 3.1.1. Модель пользователя с ролью

В `users.json` добавлено поле `role`:

```json
{
  "id": 1,
  "email": "admin@example.com",
  "first_name": "Admin",
  "last_name": "Adminov",
  "password": "$2b$10$...",
  "role": "admin"
}
```

При регистрации роль устанавливается `"user"` по умолчанию.

#### 3.1.2. Генерация токенов с ролью

```javascript
function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}
```

#### 3.1.3. Middleware для проверки ролей

```javascript
function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: insufficient role' });
    }
    next();
  };
}
```

#### 3.1.4. Защита маршрутов

Примеры:

- `GET /api/products` – доступен любому аутентифицированному пользователю (`authMiddleware`).
- `POST /api/products` – доступен продавцу и администратору (`roleMiddleware(['seller', 'admin'])`).
- `DELETE /api/products/:id` – только администратору.
- `GET /api/users` – только администратору.

**Полный перечень маршрутов и прав доступа** (соответствует таблице из задания):

| Маршрут | Метод | Доступ | Описание |
|---------|-------|--------|----------|
| /api/auth/register | POST | Гость | Регистрация |
| /api/auth/login | POST | Гость | Вход |
| /api/auth/refresh | POST | Гость | Обновление токенов |
| /api/auth/me | GET | Пользователь | Текущий пользователь |
| /api/users | GET | Администратор | Список пользователей |
| /api/users/:id | GET | Администратор | Получить пользователя |
| /api/users/:id | PUT | Администратор | Обновить пользователя |
| /api/users/:id | DELETE | Администратор | Блокировка (удаление) |
| /api/products | POST | Продавец | Создать товар |
| /api/products | GET | Пользователь | Список товаров |
| /api/products/:id | GET | Пользователь | Товар по id |
| /api/products/:id | PUT | Продавец | Обновить товар |
| /api/products/:id | DELETE | Администратор | Удалить товар |

#### 3.1.5. CRUD пользователей (админка)

Реализованы эндпоинты:
- `GET /api/users` – возвращает всех пользователей без паролей.
- `GET /api/users/:id` – детальная информация.
- `PUT /api/users/:id` – обновление email, имени, фамилии, роли.
- `DELETE /api/users/:id` – удаление пользователя.

---

### 3.2. Клиентская часть (фронтенд)

**Стек:** React, React Router, Context API, Sass.

#### 3.2.1. Контекст аутентификации (`AuthContext.js`)

Хранит состояние пользователя, предоставляет методы `login`, `logout`, загружает пользователя по токену при старте.

#### 3.2.2. Защита маршрутов

- `ProtectedRoute` – пропускает только авторизованных пользователей (иначе редирект на `/login`).
- `RoleProtectedRoute` – дополнительно проверяет, входит ли роль пользователя в список `allowedRoles`.

#### 3.2.3. Навигация (`Header.jsx`)

Отображает ссылки в зависимости от роли:
- **Пользователь (user):** только «Товары».
- **Продавец (seller):** + кнопка «➕ Добавить товар».
- **Администратор (admin):** + ссылка «👥 Пользователи».

#### 3.2.4. Страница товаров (`ProductsPage.jsx`)

- Загружает список товаров через `api.getProducts()`.
- В карточке товара (`ProductCard.jsx`) кнопки «Редактировать» и «Удалить» показываются только для соответствующих ролей.
- Редактирование товара доступно продавцу и администратору, удаление – только администратору.

#### 3.2.5. Страница управления пользователями (`UsersPage.jsx`)

- Доступна только администратору.
- Отображает таблицу пользователей с полями: ID, Email, Имя, Фамилия, Роль.
- Реализованы кнопки «✏️ Редактировать» (изменение роли и данных) и «🗑️ Удалить».

#### 3.2.6. Формы

- `ProductFormPage` – для создания и редактирования товара.
- `LoginPage`, `RegisterPage` – стандартные формы с валидацией.

---

## 4. Инструкция по запуску и тестированию

### 4.1. Запуск бэкенда

```bash
cd japan-shop_2
npm install
node app.js
```

Сервер запускается на `http://localhost:3000`.

### 4.2. Запуск фронтенда

```bash
cd client
npm install
npm start
```

Клиент доступен на `http://localhost:3001`.

### 4.3. Тестовые сценарии

#### 4.3.1. Регистрация нового пользователя

1. Перейти на `http://localhost:3001/register`.
2. Заполнить поля (email, имя, фамилия, пароль ≥6 символов).
3. Нажать «Зарегистрироваться».
4. Убедиться, что в `users.json` появилась запись с ролью `"user"`.

#### 4.3.2. Вход в систему

1. Перейти на `http://localhost:3001/login`.
2. Ввести email и пароль зарегистрированного пользователя.
3. После входа перенаправление на `/products`.
4. В шапке отображается «Привет, Имя (role)».

#### 4.3.3. Проверка прав доступа

**Пользователь (role = user)**:
- Может просматривать список товаров и детали.
- Не видит кнопок «Добавить товар», «Редактировать», «Удалить».
- Не имеет доступа к `/users`.

**Продавец (role = seller)**:
- Может просматривать, добавлять и редактировать товары.
- Не может удалять товары.
- Не имеет доступа к `/users`.

**Администратор (role = admin)**:
- Имеет полный доступ к товарам (добавление, редактирование, удаление).
- Может управлять пользователями (список, редактирование, удаление).
- Видит ссылку «Пользователи» в шапке.

#### 4.3.4. Проверка защищённых маршрутов

- При попытке неавторизованного доступа к `/products` – редирект на `/login`.
- При попытке продавца зайти на `/users` – редирект на `/products`.
- При попытке пользователя вызвать `POST /api/products` через инструменты разработчика – сервер возвращает `403 Forbidden`.

---

## 6. Тестирование API (примеры)

### 6.1. Регистрация

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","first_name":"Тест","last_name":"Тестов","password":"123456"}'
```

**Ответ:** `{"id":3,"email":"test@example.com","first_name":"Тест","last_name":"Тестов","role":"user"}`

### 6.2. Логин

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

**Ответ:** `{"accessToken":"...","refreshToken":"..."}`

### 6.3. Получение списка пользователей (только admin)

```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer <admin_access_token>"
```

**Ответ:** массив пользователей без паролей.

### 6.4. Попытка удаления товара продавцом

```bash
curl -X DELETE http://localhost:3000/api/products/1 \
  -H "Authorization: Bearer <seller_access_token>"
```

**Ответ:** `{"error":"Access denied: insufficient role"}` (статус 403).

---

## 8. Выводы

В ходе практической работы:

- Реализована полноценная система RBAC на сервере и клиенте.
- Все маршруты защищены в соответствии с заданной таблицей прав.
- Пользователи с разными ролями имеют разные возможности интерфейса.
- Администратор может управлять пользователями (CRUD).
- Продавец может управлять товарами (создание, редактирование).
- Простой пользователь только просматривает товары.

**Использованные технологии:** Node.js, Express, JWT, React, Context API, React Router, bcrypt, fetch API.

## 📄 Отчёт по практическому занятию №12  
### «Подготовка к контрольной работе №2»

**Дисциплина:** Фронтенд и бэкенд разработка  
**Институт:** ИПТИП  
**Кафедра:** Индустриального программирования  
**Семестр:** 4, 2025/2026 уч. год  
**Преподаватели:** Загородних Николай Анатольевич, Краснослободцева Дарья Борисовна  
**Студент:** [ФИО]  
**Дата сдачи:** [текущая дата]

---

## 1. Цель работы

Подготовить к сдаче контрольную работу №2, которая представляет собой результат выполнения практических заданий №7–11.  
В рамках данного занятия необходимо:
- Протестировать работоспособность реализованного веб-приложения.
- Оформить документацию проекта в виде файла `README.md`.
- Убедиться, что репозиторий с кодом является открытым (публичным).
- Предоставить ссылку на репозиторий в СДО.

---

## 2. Выполненные ранее работы (№7–11)

Контрольная работа №2 базируется на следующих практических занятиях:

| № | Тема | Реализованный функционал |
|---|------|--------------------------|
| 7 | Основы Node.js/Express | Создание сервера, маршруты для товаров (CRUD) |
| 8 | Валидация и обработка ошибок | Валидация входных данных через `express-validator` |
| 9 | Swagger документация | Автоматическая документация API |
| 10 | Аутентификация JWT | Регистрация, логин, access/refresh токены |
| 11 | Ролевой доступ (RBAC) | Роли: пользователь, продавец, администратор; защита маршрутов |

Итогом этих занятий стало **полноценное веб-приложение** интернет-магазина «Токийский дрифт» с разграничением прав доступа.

---

## 3. Тестирование приложения

Перед сдачей контрольной работы проведено функциональное тестирование по следующим сценариям.

### 3.1. Регистрация и вход

| Действие | Ожидаемый результат | Фактический результат |
|----------|---------------------|----------------------|
| Регистрация нового пользователя | Пользователь добавляется в `users.json` с ролью `"user"`, перенаправление на страницу входа | ✅ Выполнено |
| Вход с корректными данными | Возвращаются access и refresh токены, редирект на `/products` | ✅ Выполнено |
| Вход с неверным паролем | Ошибка `401 Invalid credentials` | ✅ Выполнено |
| Попытка доступа к `/products` без токена | Редирект на `/login` | ✅ Выполнено |

### 3.2. Ролевой доступ

| Роль | Действие | Ожидаемый результат | Фактический результат |
|------|----------|---------------------|----------------------|
| **Пользователь** (`user`) | Просмотр списка товаров | Доступно | ✅ |
| | Кнопки «Добавить», «Редактировать», «Удалить» | Отсутствуют | ✅ |
| | Доступ к `/users` | Редирект на `/products` | ✅ |
| **Продавец** (`seller`) | Просмотр товаров | Доступно | ✅ |
| | Добавление нового товара (кнопка в шапке) | Доступно | ✅ |
| | Редактирование товара | Доступно | ✅ |
| | Удаление товара | Кнопка отсутствует, сервер возвращает 403 | ✅ |
| **Администратор** (`admin`) | Просмотр товаров | Доступно | ✅ |
| | Добавление / редактирование / удаление товаров | Доступно | ✅ |
| | Управление пользователями (список, редактирование, удаление) | Доступно через `/users` | ✅ |

### 3.3. API тестирование

Выполнены запросы через инструменты разработчика браузера и `curl` (примеры):

- **Регистрация** – `POST /api/auth/register` → `201 Created`
- **Логин** – `POST /api/auth/login` → `200 OK` с токенами
- **Получение товаров** – `GET /api/products` с токеном → массив товаров
- **Создание товара (продавец)** – `POST /api/products` → `201 Created`
- **Удаление товара (админ)** – `DELETE /api/products/:id` → `200 OK`
- **Удаление товара (продавец)** – `DELETE /api/products/:id` → `403 Forbidden`
- **Получение списка пользователей (админ)** – `GET /api/users` → массив пользователей
- **Получение списка пользователей (пользователь)** – `401 Unauthorized` (не проходит `roleMiddleware`)

Все тесты пройдены успешно.

---

## 4. Выводы

В ходе практического занятия №12 выполнена полная подготовка к сдаче контрольной работы №2:

- Приложение протестировано на всех уровнях (функциональность, ролевой доступ, API).
- Оформлена техническая документация (`README.md`), достаточная для понимания и развёртывания проекта.
- Репозиторий сделан публичным, ссылка передана преподавателю.

## 📄 Отчёт по практическим работам №13–17: «Токийский дрифт» — PWA-магазин с напоминаниями

### 🧩 Объединённый проект

В рамках дисциплин «Фронтенд и бэкенд разработка» реализовано прогрессивное веб-приложение (PWA) — интернет-магазин «Токийский дрифт». Проект объединяет все практические работы с 13 по 17, демонстрируя:

- офлайн‑доступ через **Service Worker**;
- установку приложения на устройство через **Web App Manifest**;
- безопасное соединение **HTTPS** и архитектуру **App Shell**;
- двустороннюю связь в реальном времени через **WebSocket (Socket.IO)**;
- **push‑уведомления** с возможностью отложить напоминание.

Все компоненты упакованы в **Docker**‑контейнеры с балансировкой нагрузки (nginx) и используют **PostgreSQL** (пользователи) + **NeDB / JSON‑файл** (товары).

---

## 📌 Практическая работа №13: Service Worker (офлайн‑доступ)

### Задача  
Создать скрипт, который кэширует статические ресурсы и перехватывает сетевые запросы, обеспечивая работу приложения без интернета.

### Реализация в проекте

**Файл `public/sw.js`** содержит:

- кэширование статики (HTML, JS, CSS, иконки) при установке;
- стратегию **Cache First** для статических ресурсов;
- обработку `push`‑событий для уведомлений.

```javascript
// sw.js (фрагмент)
const CACHE_NAME = 'tokyo-drift-v1';
const STATIC_ASSETS = ['/', '/index.html', '/app.js', '/manifest.json', ...];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
```

**Регистрация Service Worker** в `index.html`:

```html
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registered', reg.scope))
        .catch(err => console.error('SW registration failed', err));
    });
  }
</script>
```

✅ **Результат**: при отключении сети страница перезагружается из кэша, интерфейс остаётся рабочим, а заметки сохраняются в `localStorage`.

---

## 📌 Практическая работа №14: Web App Manifest (установка PWA)

### Задача  
Создать файл `manifest.json`, указать иконки, тему, режим отображения, чтобы приложение можно было установить на рабочий стол.

### Реализация

**Файл `public/manifest.json`**:

```json
{
  "name": "Токийский дрифт",
  "short_name": "DriftShop",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4285f4",
  "icons": [
    { "src": "icons/favicon-16x16.png", "sizes": "16x16", "type": "image/png" },
    { "src": "icons/favicon-32x32.png", "sizes": "32x32", "type": "image/png" },
    { "src": "icons/favicon-128x128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "icons/favicon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable any" }
  ]
}
```

**Подключение в `index.html`** (в `<head>`):

```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#4285f4">
<meta name="mobile-web-app-capable" content="yes">
<link rel="apple-touch-icon" href="/icons/favicon-128x128.png">
```

✅ **Результат**: в браузере появляется кнопка «Установить приложение», после установки оно запускается в отдельном окне без адресной строки.

---

## 📌 Практическая работа №15: HTTPS + App Shell

### Задача  
Обеспечить безопасное соединение (локальный HTTPS через `mkcert`) и реализовать архитектуру App Shell – каркас приложения загружается мгновенно, а контент подгружается динамически.

### Реализация

**Локальный HTTPS** создан с помощью утилиты `mkcert`:

```bash
mkcert -install
mkcert localhost 127.0.0.1 ::1
```

Сертификаты помещены в папку `certs/` и используются в `server.js` для режима разработки. В Docker‑среде используется HTTP, а HTTPS обеспечивает nginx.

**App Shell** – в `index.html` только статический каркас (шапка, меню, контейнер `#app`), а содержимое страниц (товары, о нас, напоминания) динамически загружается и рендерится JavaScript'ом без перезагрузки страницы.

**Пример загрузки контента** (функция `showHome` в `app.js`):

```javascript
function showHome() {
  if (!accessToken) { appDiv.innerHTML = '<p>Пожалуйста, войдите.</p>'; return; }
  loadProducts(); // загружает товары через fetch и отображает
}
```

✅ **Результат**: при первом посещении кэшируется каркас, страница загружается мгновенно даже на медленном соединении; все API‑запросы идут через HTTPS.

---

## 📌 Практическая работа №16: WebSocket + Push уведомления

### Задача  
Реализовать обмен событиями в реальном времени через Socket.IO и отправку push‑уведомлений при добавлении нового товара.

### Реализация

#### Серверная часть (`backend/server.js`)

```javascript
const socketIo = require('socket.io');
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('newProduct', (product) => {
    io.emit('productAdded', product);          // всем клиентам
    pushManager.sendToAllSubscribers({ title: 'Новый товар!', body: product.title });
  });
});
```

#### Клиентская часть (`public/app.js`)

```javascript
function initSocket() {
  socket = io(protocol + '//' + location.host, { path: '/socket.io' });
  socket.on('productAdded', (product) => {
    showToast(`Новый товар: ${product.title}`);
    loadProducts(); // обновляем список
  });
}
```

#### Push‑уведомления

- Сгенерированы VAPID‑ключи (`npx web-push generate-vapid-keys`).
- На сервере настроен `web-push` и эндпоинты `/api/push/subscribe` и `/api/push/unsubscribe`.
- В `app.js` реализована подписка через `PushManager` и отправка подписки на сервер.

**Фрагмент подписки**:

```javascript
async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });
  await fetch('/api/push/subscribe', { method: 'POST', body: JSON.stringify(subscription), ... });
}
```

✅ **Результат**: при добавлении товара (роль `seller` или `admin`) все активные клиенты мгновенно видят новинку, а подписанные пользователи получают системное push‑уведомление даже при закрытой вкладке.

---

## 📌 Практическая работа №17: Детализация Push (напоминания с откладыванием)

### Задача  
Добавить возможность создавать заметки с напоминанием на определённое время. Сервер должен запланировать отправку push‑уведомления, а в самом уведомлении должна быть кнопка «Отложить на 5 минут».

### Реализация

#### 1. Изменение клиентской части

В `index.html` добавлена форма для создания напоминания:

```html
<div class="add-product-form">
  <h3>Новое напоминание</h3>
  <input type="text" id="reminder-text" placeholder="Текст заметки" class="input">
  <input type="datetime-local" id="reminder-datetime" class="input">
  <button id="add-reminder-btn" class="button primary">Добавить</button>
  <div id="add-reminder-error" class="error"></div>
</div>
```

В `app.js` – функция `addReminder`, которая отправляет данные на сервер:

```javascript
async function addReminder() {
  const text = document.getElementById('reminder-text').value.trim();
  const reminderTime = new Date(document.getElementById('reminder-datetime').value).getTime();
  const newReminder = { id: Date.now(), text, reminderTime };
  await fetch('/api/reminders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
    body: JSON.stringify(newReminder)
  });
  showReminders();
}
```

#### 2. Серверное планирование (`backend/server.js`)

Добавлена структура `reminders` (Map), где хранятся активные таймеры.

**Эндпоинт создания напоминания**:

```javascript
const reminders = new Map();

app.post('/api/reminders', authMiddleware, async (req, res) => {
  const { id, text, reminderTime } = req.body;
  const delay = reminderTime - Date.now();
  if (delay <= 0) return res.status(400).json({ error: 'Invalid time' });

  const timeoutId = setTimeout(async () => {
    const payload = JSON.stringify({ title: 'Напоминание', body: text, reminderId: id });
    subscriptions.forEach(sub => webpush.sendNotification(sub, payload).catch(console.error));
    reminders.delete(id);
  }, delay);

  reminders.set(id, { timeoutId, text, reminderTime });
  res.status(201).json({ message: 'Reminder scheduled' });
});
```

**Эндпоинт откладывания**:

```javascript
app.post('/snooze', (req, res) => {
  const reminderId = parseInt(req.query.reminderId);
  const reminder = reminders.get(reminderId);
  if (!reminder) return res.status(404).json({ error: 'Not found' });

  clearTimeout(reminder.timeoutId);
  const newDelay = 5 * 60 * 1000;
  const newTimeoutId = setTimeout(() => {
    const payload = JSON.stringify({ title: 'Отложенное напоминание', body: reminder.text, reminderId });
    subscriptions.forEach(sub => webpush.sendNotification(sub, payload).catch(console.error));
    reminders.delete(reminderId);
  }, newDelay);

  reminders.set(reminderId, { timeoutId: newTimeoutId, text: reminder.text, reminderTime: Date.now() + newDelay });
  res.status(200).json({ message: 'Snoozed for 5 minutes' });
});
```

#### 3. Service Worker: обработка действия «Отложить»

В `sw.js` добавлен обработчик `notificationclick`:

```javascript
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  if (action === 'snooze') {
    const reminderId = notification.data.reminderId;
    event.waitUntil(
      fetch(`/snooze?reminderId=${reminderId}`, { method: 'POST' })
        .then(() => notification.close())
        .catch(err => console.error('Snooze failed:', err))
    );
  } else {
    notification.close();
  }
});
```

При формировании push‑уведомления (в `server.js`) добавляется кнопка `Отложить`:

```javascript
const options = {
  body: data.body,
  icon: '/icons/favicon-128x128.png',
  actions: [{ action: 'snooze', title: 'Отложить на 5 минут' }],
  data: { reminderId: data.reminderId }
};
```

✅ **Результат**: при наступлении времени напоминания пользователь получает push‑уведомление с кнопкой. Нажатие «Отложить» переносит напоминание на 5 минут, после чего оно приходит снова. Все таймеры живут на сервере, поэтому уведомления работают даже при закрытом браузере.

---

## 🐳 Дополнительно: Docker + балансировка

Проект полностью контейнеризирован:

- **PostgreSQL** – для хранения пользователей.
- **Три экземпляра бэкенда** – для отказоустойчивости.
- **Nginx** – балансировщик нагрузки и HTTPS‑прокси.

**Фрагмент `docker-compose.yml`**:

```yaml
services:
  postgres: ...
  backend1: build: . ; environment: NODE_ENV=production ; depends_on: postgres
  backend2: ...
  backend3: ...
  nginx:
    image: nginx:alpine
    ports: - "80:80" - "443:443"
    volumes: - ./nginx.conf:/etc/nginx/nginx.conf - ./certs:/etc/nginx/certs
```

---

## 🚀 Запуск проекта

1. Установить Docker и Docker Compose.
2. Сгенерировать VAPID‑ключи и поместить в `.env`.
3. Создать SSL‑сертификаты `mkcert -install && mkcert localhost 127.0.0.1 ::1` и положить в `certs/`.
4. Выполнить в корне проекта:
   ```bash
   docker-compose build --no-cache
   docker-compose up
   ```
5. Открыть в браузере `https://localhost`.
