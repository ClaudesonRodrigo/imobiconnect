// src/pages/Login.jsx

import { useState } from 'react';
// 1. Importe as ferramentas de autenticação do Firebase
import { auth } from '../services/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
// Importe o hook para navegar entre páginas após o login
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // State para guardar mensagens de erro
  
  const navigate = useNavigate(); // Inicializa o hook de navegação

  // 2. Atualize a função handleSubmit para ser async e chamar o Firebase
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Limpa erros anteriores

    try {
      // 3. Tenta fazer o login com a função do Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Se o login for bem-sucedido:
      console.log("Login realizado com sucesso!", userCredential.user);
      alert("Login bem-sucedido!");
      
      // 4. Redireciona o usuário para a página de administração
      navigate('/admin'); 

    } catch (error) {
      // Se o Firebase retornar um erro:
      console.error("Erro ao fazer login:", error.code, error.message);
      setError("Falha no login. Verifique seu e-mail e senha."); // Mostra um erro amigável
    }
  };

  return (
    <div>
      <h1>Área do Corretor - Login</h1>
      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>Entrar no Painel</legend>
          <label>
            Email:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <br />
          <label>
            Senha:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <br />
        </fieldset>
        {/* Mostra a mensagem de erro, se houver */}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}

export default Login;