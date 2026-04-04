import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import ProductsPage from './pages/ProductsPage/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage/ProductDetailPage';
import ProductFormPage from './pages/ProductFormPage/ProductFormPage';
import UsersPage from './pages/UsersPage/UsersPage';
import Header from './components/Header';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
          <Route path="/products/:id" element={<ProtectedRoute><ProductDetailPage /></ProtectedRoute>} />
          <Route path="/products/new" element={
            <RoleProtectedRoute allowedRoles={['seller', 'admin']}>
              <ProductFormPage />
            </RoleProtectedRoute>
          } />
          <Route path="/products/:id/edit" element={
            <RoleProtectedRoute allowedRoles={['seller', 'admin']}>
              <ProductFormPage />
            </RoleProtectedRoute>
          } />
          <Route path="/users" element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <UsersPage />
            </RoleProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/products" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;