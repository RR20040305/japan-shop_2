import { useContext } from 'react';          // <-- добавьте эту строку
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';   // <-- правильный путь

export default function Header() {
  const { user, logout } = useContext(AuthContext);   // <-- теперь user и logout определены
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="site-header">
      <div className="title">
        <h1 className="title-text">Токийский дрифт</h1>
        <p className="title-des">Магазин японских вкусов</p>
      </div>
      <nav className="header-nav" style={{ display: 'flex', gap: '1rem', padding: '0 2rem', alignItems: 'center' }}>
        <Link to="/products">Товары</Link>
        {(user?.role === 'seller' || user?.role === 'admin') && (
          <Link to="/products/new">➕ Добавить товар</Link>
        )}
        {user?.role === 'admin' && (
          <Link to="/users">👥 Пользователи</Link>
        )}
        <span style={{ marginLeft: 'auto' }}>Привет, {user?.first_name} ({user?.role})</span>
        <button onClick={handleLogout} style={{ background: 'none', border: '1px solid #7d5a5a', borderRadius: '20px', padding: '0.3rem 0.8rem', cursor: 'pointer' }}>Выйти</button>
      </nav>
    </header>
  );
}