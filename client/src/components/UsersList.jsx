import React from 'react';

const UsersList = ({ users, onEdit, onDelete }) => {
  return (
    <div className="users-list-container">
      <table className="users-table">
        <thead>
          <tr><th>ID</th><th>Email</th><th>Имя</th><th>Фамилия</th><th>Роль</th><th>Действия</th></tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td className="user-id">#{user.id}</td>
              <td className="user-email">{user.email}</td>
              <td className="user-firstname">{user.first_name}</td>
              <td className="user-lastname">{user.last_name}</td>
              <td className="user-role">{user.role}</td>
              <td className="user-actions">
                <button className="edit-btn" onClick={() => onEdit(user)}>✏️</button>
                <button className="delete-btn" onClick={() => onDelete(user.id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersList;