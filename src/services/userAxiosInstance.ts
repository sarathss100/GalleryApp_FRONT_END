import axios from "axios";
import { toast } from 'react-toastify';
import { useAuthStore } from "../stores/userAuthStore";
import { jwtDecode } from 'jwt-decode';

const API_URI = import.meta.env.VITE_API_URI || 'http://localhost:5000/api/user';

const apiClient = axios.create({
  baseURL: API_URI,
  withCredentials: true,
  timeout: 10000,
});

interface RefreshResponse {
  success: boolean;
  accessToken: string;
}

const isTokenExpired = (token: string): boolean => {
  try {
    const decodedToken: { exp: number } = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decodedToken.exp <= currentTime;
  } catch (error) {
    console.error('Error decoding token:', error); 
    return true;
  }
};

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await axios.post<RefreshResponse>(
      `${API_URI}/refresh-token`,
      {},
      { withCredentials: true }
    );

    if (response.data.success && response.data.accessToken) {
      const newAccessToken = response.data.accessToken;
      
      // Update token in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', newAccessToken);
      }
      
      // Update auth store
      useAuthStore.getState().setAuth(true);
    
      return newAccessToken; 
    }
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

apiClient.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem('accessToken');
    
    if (token) {
      if (isTokenExpired(token)) {
        try {
          const newToken = await refreshAccessToken();
          if (newToken) {
            token = newToken;
          } else {
            // Clear auth state and redirect to login
            useAuthStore.getState().setAuth(false);

            localStorage.removeItem('accessToken');

            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            
            return Promise.reject(new Error('Session expired. Please login again.'));
          }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          // Handle refresh token failure
          useAuthStore.getState().setAuth(false);
          localStorage.removeItem('accessToken');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(new Error('Session expired. Please login again.'));
        }
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
      
      // If refresh fails, clear auth and redirect
      localStorage.removeItem('accessToken');
      useAuthStore.getState().setAuth(false);
      toast.error("Session expired. Please login again.");
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export { apiClient };

