// src/pages/LandingPage.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../services/firebaseConfig';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Rocket, Target, BarChart, CheckCircle } from 'lucide-react';

// Componente para o Card de Funcionalidade
const FeatureCard = ({ icon, title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
    <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600">{children}</p>
  </div>
);

// Componente para o Card de Imóvel em Destaque
const ImovelDestaqueCard = ({ imovel }) => (
  <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-105">
    <div className="w-full h-56 bg-gray-200">
      <img src={imovel.fotos?.[0] || 'https://placehold.co/400x300'} alt={imovel.titulo} className="w-full h-full object-cover" />
    </div>
    <div className="p-4">
      <h3 className="font-bold text-lg truncate">{imovel.titulo}</h3>
      <p className="text-sm text-gray-500">{imovel.endereco.bairro}, {imovel.endereco.cidade}</p>
      <p className="text-xl font-extrabold text-green-600 mt-2">
        R$ {Number(imovel.preco).toLocaleString('pt-BR')}
      </p>
    </div>
  </div>
);


function LandingPage() {
  const [imoveisDestaque, setImoveisDestaque] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImoveis = async () => {
      try {
        // Busca 3 imóveis aleatórios para destaque
        const imoveisRef = collection(db, 'imoveis');
        const q = query(imoveisRef, orderBy('createdAt', 'desc'), limit(3));
        const snapshot = await getDocs(q);
        const imoveisList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setImoveisDestaque(imoveisList);
      } catch (error) {
        console.error("Erro ao buscar imóveis de destaque:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchImoveis();
  }, []);

  return (
    <div className="bg-gray-50">
      {/* Seção Hero */}
      <section className="bg-white">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-4">
            A plataforma definitiva para o Corretor de Imóveis Moderno.
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Gerencie seus imóveis, clientes e transações em um só lugar. Crie sua própria vitrine profissional e venda mais, mais rápido.
          </p>
          <Link to="/login" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-indigo-700 transition-colors duration-300">
            Comece Agora
          </Link>
        </div>
      </section>

      {/* Seção de Funcionalidades */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Tudo que você precisa para decolar</h2>
            <p className="text-gray-600 mt-2">Ferramentas poderosas, resultados incríveis.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard icon={<Rocket size={24}/>} title="Sua Vitrine Pessoal">
              Receba um link exclusivo com sua foto, bio e todos os seus imóveis. Perfeito para divulgar no Instagram e WhatsApp.
            </FeatureCard>
            <FeatureCard icon={<Target size={24}/>} title="Gestão de Clientes (CRM)">
              Organize seus leads e negociações com nosso painel Kanban. Nunca mais perca uma oportunidade de negócio.
            </FeatureCard>
            <FeatureCard icon={<BarChart size={24}/>} title="Copiloto com IA">
              Crie descrições de anúncios atraentes e profissionais em segundos com o poder da inteligência artificial.
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* Seção de Imóveis em Destaque */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Veja a Qualidade da Apresentação</h2>
            <p className="text-gray-600 mt-2">Seus imóveis merecem este nível de destaque.</p>
          </div>
          {loading ? (
            <p className="text-center">Carregando destaques...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {imoveisDestaque.map(imovel => (
                <ImovelDestaqueCard key={imovel.id} imovel={imovel} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Seção de Chamada para Ação (CTA) */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Pronto para elevar seu nível?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                Junte-se à comunidade de corretores que estão transformando o mercado com a ImobiConnect.
            </p>
            <Link to="/login" className="bg-green-500 text-white font-bold py-4 px-10 rounded-lg text-xl hover:bg-green-600 transition-colors duration-300">
                Criar minha conta
            </Link>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;