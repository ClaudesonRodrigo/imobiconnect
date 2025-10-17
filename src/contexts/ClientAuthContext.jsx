// src/contexts/ClientAuthContext.jsx

import { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

const ClientAuthContext = createContext();

export function ClientAuthProvider({ children }) {
  const [clientUser, setClientUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Efeito que lida com o estado geral de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const clientDocRef = doc(db, 'clients', user.uid);
        const clientDocSnap = await getDoc(clientDocRef);
        if (clientDocSnap.exists()) {
          setClientUser({ ...user, ...clientDocSnap.data() });
        }
        // Se não for um cliente, o clientUser permanece null
      } else {
        setClientUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ATUALIZAÇÃO CRÍTICA: Efeito para capturar o resultado do redirecionamento
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // O usuário acabou de fazer login via redirecionamento
          const user = result.user;
          const userDocRef = doc(db, 'clients', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          // Se for o primeiro login do cliente, criamos o documento dele no Firestore
          if (!userDocSnap.exists()) {
            await setDoc(userDocRef, {
              uid: user.uid,
              nome: user.displayName,
              email: user.email,
              foto: user.photoURL,
              createdAt: new Date(),
            });
          }
          // Após isso, o onAuthStateChanged acima irá detectar o usuário e definir o estado clientUser corretamente.
        }
      } catch (error) {
        console.error("Erro ao obter resultado do redirecionamento:", error);
      }
    };
    
    handleRedirectResult();
  }, []); // Executa apenas uma vez quando o componente é montado

  const signInWithGoogle = async () => {
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error("Erro ao iniciar redirecionamento com Google:", error);
    }
  };

  const clientSignOut = async () => {
    try {
      await signOut(auth);
      setClientUser(null);
    } catch (error) {
      console.error("Erro no logout do cliente:", error);
    }
  };

  const value = {
    clientUser,
    loading,
    signInWithGoogle,
    clientSignOut
  };

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  return useContext(ClientAuthContext);
}