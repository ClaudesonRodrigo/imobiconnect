// src/components/WhatsappButton.jsx

import { MessageCircle } from 'lucide-react'; // Usando ícone da biblioteca do projeto

function WhatsappButton({ phoneNumber }) {
  // Se não houver número de telefone, não renderiza nada
  if (!phoneNumber) {
    return null;
  }

  // Monta a URL da API do WhatsApp
  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Tenho interesse em um dos seus imóveis.')}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contatar no WhatsApp"
      className="fixed bottom-8 right-8 z-50 group flex items-center justify-center"
    >
      {/* Tooltip que aparece no hover */}
      <div className="absolute right-full mr-4 px-3 py-2 bg-gray-800 text-white text-sm font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap hidden sm:block">
        Fale Conosco
        <div className="absolute left-full top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45" />
      </div>

      {/* Botão principal */}
      <div className="relative w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
        {/* Animação de pulsação */}
        <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
        <MessageCircle size={32} className="text-white relative" />
      </div>
    </a>
  );
}

export default WhatsappButton;