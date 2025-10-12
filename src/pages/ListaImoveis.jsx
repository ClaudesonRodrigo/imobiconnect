// src/pages/ListaImoveis.jsx

import { useState, useEffect } from 'react';
import { db } from '../services/firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Link } from 'react-router-dom';

function ListaImoveis() {
  const [imoveis, setImoveis] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImoveis = async () => {
      try {
        const imoveisCollectionRef = collection(db, 'imoveis');
        const q = query(imoveisCollectionRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const imoveisData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setImoveis(imoveisData);
      } catch (error) {
        console.error("Erro ao buscar imóveis: ", error);
        alert("Falha ao carregar a lista de imóveis.");
      } finally {
        setLoading(false);
      }
    };
    fetchImoveis();
  }, []);

  if (loading) {
    return <p className="text-center text-gray-500 mt-8">Carregando imóveis...</p>;
  }

  return (
    // 'bg-gray-100' - um fundo cinza claro para a página toda
    <div className="bg-gray-100 min-h-screen">
        {/* 'container mx-auto px-4 py-8': Centraliza o conteúdo e adiciona padding */}
        <div className="container mx-auto px-4 py-12">
            {/* 'text-4xl font-bold text-center mb-12': Título grande, em negrito, centralizado e com margem abaixo */}
            <h1 className="text-4xl font-bold text-center mb-12 text-gray-800">Vitrine de Imóveis</h1>
            
            {imoveis.length === 0 ? (
                <p className="text-center text-gray-600">Nenhum imóvel cadastrado ainda.</p>
            ) : (
                // 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8': Cria um grid responsivo.
                // 1 coluna em telas pequenas, 2 em médias (md), 3 em grandes (lg). 'gap-8' é o espaçamento.
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {imoveis.map(imovel => (
                    // A tag Link agora é um grupo para o hover funcionar no card inteiro
                    <Link to={`/imovel/${imovel.id}`} key={imovel.id} className="block group">
                    {/* Card principal com sombra, bordas arredondadas e transição suave */}
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-2xl">
                        {/* Imagem de Placeholder (vamos adicionar a imagem real depois) */}
                        <div className="w-full h-56 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">Imagem do imóvel</span>
                        </div>
                        {/* Área de conteúdo do card com padding */}
                        <div className="p-6">
                        {/* Título do imóvel */}
                        <h2 className="text-2xl font-bold text-gray-800 mb-2 truncate">{imovel.titulo}</h2>
                        {/* Localização */}
                        <p className="text-gray-600 mb-4">{imovel.endereco.cidade} - {imovel.endereco.bairro}</p>
                        {/* Preço */}
                        <p className="text-3xl font-extrabold text-green-600">
                            R$ {Number(imovel.preco).toLocaleString('pt-BR')}
                        </p>
                        </div>
                    </div>
                    </Link>
                ))}
                </div>
            )}
        </div>
    </div>
  );
}

export default ListaImoveis;