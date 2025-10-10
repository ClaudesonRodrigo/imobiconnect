// src/App.jsx

import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import ListaImoveis from './pages/ListaImoveis';
import CadastroImovel from './pages/CadastroImovel';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdmin from './pages/SuperAdmin';

// 1. Importe as ferramentas que precisamos
import { useAuth } from './contexts/AuthContext';
import { auth } from './services/firebaseConfig';
import { signOut } from 'firebase/auth';

import './App.css';

function App() {
  // 2. Pegue o usuário atual do nosso contexto
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // 3. Crie a função de logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Você saiu com sucesso!");
      navigate('/login'); // Redireciona para a página de login após o logout
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      alert("Falha ao sair.");
    }
  };

  return (
    <div className="App">
      <nav style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
        <Link to="/" style={{ marginRight: '10px' }}>Vitrine</Link>
        
        {/* 4. Lógica para mostrar/esconder links */}
        {currentUser ? (
          <>
            <Link to="/admin" style={{ marginRight: '10px' }}>Cadastrar Imóvel</Link>
            <button onClick={handleLogout}>Sair</button>
          </>
        ) : (
          <Link to="/login">Login (Corretor)</Link>
        )}
      </nav>

      <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<ListaImoveis />} />
        <Route path="/login" element={<Login />} />
        
        {/* Rotas Protegidas com PAPÉIS ESPECÍFICOS */}
        <Route 
          path="/admin" 
          element={
            // Permitido para superadmin E corretor
            <ProtectedRoute allowedRoles={['superadmin', 'corretor']}>
              <CadastroImovel />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/superadmin" 
          element={
            // Permitido APENAS para superadmin
            <ProtectedRoute allowedRoles={['superadmin']}>
              <SuperAdmin />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  )
}

export default App;