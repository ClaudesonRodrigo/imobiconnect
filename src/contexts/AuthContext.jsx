// src/contexts/AuthContext.jsx

import { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore'; // Importe o getDoc

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Se um usuário fez login, busque o documento dele no Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          // Se o documento existe, salve o usuário COM O PAPEL no nosso state
          setCurrentUser({ ...user, ...userDocSnap.data() });
        } else {
          // Caso raro: usuário existe no Auth mas não no Firestore. Trate como não logado.
          setCurrentUser(null);
        }
      } else {
        // Se não há usuário, defina como nulo
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser
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