// src/pages/CadastroImovel.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  const [formSuccess, setFormSuccess] = useState(false); 

  const [whatsapp, setWhatsapp] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.personalizacao) {
      setWhatsapp(currentUser.personalizacao.whatsapp || '');
    }
    
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

  const handlePersonalizacaoSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Você precisa estar logado para salvar.");
      return;
    }
    setUploading(true);

    try {
      let logoUrl = currentUser.personalizacao?.logoUrl || '';

      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const data = await response.json();
        if (data.secure_url) {
          logoUrl = data.secure_url;
        } else {
          throw new Error('Falha no upload para o Cloudinary.');
        }
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        personalizacao: {
          whatsapp: whatsapp,
          logoUrl: logoUrl
        }
      }, { merge: true });

      alert("Personalização salva com sucesso! Pode ser necessário recarregar a página para que as alterações tenham efeito no seu perfil.");
      setLogoFile(null);

    } catch (error) {
      console.error("Erro ao salvar personalização: ", error);
      alert("Ocorreu um erro ao salvar a personalização.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1>Painel do Corretor</h1>

      {currentUser && (
        <div style={{ margin: '20px 0', padding: '10px', border: '1px solid green', backgroundColor: '#f0fff0' }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>Link da sua Vitrine Pessoal:</p>
          <Link to={`/corretor/${currentUser.uid}`} target="_blank" rel="noopener noreferrer">
            https://imobiconnect.netlify.app/corretor/{currentUser.uid}
          </Link>
        </div>
      )}

      <section style={{ margin: '40px 0' }}>
        <h2>Personalização da sua Página</h2>

        {/* ===== CÓDIGO PARA EXIBIR A LOGO NO PAINEL ===== */}
        {currentUser?.personalizacao?.logoUrl && (
            <div style={{ marginBottom: '20px' }}>
                <p>Sua logo atual:</p>
                <img 
                    src={currentUser.personalizacao.logoUrl} 
                    alt="Sua logo atual"
                    style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }}
                />
            </div>
        )}
        {/* ================================================= */}

        <form onSubmit={handlePersonalizacaoSubmit}>
          <fieldset>
            <legend>Suas Informações Públicas</legend>
            <label>Número do WhatsApp (com código do país, ex: 5579...):
              <input 
                type="tel" 
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="5579999998888"
              />
            </label>
            <br/><br/>
            <label>Alterar Logo (imagem):
              <input 
                type="file" 
                accept="image/png, image/jpeg"
                onChange={(e) => setLogoFile(e.target.files[0])}
              />
            </label>
          </fieldset>
          <button type="submit" disabled={uploading}>
            {uploading ? 'Salvando...' : 'Salvar Personalização'}
          </button>
        </form>
      </section>

      <hr style={{ margin: '40px 0' }} />

      <section>
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