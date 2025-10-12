// src/pages/AdminPanel.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebaseConfig';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

// O estado inicial do formulário, que agora vive aqui
const initialState = {
  titulo: '', descricao: '', tipo: 'casa', finalidade: 'venda', preco: 0, status: 'disponivel',
  endereco: { rua: '', numero: '', bairro: '', cidade: '', cep: '' },
  caracteristicas: { quartos: 0, suites: 0, banheiros: 0, vagasGaragem: 0, areaTotal: 0 },
  comodidades: [], fotos: []
};

function AdminPanel() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('meusImoveis');

  // --- States da Aba "Meus Imóveis" ---
  const [meusImoveis, setMeusImoveis] = useState([]);
  const [loadingImoveis, setLoadingImoveis] = useState(true);
  
  // --- States da Aba "Cadastrar / Editar" (Movidos para cá) ---
  const [imovelData, setImovelData] = useState(initialState);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(false); // Para forçar a recarga da lista

  useEffect(() => {
    if (!currentUser) return;

    const fetchMeusImoveis = async () => {
      setLoadingImoveis(true);
      try {
        const imoveisCollectionRef = collection(db, 'imoveis');
        const q = query(imoveisCollectionRef, where("corretorId", "==", currentUser.uid), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const imoveisList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMeusImoveis(imoveisList);
      } catch (err) {
        console.error("Erro ao buscar meus imóveis:", err);
      } finally {
        setLoadingImoveis(false);
      }
    };
    fetchMeusImoveis();
  }, [currentUser, forceUpdate]);

  // --- Funções do Formulário (Movidas para cá) ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [objectName, fieldName] = name.split('.');
      setImovelData(prevData => ({ ...prevData, [objectName]: { ...prevData[objectName], [fieldName]: value } }));
    } else {
      setImovelData(prevData => ({ ...prevData, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSave = {
      ...imovelData,
      preco: Number(imovelData.preco),
      caracteristicas: {
        quartos: Number(imovelData.caracteristicas.quartos),
        suites: Number(imovelData.caracteristicas.suites),
        banheiros: Number(imovelData.caracteristicas.banheiros),
        vagasGaragem: Number(imovelData.caracteristicas.vagasGaragem),
        areaTotal: Number(imovelData.caracteristicas.areaTotal),
      },
    };

    if (isEditing) {
      try {
        const imovelDocRef = doc(db, 'imoveis', editingId);
        await updateDoc(imovelDocRef, dataToSave);
        alert("Imóvel atualizado com sucesso!");
        handleCancelEdit();
      } catch (error) { console.error("Erro ao atualizar: ", error); alert("Erro ao atualizar."); }
    } else {
      try {
        await addDoc(collection(db, "imoveis"), {
          ...dataToSave,
          createdAt: serverTimestamp(),
          corretorId: currentUser.uid 
        });
        alert(`Imóvel cadastrado com sucesso!`);
        setImovelData(initialState);
      } catch (error) { console.error("Erro ao cadastrar: ", error); alert("Erro ao cadastrar."); }
    }
    setForceUpdate(prev => !prev);
    setActiveTab('meusImoveis');
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setImovelData(initialState);
    setActiveTab('meusImoveis'); // Volta para a lista ao cancelar
  };

  // --- Funções da Lista (Já estavam aqui, mas handleEdit foi atualizada) ---
  const handleEdit = (imovel) => {
    setIsEditing(true);
    setEditingId(imovel.id);
    setImovelData(imovel);
    setActiveTab('cadastrar'); // PULA PARA A ABA DO FORMULÁRIO
    window.scrollTo(0, 0);
  };

  const handleDelete = async (imovelId) => {
    if (window.confirm("Tem certeza que deseja apagar este imóvel?")) {
      try {
        await deleteDoc(doc(db, 'imoveis', imovelId));
        alert("Imóvel apagado com sucesso!");
        setForceUpdate(prev => !prev);
      } catch (error) { console.error("Erro ao apagar: ", error); alert("Erro ao apagar."); }
    }
  };

  // --- Função que Renderiza o Conteúdo da Aba ---
  const renderContent = () => {
    switch (activeTab) {
      case 'meusImoveis':
        return (
          <section className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6">Meus Imóveis Cadastrados</h2>
            {loadingImoveis ? <p>Carregando...</p> : (
              <div className="space-y-4">
                {meusImoveis.length > 0 ? (
                  meusImoveis.map(imovel => (
                    <div key={imovel.id} className="border border-gray-200 p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <div className="mb-4 sm:mb-0">
                        <h3 className="font-bold text-lg truncate">{imovel.titulo}</h3>
                        <p className="text-gray-600">R$ {Number(imovel.preco).toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="flex-shrink-0 space-x-2">
                        <button onClick={() => handleEdit(imovel)} className="bg-blue-500 text-white text-sm py-1 px-3 rounded hover:bg-blue-600">Editar</button>
                        <button onClick={() => handleDelete(imovel.id)} className="bg-red-500 text-white text-sm py-1 px-3 rounded hover:bg-red-600">Apagar</button>
                      </div>
                    </div>
                  ))
                ) : <p className="text-center text-gray-500">Você ainda não cadastrou nenhum imóvel.</p>}
              </div>
            )}
          </section>
        );
      case 'cadastrar':
        return (
          <section className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6">{isEditing ? 'Editando Imóvel' : 'Cadastrar Novo Imóvel'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* --- FORMULÁRIO COMPLETO E ESTILIZADO --- */}
              <div>
                <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">Título do Anúncio</label>
                <input type="text" name="titulo" id="titulo" value={imovelData.titulo} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea name="descricao" id="descricao" value={imovelData.descricao} onChange={handleChange} rows="4" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="preco" className="block text-sm font-medium text-gray-700">Preço (R$)</label>
                  <input type="number" name="preco" id="preco" value={imovelData.preco} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                  <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">Tipo de Imóvel</label>
                  <select id="tipo" name="tipo" value={imovelData.tipo} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    <option value="casa">Casa</option>
                    <option value="apartamento">Apartamento</option>
                    <option value="terreno">Terreno</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="finalidade" className="block text-sm font-medium text-gray-700">Finalidade</label>
                  <select id="finalidade" name="finalidade" value={imovelData.finalidade} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    <option value="venda">Venda</option>
                    <option value="aluguel">Aluguel</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-4 pt-6">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700">{isEditing ? 'Atualizar Imóvel' : 'Cadastrar Imóvel'}</button>
                {isEditing && (
                  <button type="button" onClick={handleCancelEdit} className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600">Cancelar Edição</button>
                )}
              </div>
            </form>
          </section>
        );
      case 'personalizacao':
        return <div className="bg-white p-8 rounded-lg shadow-md">O formulário de personalização virá para esta aba.</div>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Painel do Corretor</h1>
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button onClick={() => setActiveTab('meusImoveis')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${ activeTab === 'meusImoveis' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              Meus Imóveis
            </button>
            <button onClick={() => { setIsEditing(false); setImovelData(initialState); setActiveTab('cadastrar'); }} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${ activeTab === 'cadastrar' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              Cadastrar Imóvel
            </button>
            <button onClick={() => setActiveTab('personalizacao')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${ activeTab === 'personalizacao' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              Personalização
            </button>
          </nav>
        </div>
        <div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;