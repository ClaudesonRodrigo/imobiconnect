// src/pages/SuperAdmin.jsx

import { useState, useEffect } from 'react';
import { db, auth as primaryAuth } from '../services/firebaseConfig'; // Renomeado para evitar conflito
import { collection, doc, setDoc, getDocs, query, where, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

// Criamos uma instância de autenticação secundária para não deslogar o SuperAdmin ao criar um novo usuário.
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const secondaryAppName = 'secondary';
let secondaryAuth;
try {
  const secondaryApp = initializeApp(db.app.options, secondaryAppName);
  secondaryAuth = getAuth(secondaryApp);
} catch (error) {
  secondaryAuth = getAuth(initializeApp(db.app.options, secondaryAppName));
}


const initialState = { nome: '', email: '', senha: '' };

function SuperAdmin() {
  const [corretores, setCorretores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState(initialState);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetchCorretores = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), where("role", "==", "corretor"), orderBy("nome"));
      const querySnapshot = await getDocs(q);
      const corretoresList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCorretores(corretoresList);
    } catch (err) {
      console.error("Erro ao buscar corretores:", err);
      setError("Não foi possível carregar a lista de corretores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorretores();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };
  
  const handleToggleStatus = async (corretorId, currentStatus) => {
    const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
    if (window.confirm(`Tem certeza que deseja alterar o status para ${newStatus}?`)) {
        try {
            const corretorDocRef = doc(db, 'users', corretorId);
            await updateDoc(corretorDocRef, { status: newStatus });
            setSuccess(`Status do corretor alterado para ${newStatus}.`);
            fetchCorretores(); // Recarrega a lista
        } catch (error) {
            console.error("Erro ao alterar status:", error);
            setError("Falha ao alterar o status do corretor.");
        }
    }
  };

  const handleDelete = async (corretorId) => {
    if (window.confirm("ATENÇÃO: Esta ação é irreversível. Deseja realmente apagar este corretor?")) {
        try {
            // NOTA: Esta ação apaga apenas o registro no Firestore.
            // Para apagar o usuário do Firebase Authentication, é necessário uma Cloud Function.
            await deleteDoc(doc(db, 'users', corretorId));
            setSuccess("Corretor apagado com sucesso do banco de dados.");
            fetchCorretores();
        } catch (error) {
            console.error("Erro ao apagar corretor: ", error);
            setError("Ocorreu um erro ao apagar o corretor.");
        }
    }
  };

  const handleEdit = (corretor) => {
    setIsEditing(true);
    setEditingId(corretor.id);
    setFormData({ nome: corretor.nome, email: corretor.email, senha: '' });
    window.scrollTo(0, 0);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData(initialState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isEditing && formData.senha.length < 6) {
      return setError("A senha precisa ter no mínimo 6 caracteres.");
    }

    try {
      if (isEditing) {
        // --- LÓGICA DE ATUALIZAÇÃO ---
        const corretorDocRef = doc(db, 'users', editingId);
        await updateDoc(corretorDocRef, { nome: formData.nome });
        setSuccess(`Corretor ${formData.nome} atualizado com sucesso!`);
      } else {
        // --- LÓGICA DE CRIAÇÃO ---
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.senha);
        const newUser = userCredential.user;
        await setDoc(doc(db, "users", newUser.uid), {
          uid: newUser.uid,
          nome: formData.nome,
          email: formData.email,
          role: "corretor",
          status: "ativo" // Novo corretor começa como ativo
        });
        setSuccess(`Corretor ${formData.nome} criado com sucesso!`);
      }
      handleCancelEdit();
      fetchCorretores();
    } catch (error) {
      console.error("Erro ao processar formulário:", error);
      setError(error.code === 'auth/email-already-in-use' ? "Este email já está sendo utilizado." : "Ocorreu um erro.");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Super Painel de Administração</h1>
        
        {/* Formulário de Adicionar/Editar Corretor */}
        <section className="bg-white p-8 rounded-lg shadow-md mb-12">
          <h2 className="text-2xl font-semibold mb-6">{isEditing ? 'Editando Corretor' : 'Adicionar Novo Corretor'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome Completo</label>
              <input type="text" name="nome" id="nome" value={formData.nome} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required disabled={isEditing} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100" />
            </div>
            {!isEditing && (
              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-gray-700">Senha Provisória</label>
                <input type="password" name="senha" id="senha" value={formData.senha} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
              </div>
            )}
            {success && <p className="text-green-600">{success}</p>}
            {error && <p className="text-red-600">{error}</p>}
            <div className="flex items-center space-x-4 pt-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">{isEditing ? 'Atualizar Nome' : 'Adicionar Corretor'}</button>
              {isEditing && (<button type="button" onClick={handleCancelEdit} className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600">Cancelar</button>)}
            </div>
          </form>
        </section>

        {/* Lista de Corretores */}
        <section className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-6">Corretores Cadastrados</h2>
          {loading ? <p>Carregando...</p> : (
            <div className="space-y-4">
              {corretores.map(corretor => (
                <div key={corretor.id} className="border border-gray-200 p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <div>
                    <strong className={corretor.status === 'inativo' ? 'text-gray-400' : 'text-gray-900'}>{corretor.nome}</strong>
                    <p className={corretor.status === 'inativo' ? 'text-gray-400' : 'text-gray-600'}>{corretor.email}</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${corretor.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {corretor.status || 'ativo'}
                    </span>
                  </div>
                  <div className="flex-shrink-0 space-x-2 mt-4 sm:mt-0">
                    <button onClick={() => handleEdit(corretor)} className="bg-blue-500 text-white text-sm py-1 px-3 rounded hover:bg-blue-600">Editar</button>
                    <button onClick={() => handleToggleStatus(corretor.id, corretor.status || 'ativo')} className={`${(corretor.status === 'inativo') ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'} text-white text-sm py-1 px-3 rounded`}>
                      {corretor.status === 'inativo' ? 'Ativar' : 'Desativar'}
                    </button>
                    <button onClick={() => handleDelete(corretor.id)} className="bg-red-500 text-white text-sm py-1 px-3 rounded hover:bg-red-600">Apagar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default SuperAdmin;