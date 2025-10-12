// src/pages/Login.jsx

import { useState, useEffect } from 'react';
import { auth, db } from '../services/firebaseConfig'; // Importar 'db'
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // Importar 'doc' e 'getDoc'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Efeito para redirecionar se o usuário JÁ ESTIVER LOGADO ao carregar a página
  useEffect(() => {
    if (!authLoading && currentUser) {
      const targetPath = currentUser.role === 'superadmin' ? '/superadmin' : '/admin';
      navigate(targetPath);
    }
  }, [currentUser, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Tenta fazer o login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. LOGO APÓS o login, busca os dados do usuário no Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      // 3. Verifica a role e redireciona IMEDIATAMENTE
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.status === 'inativo') {
          setError("Sua conta foi desativada. Entre em contato com o administrador.");
          await auth.signOut(); // Desloga o usuário inativo
        } else {
          const targetPath = userData.role === 'superadmin' ? '/superadmin' : '/admin';
          navigate(targetPath);
        }
      } else {
        // Caso raro onde o usuário existe na autenticação mas não no DB
        setError("Dados do usuário não encontrados.");
        await auth.signOut();
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error.code, error.message);
      setError("Falha no login. Verifique seu e-mail e senha.");
    } finally {
      setLoading(false);
    }
  };
  
  // Exibe "Redirecionando..." apenas se o usuário já estiver logado
  if (authLoading || currentUser) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <p className="text-gray-500">Verificando autenticação...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Acessar meu painel
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Exclusivo para corretores cadastrados
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Endereço de email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password"className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-sm text-red-700 text-center">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;