// src/pages/AdminPanel.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebaseConfig';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';

// No futuro, quando quebrarmos em mais arquivos, importaremos os componentes aqui.
// Por enquanto, a lógica viverá toda neste componente.

function AdminPanel() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('meusImoveis');

  // --- Lógica da Aba "Meus Imóveis" ---
  const [meusImoveis, setMeusImoveis] = useState([]);
  const [loadingImoveis, setLoadingImoveis] = useState(true);

  useEffect(() => {
    // A busca só é acionada se a aba "Meus Imóveis" estiver ativa e o usuário logado.
    if (activeTab === 'meusImoveis' && currentUser) {
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
    }
  }, [currentUser, activeTab]); // Roda sempre que o usuário ou a aba ativa mudam

  const handleEdit = (imovel) => {
    // Esta função será totalmente implementada quando movermos o formulário
    console.log("Editar imóvel:", imovel);
    alert("A função de editar será conectada na próxima etapa!");
  };

  const handleDelete = async (imovelId) => {
    if (window.confirm("Tem certeza que deseja apagar este imóvel? Esta ação não pode ser desfeita.")) {
      try {
        await deleteDoc(doc(db, 'imoveis', imovelId));
        alert("Imóvel apagado com sucesso!");
        // Força a recarga da lista removendo o item apagado do state local
        setMeusImoveis(prevImoveis => prevImoveis.filter(imovel => imovel.id !== imovelId));
      } catch (error) {
        console.error("Erro ao apagar imóvel: ", error);
        alert("Ocorreu um erro ao apagar o imóvel.");
      }
    }
  };
  // --- Fim da Lógica da Aba "Meus Imóveis" ---

  const renderContent = () => {
    switch (activeTab) {
      case 'meusImoveis':
        return (
          <section className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6">Meus Imóveis Cadastrados</h2>
            {loadingImoveis ? (
              <p>Carregando seus imóveis...</p>
            ) : (
              <div className="space-y-4">
                {meusImoveis.length > 0 ? (
                  meusImoveis.map(imovel => (
                    <div key={imovel.id} className="border border-gray-200 p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <div className="mb-4 sm:mb-0">
                        <h3 className="font-bold text-lg truncate">{imovel.titulo}</h3>
                        <p className="text-gray-600">R$ {Number(imovel.preco).toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="flex-shrink-0 space-x-2">
                        <button onClick={() => handleEdit(imovel)} className="bg-blue-500 text-white text-sm py-1 px-3 rounded hover:bg-blue-600">
                          Editar
                        </button>
                        <button onClick={() => handleDelete(imovel.id)} className="bg-red-500 text-white text-sm py-1 px-3 rounded hover:bg-red-600">
                          Apagar
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">Você ainda não cadastrou nenhum imóvel.</p>
                )}
              </div>
            )}
          </section>
        );
      case 'cadastrar':
        return <div className="bg-white p-8 rounded-lg shadow-md">O formulário para cadastrar e editar imóveis virá para esta aba.</div>;
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
            <button
              onClick={() => setActiveTab('meusImoveis')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'meusImoveis'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Meus Imóveis
            </button>
            <button
              onClick={() => setActiveTab('cadastrar')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'cadastrar'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Cadastrar / Editar Imóvel
            </button>
            <button
              onClick={() => setActiveTab('personalizacao')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'personalizacao'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
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