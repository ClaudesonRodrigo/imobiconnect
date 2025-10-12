mobiConnect 🏡
📖 Sobre o Projeto
ImobiConnect é uma plataforma web moderna e completa para o mercado imobiliário, desenhada para capacitar corretores com ferramentas de gerenciamento e, ao mesmo tempo, oferecer uma experiência de busca fluida e atraente para clientes. A aplicação conecta corretores, imóveis e clientes de forma simples e eficiente.

Este projeto foi construído do zero, utilizando um stack de tecnologias modernas para garantir performance, escalabilidade e uma excelente experiência de desenvolvimento.

✨ Funcionalidades Principais
A plataforma é dividida em três níveis de acesso, cada um com seu próprio conjunto de superpoderes:

👤 Para o Cliente (Público)
Vitrine Principal: Visualização de todos os imóveis disponíveis em um layout de cards moderno e responsivo.

Página de Detalhes do Imóvel: Uma página completa para cada imóvel com:

Galeria de fotos interativa.

Player de vídeo integrado.

Descrição detalhada, preço e características (quartos, banheiros, área, etc.).

Informações do corretor responsável.

Página Exclusiva do Corretor: Cada corretor possui uma página pessoal com seu logo, nome e uma galeria de todos os seus imóveis.

Contato Direto via WhatsApp: Um botão flutuante em todas as páginas de imóveis e corretores para iniciar uma conversa imediata, com uma mensagem padrão para facilitar o primeiro contato.

🤵 Para o Corretor (Painel Administrativo)
Autenticação Segura: Sistema de login protegido por email e senha.

Dashboard Centralizado (/admin): Um painel de controle com abas para gerenciamento completo:

CRUD de Imóveis: Crie, visualize, edite e apague seus próprios anúncios de imóveis.

Upload de Mídias: Adicione até 5 fotos e 1 vídeo para cada imóvel, com upload direto para o Cloudinary.

Personalização da Página: Atualize seu número de WhatsApp e sua foto/logo para customizar sua página pública.

👑 Para o SuperAdmin (Controle Total)
Painel de Super Administração (/superadmin): Acesso a uma área com poderes elevados para gerenciamento da plataforma.

Dashboard de Métricas: Visão geral do negócio com estatísticas em tempo real:

Total de corretores na plataforma.

Total de imóveis cadastrados.

Preço médio dos imóveis à venda.

CRUD de Corretores: Crie, edite (nome), ative, desative e apague contas de corretores.

Gerenciamento Global de Imóveis: Capacidade de visualizar e apagar qualquer imóvel na plataforma, garantindo o controle de qualidade e moderação.

🛠️ Tecnologias Utilizadas (Stack)
Frontend:

React 19: Biblioteca principal para a construção da interface.

Vite: Ferramenta de build extremamente rápida para desenvolvimento.

React Router DOM: Para gerenciamento de rotas e navegação.

Estilização:

Tailwind CSS: Framework CSS utility-first para uma estilização rápida e consistente.

Lucide React: Biblioteca de ícones moderna e leve.

Backend & Infraestrutura (Serverless):

Firebase: Plataforma principal para backend como serviço (BaaS).

Firestore: Banco de dados NoSQL para armazenar dados de imóveis e usuários.

Firebase Authentication: Para gerenciamento de autenticação de usuários (email/senha).

Cloudinary: Serviço de gerenciamento de mídias para upload, armazenamento e otimização de imagens e vídeos.

Deployment:

Netlify: Plataforma para deploy contínuo e hospedagem do frontend.

🚀 Como Rodar o Projeto Localmente
Para executar o ImobiConnect em seu ambiente de desenvolvimento local, siga os passos abaixo.

Pré-requisitos
Node.js (versão 18 ou superior)

npm ou yarn

Uma conta no Firebase para criar seu próprio projeto e obter as chaves da API.

Uma conta no Cloudinary para obter as credenciais de upload.

Instalação
Clone o repositório:

Bash

git clone https://github.com/seu-usuario/imobiconnect.git
cd imobiconnect
Instale as dependências:

Bash

npm install
Configure as Variáveis de Ambiente:

Na raiz do projeto, crie um arquivo chamado .env.local.

Copie o conteúdo abaixo e preencha com as suas próprias chaves obtidas do Firebase e do Cloudinary.

Arquivo .env.local:

Snippet de código

# Credenciais do seu projeto Firebase
VITE_FIREBASE_API_KEY="SUA_API_KEY"
VITE_FIREBASE_AUTH_DOMAIN="SEU_AUTH_DOMAIN"
VITE_FIREBASE_PROJECT_ID="SEU_PROJECT_ID"
VITE_FIREBASE_STORAGE_BUCKET="SEU_STORAGE_BUCKET"
VITE_FIREBASE_MESSAGING_SENDER_ID="SEU_MESSAGING_SENDER_ID"
VITE_FIREBASE_APP_ID="SEU_APP_ID"
VITE_FIREBASE_MEASUREMENT_ID="SEU_MEASUREMENT_ID"

# Credenciais do Cloudinary
VITE_CLOUDINARY_CLOUD_NAME="SEU_CLOUD_NAME"
VITE_CLOUDINARY_UPLOAD_PRESET="SEU_UPLOAD_PRESET"
Importante: Você pode encontrar todas as credenciais do Firebase nas configurações do seu projeto no console do Firebase. As credenciais do Cloudinary estão no seu dashboard do Cloudinary.

Execute o servidor de desenvolvimento:

Bash

npm run dev
Acesse a aplicação:

Abra seu navegador e acesse http://localhost:5173 (ou a porta indicada no seu terminal).

Feito! O projeto está pronto para ser explorado e modificado em sua máquina local.