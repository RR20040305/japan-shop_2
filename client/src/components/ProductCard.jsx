import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function ProductCard({ product, onEdit, onDelete, onClick }) {
  const { user } = useContext(AuthContext);
  const canEdit = user && (user.role === 'seller' || user.role === 'admin');
  const canDelete = user && user.role === 'admin';

  const handleCardClick = () => onClick && onClick(product.id);
  const handleEdit = (e) => { e.stopPropagation(); onEdit(product); };
  const handleDelete = (e) => { e.stopPropagation(); onDelete(product.id); };

  return (
    <div className="product-card" onClick={handleCardClick}>
      <div className="product-card__image">
        <img src={`img/${product.id}.jpg`} alt={product.title} className="card-image" onError={(e) => { e.target.src = 'img/placeholder.jpg'; }} />
      </div>
      <div className="product-card__content">
        <h3 className="product-card__title">{product.title}</h3>
        <p className="product-card__description">{product.description}</p>
        <p className="product-card__price">{product.price} ₽</p>
        <div className="product-card__category">{product.category}</div>
        <div className="product-card__amount">{product.amount}</div>
        <div className="product-card__actions">
          {canEdit && <button className="edit-btn" onClick={handleEdit}>Редактировать</button>}
          {canDelete && <button className="delete-btn" onClick={handleDelete}>Удалить</button>}
        </div>
      </div>
    </div>
  );
}