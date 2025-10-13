// src/components/NovaTransacaoModal.jsx

import { useState } from 'react';
import { X } from 'lucide-react';

// Modelos de checklist baseados na sua pesquisa de mercado
const checklistTemplates = {
  "Financiamento Caixa - MCMV": [
    { nome: "Simulação de Financiamento", status: "pendente" },
    { nome: "Coleta de Documentos do Cliente", status: "pendente" },
    { nome: "Análise de Crédito na Caixa", status: "pendente" },
    { nome: "Avaliação do Imóvel", status: "pendente" },
    { nome: "Emissão do Contrato", status: "pendente" },
    { nome: "Assinatura e Registro", status: "pendente" },
  ],
  "Venda de Terreno": [
    { nome: "Verificação de Matrícula", status: "pendente" },
    { nome: "Coleta de Documentos (Vendedor/Comprador)", status: "pendente" },
    { nome: "Elaboração do Contrato de Compra e Venda", status: "pendente" },
    { nome: "Assinatura do Contrato", status: "pendente" },
    { nome: "Escritura e Registro", status: "pendente" },
  ],
  "Locação com Fiador": [
    { nome: "Coleta de Documentos (Locatário/Fiador)", status: "pendente" },
    { nome: "Análise Cadastral", status: "pendente" },
    { nome: "Elaboração do Contrato de Locação", status: "pendente" },
    { nome: "Vistoria do Imóvel", status: "pendente" },
    { nome: "Assinatura do Contrato", status: "pendente" },
  ],
};

function NovaTransacaoModal({ isOpen, onClose, onSave, meusImoveis }) {
  const [nomeCliente, setNomeCliente] = useState('');
  const [imovelId, setImovelId] = useState('');
  const [tipoProcesso, setTipoProcesso] = useState(Object.keys(checklistTemplates)[0]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    if (!nomeCliente || !imovelId || !tipoProcesso) {
      alert("Por favor, preencha todos os campos.");
      return;
    }
    const imovelSelecionado = meusImoveis.find(imovel => imovel.id === imovelId);
    
    const transacaoData = {
      nomeCliente,
      imovelId,
      imovelTitulo: imovelSelecionado?.titulo || "Imóvel não encontrado",
      tipoProcesso,
      status: "Em Andamento",
      etapas: checklistTemplates[tipoProcesso],
    };
    onSave(transacaoData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-800">Iniciar Nova Transação</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="nomeCliente" className="block text-sm font-medium text-gray-700">Nome do Cliente / Identificação</label>
            <input
              type="text"
              id="nomeCliente"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              placeholder="Ex: Venda Apto Jardins - Maria Silva"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="imovelId" className="block text-sm font-medium text-gray-700">Imóvel Relacionado</label>
            <select
              id="imovelId"
              value={imovelId}
              onChange={(e) => setImovelId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="">Selecione um imóvel</option>
              {meusImoveis.map(imovel => (
                <option key={imovel.id} value={imovel.id}>{imovel.titulo}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tipoProcesso" className="block text-sm font-medium text-gray-700">Modelo de Processo</label>
            <select
              id="tipoProcesso"
              value={tipoProcesso}
              onChange={(e) => setTipoProcesso(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              {Object.keys(checklistTemplates).map(templateName => (
                <option key={templateName} value={templateName}>{templateName}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end items-center p-6 border-t space-x-4">
          <button onClick={onClose} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300">
            Cancelar
          </button>
          <button onClick={handleSave} className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">
            Salvar Transação
          </button>
        </div>
      </div>
    </div>
  );
}

export default NovaTransacaoModal;