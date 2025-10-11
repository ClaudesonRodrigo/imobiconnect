// src/pages/CadastroImovel.jsx

import { useState, useEffect } from 'react';
import { db } from '../services/firebaseConfig';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const initialState = {
  titulo: '', descricao: '', tipo: 'casa', finalidade: 'venda', preco: 0, status: 'disponivel',
  endereco: { rua: '', numero: '', bairro: '', cidade: '', cep: '' },
  caracteristicas: { quartos: 0, suites: 0, banheiros: 0, vagasGaragem: 0, areaTotal: 0 },
  comodidades: [], fotos: []
};

function CadastroImovel() {
  const { currentUser } = useAuth();
  
  const [imovelData, setImovelData] = useState(initialState);
  const [meusImoveis, setMeusImoveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // A variável que faltava e causou a tela branca.
  const [formSuccess, setFormSuccess] = useState(false); 

  useEffect(() => {
    const fetchMeusImoveis = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const imoveisCollectionRef = collection(db, 'imoveis');
        const q = query(imoveisCollectionRef, where("corretorId", "==", currentUser.uid), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const imoveisList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMeusImoveis(imoveisList);
      } catch (err) {
        console.error("Erro ao buscar meus imóveis:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeusImoveis();
  }, [currentUser, formSuccess]);

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
    if (!currentUser) {
      alert("Você precisa estar logado.");
      return;
    }
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
        setFormSuccess(!formSuccess);
      } catch (error) {
        console.error("Erro ao atualizar imóvel: ", error);
        alert("Ocorreu um erro ao atualizar.");
      }
    } else {
      try {
        await addDoc(collection(db, "imoveis"), {
          ...dataToSave,
          createdAt: serverTimestamp(),
          corretorId: currentUser.uid 
        });
        alert(`Imóvel cadastrado com sucesso!`);
        setImovelData(initialState);
        setFormSuccess(!formSuccess);
      } catch (error) {
        console.error("Erro ao cadastrar imóvel: ", error);
        alert("Ocorreu um erro ao cadastrar.");
      }
    }
  };

  const handleEdit = (imovel) => {
    setIsEditing(true);
    setEditingId(imovel.id);
    setImovelData(imovel);
    window.scrollTo(0, 0);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setImovelData(initialState);
  };

  const handleDelete = async (imovelId) => {
    if (window.confirm("Tem certeza que deseja apagar este imóvel?")) {
      try {
        await deleteDoc(doc(db, 'imoveis', imovelId));
        alert("Imóvel apagado com sucesso!");
        setFormSuccess(!formSuccess);
      } catch (error) {
        console.error("Erro ao apagar imóvel: ", error);
        alert("Ocorreu um erro ao apagar.");
      }
    }
  };

  return (
    <div>
      <section>
        <h1>Painel do Corretor</h1>
        <h2>{isEditing ? 'Editando Imóvel' : 'Cadastrar Novo Imóvel'}</h2>
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
            <button type="submit">{isEditing ? 'Atualizar Imóvel' : 'Cadastrar Imóvel'}</button>
            {isEditing && (
                <button type="button" onClick={handleCancelEdit} style={{ marginLeft: '10px', backgroundColor: 'gray' }}>
                Cancelar Edição
                </button>
            )}
        </form>
      </section>

      <hr style={{ margin: '40px 0' }} />

      <section>
        <h2>Meus Imóveis Cadastrados</h2>
        {loading ? <p>Carregando...</p> : (
          <div>
            {meusImoveis.length === 0 ? <p>Você ainda não cadastrou nenhum imóvel.</p> : meusImoveis.map(imovel => (
              <div key={imovel.id} style={{ border: '1px solid #555', padding: '10px', marginBottom: '10px', textAlign: 'left' }}>
                <h3>{imovel.titulo}</h3>
                <p><strong>Preço:</strong> R$ {Number(imovel.preco).toLocaleString('pt-BR')}</p>
                <div>
                  <button onClick={() => handleEdit(imovel)} style={{ backgroundColor: 'darkblue', color: 'white', marginRight: '10px' }}>
                    Editar
                  </button>
                  <button onClick={() => handleDelete(imovel.id)} style={{ backgroundColor: 'darkred', color: 'white' }}>
                    Apagar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default CadastroImovel;