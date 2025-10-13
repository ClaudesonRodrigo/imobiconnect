// src/pages/DetalheTransacao.jsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../services/firebaseConfig';
// CORREÇÃO AQUI: Adicionado 'query', 'collection', 'orderBy', 'addDoc', 'serverTimestamp' e 'getDocs'
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, getDocs, orderBy, query, deleteDoc } from 'firebase/firestore';
import { CheckCircle2, Circle, Loader, UploadCloud, FileText, Trash2 } from 'lucide-react';

function DetalheTransacao() {
  const { transacaoId } = useParams();
  const [transacao, setTransacao] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [arquivo, setArquivo] = useState(null);
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    const resourceType = file.type.startsWith('video') ? 'video' : (file.type.startsWith('image') ? 'image' : 'raw');
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

  const fetchDados = async () => {
    try {
      setLoading(true);
      const transacaoDocRef = doc(db, 'transacoes', transacaoId);
      const transacaoDocSnap = await getDoc(transacaoDocRef);
      if (transacaoDocSnap.exists()) {
        setTransacao({ id: transacaoDocSnap.id, ...transacaoDocSnap.data() });
      } else {
        setError("Transação não encontrada.");
        setLoading(false);
        return;
      }
      const documentosQuery = query(collection(db, 'transacoes', transacaoId, 'documentos'), orderBy('createdAt', 'desc'));
      const documentosSnapshot = await getDocs(documentosQuery);
      const documentosList = documentosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDocumentos(documentosList);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      setError("Ocorreu um erro ao carregar os dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, [transacaoId]);
  
  const handleFileUpload = async () => {
    if (!arquivo || !nomeArquivo) {
      alert("Por favor, selecione um arquivo e dê um nome a ele.");
      return;
    }
    setIsUploading(true);
    try {
      const fileUrl = await uploadFile(arquivo);
      if (!fileUrl) throw new Error("Falha no upload do arquivo.");
      const documentosCollectionRef = collection(db, 'transacoes', transacaoId, 'documentos');
      await addDoc(documentosCollectionRef, {
        nomeArquivo: nomeArquivo,
        url: fileUrl,
        enviadoPor: 'corretor',
        createdAt: serverTimestamp(),
      });
      setArquivo(null);
      setNomeArquivo('');
      fetchDados();
    } catch (error) {
      console.error("Erro ao enviar documento:", error);
      alert("Ocorreu um erro ao enviar o documento.");
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDeleteDocumento = async (documentoId) => {
    if (window.confirm("Tem certeza que deseja apagar este documento?")) {
      try {
        const docRef = doc(db, 'transacoes', transacaoId, 'documentos', documentoId);
        await deleteDoc(docRef);
        fetchDados();
      } catch (error) {
        console.error("Erro ao apagar documento:", error);
        alert("Falha ao apagar o documento.");
      }
    }
  };

  const toggleEtapaStatus = async (index) => {
    if (!transacao) return;
    const novasEtapas = [...transacao.etapas];
    const etapaAtual = novasEtapas[index];
    etapaAtual.status = etapaAtual.status === 'concluido' ? 'pendente' : 'concluido';
    setTransacao(prev => ({ ...prev, etapas: novasEtapas }));
    try {
      const transacaoDocRef = doc(db, 'transacoes', transacaoId);
      await updateDoc(transacaoDocRef, { etapas: novasEtapas });
    } catch (error) {
      console.error("Erro ao atualizar etapa:", error);
      novasEtapas[index].status = novasEtapas[index].status === 'concluido' ? 'pendente' : 'concluido';
      setTransacao(prev => ({ ...prev, etapas: novasEtapas }));
      alert("Falha ao atualizar o status da etapa.");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin" size={48} /></div>;
  }
  if (error) {
    return <p className="text-center text-red-500 mt-8">{error}</p>;
  }
  if (!transacao) {
    return <p className="text-center text-gray-500 mt-8">Nenhuma transação encontrada.</p>;
  }

  const etapasConcluidas = transacao.etapas.filter(e => e.status === 'concluido').length;
  const progresso = (etapasConcluidas / transacao.etapas.length) * 100;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link to="/admin" className="text-indigo-600 hover:underline text-sm mb-2 inline-block">← Voltar para Transações</Link>
          <p className="text-indigo-600 font-semibold">{transacao.tipoProcesso}</p>
          <h1 className="text-4xl font-bold text-gray-800">{transacao.nomeCliente}</h1>
          <Link to={`/imovel/${transacao.imovelId}`} className="text-gray-500 hover:underline">{transacao.imovelTitulo}</Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Checklist de Etapas</h2>
              <p className="text-sm text-gray-500 mb-6">Clique em uma etapa para marcar como concluída ou pendente.</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                <div className="bg-green-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progresso}%` }}></div>
              </div>
              <div className="space-y-4">
                {transacao.etapas.map((etapa, index) => (
                  <div key={index} onClick={() => toggleEtapaStatus(index)} className={`p-4 border rounded-lg flex items-center cursor-pointer transition-all ${etapa.status === 'concluido' ? 'bg-green-50 border-green-200' : 'bg-white hover:bg-gray-50'}`}>
                    {etapa.status === 'concluido' ? <CheckCircle2 size={24} className="text-green-500 mr-4 flex-shrink-0" /> : <Circle size={24} className="text-gray-300 mr-4 flex-shrink-0" />}
                    <span className={`font-medium ${etapa.status === 'concluido' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{etapa.nome}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
             <div className="bg-white p-8 rounded-lg shadow-md sticky top-8 space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800">Documentos</h2>
                <div className="space-y-4 p-4 border-2 border-dashed rounded-lg">
                  <h3 className="font-medium text-gray-700">Adicionar Novo Documento</h3>
                  <div>
                    <label htmlFor="nomeArquivo" className="block text-xs font-medium text-gray-600">Nome/Descrição do Arquivo</label>
                    <input type="text" id="nomeArquivo" value={nomeArquivo} onChange={(e) => setNomeArquivo(e.target.value)} placeholder="Ex: RG e CPF do Cliente" className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm"/>
                  </div>
                  <div>
                    <label htmlFor="fileUpload" className="block text-xs font-medium text-gray-600">Selecione o arquivo</label>
                    <input id="fileUpload" type="file" onChange={(e) => setArquivo(e.target.files[0])} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                  </div>
                  <button onClick={handleFileUpload} disabled={isUploading} className="w-full inline-flex justify-center items-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400">
                    {isUploading ? <Loader className="animate-spin mr-2"/> : <UploadCloud size={16} className="mr-2"/>}
                    {isUploading ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-700">Documentos Anexados</h3>
                  {documentos.length > 0 ? documentos.map(docItem => (
                    <div key={docItem.id} className="border rounded-md p-3 flex justify-between items-center">
                      <a href={docItem.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 group">
                        <FileText className="text-gray-400 group-hover:text-indigo-600"/>
                        <span className="text-sm font-medium text-gray-800 group-hover:underline">{docItem.nomeArquivo}</span>
                      </a>
                      <button onClick={() => handleDeleteDocumento(docItem.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-400 text-center py-4">Nenhum documento anexado.</p>
                  )}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetalheTransacao;