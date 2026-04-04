const API_BASE = 'http://localhost:3000/api';

const request = async (url, options = {}) => {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }
  return response.json();   // для статуса 201 тоже сработает
};

export const api = {
  // Аутентификация
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  refresh: (refreshToken) => request('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  getMe: () => {
    const token = localStorage.getItem('accessToken');
    return request('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
  },

  // Товары
  getProducts: () => {
    const token = localStorage.getItem('accessToken');
    return request('/products', { headers: { Authorization: `Bearer ${token}` } });
  },
  getProduct: (id) => {
    const token = localStorage.getItem('accessToken');
    return request(`/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  },
  createProduct: (product) => {
    const token = localStorage.getItem('accessToken');
    return request('/products', { method: 'POST', body: JSON.stringify(product), headers: { Authorization: `Bearer ${token}` } });
  },
  updateProduct: (id, product) => {
    const token = localStorage.getItem('accessToken');
    return request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(product), headers: { Authorization: `Bearer ${token}` } });
  },
  deleteProduct: (id) => {
    const token = localStorage.getItem('accessToken');
    return request(`/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  },

  // Пользователи (только админ)
  getUsers: () => {
    const token = localStorage.getItem('accessToken');
    return request('/users', { headers: { Authorization: `Bearer ${token}` } });
  },
  getUser: (id) => {
    const token = localStorage.getItem('accessToken');
    return request(`/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  },
  updateUser: (id, data) => {
    const token = localStorage.getItem('accessToken');
    return request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } });
  },
  deleteUser: (id) => {
    const token = localStorage.getItem('accessToken');
    return request(`/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  }
};