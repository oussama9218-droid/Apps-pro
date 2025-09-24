import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export function useApi() {
  const { token, logout } = useAuth();

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_URL}/api${endpoint}`;
    console.log('🌐 API Call:', url, options.method || 'GET');

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
      });

      console.log('📡 API Response:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('🔓 Unauthorized - logging out');
          logout();
          throw new Error('Session expirée, veuillez vous reconnecter');
        }

        const error = await response.json().catch(() => ({ detail: 'Erreur serveur' }));
        throw new Error(error.detail || `Erreur ${response.status}`);
      }

      // Special handling for PDF downloads
      if (response.headers.get('content-type')?.includes('application/pdf')) {
        return response.blob();
      }

      return response.json();
    } catch (error: any) {
      console.error('❌ API Error:', error);
      
      if (error.name === 'TypeError' && error.message === 'Network request failed') {
        throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion internet.');
      }
      
      throw error;
    }
  };

  const get = (endpoint: string) => apiCall(endpoint, { method: 'GET' });
  
  const post = (endpoint: string, data: any) => 
    apiCall(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    });
    
  const put = (endpoint: string, data: any) => 
    apiCall(endpoint, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    });
    
  const del = (endpoint: string) => apiCall(endpoint, { method: 'DELETE' });

  const checkHealth = async () => {
    try {
      const health = await get('/health');
      console.log('💚 Backend Health:', health);
      return health;
    } catch (error) {
      console.log('💔 Backend Health Check Failed:', error);
      return { status: 'error', message: error };
    }
  };

  return {
    get,
    post,
    put,
    delete: del,
    checkHealth,
    apiUrl: API_URL,
  };
}