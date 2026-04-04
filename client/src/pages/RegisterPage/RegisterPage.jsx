import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Простая валидация на клиенте
    if (!email || !first_name || !last_name || !password) {
      setError('Все поля обязательны для заполнения');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    try {
      const response = await api.register({ email, first_name, last_name, password });
      console.log('Registration successful:', response);
      setSuccess(true);
      // Через 2 секунды перенаправляем на страницу входа
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Ошибка регистрации');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '1rem' }}>
      <h2>Регистрация</h2>
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: '1rem' }}>Регистрация успешна! Перенаправление на вход...</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Email</label><br />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '0.3rem' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Имя</label><br />
          <input type="text" value={first_name} onChange={(e) => setFirstName(e.target.value)} required style={{ width: '100%', padding: '0.3rem' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Фамилия</label><br />
          <input type="text" value={last_name} onChange={(e) => setLastName(e.target.value)} required style={{ width: '100%', padding: '0.3rem' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Пароль (минимум 6 символов)</label><br />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" style={{ width: '100%', padding: '0.3rem' }} />
        </div>
        <button type="submit" style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>Зарегистрироваться</button>
      </form>
      <p style={{ marginTop: '1rem' }}>
        Уже есть аккаунт? <a href="/login">Войти</a>
      </p>
    </div>
  );
}