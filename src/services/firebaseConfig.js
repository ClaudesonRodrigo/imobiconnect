// src/services/firebaseConfig.js

import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Inicializa o app principal (ou o obtém se já existir)
const mainApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// ATUALIZAÇÃO CRÍTICA: Cria um segundo app para autenticação do cliente
const clientAppName = 'clientAuth';
const clientApp = getApps().find(app => app.name === clientAppName) || initializeApp(firebaseConfig, clientAppName);

const analytics = getAnalytics(mainApp);
const db = getFirestore(mainApp);

// Auth principal (para corretores e admin)
const auth = getAuth(mainApp);

// Auth secundário (APENAS para clientes)
const clientAuth = getAuth(clientApp);

const googleProvider = new GoogleAuthProvider();

export { db, auth, clientAuth, googleProvider, firebaseConfig };