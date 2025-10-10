// src/components/ProtectedRoute.jsx

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Agora ele aceita uma propriedade "allowedRoles"
function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser } = useAuth();

  // 1. Checa se o usuário está logado
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // 2. Checa se o usuário tem um dos papéis permitidos
  // O 'allowedRoles' é um array, ex: ['superadmin', 'corretor']
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Se o usuário não tem o papel necessário, redireciona para a página inicial
    alert("Você não tem permissão para acessar esta página."); // Opcional
    return <Navigate to="/" />;
  }

  // Se passou por todas as checagens, libera o acesso
  return children;
}

export default ProtectedRoute;