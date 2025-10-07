// src/App.jsx

// 1. Apagamos os imports antigos (useState, logos, etc.)
//    e importamos nossa página de cadastro.
import CadastroImovel from './pages/CadastroImovel';

// Também podemos apagar o import do './App.css' ou deixar para usar depois.
import './App.css' 

function App() {
  // 2. Apagamos a lógica do contador (o useState com o 'count')

  // 3. Substituímos todo o JSX da página de demonstração
  //    pelo nosso componente.
  return (
    <div className="App">
      <CadastroImovel />
    </div>
  )
}

export default App