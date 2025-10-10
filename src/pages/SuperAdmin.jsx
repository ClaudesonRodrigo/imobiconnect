// src/pages/SuperAdmin.jsx

import { useState, useEffect } from 'react'; // Adicionado useEffect
import { firebaseConfig, db } from '../services/firebaseConfig';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
// Importado o necessário para ler dados da coleção
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';

// A inicialização da app secundária continua a mesma
const secondaryAppName = 'secondary';
let secondaryApp;
try {
  secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
} catch (error) {
  console.log("App secundária já inicializada.");
}
const secondaryAuth = getAuth(secondaryApp);

function SuperAdmin() {
  const [novoCorretor, setNovoCorretor] = useState({
    nome: '',
    email: '',
    senha: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // States para a lista de corretores
  const [corretores, setCorretores] = useState([]);
  const [loading, setLoading] = useState(true);

  // useEffect para buscar os corretores quando a página carregar
  useEffect(() => {
    const fetchCorretores = async () => {
      try {
        // Query para buscar todos os documentos da coleção "users" onde o role é "corretor"
        const q = query(collection(db, "users"), where("role", "==", "corretor"));
        const querySnapshot = await getDocs(q);
        const corretoresList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCorretores(corretoresList);
      } catch (err) {
        console.error("Erro ao buscar corretores:", err);
        setError("Não foi possível carregar a lista de corretores.");
      } finally {
        setLoading(false);
      }
    };

    fetchCorretores();
  }, [success]); // Roda na primeira vez e toda vez que a mensagem de sucesso mudar (após criar um novo corretor)

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNovoCorretor(prevData => ({ ...prevData, [name]: value }));
  };

  const handleAddCorretor = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (novoCorretor.senha.length < 6) {
        setError("A senha precisa ter no mínimo 6 caracteres.");
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        novoCorretor.email,
        novoCorretor.senha
      );
      const newUser = userCredential.user;
      console.log("Usuário criado no Authentication:", newUser.uid);

      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        nome: novoCorretor.nome,
        email: novoCorretor.email,
        role: "corretor"
      });
      console.log("Documento do usuário salvo no Firestore.");
      
      setSuccess(`Corretor ${novoCorretor.nome} criado com sucesso!`);
      setNovoCorretor({ nome: '', email: '', senha: '' });

    } catch (error) {
      console.error("Erro ao criar corretor:", error);
      if (error.code === 'auth/email-already-in-use') {
        setError("Este email já está sendo utilizado.");
      } else {
        setError("Ocorreu um erro ao criar o corretor.");
      }
    }
  };

  return (
    <div>
      <h1>Super Painel de Administração</h1>
      <section>
        <h2>Adicionar Novo Corretor</h2>
        <form onSubmit={handleAddCorretor}>
          <fieldset>
            <legend>Dados do Corretor</legend>
            <label>Nome: 
              <input 
                type="text" 
                name="nome" 
                value={novoCorretor.nome} 
                onChange={handleChange} 
                required 
              />
            </label><br/>
            <label>Email: 
              <input 
                type="email" 
                name="email" 
                value={novoCorretor.email} 
                onChange={handleChange} 
                required 
              />
            </label><br/>
            <label>Senha Provisória: 
              <input 
                type="password" 
                name="senha" 
                value={novoCorretor.senha} 
                onChange={handleChange} 
                required 
              />
            </label><br/>
          </fieldset>
          {success && <p style={{ color: 'green' }}>{success}</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit">Adicionar Corretor</button>
        </form>
      </section>

      <hr style={{ margin: '40px 0' }} />

      {/* Seção de Lista de Corretores ATUALIZADA */}
      <section>
        <h2>Corretores Cadastrados</h2>
        {loading ? (
          <p>Carregando corretores...</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {corretores.length > 0 ? (
              corretores.map(corretor => (
                <li key={corretor.id} style={{ border: '1px solid #555', padding: '10px', marginBottom: '5px' }}>
                  <strong>{corretor.nome}</strong> ({corretor.email})
                </li>
              ))
            ) : (
              <p>Nenhum corretor cadastrado ainda.</p>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}

export default SuperAdmin;