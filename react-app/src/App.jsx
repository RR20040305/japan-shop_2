import { Routes, Route, Link } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Home from './pages/Home';

const About = lazy(() => import('./pages/About'));

export default function App() {
  return (
    <div>
      <nav>
        <Link to="/">Главная (React)</Link> | <Link to="/about">О нас (React)</Link>
      </nav>
      <Suspense fallback={<div>Загрузка...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Suspense>
    </div>
  );
}