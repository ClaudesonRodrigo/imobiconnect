// src/components/InteractionModal.jsx

import { useState } from 'react';
import { X } from 'lucide-react';

function InteractionModal({ isOpen, onClose, onSave, client }) {
  const [tipo, setTipo] = useState('WhatsApp');
  const [notas, setNotas] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    if (!notas) {
      alert("Por favor, adicione uma nota sobre a interação.");
      return;
    }
    onSave({
      tipo,
      notas,
      clienteId: client.id,
      clienteNome: client.nomeCliente,
    });
    setNotas(''); // Limpa o campo após salvar
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-800">Registrar Interação com {client?.nomeCliente}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="tipoInteracao" className="block text-sm font-medium text-gray-700">Tipo de Interação</label>
            <select
              id="tipoInteracao"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option>WhatsApp</option>
              <option>Ligação</option>
              <option>Email</option>
              <option>Visita ao Imóvel</option>
              <option>Reunião</option>
              <option>Outro</option>
            </select>
          </div>
          <div>
            <label htmlFor="notas" className="block text-sm font-medium text-gray-700">Notas / Resumo</label>
            <textarea
              id="notas"
              rows="4"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Descreva o que foi conversado, próximos passos, etc."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
        </div>
        <div className="flex justify-end items-center p-6 border-t space-x-4">
          <button onClick={onClose} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300">
            Cancelar
          </button>
          <button onClick={handleSave} className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">
            Salvar Interação
          </button>
        </div>
      </div>
    </div>
  );
}

export default InteractionModal;