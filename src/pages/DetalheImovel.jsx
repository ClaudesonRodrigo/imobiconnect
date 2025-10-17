// src/pages/DetalheImovel.jsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../services/firebaseConfig';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import WhatsappButton from '../components/WhatsappButton';
import { BedDouble, Bath, Car, Ruler, Heart } from 'lucide-react';
// CORREÇÃO AQUI: Importando do arquivo correto
import { useClientAuth } from '../contexts/ClientAuthContext';


function DetalheImovel() {
  const { imovelId } = useParams();
  const [imovel, setImovel] = useState(null);
  const [corretor, setCorretor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fotoPrincipal, setFotoPrincipal] = useState(null);

  const { clientUser, signInWithGoogle } = useClientAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);


  useEffect(() => {
    const fetchImovel = async () => {
      setLoading(true);
      try {
        const imovelDocRef = doc(db, 'imoveis', imovelId);
        const imovelDocSnap = await getDoc(imovelDocRef);

        if (imovelDocSnap.exists()) {
          const imovelData = { id: imovelDocSnap.id, ...imovelDocSnap.data() };
          setImovel(imovelData);
          if (imovelData.fotos && imovelData.fotos.length > 0) {
            setFotoPrincipal(imovelData.fotos[0]);
          }

          if (imovelData.corretorId) {
            const corretorDocRef = doc(db, 'users', imovelData.corretorId);
            const corretorDocSnap = await getDoc(corretorDocRef);
            if (corretorDocSnap.exists()) {
              setCorretor(corretorDocSnap.data());
            }
          }
        } else {
          setError("Imóvel não encontrado.");
        }
      } catch (err) {
        console.error("Erro ao buscar imóvel:", err);
        setError("Ocorreu um erro ao carregar os detalhes do imóvel.");
      } finally {
        setLoading(false);
      }
    };

    fetchImovel();
  }, [imovelId]);

  useEffect(() => {
    if (!clientUser || !imovelId) {
      setIsFavorited(false);
      return;
    }
    const checkFavorite = async () => {
      const favoriteRef = doc(db, 'clients', clientUser.uid, 'favorites', imovelId);
      const favoriteSnap = await getDoc(favoriteRef);
      setIsFavorited(favoriteSnap.exists());
    };
    checkFavorite();
  }, [clientUser, imovelId]);
  
  const handleFavoriteClick = async () => {
    setIsFavoriting(true);
    let currentUser = clientUser;

    if (!currentUser) {
      currentUser = await signInWithGoogle();
      if (!currentUser) {
        setIsFavoriting(false);
        return;
      }
    }
    
    const favoriteRef = doc(db, 'clients', currentUser.uid, 'favorites', imovelId);
    
    try {
      if (isFavorited) {
        await deleteDoc(favoriteRef);
        setIsFavorited(false);
      } else {
        await setDoc(favoriteRef, {
          imovelId: imovelId,
          titulo: imovel.titulo,
          foto: imovel.fotos?.[0] || '',
          preco: imovel.preco,
          corretorId: imovel.corretorId,
          favoritedAt: new Date(),
        });
        setIsFavorited(true);
      }
    } catch (err) {
      console.error("Erro ao salvar favorito:", err);
      alert("Ocorreu um erro ao salvar seu favorito.");
    } finally {
      setIsFavoriting(false);
    }
  };


  if (loading) {
    return <p className="text-center text-gray-500 mt-8">Carregando detalhes do imóvel...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 mt-8">Erro: {error}</p>;
  }

  if (!imovel) {
    return null;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <main className="bg-white p-6 sm:p-8 rounded-lg shadow-lg">
          <section className="mb-8">
            <div className="w-full aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-gray-200 mb-4">
              {fotoPrincipal ? (
                <img src={fotoPrincipal} alt="Foto principal do imóvel" className="w-full h-full object-cover"/>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-gray-500">Sem foto principal</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {imovel.fotos && imovel.fotos.map((foto, index) => (
                <div key={index} className="aspect-w-1 aspect-h-1 cursor-pointer rounded overflow-hidden" onClick={() => setFotoPrincipal(foto)}>
                  <img src={foto} alt={`Thumbnail ${index + 1}`} className={`w-full h-full object-cover transition-opacity duration-200 ${foto === fotoPrincipal ? 'opacity-100 ring-2 ring-indigo-500' : 'opacity-60 hover:opacity-100'}`} />
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">{imovel.titulo}</h1>
              <p className="text-lg text-gray-500 mb-6">{imovel.endereco.bairro}, {imovel.endereco.cidade}</p>
              
              <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-6 pb-6 border-b">
                  <div className="flex items-center gap-2"><BedDouble size={20} /><span>{imovel.caracteristicas.quartos} Quartos</span></div>
                  <div className="flex items-center gap-2"><Bath size={20} /><span>{imovel.caracteristicas.banheiros} Banheiros</span></div>
                  <div className="flex items-center gap-2"><Car size={20} /><span>{imovel.caracteristicas.vagasGaragem} Vagas</span></div>
                  <div className="flex items-center gap-2"><Ruler size={20} /><span>{imovel.caracteristicas.areaTotal} m²</span></div>
              </div>

              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Descrição</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{imovel.descricao || "Nenhuma descrição fornecida."}</p>
              
              {imovel.videoUrl && (
                <div className="mt-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Vídeo do Imóvel</h2>
                  <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
                    <video src={imovel.videoUrl} controls className="w-full h-full">
                      Seu navegador não suporta o player de vídeo.
                    </video>
                  </div>
                </div>
              )}
            </div>

            <aside className="lg:col-span-1">
              <div className="sticky top-8 bg-gray-50 p-6 rounded-lg shadow-md">
                <p className="text-sm text-gray-600">{imovel.finalidade === 'venda' ? 'Preço de Venda' : 'Valor do Aluguel'}</p>
                <p className="text-4xl font-extrabold text-green-600 mb-6">
                  R$ {Number(imovel.preco).toLocaleString('pt-BR')}
                </p>

                <button
                  onClick={handleFavoriteClick}
                  disabled={isFavoriting}
                  className={`w-full flex items-center justify-center gap-2 text-center font-bold py-3 px-6 rounded-lg transition-colors mb-6 ${
                    isFavorited
                      ? 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Heart size={20} fill={isFavorited ? 'currentColor' : 'none'} />
                  {isFavorited ? 'Salvo como Favorito' : 'Salvar como Favorito'}
                </button>

                {corretor && (
                  <div className="pt-6 border-t">
                    <p className="text-sm font-medium text-gray-800 mb-4">Corretor Responsável</p>
                    <Link to={`/corretor/${imovel.corretorId}`} className="flex items-center gap-4 group">
                      {corretor.personalizacao?.logoUrl ? (
                        <img src={corretor.personalizacao.logoUrl} alt={`Logo de ${corretor.nome}`} className="w-16 h-16 rounded-full object-cover"/>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm text-gray-500">Sem Logo</span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 group-hover:underline">{corretor.nome}</h3>
                        <p className="text-sm text-gray-600">{corretor.email}</p>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </aside>
          </section>
        </main>
        {corretor && <WhatsappButton phoneNumber={corretor.personalizacao?.whatsapp} />}
      </div>
    </div>
  );
}

export default DetalheImovel;