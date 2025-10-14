// src/pages/PaginaCorretor.jsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../services/firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Phone, Mail, Instagram, Facebook, Share2, MessageSquare } from 'lucide-react'; // Ícone MessageSquare adicionado

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
          // ATUALIZAÇÃO: Mesclando dados do usuário e personalização
          const userData = corretorDocSnap.data();
          setCorretor({
            ...userData,
            // Garante que personalizacao seja um objeto para evitar erros
            personalizacao: userData.personalizacao || {} 
          });
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

  // ATUALIZAÇÃO: Lógica de compartilhamento implementada
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de ${corretor.nome}`,
          text: `Confira os imóveis de ${corretor.nome}, corretor especialista.`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
      }
    } else {
      // Fallback para desktops ou navegadores sem suporte
      navigator.clipboard.writeText(window.location.href);
      alert("Link do perfil copiado para a área de transferência!");
    }
  };

  if (loading) {
    return <p className="text-center text-gray-500 mt-8">Carregando página do corretor...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 mt-8">Erro: {error}</p>;
  }

  if (!corretor) {
    return <p className="text-center text-gray-500 mt-8">Corretor não encontrado.</p>;
  }
  
  // Extraindo os dados de personalização para facilitar o uso
  const { creci, bio, telefone, whatsapp, social } = corretor.personalizacao;

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <header className="bg-white rounded-2xl shadow-xl p-8 mb-12 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {corretor.personalizacao?.logoUrl ? (
              <img 
                src={corretor.personalizacao.logoUrl} 
                alt={`Logo de ${corretor.nome}`} 
                className="w-40 h-40 rounded-full object-cover shadow-lg border-4 border-indigo-500"
              />
            ) : (
              <div className="w-40 h-40 rounded-full bg-gray-300 flex items-center justify-center shadow-lg border-4 border-indigo-500">
                <span className="text-gray-500">Sem Logo</span>
              </div>
            )}
            
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-bold text-gray-800">{corretor.nome}</h1>
              <p className="text-md text-gray-500 font-semibold mt-1">{creci || 'CRECI não informado'}</p>
              <p className="text-gray-600 mt-4 max-w-lg">{bio || 'Corretor de imóveis dedicado a encontrar o lar dos seus sonhos.'}</p>

              <div className="flex justify-center md:justify-start space-x-4 mt-4">
                {social?.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-indigo-600"><Instagram size={24} /></a>}
                {social?.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-indigo-600"><Facebook size={24} /></a>}
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 flex flex-wrap justify-center gap-4">
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 min-w-[150px]">
                <MessageSquare size={20}/> WhatsApp
              </a>
            )}
            {corretor.email && (
              <a href={`mailto:${corretor.email}`} className="flex-1 text-center bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 min-w-[150px]">
                <Mail size={20}/> Email
              </a>
            )}
            {telefone && (
              <a href={`tel:${telefone.replace(/\D/g, '')}`} className="flex-1 text-center bg-gray-800 text-white font-bold py-3 px-6 rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2 min-w-[150px]">
                <Phone size={20}/> Ligar
              </a>
            )}
            <button onClick={handleShare} className="flex-1 text-center bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 min-w-[150px]">
              <Share2 size={20}/> Compartilhar
            </button>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Imóveis em Destaque</h2>
          {imoveis.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {imoveis.map(imovel => (
                <Link to={`/imovel/${imovel.id}`} key={imovel.id} className="block group">
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-2xl">
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
      </div>
    </div>
  );
}

export default PaginaCorretor;