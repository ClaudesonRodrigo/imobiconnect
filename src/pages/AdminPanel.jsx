// src/pages/AdminPanel.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebaseConfig';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { UploadCloud, X } from 'lucide-react';

const initialState = {
  titulo: '', 
  descricao: '', 
  tipo: 'casa', 
  finalidade: 'venda', 
  preco: 0, 
  status: 'disponivel',
  endereco: { rua: '', numero: '', bairro: '', cidade: '', cep: '' },
  caracteristicas: { quartos: 0, suites: 0, banheiros: 0, vagasGaragem: 0, areaTotal: 0 },
  fotos: [], 
  videoUrl: ''
};

function AdminPanel() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('meusImoveis');
  const [meusImoveis, setMeusImoveis] = useState([]);
  const [loadingImoveis, setLoadingImoveis] = useState(true);
  const [imovelData, setImovelData] = useState(initialState);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [photoFiles, setPhotoFiles] = useState(Array(5).fill(null));
  const [videoFile, setVideoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState(Array(5).fill(null));
  const [whatsapp, setWhatsapp] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.personalizacao) {
      setWhatsapp(currentUser.personalizacao.whatsapp || '');
    }
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
  }, [currentUser, forceUpdate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [objectName, fieldName] = name.split('.');
      setImovelData(prevData => ({ ...prevData, [objectName]: { ...prevData[objectName], [fieldName]: value } }));
    } else {
      setImovelData(prevData => ({ ...prevData, [name]: value }));
    }
  };

  const uploadFile = async (file) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    const resourceType = file.type.startsWith('video') ? 'video' : 'image';
    const apiUrl = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
    try {
      const response = await fetch(apiUrl, { method: 'POST', body: formData });
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Erro no upload:', error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      const photoUploadPromises = photoFiles.map(file => uploadFile(file));
      const uploadedPhotoUrls = (await Promise.all(photoUploadPromises)).filter(Boolean);
      const videoUrl = await uploadFile(videoFile);
      
      // Combina fotos existentes (se editando) com as novas
      const existingPhotos = isEditing ? imovelData.fotos.filter(url => !photoPreviews.includes(url) || uploadedPhotoUrls.includes(url)) : [];
      const finalPhotoUrls = [...existingPhotos, ...uploadedPhotoUrls].filter((value, index, self) => self.indexOf(value) === index);


      const dataToSave = {
        ...imovelData,
        preco: Number(imovelData.preco),
        fotos: finalPhotoUrls,
        videoUrl: videoUrl || imovelData.videoUrl,
        caracteristicas: {
          quartos: Number(imovelData.caracteristicas.quartos),
          suites: Number(imovelData.caracteristicas.suites),
          banheiros: Number(imovelData.caracteristicas.banheiros),
          vagasGaragem: Number(imovelData.caracteristicas.vagasGaragem),
          areaTotal: Number(imovelData.caracteristicas.areaTotal),
        },
      };

      if (isEditing) {
        const imovelDocRef = doc(db, 'imoveis', editingId);
        await updateDoc(imovelDocRef, dataToSave);
        alert("Imóvel atualizado com sucesso!");
      } else {
        await addDoc(collection(db, "imoveis"), {
          ...dataToSave,
          createdAt: serverTimestamp(),
          corretorId: currentUser.uid
        });
        alert(`Imóvel cadastrado com sucesso!`);
      }
      handleCancelEdit();
      setForceUpdate(prev => !prev);
      setActiveTab('meusImoveis');
    } catch (error) {
      console.error("Erro ao salvar imóvel: ", error);
      alert("Ocorreu um erro ao salvar o imóvel.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const newPhotoFiles = [...photoFiles];
      newPhotoFiles[index] = file;
      setPhotoFiles(newPhotoFiles);
      const newPreviews = [...photoPreviews];
      newPreviews[index] = URL.createObjectURL(file);
      setPhotoPreviews(newPreviews);
    }
  };

  const removePhoto = (index) => {
    const newPreviews = [...photoPreviews];
    const newPhotoFiles = [...photoFiles];
    
    // Limpa o preview e o arquivo daquele slot
    newPreviews[index] = null;
    newPhotoFiles[index] = null;

    // Se estiver editando, também remove a URL da foto existente do estado
    if (isEditing && imovelData.fotos && imovelData.fotos[index]) {
      const updatedPhotos = [...imovelData.fotos];
      updatedPhotos.splice(index, 1);
      setImovelData(prev => ({ ...prev, fotos: updatedPhotos }));
      // Reorganiza os previews restantes
      const finalPreviews = Array(5).fill(null);
      updatedPhotos.forEach((url, i) => {
        finalPreviews[i] = url;
      });
      setPhotoPreviews(finalPreviews);
    } else {
      setPhotoPreviews(newPreviews);
      setPhotoFiles(newPhotoFiles);
    }
  };

  const handleEdit = (imovel) => {
    setIsEditing(true);
    setEditingId(imovel.id);
    setImovelData(imovel);
    const previews = Array(5).fill(null);
    if (imovel.fotos) {
      imovel.fotos.forEach((url, index) => {
        if (index < 5) previews[index] = url;
      });
    }
    setPhotoPreviews(previews);
    setPhotoFiles(Array(5).fill(null));
    setVideoFile(null);
    setActiveTab('cadastrar');
    window.scrollTo(0, 0);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setImovelData(initialState);
    setPhotoFiles(Array(5).fill(null));
    setVideoFile(null);
    setPhotoPreviews(Array(5).fill(null));
    setActiveTab('meusImoveis');
  };

  const handleDelete = async (imovelId) => {
    if (window.confirm("Tem certeza que deseja apagar este imóvel?")) {
      try {
        await deleteDoc(doc(db, 'imoveis', imovelId));
        alert("Imóvel apagado com sucesso!");
        setForceUpdate(prev => !prev);
      } catch (error) { console.error("Erro ao apagar: ", error); alert("Erro ao apagar."); }
    }
  };

  const handlePersonalizacaoSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("Você precisa estar logado para salvar.");
    setUploadingLogo(true);
    try {
      const logoUrl = await uploadFile(logoFile);
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        personalizacao: {
          whatsapp: whatsapp,
          logoUrl: logoUrl || currentUser.personalizacao?.logoUrl || ''
        }
      }, { merge: true });
      alert("Personalização salva com sucesso!");
      setLogoFile(null);
    } catch (error) {
      console.error("Erro ao salvar personalização: ", error);
      alert("Ocorreu um erro ao salvar a personalização.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'meusImoveis':
        return (
          <section className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6">Meus Imóveis Cadastrados</h2>
            {loadingImoveis ? <p>Carregando...</p> : (
              <div className="space-y-4">
                {meusImoveis.length > 0 ? (
                  meusImoveis.map(imovel => (
                    <div key={imovel.id} className="border border-gray-200 p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <div className="mb-4 sm:mb-0">
                        <h3 className="font-bold text-lg truncate">{imovel.titulo}</h3>
                        <p className="text-gray-600">R$ {Number(imovel.preco).toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="flex-shrink-0 space-x-2">
                        <button onClick={() => handleEdit(imovel)} className="bg-blue-500 text-white text-sm py-1 px-3 rounded hover:bg-blue-600">Editar</button>
                        <button onClick={() => handleDelete(imovel.id)} className="bg-red-500 text-white text-sm py-1 px-3 rounded hover:bg-red-600">Apagar</button>
                      </div>
                    </div>
                  ))
                ) : <p className="text-center text-gray-500">Você ainda não cadastrou nenhum imóvel.</p>}
              </div>
            )}
          </section>
        );
      case 'cadastrar':
        return (
          <section className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6">{isEditing ? 'Editando Imóvel' : 'Cadastrar Novo Imóvel'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* --- INFORMAÇÕES PRINCIPAIS --- */}
              <div>
                <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">Título do Anúncio</label>
                <input type="text" name="titulo" id="titulo" value={imovelData.titulo} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea name="descricao" id="descricao" value={imovelData.descricao} onChange={handleChange} rows="4" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="preco" className="block text-sm font-medium text-gray-700">Preço (R$)</label>
                  <input type="number" name="preco" id="preco" value={imovelData.preco} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                  <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">Tipo de Imóvel</label>
                  <select id="tipo" name="tipo" value={imovelData.tipo} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    <option value="casa">Casa</option>
                    <option value="apartamento">Apartamento</option>
                    <option value="terreno">Terreno</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="finalidade" className="block text-sm font-medium text-gray-700">Finalidade</label>
                  <select id="finalidade" name="finalidade" value={imovelData.finalidade} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    <option value="venda">Venda</option>
                    <option value="aluguel">Aluguel</option>
                  </select>
                </div>
              </div>

              {/* --- ENDEREÇO --- */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rua</label>
                    <input type="text" name="endereco.rua" value={imovelData.endereco.rua} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Número</label>
                    <input type="text" name="endereco.numero" value={imovelData.endereco.numero} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bairro</label>
                    <input type="text" name="endereco.bairro" value={imovelData.endereco.bairro} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cidade</label>
                    <input type="text" name="endereco.cidade" value={imovelData.endereco.cidade} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CEP</label>
                    <input type="text" name="endereco.cep" value={imovelData.endereco.cep} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                  </div>
                </div>
              </div>

              {/* --- CARACTERÍSTICAS --- */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Características</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quartos</label>
                    <input type="number" name="caracteristicas.quartos" value={imovelData.caracteristicas.quartos} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Suítes</label>
                    <input type="number" name="caracteristicas.suites" value={imovelData.caracteristicas.suites} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Banheiros</label>
                    <input type="number" name="caracteristicas.banheiros" value={imovelData.caracteristicas.banheiros} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vagas</label>
                    <input type="number" name="caracteristicas.vagasGaragem" value={imovelData.caracteristicas.vagasGaragem} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Área (m²)</label>
                    <input type="number" name="caracteristicas.areaTotal" value={imovelData.caracteristicas.areaTotal} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                  </div>
                </div>
              </div>

              {/* --- MÍDIA (FOTOS E VÍDEO) --- */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Fotos e Vídeo</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fotos (até 5)</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400">
                        <input type="file" accept="image/*" onChange={(e) => handlePhotoChange(e, index)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isUploading} />
                        {preview ? (
                          <>
                            <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                            <button type="button" onClick={() => removePhoto(index)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 leading-none hover:bg-red-700">
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <div className="text-center">
                            <UploadCloud size={24} />
                            <p className="text-xs mt-1">Foto {index + 1}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="video" className="block text-sm font-medium text-gray-700">Vídeo do Imóvel</label>
                  <input id="video" type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files[0])} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" disabled={isUploading} />
                  {isEditing && imovelData.videoUrl && !videoFile && (
                    <a href={imovelData.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 mt-2 hover:underline">Ver vídeo atual. Envie um novo para substituí-lo.</a>
                  )}
                </div>
              </div>

              {/* --- BOTÕES DE AÇÃO --- */}
              <div className="flex items-center space-x-4 pt-6">
                <button type="submit" disabled={isUploading} className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400">
                  {isUploading ? 'Salvando...' : (isEditing ? 'Atualizar Imóvel' : 'Cadastrar Imóvel')}
                </button>
                {isEditing && (
                  <button type="button" onClick={handleCancelEdit} className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600">Cancelar Edição</button>
                )}
              </div>
            </form>
          </section>
        );
        case 'personalizacao':
            return (
              <section className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-6">Personalização da sua Página</h2>
                {currentUser && (
                  <div className="mb-8 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                    <p className="font-bold text-blue-800">Sua Vitrine Pessoal está pronta!</p>
                    <Link to={`/corretor/${currentUser.uid}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                      https://imobiconnect.netlify.app/corretor/{currentUser.uid}
                    </Link>
                  </div>
                )}
                <form onSubmit={handlePersonalizacaoSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">Número do WhatsApp</label>
                      <input id="whatsapp" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="5579999998888" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                    </div>
                    <div>
                      <label htmlFor="logo" className="block text-sm font-medium text-gray-700">{currentUser?.personalizacao?.logoUrl ? 'Alterar Logo' : 'Enviar Logo'}</label>
                      {currentUser?.personalizacao?.logoUrl && (<img src={currentUser.personalizacao.logoUrl} alt="Sua logo atual" className="w-24 h-24 rounded-full object-cover my-2"/>)}
                      <input id="logo" type="file" accept="image/png, image/jpeg" onChange={(e) => setLogoFile(e.target.files[0])} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                    </div>
                  <button type="submit" disabled={uploadingLogo} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400">
                    {uploadingLogo ? 'Salvando...' : 'Salvar Personalização'}
                  </button>
                </form>
              </section>
            );
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
            <button onClick={() => setActiveTab('meusImoveis')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${ activeTab === 'meusImoveis' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              Meus Imóveis
            </button>
            <button onClick={() => { handleCancelEdit(); setActiveTab('cadastrar'); }} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${ activeTab === 'cadastrar' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              Cadastrar Imóvel
            </button>
            <button onClick={() => setActiveTab('personalizacao')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${ activeTab === 'personalizacao' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
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