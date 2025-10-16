// src/services/geminiService.js

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Vamos remover a especificação da versão e deixar a biblioteca usar o seu padrão (v1beta).
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Gera a descrição de um anúncio de imóvel usando a IA do Gemini.
 * @param {object} imovel - O objeto com os dados do imóvel.
 * @returns {Promise<string>} - A descrição do anúncio gerada pela IA.
 */
export async function gerarDescricaoDeAnuncio(imovel) {
  // AJUSTE FINAL: Usando o alias 'latest' para máxima compatibilidade.
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    Aja como um corretor de imóveis especialista em marketing digital.
    Sua tarefa é criar uma descrição de anúncio de imóvel que seja profissional, atraente e otimizada para vendas.
    
    **Instruções:**
    - Use um tom vendedor e convidativo.
    - Destaque os principais benefícios e o estilo de vida que o imóvel proporciona.
    - Organize o texto em parágrafos curtos e fáceis de ler.
    - Inicie com um título chamativo.
    - Finalize com uma chamada para ação (call to action), convidando o leitor a agendar uma visita.
    - **NÃO** inclua informações de contato como telefone ou email.

    **Dados do Imóvel:**
    - Título: ${imovel.titulo}
    - Tipo: ${imovel.tipo}
    - Finalidade: ${imovel.finalidade}
    - Preço: R$ ${Number(imovel.preco).toLocaleString('pt-BR')}
    - Endereço: ${imovel.endereco.bairro}, ${imovel.endereco.cidade}
    - Características Principais: ${imovel.caracteristicas.quartos} quartos, ${imovel.caracteristicas.suites} suítes, ${imovel.caracteristicas.banheiros} banheiros, ${imovel.caracteristicas.vagasGaragem} vagas de garagem.
    - Área Total: ${imovel.caracteristicas.areaTotal} m².
    - Descrição do Corretor: ${imovel.descricao}

    Agora, gere a descrição do anúncio.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Erro ao gerar descrição com a IA:", error);
    if (error.message.includes('API key not valid')) {
        return "Erro: A chave da API do Gemini não é válida. Verifique o seu arquivo .env.local.";
    }
    return "Ocorreu um erro ao tentar gerar a descrição. Verifique se a 'Generative Language API' está ativada e se uma conta de faturação está associada ao seu projeto Google Cloud.";
  }
}