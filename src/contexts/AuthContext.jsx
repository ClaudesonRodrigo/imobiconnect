// src/contexts/AuthContext.jsx

import { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Flag de montagem para evitar vazamento de memória ou erros de 'unmounted component'
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          // Verifica se o componente ainda está montado antes de atualizar o estado
          if (isMounted) {
            if (userDocSnap.exists() && 
               (userDocSnap.data().role === 'corretor' || userDocSnap.data().role === 'superadmin') && 
               userDocSnap.data().status !== 'inativo') {
              
              setCurrentUser({ ...user, ...userDocSnap.data() });
            } else {
              // Usuário existe no Auth mas não é corretor/admin ou está inativo
              setCurrentUser(null);
            }
          }
        } else {
          if (isMounted) setCurrentUser(null);
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        if (isMounted) setCurrentUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    // Função de limpeza
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} 
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}