// src/pages/CadastroImovel.jsx

import { useState } from 'react';
// IMPORTANTE: Importar as funções do Firestore e a nossa config do db
import { db } from '../services/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function CadastroImovel() {
  // O useState vai guardar os dados de TODOS os campos do formulário
  // A estrutura dele é um espelho do nosso modelo de dados
  const [imovelData, setImovelData] = useState({
    titulo: '',
    descricao: '',
    tipo: 'casa', // Valor padrão
    finalidade: 'venda', // Valor padrão
    preco: 0,
    status: 'disponivel', // Valor padrão
    endereco: {
      rua: '',
      numero: '',
      bairro: '',
      cidade: '',
      cep: ''
    },
    caracteristicas: {
      quartos: 0,
      suites: 0,
      banheiros: 0,
      vagasGaragem: 0,
      areaTotal: 0
    },
    comodidades: [], // Por enquanto deixaremos vazio, é mais complexo
    fotos: [] // Esvaziaremos também
  });

  // Função "mágica" que atualiza o state a cada mudança nos inputs
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Se o input for de um objeto aninhado (ex: endereco.rua)
    if (name.includes('.')) {
      const [objectName, fieldName] = name.split('.');
      setImovelData(prevData => ({
        ...prevData,
        [objectName]: {
          ...prevData[objectName],
          [fieldName]: value
        }
      }));
    } else {
      // Se for um campo normal
      setImovelData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
  };

  // Função chamada quando o formulário é enviado
  const handleSubmit = async (e) => {
    e.preventDefault(); // Impede que a página recarregue
    
    console.log("Dados a serem enviados:", imovelData);

    try {
      // Usamos a função addDoc para adicionar um novo documento
      const docRef = await addDoc(collection(db, "imoveis"), {
        ...imovelData,
        // Convertendo campos numéricos que vêm como string do formulário
        preco: Number(imovelData.preco),
        caracteristicas: {
          quartos: Number(imovelData.caracteristicas.quartos),
          suites: Number(imovelData.caracteristicas.suites),
          banheiros: Number(imovelData.caracteristicas.banheiros),
          vagasGaragem: Number(imovelData.caracteristicas.vagasGaragem),
          areaTotal: Number(imovelData.caracteristicas.areaTotal),
        },
        createdAt: serverTimestamp() // Adiciona a data de criação pelo servidor
      });
      
      alert(`Imóvel cadastrado com sucesso! ID: ${docRef.id}`);
      // Futuramente, podemos limpar o formulário ou redirecionar o usuário
      
    } catch (error) {
      console.error("Erro ao cadastrar imóvel: ", error);
      alert("Ocorreu um erro ao cadastrar o imóvel. Verifique o console.");
    }
  };

  // O JSX é a estrutura HTML do nosso formulário
  return (
    <div>
      <h1>Cadastro de Novo Imóvel</h1>
      <form onSubmit={handleSubmit}>
        
        {/* INFORMAÇÕES PRINCIPAIS */}
        <fieldset>
          <legend>Informações Principais</legend>
          <label>Título: <input type="text" name="titulo" value={imovelData.titulo} onChange={handleChange} required /></label><br/>
          <label>Descrição: <textarea name="descricao" value={imovelData.descricao} onChange={handleChange}></textarea></label><br/>
          <label>Preço (R$): <input type="number" name="preco" value={imovelData.preco} onChange={handleChange} /></label><br/>
          <label>Tipo: 
            <select name="tipo" value={imovelData.tipo} onChange={handleChange}>
              <option value="casa">Casa</option>
              <option value="apartamento">Apartamento</option>
              <option value="terreno">Terreno</option>
            </select>
          </label><br/>
          <label>Finalidade: 
            <select name="finalidade" value={imovelData.finalidade} onChange={handleChange}>
              <option value="venda">Venda</option>
              <option value="aluguel">Aluguel</option>
            </select>
          </label><br/>
        </fieldset>
        
        {/* ENDEREÇO */}
        <fieldset>
          <legend>Endereço</legend>
          <label>Rua: <input type="text" name="endereco.rua" value={imovelData.endereco.rua} onChange={handleChange} /></label><br/>
          <label>Número: <input type="text" name="endereco.numero" value={imovelData.endereco.numero} onChange={handleChange} /></label><br/>
          <label>Bairro: <input type="text" name="endereco.bairro" value={imovelData.endereco.bairro} onChange={handleChange} /></label><br/>
          <label>Cidade: <input type="text" name="endereco.cidade" value={imovelData.endereco.cidade} onChange={handleChange} /></label><br/>
          <label>CEP: <input type="text" name="endereco.cep" value={imovelData.endereco.cep} onChange={handleChange} /></label><br/>
        </fieldset>

        {/* CARACTERÍSTICAS */}
        <fieldset>
          <legend>Características</legend>
          <label>Quartos: <input type="number" name="caracteristicas.quartos" value={imovelData.caracteristicas.quartos} onChange={handleChange} /></label><br/>
          <label>Suítes: <input type="number" name="caracteristicas.suites" value={imovelData.caracteristicas.suites} onChange={handleChange} /></label><br/>
          <label>Banheiros: <input type="number" name="caracteristicas.banheiros" value={imovelData.caracteristicas.banheiros} onChange={handleChange} /></label><br/>
          <label>Vagas de Garagem: <input type="number" name="caracteristicas.vagasGaragem" value={imovelData.caracteristicas.vagasGaragem} onChange={handleChange} /></label><br/>
          <label>Área Total (m²): <input type="number" name="caracteristicas.areaTotal" value={imovelData.caracteristicas.areaTotal} onChange={handleChange} /></label><br/>
        </fieldset>
        
        <button type="submit">Cadastrar Imóvel</button>
      </form>
    </div>
  );
}

export default CadastroImovel;