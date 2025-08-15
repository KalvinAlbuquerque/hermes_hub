// Arquivo: frontend/src/app/login/page.tsx

"use client"; // Marca este como um Componente de Cliente

import { useState } from 'react'; // Importa o hook para gerenciar estado
import axios from 'axios';       // Importa o Axios para fazer chamadas de API
import { useRouter } from 'next/navigation'; // Importa o hook para redirecionamento

export default function LoginPage() {
  // 1. Estados para armazenar os valores dos inputs e mensagens de erro/sucesso
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const router = useRouter(); // Inicializa o hook de roteamento

  // 2. Função que será chamada quando o formulário for enviado
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Previne o comportamento padrão do formulário (recarregar a página)
    setError(''); // Limpa erros antigos

    try {
      // 3. Faz a chamada POST para a nossa API de backend
      const response = await axios.post('http://localhost:3333/login', {
        email,
        password,
      });

      // 4. Se a chamada for bem-sucedida
      if (response.data.token) {
        // Armazena o token nos cookies do navegador
        // (document.cookie é uma forma simples, bibliotecas como 'js-cookie' são recomendadas para projetos maiores)
        document.cookie = `hermes.token=${response.data.token}; path=/; max-age=28800`; // max-age = 8 horas

        // Redireciona o usuário para a página principal
        router.push('/dashboard'); 
      }

    } catch (err: any) {
      // 5. Se a API retornar um erro
      if (err.response && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Ocorreu um erro inesperado. Tente novamente.');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-6">Hermes Hub Login</h1>
        
        {/* Adiciona o 'onSubmit' para chamar nossa função */}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">
              E-mail
            </label>
            <input
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="email"
              type="email"
              placeholder="seu.email@exemplo.com"
              value={email} // Conecta o input ao estado 'email'
              onChange={(e) => setEmail(e.target.value)} // Atualiza o estado quando o usuário digita
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              Senha
            </label>
            <input
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="password"
              type="password"
              placeholder="********"
              value={password} // Conecta o input ao estado 'password'
              onChange={(e) => setPassword(e.target.value)} // Atualiza o estado quando o usuário digita
              required
            />
          </div>

          {/* Exibe a mensagem de erro, se houver */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <button
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            type="submit"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}