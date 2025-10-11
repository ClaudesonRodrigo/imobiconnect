// src/components/WhatsappButton.jsx

import React from 'react';

// Um ícone simples de WhatsApp em SVG que vamos usar
const WhatsAppIcon = () => (
  <svg viewBox="0 0 32 32" style={{ width: '32px', height: '32px', fill: 'white' }}>
    <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.546-.827-1.116-.975-1.297a.17.17 0 0 0-.12-.057c-.138 0-.277.038-.415.038-.143 0-.46.038-.662.038a1.693 1.693 0 0 0-.616.074c-.22.074-.46.183-.662.372-.202.182-.36.372-.46.545-.118.183-.24.41-.31.663-.07.245-.07.52-.07.78 0 .26.038.545.07.78.034.245.182.59.39.99.215.41.49.855.827 1.39.345.545.75 1.09 1.21 1.62.45.538 1.033 1.01 1.62 1.39.59.38 1.18.63 1.76.78.59.15 1.18.21 1.76.21.59 0 1.18-.063 1.76-.21a4.2 4.2 0 0 0 1.76-.78c.59-.38 1.11-.855 1.518-1.39.41-.545.695-1.14.827-1.76.13-.615.195-1.24.195-1.85 0-.59-.063-1.18-.18-1.76a4.17 4.17 0 0 0-.78-1.76c-.38-.59-.855-1.11-1.39-1.518a4.19 4.19 0 0 0-1.76-.78c-.59-.15-1.18-.21-1.76-.21-.59 0-1.18.063-1.76.21-.59.15-1.11.38-1.518.78a4.17 4.17 0 0 0-1.39 1.518c-.38.59-.63 1.18-.78 1.76-.14.59-.21 1.18-.21 1.76 0 .59.07 1.18.21 1.76.15.59.38 1.11.78 1.518.41.41.895.75 1.39.99.5.245 1.03.39 1.59.39.56 0 1.11-.143 1.59-.39.49-.245.92-.578 1.31-1.008.39-.43.69-.93.91-1.46.22-.53.33-1.09.33-1.66 0-.59-.11-1.18-.33-1.76a4.843 4.843 0 0 0-.91-1.46c-.39-.43-.82-.763-1.31-1.008-.48-.245-1.03-.39-1.59-.39z"></path>
  </svg>
);

function WhatsappButton({ phoneNumber }) {
  // Se não houver número de telefone, não renderiza nada
  if (!phoneNumber) {
    return null;
  }

  // Monta a URL da API do WhatsApp
  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        backgroundColor: '#25D366',
        color: 'white',
        borderRadius: '50%',
        width: '60px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '2px 2px 8px rgba(0, 0, 0, 0.4)',
        zIndex: 1000,
        textDecoration: 'none'
      }}
      aria-label="Contatar no WhatsApp"
    >
      <WhatsAppIcon />
    </a>
  );
}

export default WhatsappButton;