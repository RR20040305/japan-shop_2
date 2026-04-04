import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import ProductForm from '../../components/ProductForm';

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [initialProduct, setInitialProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.getProduct(id).then(product => setInitialProduct(product)).catch(console.error);
    }
  }, [id, isEdit]);

  const handleSubmit = async (productData) => {
    setLoading(true);
    try {
      if (isEdit) {
        await api.updateProduct(id, productData);
      } else {
        await api.createProduct(productData);
      }
      navigate('/products');
    } catch (err) {
      alert('Ошибка сохранения товара');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate('/products');

  return (
    <div className="add-product-form">
      <h3>{isEdit ? 'Редактировать товар' : 'Новый товар'}</h3>
      <ProductForm
        initialProduct={initialProduct}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
      {loading && <p>Сохранение...</p>}
    </div>
  );
}