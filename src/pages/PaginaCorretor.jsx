// src/pages/PaginaCorretor.jsx

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
    return <p>Carregando página do corretor...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Erro: {error}</p>;
  }

  return (
    <div>
      {corretor && (
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          {/* ===== LÓGICA PARA EXIBIR A LOGO AQUI ===== */}
          {corretor.personalizacao?.logoUrl && (
            <img 
              src={corretor.personalizacao.logoUrl} 
              alt={`Logo de ${corretor.nome}`} 
              style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }}
            />
          )}
          <h1>Imóveis de {corretor.nome}</h1>
          <p>Contato: {corretor.email}</p>
        </header>
      )}
      
      <main>
        {imoveis.length > 0 ? (
          imoveis.map(imovel => (
            <div key={imovel.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
              <h2>{imovel.titulo}</h2>
              <p><strong>Tipo:</strong> {imovel.tipo}</p>
              <p><strong>Cidade:</strong> {imovel.endereco.cidade}</p>
              <p><strong>Preço:</strong> R$ {Number(imovel.preco).toLocaleString('pt-BR')}</p>
            </div>
          ))
        ) : (
          <p>Este corretor não possui imóveis cadastrados no momento.</p>
        )}
      </main>
      {/* 2. Adicione o botão flutuante aqui! */}
      {corretor && <WhatsappButton phoneNumber={corretor.personalizacao?.whatsapp} />}
    </div>
  );
}

export default PaginaCorretor;