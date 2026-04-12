import axios from 'axios';

// Konfigurasi default Axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:3000/api/v2`, // Otomatis deteksi IP
  timeout: 15000,
});

// Interceptor untuk Auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('resto_accessToken') || localStorage.getItem('resto_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// ✨ BUG FIX (FITUR 3): Axios Response Interceptor untuk Auto-Refresh Token
api.interceptors.response.use((response) => response, async (error) => {
  const originalRequest = error.config;

  if (error.response && (error.response.status === 401 || error.response.status === 403) && !originalRequest._retry) {
    originalRequest._retry = true;
    const refreshToken = localStorage.getItem('resto_refreshToken');
    
    if (refreshToken) {
      try {
        // Lakukan request untuk mendapatkan access token baru
        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
        const newAccessToken = response.data.accessToken;
        
        localStorage.setItem('resto_accessToken', newAccessToken);
        localStorage.setItem('resto_token', newAccessToken); // Fallback kompatibilitas
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        return api(originalRequest); // Ulangi request asli secara transparan
      } catch (refreshError) {
        // Jika Refresh Token juga expired, tendang user ke login
        localStorage.removeItem('resto_token');
        localStorage.removeItem('resto_accessToken');
        localStorage.removeItem('resto_refreshToken');
        window.location.href = '/';
      }
    }
  }
  return Promise.reject(error);
});

export default api;