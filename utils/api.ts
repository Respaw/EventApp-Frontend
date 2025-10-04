// utils/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Базовый URL твоего бэкенда
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1'; // Убедись, что это правильный URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Перехватчик запросов: добавляет токен авторизации
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken'); // Получаем токен из AsyncStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Перехватчик ответов: обрабатывает ошибки 401 (Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    // Если ошибка 401 и это не запрос на логин/регистрацию
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Помечаем запрос, чтобы избежать бесконечного цикла
      
      // Здесь можно было бы реализовать логику обновления токена,
      // но пока просто перенаправим на логин.
      
      // Очищаем токен и перенаправляем на логин
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken'); // Если есть refreshToken
      
      // Используем уведомление, чтобы избежать циклической зависимости от navigation
      // Или, более корректно, обработаем это в AuthContext
      // Пока просто выведем в консоль и ожидаем, что AuthContext перехватит.
      console.warn('Access token expired or invalid. User logged out.');
      
      // В AuthContext мы можем отслеживать это состояние и навигировать
      // Здесь напрямую navigation.navigate('Login') не сработает из-за отсутствия контекста
      // Поэтому `onLogout()` из AuthContext должен быть более умным.
    }
    return Promise.reject(error);
  }
);

export default api;