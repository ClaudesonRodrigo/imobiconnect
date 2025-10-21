// src/components/Header.jsx

import { useState } from 'react'; // Importar useState
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClientAuth } from '../contexts/ClientAuthContext';
import { auth } from '../services/firebaseConfig';
import { signOut } from 'firebase/auth';
import { Menu, X } from 'lucide-react'; // Importar ícones Menu e X

// --- Menu Principal (MainNav) ---
const MainNav = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false); // Estado para o menu mobile

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Você saiu com sucesso!");
      setIsOpen(false); // Fecha o menu ao deslogar
      navigate('/login');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      alert("Falha ao sair.");
    }
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-bold text-indigo-600">ImobiConnect</Link>

          {/* Links para Desktop */}
          <div className="hidden md:flex items-center space-x-4">
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

          {/* Botão Hambúrguer para Mobile */}
          <div className="md:hidden">
            <button onClick={toggleMenu} aria-label="Abrir menu">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Dropdown Mobile */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 py-4 space-y-3">
             {currentUser && currentUser.role === 'superadmin' && (
              <Link to="/imoveis" onClick={toggleMenu} className="block text-gray-700 hover:text-indigo-600">Vitrine Geral</Link>
            )}
            {currentUser ? (
              <>
                <Link to="/admin" onClick={toggleMenu} className="block text-gray-700 hover:text-indigo-600">Meu Painel</Link>
                {currentUser.role === 'superadmin' && (
                  <Link to="/superadmin" onClick={toggleMenu} className="block text-gray-700 hover:text-indigo-600">Super Admin</Link>
                )}
                <button onClick={handleLogout} className="w-full text-left bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200">Sair</button>
              </>
            ) : (
              <Link to="/login" onClick={toggleMenu} className="block bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 text-center">Login</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

// --- Menu do Cliente (ClientNav) ---
const ClientNav = () => {
  const { clientUser, clientSignOut } = useClientAuth();
  const [isOpen, setIsOpen] = useState(false); // Estado para o menu mobile
  const navigate = useNavigate();

  const handleLogout = () => {
    clientSignOut();
    setIsOpen(false); // Fecha o menu ao deslogar
    // Opcional: Redirecionar para algum lugar ou apenas atualizar a página
    // navigate('/'); // Exemplo: redireciona para a home se fizer sentido
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="text-xl font-bold text-indigo-600 cursor-default">ImobiConnect</div>

           {/* Informação do Usuário e Botão Sair (Desktop) */}
           <div className="hidden md:flex items-center space-x-4">
            {clientUser ? (
              <>
                <span className="text-sm text-gray-700">Bem-vindo, {clientUser.nome.split(' ')[0]}!</span>
                <button onClick={handleLogout} className="bg-gray-500 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-600">Sair</button>
              </>
            ) : (
              <span className="text-sm text-gray-500">Visitante</span>
            )}
          </div>


          {/* Botão Hambúrguer para Mobile */}
          <div className="md:hidden">
            <button onClick={toggleMenu} aria-label="Abrir menu">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

       {/* Menu Dropdown Mobile (ClientNav) */}
       {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 py-4 space-y-3">
             {clientUser ? (
              <>
                <span className="block text-sm text-gray-700 font-medium">Bem-vindo, {clientUser.nome.split(' ')[0]}!</span>
                <button onClick={handleLogout} className="w-full text-left bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200">Sair</button>
              </>
            ) : (
              <span className="block text-sm text-gray-500">Visitante</span>
              // Se quiser um botão de login aqui, adicione:
              // <button onClick={() => { signInWithGoogle(); setIsOpen(false); }} className="w-full text-center bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">Login Google</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

// --- Componente Header Principal ---
function Header() {
  const location = useLocation();
  // Inclui a Landing Page no fluxo principal, não no fluxo do cliente
  const isClientFlow = (location.pathname.startsWith('/corretor/') || location.pathname.startsWith('/imovel/'));

  return isClientFlow ? <ClientNav /> : <MainNav />;
}

export default Header;