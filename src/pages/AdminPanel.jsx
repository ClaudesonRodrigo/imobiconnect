// src/pages/AdminPanel.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebaseConfig';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { UploadCloud, X, ShieldAlert, Briefcase, PlusCircle, MoreVertical, MessageSquare, CalendarPlus } from 'lucide-react';
import NovaTransacaoModal from '../components/NovaTransacaoModal';
import InteractionModal from '../components/InteractionModal';

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

const KANBAN_COLUMNS = [
  { id: 'Novas', title: 'Novas', color: 'bg-blue-500' },
  { id: 'Em Andamento', title: 'Em Andamento', color: 'bg-yellow-500' },
  { id: 'Concluídas', title: 'Concluídas', color: 'bg-green-500' },
  { id: 'Canceladas', title: 'Canceladas', color: 'bg-red-500' },
];

function AdminPanel() {
  const { currentUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('transacoes');
  const [meusImoveis, setMeusImoveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imovelData, setImovelData] = useState(initialState);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [photoFiles, setPhotoFiles] = useState(Array(5).fill(null));
  const [videoFile, setVideoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState(Array(5).fill(null));
  
  // --- NOVOS ESTADOS PARA PERSONALIZAÇÃO ---
  const [whatsapp, setWhatsapp] = useState('');
  const [telefone, setTelefone] = useState('');
  const [creci, setCreci] = useState('');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  // --- FIM DOS NOVOS ESTADOS ---

  const [transacoes, setTransacoes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    // ATUALIZAÇÃO: Carregar todos os dados de personalização
    if (currentUser.personalizacao) {
      const { personalizacao } = currentUser;
      setWhatsapp(personalizacao.whatsapp || '');
      setTelefone(personalizacao.telefone || '');
      setCreci(personalizacao.creci || '');
      setBio(personalizacao.bio || '');
      setInstagram(personalizacao.social?.instagram || '');
      setFacebook(personalizacao.social?.facebook || '');
    }
    const fetchData = async () => {
      try {
        const imoveisQuery = query(collection(db, 'imoveis'), where("corretorId", "==", currentUser.uid), orderBy("createdAt", "desc"));
        const imoveisSnapshot = await getDocs(imoveisQuery);
        setMeusImoveis(imoveisSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const transacoesQuery = query(collection(db, 'transacoes'), where("corretorId", "==", currentUser.uid), orderBy("createdAt", "desc"));
        const transacoesSnapshot = await getDocs(transacoesQuery);
        setTransacoes(transacoesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Erro ao buscar dados do painel:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser, forceUpdate]);

  const handleSupportAccess = async (approved) => {
    if (!currentUser) return;
    const corretorDocRef = doc(db, 'users', currentUser.uid);
    try {
      await updateDoc(corretorDocRef, { "suporte.aprovado": approved, "suporte.solicitado": false });
      alert(approved ? "Acesso de suporte aprovado." : "Solicitação de acesso negada.");
      window.location.reload();
    } catch (err) { alert("Erro ao processar sua resposta."); }
  };
  
  const handleSaveTransaction = async (transacaoData) => {
    if (!currentUser) return alert("Você precisa estar logado.");
    try {
      await addDoc(collection(db, 'transacoes'), {
        ...transacaoData,
        corretorId: currentUser.uid,
        createdAt: serverTimestamp(),
      });
      alert("Nova transação iniciada com sucesso!");
      setIsModalOpen(false);
      setForceUpdate(prev => !prev);
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      alert("Ocorreu um erro ao iniciar a transação.");
    }
  };

  const handleUpdateTransactionStatus = async (transacaoId, newStatus) => {
    try {
      const transacaoDocRef = doc(db, 'transacoes', transacaoId);
      await updateDoc(transacaoDocRef, { status: newStatus });
      setForceUpdate(prev => !prev);
    } catch (error) {
      console.error("Erro ao atualizar status da transação:", error);
      alert("Falha ao mover a transação.");
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [objectName, fieldName] = name.split('.');
      setImovelData(prev => ({ ...prev, [objectName]: { ...prev[objectName], [fieldName]: value } }));
    } else {
      setImovelData(prev => ({ ...prev, [name]: value }));
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
        await updateDoc(doc(db, 'imoveis', editingId), dataToSave);
        alert("Imóvel atualizado!");
      } else {
        await addDoc(collection(db, "imoveis"), { ...dataToSave, createdAt: serverTimestamp(), corretorId: currentUser.uid });
        alert(`Imóvel cadastrado!`);
      }
      handleCancelEdit();
      setForceUpdate(prev => !prev);
      setActiveTab('meusImoveis');
    } catch (error) {
      console.error("Erro ao salvar imóvel: ", error);
      alert("Ocorreu um erro.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const newFiles = [...photoFiles];
      newFiles[index] = file;
      setPhotoFiles(newFiles);
      const newPreviews = [...photoPreviews];
      newPreviews[index] = URL.createObjectURL(file);
      setPhotoPreviews(newPreviews);
    }
  };

  const removePhoto = (index) => {
    const newPreviews = [...photoPreviews];
    const newFiles = [...photoFiles];
    newPreviews[index] = null;
    newFiles[index] = null;
    if (isEditing && imovelData.fotos && imovelData.fotos[index]) {
      const updatedPhotos = imovelData.fotos.filter((_, i) => i !== index);
      setImovelData(prev => ({ ...prev, fotos: updatedPhotos }));
      const finalPreviews = Array(5).fill(null);
      updatedPhotos.forEach((url, i) => { finalPreviews[i] = url; });
      setPhotoPreviews(finalPreviews);
    } else {
      setPhotoPreviews(newPreviews);
      setPhotoFiles(newFiles);
    }
  };

  const handleEdit = (imovel) => {
    setIsEditing(true);
    setEditingId(imovel.id);
    setImovelData(imovel);
    const previews = Array(5).fill(null);
    if (imovel.fotos) {
      imovel.fotos.forEach((url, i) => { if (i < 5) previews[i] = url; });
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
        alert("Imóvel apagado!");
        setForceUpdate(prev => !prev);
      } catch (err) { alert("Erro ao apagar."); }
    }
  };

  // ATUALIZAÇÃO: Salvar todos os novos campos no banco
  const handlePersonalizacaoSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setUploadingLogo(true);
    try {
      const logoUrl = await uploadFile(logoFile);
      const personalizacaoData = {
        whatsapp: whatsapp,
        logoUrl: logoUrl || currentUser.personalizacao?.logoUrl || '',
        telefone: telefone,
        creci: creci,
        bio: bio,
        social: {
          instagram: instagram,
          facebook: facebook,
        }
      };
      await updateDoc(doc(db, 'users', currentUser.uid), {
        personalizacao: personalizacaoData
      }, { merge: true });
      alert("Personalização salva!");
      setLogoFile(null);
    } catch (err) {
      console.error("Erro ao salvar personalização:", err);
      alert("Erro ao salvar.");
    } finally {
      setUploadingLogo(false);
    }
  };
  
  const handleSaveInteraction = async (interactionData) => {
    try {
        const interactionCollectionRef = collection(db, 'transacoes', interactionData.clienteId, 'interactions');
        await addDoc(interactionCollectionRef, {
            tipo: interactionData.tipo,
            notas: interactionData.notas,
            createdAt: serverTimestamp(),
        });
        alert("Interação registrada com sucesso!");
        setIsInteractionModalOpen(false);
        setSelectedClient(null);
    } catch (error) {
        console.error("Erro ao registrar interação:", error);
        alert("Falha ao registrar interação.");
    }
  };

  const openInteractionModal = (client) => {
    setSelectedClient(client);
    setIsInteractionModalOpen(true);
  };

  const closeInteractionModal = () => {
    setIsInteractionModalOpen(false);
    setSelectedClient(null);
  }
  
  const generateGoogleCalendarLink = (cliente) => {
    const imovel = meusImoveis.find(i => i.id === cliente.imovelId);
    if (!imovel) return '#';

    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 1); 
    const endTime = new Date(startTime.getTime() + (60 * 60 * 1000)); 

    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d+/g, '');

    const url = new URL('https://www.google.com/calendar/render?action=TEMPLATE');
    url.searchParams.append('text', `Visita: ${cliente.imovelTitulo}`);
    url.searchParams.append('dates', `${formatDate(startTime)}/${formatDate(endTime)}`);
    url.searchParams.append('details', `Visita agendada com o cliente ${cliente.nomeCliente} para o imóvel "${cliente.imovelTitulo}".`);
    url.searchParams.append('location', `${imovel.endereco.rua}, ${imovel.endereco.numero} - ${imovel.endereco.bairro}, ${imovel.endereco.cidade}`);

    return url.href;
  };

  const TransactionCard = ({ transacao }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-start">
          <Link to={`/transacao/${transacao.id}`} className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 truncate">{transacao.nomeCliente}</p>
            <p className="text-sm text-gray-500 truncate">{transacao.imovelTitulo}</p>
          </Link>
          <div className="relative flex-shrink-0 ml-2">
            <button onClick={() => setMenuOpen(!menuOpen)} onBlur={() => setTimeout(() => setMenuOpen(false), 150)} className="text-gray-400 hover:text-gray-600">
              <MoreVertical size={20} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                <div className="py-1">
                  <Link to={`/transacao/${transacao.id}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Ver Detalhes</Link>
                  <p className="px-4 pt-2 pb-1 text-xs text-gray-500">Mover para:</p>
                  {KANBAN_COLUMNS.filter(col => col.id !== transacao.status).map(col => (
                     <button key={col.id} onClick={() => { handleUpdateTransactionStatus(transacao.id, col.id); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                       {col.title}
                     </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'transacoes':
        return (
          <section className="bg-gray-50 p-4 -m-4 rounded-lg">
            <div className="flex justify-between items-center mb-6 px-4">
              <h2 className="text-2xl font-semibold text-gray-800">Painel de Transações (Kanban)</h2>
              <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">
                <PlusCircle size={20} className="mr-2"/>
                Iniciar Transação
              </button>
            </div>
            {loading ? <p>Carregando transações...</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {KANBAN_COLUMNS.map(column => (
                  <div key={column.id} className="bg-gray-100 rounded-lg">
                    <h3 className={`font-semibold text-white p-3 rounded-t-lg ${column.color}`}>{column.title}</h3>
                    <div className="p-4 space-y-4">
                      {transacoes.filter(t => t.status === column.id).map(transacao => (
                          <TransactionCard key={transacao.id} transacao={transacao} />
                      ))}
                      {transacoes.filter(t => t.status === column.id).length === 0 && (
                        <div className="text-center text-xs text-gray-400 py-4">
                          Nenhuma transação aqui.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );

      case 'meusImoveis':
        return (
          <section className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6">Meus Imóveis Cadastrados</h2>
            {loading ? <p>Carregando...</p> : (
              <div className="space-y-4">
                {meusImoveis.length > 0 ? (
                  meusImoveis.map(imovel => (
                    <div key={imovel.id} className="border border-gray-200 p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                        <img src={imovel.fotos?.[0] || 'https://placehold.co/100x100'} alt={imovel.titulo} className="w-16 h-16 object-cover rounded-md bg-gray-200"/>
                        <div>
                          <h3 className="font-bold text-lg truncate">{imovel.titulo}</h3>
                          <p className="text-gray-600">R$ {Number(imovel.preco).toLocaleString('pt-BR')}</p>
                        </div>
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
              <div><label htmlFor="titulo" className="block text-sm font-medium text-gray-700">Título do Anúncio</label><input type="text" name="titulo" id="titulo" value={imovelData.titulo} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" /></div>
              <div><label htmlFor="descricao" className="block text-sm font-medium text-gray-700">Descrição</label><textarea name="descricao" id="descricao" value={imovelData.descricao} onChange={handleChange} rows="4" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div><label htmlFor="preco" className="block text-sm font-medium text-gray-700">Preço (R$)</label><input type="number" name="preco" id="preco" value={imovelData.preco} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
                <div><label htmlFor="tipo" className="block text-sm font-medium text-gray-700">Tipo de Imóvel</label><select id="tipo" name="tipo" value={imovelData.tipo} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"><option value="casa">Casa</option><option value="apartamento">Apartamento</option><option value="terreno">Terreno</option></select></div>
                <div><label htmlFor="finalidade" className="block text-sm font-medium text-gray-700">Finalidade</label><select id="finalidade" name="finalidade" value={imovelData.finalidade} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"><option value="venda">Venda</option><option value="aluguel">Aluguel</option></select></div>
              </div>
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-medium text-gray-700">Rua</label><input type="text" name="endereco.rua" value={imovelData.endereco.rua} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/></div>
                  <div><label className="block text-sm font-medium text-gray-700">Número</label><input type="text" name="endereco.numero" value={imovelData.endereco.numero} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/></div>
                  <div><label className="block text-sm font-medium text-gray-700">Bairro</label><input type="text" name="endereco.bairro" value={imovelData.endereco.bairro} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/></div>
                  <div><label className="block text-sm font-medium text-gray-700">Cidade</label><input type="text" name="endereco.cidade" value={imovelData.endereco.cidade} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/></div>
                  <div><label className="block text-sm font-medium text-gray-700">CEP</label><input type="text" name="endereco.cep" value={imovelData.endereco.cep} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/></div>
                </div>
              </div>
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Características</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <div><label className="block text-sm font-medium text-gray-700">Quartos</label><input type="number" name="caracteristicas.quartos" value={imovelData.caracteristicas.quartos} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/></div>
                  <div><label className="block text-sm font-medium text-gray-700">Suítes</label><input type="number" name="caracteristicas.suites" value={imovelData.caracteristicas.suites} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/></div>
                  <div><label className="block text-sm font-medium text-gray-700">Banheiros</label><input type="number" name="caracteristicas.banheiros" value={imovelData.caracteristicas.banheiros} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/></div>
                  <div><label className="block text-sm font-medium text-gray-700">Vagas</label><input type="number" name="caracteristicas.vagasGaragem" value={imovelData.caracteristicas.vagasGaragem} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/></div>
                  <div><label className="block text-sm font-medium text-gray-700">Área (m²)</label><input type="number" name="caracteristicas.areaTotal" value={imovelData.caracteristicas.areaTotal} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/></div>
                </div>
              </div>
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
                            <button type="button" onClick={() => removePhoto(index)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 leading-none hover:bg-red-700"><X size={14} /></button>
                          </>
                        ) : (
                          <div className="text-center"><UploadCloud size={24} /><p className="text-xs mt-1">Foto {index + 1}</p></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="video" className="block text-sm font-medium text-gray-700">Vídeo do Imóvel</label>
                  <input id="video" type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files[0])} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" disabled={isUploading} />
                  {isEditing && imovelData.videoUrl && !videoFile && (<a href={imovelData.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 mt-2 hover:underline">Ver vídeo atual.</a>)}
                </div>
              </div>
              <div className="flex items-center space-x-4 pt-6">
                <button type="submit" disabled={isUploading} className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400">{isUploading ? 'Salvando...' : (isEditing ? 'Atualizar Imóvel' : 'Cadastrar Imóvel')}</button>
                {isEditing && (<button type="button" onClick={handleCancelEdit} className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600">Cancelar Edição</button>)}
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
            <form onSubmit={handlePersonalizacaoSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="creci" className="block text-sm font-medium text-gray-700">Seu CRECI</label>
                  <input id="creci" type="text" value={creci} onChange={(e) => setCreci(e.target.value)} placeholder="Ex: 12345-F" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                  <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">Telefone para Contato (Ligar)</label>
                  <input id="telefone" type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="5579999998888" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
              </div>
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio / Sobre Mim</label>
                <textarea id="bio" rows="3" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Fale um pouco sobre sua experiência e especialidade." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="instagram" className="block text-sm font-medium text-gray-700">Link do Instagram</label>
                  <input id="instagram" type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/seu-usuario" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                  <label htmlFor="facebook" className="block text-sm font-medium text-gray-700">Link do Facebook</label>
                  <input id="facebook" type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/seu-usuario" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">WhatsApp (para o botão)</label>
                    <input id="whatsapp" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="5579999998888" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                  <label htmlFor="logo" className="block text-sm font-medium text-gray-700">{currentUser?.personalizacao?.logoUrl ? 'Alterar Logo' : 'Enviar Logo'}</label>
                  {currentUser?.personalizacao?.logoUrl && (<img src={currentUser.personalizacao.logoUrl} alt="Sua logo atual" className="w-24 h-24 rounded-full object-cover my-2"/>)}
                  <input id="logo" type="file" accept="image/png, image/jpeg" onChange={(e) => setLogoFile(e.target.files[0])} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                </div>
              </div>
              <button type="submit" disabled={uploadingLogo} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400">
                {uploadingLogo ? 'Salvando...' : 'Salvar Personalização'}
              </button>
            </form>
          </section>
        );
        
      case 'clientes':
        return (
          <section className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6">Meus Clientes</h2>
            {loading ? <p>Carregando...</p> : (
              <div className="space-y-4">
                {transacoes.length > 0 ? (
                  transacoes.map(cliente => (
                    <div key={cliente.id} className="border border-gray-200 p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{cliente.nomeCliente}</h3>
                        <p className="text-gray-600 text-sm">{cliente.imovelTitulo}</p>
                      </div>
                      <div className="flex-shrink-0 flex items-center space-x-2 mt-4 sm:mt-0">
                        <a href={`https://wa.me/${whatsapp}?text=Olá ${cliente.nomeCliente}, sobre o imóvel ${cliente.imovelTitulo}...`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-green-500 text-white text-sm py-2 px-3 rounded-md hover:bg-green-600">
                          <MessageSquare size={16} className="mr-2"/> WhatsApp
                        </a>
                        <button onClick={() => openInteractionModal(cliente)} className="inline-flex items-center bg-gray-200 text-gray-700 text-sm py-2 px-3 rounded-md hover:bg-gray-300">
                          Registrar
                        </button>
                        <a href={generateGoogleCalendarLink(cliente)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-blue-500 text-white text-sm py-2 px-3 rounded-md hover:bg-blue-600">
                           <CalendarPlus size={16} className="mr-2"/> Agendar
                        </a>
                      </div>
                    </div>
                  ))
                ) : <p className="text-center text-gray-500">Nenhum cliente em transações ativas.</p>}
              </div>
            )}
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
        
        {!authLoading && currentUser?.suporte?.solicitado && (
          <div className="mb-8 p-4 border-l-4 border-yellow-400 bg-yellow-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <ShieldAlert className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">O administrador solicitou acesso temporário à sua conta para fins de suporte.</p>
                <div className="mt-4 space-x-4">
                  <button onClick={() => handleSupportAccess(true)} className="bg-green-500 text-white text-sm font-medium py-1 px-3 rounded-md hover:bg-green-600">Aprovar Acesso</button>
                  <button onClick={() => handleSupportAccess(false)} className="bg-red-500 text-white text-sm font-medium py-1 px-3 rounded-md hover:bg-red-600">Negar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6 overflow-x-auto">
            <button onClick={() => setActiveTab('transacoes')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${ activeTab === 'transacoes' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              Transações
            </button>
            <button onClick={() => setActiveTab('clientes')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${ activeTab === 'clientes' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              Clientes
            </button>
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
      <NovaTransacaoModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        meusImoveis={meusImoveis}
      />
      
      <InteractionModal
        isOpen={isInteractionModalOpen}
        onClose={closeInteractionModal}
        onSave={handleSaveInteraction}
        client={selectedClient}
      />

    </div>
  );
}

export default AdminPanel;