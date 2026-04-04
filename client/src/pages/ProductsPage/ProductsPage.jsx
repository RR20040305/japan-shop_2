import React, { useState, useEffect, useContext } from 'react';   // <-- useContext уже есть
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';                    // <-- проверьте путь
import { AuthContext } from '../../context/AuthContext';   // <-- импорт контекста
import ProductList from '../../components/ProductList';

export default function ProductsPage() {
  const { user, loading: authLoading } = useContext(AuthContext);   // <-- получаем user и loading
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => navigate(`/products/${product.id}/edit`);
  const handleDelete = async (id) => {
    if (!window.confirm('Удалить товар?')) return;
    try {
      await api.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) { alert('Ошибка удаления'); }
  };
  const handleClick = (id) => navigate(`/products/${id}`);

  if (authLoading || loading) return <div>Загрузка...</div>;

  return (
    <div className="products-area">
      <div className="card-header">
        <h2 className="card-title">Наши товары</h2>
      </div>
      <ProductList products={products} onEdit={handleEdit} onDelete={handleDelete} onClick={handleClick} />
    </div>
  );
}