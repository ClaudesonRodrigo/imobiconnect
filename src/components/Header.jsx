// src/components/Header.jsx

import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClientAuth } from '../contexts/ClientAuthContext';
import { auth } from '../services/firebaseConfig';
import { signOut } from 'firebase/auth';

// Menu Principal (para Landing Page, Login, Painéis)
const MainNav = () => {
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
    <nav className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-bold text-indigo-600">ImobiConnect</Link>
          <div className="flex items-center space-x-4">
            {currentUser && currentUser.role === 'superadmin' && (
              <Link to="/imoveis" className="text-gray-500 hover:text-indigo-600">Vitrine Geral</Link>
            )}
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
  );
};

// ATUALIZAÇÃO: Menu do Cliente com logo não-clicável e mensagem de boas-vindas
const ClientNav = () => {
  const { clientUser, clientSignOut } = useClientAuth();

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* O logo agora não é um link, mantendo o cliente na vitrine do corretor */}
          <div className="text-xl font-bold text-indigo-600 cursor-default">ImobiConnect</div>
          <div className="flex items-center space-x-4">
            {clientUser ? (
              <>
                <span className="text-sm text-gray-700 hidden sm:block">Bem-vindo, {clientUser.nome.split(' ')[0]}!</span>
                <button onClick={clientSignOut} className="bg-gray-500 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-600">Sair</button>
              </>
            ) : (
              <span className="text-sm text-gray-500">Visitante</span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Componente Header que decide qual menu renderizar
function Header() {
  const location = useLocation();
  const isClientFlow = location.pathname.startsWith('/corretor/') || location.pathname.startsWith('/imovel/');

  return isClientFlow ? <ClientNav /> : <MainNav />;
}

export default Header;