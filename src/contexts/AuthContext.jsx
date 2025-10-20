// src/contexts/AuthContext.jsx

import { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
// ATUALIZAÇÃO FINAL: Importamos a instância de auth principal
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Este listener observa a instância de auth principal (para corretores)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        // Apenas definimos o currentUser se ele for um corretor válido e ativo
        if (userDocSnap.exists() && userDocSnap.data().role === 'corretor' && userDocSnap.data().status !== 'inativo') {
          setCurrentUser({ ...user, ...userDocSnap.data() });
        } else if (userDocSnap.exists() && userDocSnap.data().role === 'superadmin') {
           setCurrentUser({ ...user, ...userDocSnap.data() });
        }
        else {
          // CORREÇÃO CRÍTICA:
          // Se o usuário logado não é um corretor (ou seja, é um cliente),
          // nós simplesmente NÃO FAZEMOS NADA.
          // Não definimos o currentUser deste contexto e, mais importante,
          // NÃO deslogamos o usuário. Isso deixa o ClientAuthContext livre para gerenciá-lo.
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}