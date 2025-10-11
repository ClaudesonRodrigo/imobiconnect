// src/components/ProtectedRoute.jsx

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children, allowedRoles }) {
  // ATUALIZAÇÃO: Pegando o 'loading' do contexto
  const { currentUser, loading } = useAuth();

  // ATUALIZAÇÃO: Se ainda estiver carregando, mostra uma mensagem de espera
  if (loading) {
    return <p>Verificando permissões...</p>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    alert("Você não tem permissão para acessar esta página.");
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;