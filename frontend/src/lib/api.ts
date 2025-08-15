// Arquivo: frontend/src/lib/api.ts
import axios from 'axios';

// Função auxiliar para pegar o token dos cookies
const getCookie = (name: string) => {
  if (typeof window === 'undefined') {
    return null;
  }
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

const api = axios.create({
  baseURL: 'http://localhost:3333',
});

// Isso é um "Interceptor". Ele intercepta TODA requisição antes de ser enviada
// e adiciona o cabeçalho de autenticação automaticamente.
api.interceptors.request.use(
  (config) => {
    const token = getCookie('hermes.token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;