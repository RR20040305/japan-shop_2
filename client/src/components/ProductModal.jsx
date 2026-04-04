import React, { useEffect, useState } from 'react';

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (open) {
      if (initialProduct) {
        // Режим редактирования – заполняем поля данными товара
        setTitle(initialProduct.title || '');
        setPrice(initialProduct.price?.toString() || '');
        setDescription(initialProduct.description || '');
        setCategory(initialProduct.category || '');
        setAmount(initialProduct.amount?.toString() || '');
      } else {
        // Режим создания – очищаем поля
        setTitle('');
        setPrice('');
        setDescription('');
        setCategory('');
        setAmount('');
      }
    }
  }, [open, initialProduct]);

  // Если модалка закрыта – не рендерим ничего
  if (!open) return null;

  const modalTitle = mode === 'edit' ? 'Редактировать товар' : 'Добавить товар';

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const parsedPrice = Number(price);
    const trimmedCategory = category.trim();
    const parsedAmount = Number(amount);

    // Валидация
    if (!trimmedTitle) {
      alert('Введите название');
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      alert('Цена должна быть положительным числом');
      return;
    }
    if (!trimmedCategory) {
      alert('Введите категорию');
      return;
    }
    if (!Number.isInteger(parsedAmount) || parsedAmount < 0) {
      alert('Количество должно быть целым неотрицательным числом');
      return;
    }

    onSubmit({
      id: initialProduct?.id,
      title: trimmedTitle,
      price: parsedPrice,
      description: description.trim(),
      category: trimmedCategory,
      amount: parsedAmount
    });
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div className="modal__title">{modalTitle}</div>
          <button className="iconBtn" onClick={onClose}>×</button>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Название
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </label>
          <label className="label">
            Цена (₽)
            <input
              className="input"
              type="number"
              step="1"
              min="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </label>
          <label className="label">
            Описание
            <textarea
              className="input"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="label">
            Категория
            <input
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </label>
          <label className="label">
            Количество на складе
            <input
              className="input"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              required
            />
          </label>
          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn--primary">
              {mode === 'edit' ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}