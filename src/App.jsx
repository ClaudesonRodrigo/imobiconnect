// src/App.jsx

import { Routes, Route } from 'react-router-dom';
import Header from './components/Header'; // 1. IMPORTA O NOVO HEADER
import LandingPage from './pages/LandingPage';
import VitrineImoveis from './pages/VitrineImoveis';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdmin from './pages/SuperAdmin';
import PaginaCorretor from './pages/PaginaCorretor';
import AdminPanel from './pages/AdminPanel';
import DetalheImovel from './pages/DetalheImovel';
import DetalheTransacao from './pages/DetalheTransacao';

import './App.css';

function App() {
  // 2. TODA A LÓGICA DE NAVEGAÇÃO E LOGOUT FOI MOVIDA PARA O COMPONENTE 'Header'
  // Deixando o App.jsx muito mais limpo e focado apenas nas rotas.

  return (
    <div className="App">
      {/* 3. USA O NOVO COMPONENTE HEADER AQUI */}
      <Header />

      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/corretor/:corretorId" element={<PaginaCorretor />} />
          <Route path="/imovel/:imovelId" element={<DetalheImovel />} />
          
          <Route 
            path="/imoveis" 
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <VitrineImoveis />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/transacao/:transacaoId"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'corretor']}>
                <DetalheTransacao />
              </ProtectedRoute>
            }
          />
          
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'corretor']}>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/superadmin" 
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <SuperAdmin />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  )
}

export default App;