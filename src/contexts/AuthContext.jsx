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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        // ATUALIZAÇÃO AQUI:
        // Verifica se o usuário existe no Firestore E se o status não é 'inativo'
        if (userDocSnap.exists() && userDocSnap.data().status !== 'inativo') {
          setCurrentUser({ ...user, ...userDocSnap.data() });
        } else {
          // Se o usuário está inativo ou não existe no DB, força o logout.
          setCurrentUser(null);
          auth.signOut(); 
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