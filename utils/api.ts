import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native'; // Добавил Alert

const API_URL = 'http://127.0.0.1:8000/api/v1'; // Убедитесь, что это правильный IP-адрес вашего бэкенда

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерсептор для добавления Access Token к каждому запросу
api.interceptors.request.use(
  async (config) => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Интерсептор для обработки 401 Unauthorized и обновления токена
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если ошибка 401 и это не повторная попытка и не запрос на refresh token
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/token/refresh/') {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/token/refresh/`, { refresh: refreshToken });
          const newAccessToken = response.data.access;
          
          await AsyncStorage.setItem('accessToken', newAccessToken);
          // Обновляем токен в заголовках Axios по умолчанию и в оригинальном запросе
          api.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          return api(originalRequest); // Повторяем оригинальный запрос
        }
      } catch (refreshError: any) {
        // Если refresh token недействителен, выходим из системы
        console.error("Refresh token failed, logging out:", refreshError.response?.data || refreshError.message);
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        Alert.alert('Сессия истекла', 'Пожалуйста, войдите снова.');
        // Возможно, здесь нужно сделать автоматический редирект на экран логина
        // Например, используя NavigationContainer.ref.navigate('Login')
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;