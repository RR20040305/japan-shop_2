import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { AuthContext } from '../../context/AuthContext';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    api.getProduct(id).then(setProduct).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Удалить товар?')) return;
    try {
      await api.deleteProduct(id);
      navigate('/products');
    } catch (err) { alert('Ошибка удаления'); }
  };

  if (loading) return <div>Загрузка...</div>;
  if (!product) return <div>Товар не найден</div>;

  const canEdit = user && (user.role === 'seller' || user.role === 'admin');
  const canDelete = user && user.role === 'admin';

  return (
    <div className="products-area" style={{ maxWidth: '800px' }}>
      <h2>{product.title}</h2>
      <p><strong>Категория:</strong> {product.category}</p>
      <p><strong>Цена:</strong> {product.price} ₽</p>
      <p><strong>Остаток:</strong> {product.amount}</p>
      <p><strong>Описание:</strong> {product.description}</p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button onClick={() => navigate('/products')}>Назад</button>
        {canEdit && <button onClick={() => navigate(`/products/${id}/edit`)}>Редактировать</button>}
        {canDelete && <button onClick={handleDelete} style={{ background: '#fbc1b1' }}>Удалить</button>}
      </div>
    </div>
  );
}