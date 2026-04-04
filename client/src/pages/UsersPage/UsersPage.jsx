import React, { useState, useEffect } from 'react';
import './UsersPage.scss';
import UsersList from '../../components/UsersList';
import { api } from '../../api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ email: '', first_name: '', last_name: '', role: 'user' });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError('Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить пользователя?')) return;
    try {
      await api.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) { alert('Ошибка удаления'); }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditForm({ email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.updateUser(editingUser.id, editForm);
      setEditingUser(null);
      loadUsers();
    } catch (err) { alert('Ошибка обновления'); }
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <h1>Управление пользователями</h1>
        <button className="btn btn--secondary" onClick={loadUsers} disabled={loading}>⟳ Обновить</button>
      </div>

      {loading && <div className="loading-spinner">Загрузка...</div>}
      {error && <div className="error-message">{error}</div>}
      {!loading && !error && users.length === 0 && <div className="empty-state">Пользователей пока нет</div>}
      {!loading && !error && users.length > 0 && (
        <UsersList users={users} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      {editingUser && (
        <div className="edit-modal" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 1000 }}>
          <h3>Редактировать пользователя</h3>
          <form onSubmit={handleUpdate}>
            <label>Email</label>
            <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} required />
            <label>Имя</label>
            <input value={editForm.first_name} onChange={e => setEditForm({...editForm, first_name: e.target.value})} required />
            <label>Фамилия</label>
            <input value={editForm.last_name} onChange={e => setEditForm({...editForm, last_name: e.target.value})} required />
            <label>Роль</label>
            <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}>
              <option value="user">Пользователь</option>
              <option value="seller">Продавец</option>
              <option value="admin">Администратор</option>
            </select>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit">Сохранить</button>
              <button type="button" onClick={() => setEditingUser(null)}>Отмена</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}