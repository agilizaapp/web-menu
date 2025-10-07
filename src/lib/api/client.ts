import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiError } from '@/lib/utils/api-error';
import { cookieService } from '@/services/cookies';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - adiciona token automaticamente se existir
apiClient.interceptors.request.use(
  (config) => {
    // Buscar token do cookie
    const token = cookieService.getCustomerToken();
    
    // Se tiver token, adicionar no header Authorization
    if (token) {
      config.headers.Authorization = `${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const errorData = error.response?.data as { message?: string, [key: string]: unknown } | undefined;
    const apiError = new ApiError(
      errorData?.message || error.message,
      error.response?.status || 500,
      error.response?.data as object | undefined
    );
    return Promise.reject(apiError);
  }
);