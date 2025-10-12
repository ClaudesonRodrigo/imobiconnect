// src/App.jsx

import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import ListaImoveis from './pages/ListaImoveis';
import CadastroImovel from './pages/CadastroImovel'; // Manteremos por enquanto, mas a rota mudará
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdmin from './pages/SuperAdmin';
import PaginaCorretor from './pages/PaginaCorretor'
import AdminPanel from './pages/AdminPanel'; // 1. Importe o novo painel

import { useAuth } from './contexts/AuthContext';
import { auth } from './services/firebaseConfig';
import { signOut } from 'firebase/auth';

import './App.css';

function App() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Você saiu com sucesso!");
      navigate('/login');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      alert("Falha ao sair.");
    }
  };

  return (
    <div className="App">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="text-xl font-bold text-indigo-600">ImobiConnect</Link>
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-gray-500 hover:text-indigo-600">Vitrine</Link>
              {currentUser ? (
                <>
                  <Link to="/admin" className="text-gray-500 hover:text-indigo-600">Meu Painel</Link>
                  {currentUser.role === 'superadmin' && (
                    <Link to="/superadmin" className="text-gray-500 hover:text-indigo-600">Super Admin</Link>
                  )}
                  <button onClick={handleLogout} className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-indigo-700">Sair</button>
                </>
              ) : (
                <Link to="/login" className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-indigo-700">Login</Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<ListaImoveis />} />
          <Route path="/login" element={<Login />} />
          <Route path="/corretor/:corretorId" element={<PaginaCorretor />} />
          
          <Route 
            path="/admin" 
            element={
              // 2. A rota /admin agora aponta para o novo AdminPanel
              <ProtectedRoute allowedRoles={['superadmin', 'corretor']}>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/superadmin" 
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <SuperAdmin />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  )
}

export default App;