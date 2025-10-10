// src/pages/ListaImoveis.jsx

import { useState, useEffect } from 'react';
// IMPORTANTE: Precisamos das funções do Firestore para LER dados
import { db } from '../services/firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

function ListaImoveis() {
  // useState para guardar a lista de imóveis que virá do banco
  const [imoveis, setImoveis] = useState([]); 
  // useState para controlar a mensagem de "carregando..."
  const [loading, setLoading] = useState(true);

  // useEffect é um hook do React que executa um código DEPOIS que o componente
  // é renderizado na tela. Perfeito para buscar dados!
  useEffect(() => {
    // Criamos uma função async aqui dentro para poder usar o await
    const fetchImoveis = async () => {
      try {
        // 1. Criamos uma referência para a nossa coleção "imoveis"
        const imoveisCollectionRef = collection(db, 'imoveis');

        // 2. Criamos uma query para buscar os documentos, ordenados pelo mais recente
        const q = query(imoveisCollectionRef, orderBy('createdAt', 'desc'));

        // 3. Executamos a query e pegamos um "snapshot" (uma foto) dos dados
        const querySnapshot = await getDocs(q);
        
        // 4. Transformamos o snapshot em um array de objetos que o React entende
        const imoveisData = querySnapshot.docs.map(doc => ({
          id: doc.id, // Pegamos o ID do documento
          ...doc.data() // Pegamos todos os outros dados (titulo, preco, etc)
        }));

        // 5. Atualizamos o nosso state com os dados buscados
        setImoveis(imoveisData);

      } catch (error) {
        console.error("Erro ao buscar imóveis: ", error);
        alert("Falha ao carregar a lista de imóveis.");
      } finally {
        // 6. Independentemente de sucesso ou erro, paramos de mostrar o "carregando"
        setLoading(false);
      }
    };

    fetchImoveis(); // Executamos a função
  }, []); // O array vazio [] significa que este useEffect roda APENAS UMA VEZ

  // Se ainda estiver carregando, mostramos uma mensagem
  if (loading) {
    return <p>Carregando imóveis...</p>;
  }

  // O JSX que será renderizado
  return (
    <div>
      <h1>Vitrine de Imóveis</h1>
      <div className="lista-imoveis-container">
        {/* Se não houver imóveis, mostramos uma mensagem */}
        {imoveis.length === 0 ? (
          <p>Nenhum imóvel cadastrado ainda.</p>
        ) : (
          // Se houver imóveis, usamos o .map para criar um "card" para cada um
          imoveis.map(imovel => (
            <div key={imovel.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
              <h2>{imovel.titulo}</h2>
              <p><strong>Tipo:</strong> {imovel.tipo}</p>
              <p><strong>Cidade:</strong> {imovel.endereco.cidade}</p>
              <p><strong>Preço:</strong> R$ {Number(imovel.preco).toLocaleString('pt-BR')}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ListaImoveis;