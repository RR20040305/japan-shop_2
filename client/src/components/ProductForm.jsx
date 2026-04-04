import React, { useState, useEffect } from 'react';

export default function ProductForm({ initialProduct, onSubmit, onCancel }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (initialProduct) {
      setTitle(initialProduct.title || '');
      setCategory(initialProduct.category || '');
      setDescription(initialProduct.description || '');
      setPrice(initialProduct.price?.toString() || '');
      setAmount(initialProduct.amount?.toString() || '');
    }
  }, [initialProduct]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      price: parseFloat(price),
      amount: parseInt(amount, 10)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <div className="form-group">
        <label>Название</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Категория</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Описание</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="3"
        />
      </div>
      <div className="form-group">
        <label>Цена (₽)</label>
        <input
          type="number"
          step="1"
          min="1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Количество</label>
        <input
          type="number"
          step="1"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>
      <div className="form-actions">
        <button type="button" onClick={onCancel}>Отмена</button>
        <button type="submit">Сохранить</button>
      </div>
    </form>
  );
}