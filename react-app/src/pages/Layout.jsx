import { Link } from 'react-router-dom';

export default function Layout({ children }) {
  return (
    <div>
      <nav>
        <Link to="/">Главная</Link> | <Link to="/about">О нас</Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}