// src/main.jsx

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
// ATUALIZAÇÃO: Importe o ClientAuthProvider
import { ClientAuthProvider } from './contexts/ClientAuthContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* ATUALIZAÇÃO: Adicione o ClientAuthProvider */}
        <ClientAuthProvider>
          <App />
        </ClientAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);