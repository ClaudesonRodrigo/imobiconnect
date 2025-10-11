// src/pages/CadastroImovel.jsx

import { useState, useEffect } from 'react'; // Adicionado useEffect
import { db } from '../services/firebaseConfig';
// Adicionadas as funções para fazer a query (consulta)
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function CadastroImovel() {
  const { currentUser } = useAuth();
  
  const [imovelData, setImovelData] = useState({
    titulo: '',
    descricao: '',
    tipo: 'casa',
    finalidade: 'venda',
    preco: 0,
    status: 'disponivel',
    endereco: { rua: '', numero: '', bairro: '', cidade: '', cep: '' },
    caracteristicas: { quartos: 0, suites: 0, banheiros: 0, vagasGaragem: 0, areaTotal: 0 },
    comodidades: [],
    fotos: []
  });

  // States para a lista de imóveis pessoais
  const [meusImoveis, setMeusImoveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formSuccess, setFormSuccess] = useState(false); // State para saber quando recarregar a lista

  // useEffect para buscar os imóveis do corretor logado
  useEffect(() => {
    const fetchMeusImoveis = async () => {
      if (!currentUser) return; // Se não houver usuário, não faz nada

      setLoading(true); // Começa a carregar
      try {
        const imoveisCollectionRef = collection(db, 'imoveis');
        // A QUERY MÁGICA: busca imóveis onde o corretorId é igual ao UID do usuário logado
        const q = query(
          imoveisCollectionRef, 
          where("corretorId", "==", currentUser.uid),
          orderBy("createdAt", "desc") // Opcional: ordena pelos mais recentes
        );

        const querySnapshot = await getDocs(q);
        const imoveisList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setMeusImoveis(imoveisList);
      } catch (err) {
        console.error("Erro ao buscar meus imóveis:", err);
      } finally {
        setLoading(false); // Termina de carregar
      }
    };

    fetchMeusImoveis();
  }, [currentUser, formSuccess]); // Roda quando o usuário muda OU quando um novo imóvel é cadastrado

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [objectName, fieldName] = name.split('.');
      setImovelData(prevData => ({
        ...prevData,
        [objectName]: {
          ...prevData[objectName],
          [fieldName]: value
        }
      }));
    } else {
      setImovelData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Você precisa estar logado para cadastrar um imóvel.");
      return;
    }
    try {
      await addDoc(collection(db, "imoveis"), {
        ...imovelData,
        preco: Number(imovelData.preco),
        caracteristicas: {
          quartos: Number(imovelData.caracteristicas.quartos),
          suites: Number(imovelData.caracteristicas.suites),
          banheiros: Number(imovelData.caracteristicas.banheiros),
          vagasGaragem: Number(imovelData.caracteristicas.vagasGaragem),
          areaTotal: Number(imovelData.caracteristicas.areaTotal),
        },
        createdAt: serverTimestamp(),
        corretorId: currentUser.uid 
      });
      alert(`Imóvel cadastrado com sucesso!`);
      setImovelData({
        titulo: '', descricao: '', tipo: 'casa', finalidade: 'venda', preco: 0, status: 'disponivel',
        endereco: { rua: '', numero: '', bairro: '', cidade: '', cep: '' },
        caracteristicas: { quartos: 0, suites: 0, banheiros: 0, vagasGaragem: 0, areaTotal: 0 },
        comodidades: [], fotos: []
      });
      setFormSuccess(!formSuccess); // "Avisa" o useEffect para recarregar a lista
    } catch (error) {
      console.error("Erro ao cadastrar imóvel: ", error);
      alert("Ocorreu um erro ao cadastrar o imóvel. Verifique o console.");
    }
  };

  return (
    <div>
      <section>
        <h1>Painel do Corretor</h1>
        <h2>Cadastrar Novo Imóvel</h2>
        <form onSubmit={handleSubmit}>
            <fieldset>
                <legend>Informações Principais</legend>
                <label>Título: <input type="text" name="titulo" value={imovelData.titulo} onChange={handleChange} required /></label><br/>
                <label>Descrição: <textarea name="descricao" value={imovelData.descricao} onChange={handleChange}></textarea></label><br/>
                <label>Preço (R$): <input type="number" name="preco" value={imovelData.preco} onChange={handleChange} /></label><br/>
                <label>Tipo: 
                    <select name="tipo" value={imovelData.tipo} onChange={handleChange}>
                    <option value="casa">Casa</option>
                    <option value="apartamento">Apartamento</option>
                    <option value="terreno">Terreno</option>
                    </select>
                </label><br/>
                <label>Finalidade: 
                    <select name="finalidade" value={imovelData.finalidade} onChange={handleChange}>
                    <option value="venda">Venda</option>
                    <option value="aluguel">Aluguel</option>
                    </select>
                </label><br/>
            </fieldset>
            <fieldset>
                <legend>Endereço</legend>
                <label>Rua: <input type="text" name="endereco.rua" value={imovelData.endereco.rua} onChange={handleChange} /></label><br/>
                <label>Número: <input type="text" name="endereco.numero" value={imovelData.endereco.numero} onChange={handleChange} /></label><br/>
                <label>Bairro: <input type="text" name="endereco.bairro" value={imovelData.endereco.bairro} onChange={handleChange} /></label><br/>
                <label>Cidade: <input type="text" name="endereco.cidade" value={imovelData.endereco.cidade} onChange={handleChange} /></label><br/>
                <label>CEP: <input type="text" name="endereco.cep" value={imovelData.endereco.cep} onChange={handleChange} /></label><br/>
            </fieldset>
            <fieldset>
                <legend>Características</legend>
                <label>Quartos: <input type="number" name="caracteristicas.quartos" value={imovelData.caracteristicas.quartos} onChange={handleChange} /></label><br/>
                <label>Suítes: <input type="number" name="caracteristicas.suites" value={imovelData.caracteristicas.suites} onChange={handleChange} /></label><br/>
                <label>Banheiros: <input type="number" name="caracteristicas.banheiros" value={imovelData.caracteristicas.banheiros} onChange={handleChange} /></label><br/>
                <label>Vagas de Garagem: <input type="number" name="caracteristicas.vagasGaragem" value={imovelData.caracteristicas.vagasGaragem} onChange={handleChange} /></label><br/>
                <label>Área Total (m²): <input type="number" name="caracteristicas.areaTotal" value={imovelData.caracteristicas.areaTotal} onChange={handleChange} /></label><br/>
            </fieldset>
            <button type="submit">Cadastrar Imóvel</button>
        </form>
      </section>

      <hr style={{ margin: '40px 0' }} />

      <section>
        <h2>Meus Imóveis Cadastrados</h2>
        {loading ? (
          <p>Carregando seus imóveis...</p>
        ) : (
          <div>
            {meusImoveis.length > 0 ? (
              meusImoveis.map(imovel => (
                <div key={imovel.id} style={{ border: '1px solid #555', padding: '10px', marginBottom: '10px', textAlign: 'left' }}>
                  <h3>{imovel.titulo}</h3>
                  <p><strong>Cidade:</strong> {imovel.endereco.cidade}</p>
                  <p><strong>Preço:</strong> R$ {Number(imovel.preco).toLocaleString('pt-BR')}</p>
                </div>
              ))
            ) : (
              <p>Você ainda não cadastrou nenhum imóvel.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default CadastroImovel;