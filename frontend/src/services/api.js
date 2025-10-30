import axios from 'axios';


const API_BASE_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

export const analyzeMarketing = async (prompt, maxResults = 5) => {
  try {
    const response = await api.post('/analyze', {
      prompt,
      max_results: maxResults,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.detail || 
      error.message || 
      'Failed to analyze marketing query'
    );
  }
};

export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw new Error('Backend server is not responding');
  }
};

export default api;