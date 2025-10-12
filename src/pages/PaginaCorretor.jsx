// src/pages/PaginaCorretor.jsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../services/firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import WhatsappButton from '../components/WhatsappButton';

function PaginaCorretor() {
  const { corretorId } = useParams();

  const [corretor, setCorretor] = useState(null);
  const [imoveis, setImoveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!corretorId) {
        setError("ID do corretor não encontrado.");
        setLoading(false);
        return;
      }
      try {
        const corretorDocRef = doc(db, 'users', corretorId);
        const corretorDocSnap = await getDoc(corretorDocRef);
        if (corretorDocSnap.exists()) {
          setCorretor(corretorDocSnap.data());
        } else {
          setError("Corretor não encontrado.");
          setLoading(false);
          return;
        }

        const imoveisCollectionRef = collection(db, 'imoveis');
        const q = query(imoveisCollectionRef, where("corretorId", "==", corretorId), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const imoveisList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setImoveis(imoveisList);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
        setError("Ocorreu um erro ao carregar a página.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [corretorId]);

  if (loading) {
    return <p className="text-center text-gray-500 mt-8">Carregando página do corretor...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 mt-8">Erro: {error}</p>;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        {corretor && (
          <header className="flex flex-col items-center text-center mb-12">
            {corretor.personalizacao?.logoUrl ? (
              <img 
                src={corretor.personalizacao.logoUrl} 
                alt={`Logo de ${corretor.nome}`} 
                className="w-32 h-32 rounded-full object-cover mb-4 shadow-lg border-4 border-white"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-300 mb-4 flex items-center justify-center shadow-lg border-4 border-white">
                <span className="text-gray-500">Sem Logo</span>
              </div>
            )}
            <h1 className="text-4xl font-bold text-gray-800">Imóveis de {corretor.nome}</h1>
            <p className="text-lg text-gray-600 mt-2">{corretor.email}</p>
          </header>
        )}
        
        <main>
          {imoveis.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {imoveis.map(imovel => (
                <Link to={`/imovel/${imovel.id}`} key={imovel.id} className="block group">
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-2xl">
                    
                    {/* ATUALIZAÇÃO AQUI */}
                    <div className="w-full h-56 bg-gray-200 flex items-center justify-center overflow-hidden">
                      {imovel.fotos && imovel.fotos.length > 0 ? (
                        <img src={imovel.fotos[0]} alt={imovel.titulo} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-500">Sem Foto</span>
                      )}
                    </div>

                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-gray-800 mb-2 truncate">{imovel.titulo}</h2>
                      <p className="text-gray-600 mb-4">{imovel.endereco.cidade} - {imovel.endereco.bairro}</p>
                      <p className="text-3xl font-extrabold text-green-600">
                        R$ {Number(imovel.preco).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 bg-white p-8 rounded-lg shadow-md">Este corretor não possui imóveis cadastrados no momento.</p>
          )}
        </main>
        
        {corretor && <WhatsappButton phoneNumber={corretor.personalizacao?.whatsapp} />}
      </div>
    </div>
  );
}

export default PaginaCorretor;