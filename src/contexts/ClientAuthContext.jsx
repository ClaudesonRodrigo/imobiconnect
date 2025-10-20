// src/contexts/ClientAuthContext.jsx

import { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
// ATUALIZAÇÃO FINAL: Importa o 'clientAuth' dedicado e o 'db'
import { clientAuth, googleProvider, db } from '../services/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const ClientAuthContext = createContext();

export function ClientAuthProvider({ children }) {
  const [clientUser, setClientUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Efeito que lida com o estado GERAL de autenticação do cliente
  useEffect(() => {
    // Este listener ouve APENAS a instância de auth do cliente (`clientAuth`)
    const unsubscribe = onAuthStateChanged(clientAuth, async (user) => {
      setLoading(true);
      if (user) {
        const clientDocRef = doc(db, 'clients', user.uid);
        const clientDocSnap = await getDoc(clientDocRef);
        if (clientDocSnap.exists()) {
          setClientUser({ ...user, ...clientDocSnap.data() });
        }
      } else {
        setClientUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Efeito que lida ESPECIFICAMENTE com o retorno do login via redirecionamento
  useEffect(() => {
    const handleRedirectResult = async () => {
      setLoading(true);
      try {
        // Captura o resultado da instância de auth do cliente (`clientAuth`)
        const result = await getRedirectResult(clientAuth);
        if (result) {
          const user = result.user;
          const userDocRef = doc(db, 'clients', user.uid);
          
          const clientData = {
              uid: user.uid,
              nome: user.displayName,
              email: user.email,
              foto: user.photoURL,
              createdAt: new Date(),
          };
          // Cria ou atualiza o documento do cliente no Firestore
          await setDoc(userDocRef, clientData, { merge: true });
          // Atualiza o estado local imediatamente
          setClientUser({ ...user, ...clientData });
        }
      } catch (error) {
        console.error("Erro ao obter resultado do redirecionamento:", error);
      } finally {
         setLoading(false);
      }
    };
    
    handleRedirectResult();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithRedirect(clientAuth, googleProvider);
    } catch (error) {
      console.error("Erro ao iniciar redirecionamento com Google:", error);
      setLoading(false);
    }
  };

  const clientSignOut = async () => {
    try {
      await signOut(clientAuth);
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
      {!loading && children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  return useContext(ClientAuthContext);
}