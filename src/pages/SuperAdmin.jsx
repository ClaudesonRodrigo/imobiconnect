// src/pages/SuperAdmin.jsx

import { useState, useEffect } from 'react';
import { db } from '../services/firebaseConfig';
import { collection, doc, setDoc, getDocs, query, where, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { Users, Home, DollarSign, Eye, Trash2 } from 'lucide-react';

// Instância de autenticação secundária
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
  const [todosImoveis, setTodosImoveis] = useState([]);
  const [stats, setStats] = useState({ totalCorretores: 0, totalImoveis: 0, precoMedio: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState(initialState);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Busca corretores
      const corretoresQuery = query(collection(db, "users"), where("role", "==", "corretor"), orderBy("nome"));
      const corretoresSnapshot = await getDocs(corretoresQuery);
      const corretoresList = corretoresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCorretores(corretoresList);

      // Busca todos os imóveis
      const imoveisQuery = query(collection(db, "imoveis"), orderBy("createdAt", "desc"));
      const imoveisSnapshot = await getDocs(imoveisQuery);
      const imoveisList = imoveisSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTodosImoveis(imoveisList);

      // Calcula estatísticas
      const imoveisVenda = imoveisList.filter(imovel => imovel.finalidade === 'venda' && imovel.preco > 0);
      const totalPreco = imoveisVenda.reduce((acc, imovel) => acc + Number(imovel.preco), 0);
      const precoMedio = imoveisVenda.length > 0 ? totalPreco / imoveisVenda.length : 0;
      setStats({
        totalCorretores: corretoresList.length,
        totalImoveis: imoveisList.length,
        precoMedio: precoMedio,
      });
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      setError("Não foi possível carregar os dados do painel.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleStatus = async (corretorId, currentStatus) => {
    const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
    if (window.confirm(`Tem certeza que deseja alterar o status para ${newStatus}?`)) {
      try {
        await updateDoc(doc(db, 'users', corretorId), { status: newStatus });
        setSuccess(`Status alterado para ${newStatus}.`);
        fetchData();
      } catch (err) { setError("Falha ao alterar o status."); }
    }
  };

  const handleDeleteCorretor = async (corretorId) => {
    if (window.confirm("ATENÇÃO: Deseja realmente apagar este corretor?")) {
      try {
        await deleteDoc(doc(db, 'users', corretorId));
        setSuccess("Corretor apagado com sucesso.");
        fetchData();
      } catch (err) { setError("Ocorreu um erro ao apagar o corretor."); }
    }
  };

  const handleDeleteImovel = async (imovelId) => {
    if (window.confirm("Deseja apagar este imóvel permanentemente?")) {
      try {
        await deleteDoc(doc(db, 'imoveis', imovelId));
        setSuccess("Imóvel apagado com sucesso.");
        fetchData();
      } catch (err) { setError("Ocorreu um erro ao apagar o imóvel."); }
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
    if (!isEditing && formData.senha.length < 6) return setError("A senha precisa ter no mínimo 6 caracteres.");

    try {
      if (isEditing) {
        await updateDoc(doc(db, 'users', editingId), { nome: formData.nome });
        setSuccess(`Corretor ${formData.nome} atualizado!`);
      } else {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.senha);
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          nome: formData.nome,
          email: formData.email,
          role: "corretor",
          status: "ativo"
        });
        setSuccess(`Corretor ${formData.nome} criado!`);
      }
      handleCancelEdit();
      fetchData();
    } catch (error) {
      setError(error.code === 'auth/email-already-in-use' ? "Este email já está sendo utilizado." : "Ocorreu um erro.");
    }
  };
  
  const StatCard = ({ icon, title, value, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
      <div className={`p-3 rounded-full ${color}`}>{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Super Painel de Administração</h1>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard icon={<Users size={24} className="text-indigo-600"/>} title="Total de Corretores" value={loading ? '...' : stats.totalCorretores} color="bg-indigo-100" />
          <StatCard icon={<Home size={24} className="text-green-600"/>} title="Total de Imóveis" value={loading ? '...' : stats.totalImoveis} color="bg-green-100" />
          <StatCard icon={<DollarSign size={24} className="text-yellow-600"/>} title="Preço Médio (Venda)" value={loading ? '...' : `R$ ${stats.precoMedio.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`} color="bg-yellow-100" />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-1">
            <section className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-6">{isEditing ? 'Editando Corretor' : 'Adicionar Corretor'}</h2>
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
                {success && <p className="text-green-600 text-sm">{success}</p>}
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <div className="flex space-x-4 pt-2">
                  <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">{isEditing ? 'Atualizar' : 'Adicionar'}</button>
                  {isEditing && (<button type="button" onClick={handleCancelEdit} className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600">Cancelar</button>)}
                </div>
              </form>
            </section>
          </div>
          <div className="lg:col-span-2">
            <section className="bg-white p-8 rounded-lg shadow-md h-full">
              <h2 className="text-2xl font-semibold mb-6">Corretores Cadastrados</h2>
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
                      <button onClick={() => handleDeleteCorretor(corretor.id)} className="bg-red-500 text-white text-sm py-1 px-3 rounded hover:bg-red-600">Apagar</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <section className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-6">Gerenciamento Global de Imóveis</h2>
          {loading ? <p>Carregando imóveis...</p> : (
            <div className="space-y-4">
              {todosImoveis.length > 0 ? todosImoveis.map(imovel => {
                const corretorDoImovel = corretores.find(c => c.uid === imovel.corretorId);
                return (
                  <div key={imovel.id} className="border border-gray-200 p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <div className="flex items-center space-x-4">
                      {/* CORREÇÃO AQUI */}
                      <img src={imovel.fotos?.[0] || 'https://placehold.co/100x100'} alt={imovel.titulo} className="w-20 h-20 object-cover rounded-md bg-gray-200"/>
                      <div>
                        <strong className="text-gray-900">{imovel.titulo}</strong>
                        <p className="text-sm text-gray-600">R$ {Number(imovel.preco).toLocaleString('pt-BR')}</p>
                        <p className="text-xs text-gray-500">por: {corretorDoImovel?.nome || 'Não encontrado'}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 space-x-2 mt-4 sm:mt-0">
                      <Link to={`/imovel/${imovel.id}`} target="_blank" className="inline-flex items-center bg-blue-500 text-white text-sm py-1 px-3 rounded hover:bg-blue-600">
                        <Eye size={16} className="mr-1"/> Ver
                      </Link>
                      <button onClick={() => handleDeleteImovel(imovel.id)} className="inline-flex items-center bg-red-500 text-white text-sm py-1 px-3 rounded hover:bg-red-600">
                        <Trash2 size={16} className="mr-1"/> Apagar
                      </button>
                    </div>
                  </div>
                )
              }) : <p className="text-center text-gray-500">Nenhum imóvel cadastrado na plataforma.</p>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default SuperAdmin;