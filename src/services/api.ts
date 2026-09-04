import axios from 'axios';
import Cookies from 'js-cookie';

// 1. Création de l'instance Axios avec la configuration de base
const api = axios.create({
  // Utilisation d'une variable d'environnement pour le déploiement sur le VPS
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Intercepteur de requêtes (Request Interceptor)
// Ce code s'exécute AVANT l'envoi de chaque requête vers le backend.
api.interceptors.request.use(
  (config) => {
    // On récupère le token stocké dans les cookies
    const token = Cookies.get('token');

    // Si un token existe, on l'ajoute dans le header Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Intercepteur de réponses (Response Interceptor)
// Ce code s'exécute à la réception de chaque réponse du backend.
api.interceptors.response.use(
  (response) => {
    // Si la requête réussit, on renvoie simplement la réponse
    return response;
  },
  (error) => {
    // Si le backend renvoie une erreur 401 (Non autorisé) ou 403 (Interdit)
    // Cela signifie généralement que le token est expiré ou invalide.
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // On supprime le cookie invalide
      Cookies.remove('token');

      // Redirection vers la page de connexion (uniquement côté client)
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;