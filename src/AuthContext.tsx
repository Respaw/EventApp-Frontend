import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, CommonActions, NavigationProp } from '@react-navigation/native'; // <--- ДОБАВЛЕН NavigationProp
import api from '../utils/api'; // Убедитесь, что путь верный
import { Alert } from 'react-native';

// --- ДОБАВЛЕНА ТИПИЗАЦИЯ ДЛЯ RootStackParamList ---
// ОБЯЗАТЕЛЬНО должна совпадать с App.tsx!
type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  CreateEvent: undefined;
  EventDetail: { eventId: number; eventTitle: string };
};

interface AuthContextType {
  user: { id: number; username: string } | null;
  accessToken: string | null;
  refreshToken: string | null;
  authenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: any }>;
  register: (username: string, password: string) => Promise<{ success: boolean; error?: any }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Используем useNavigation с типизацией
  const navigation = useNavigation<NavigationProp<RootStackParamList>>(); // <--- ТИПИЗАЦИЯ

  const saveTokens = async (access: string, refresh: string) => {
    await AsyncStorage.setItem('accessToken', access);
    await AsyncStorage.setItem('refreshToken', refresh);
    setAccessToken(access);
    setRefreshToken(refresh);
    setAuthenticated(true);
  };

  const loadTokens = useCallback(async () => {
    try {
      const storedAccessToken = await AsyncStorage.getItem('accessToken');
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
      if (storedAccessToken && storedRefreshToken) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        setAuthenticated(true);
        // Дополнительно: проверить токен на валидность, чтобы получить user info
        try {
          // Получение информации о пользователе после успешной загрузки токена
          const userResponse = await api.get('/auth/user/', {
            headers: { 'Authorization': `Bearer ${storedAccessToken}` }
          });
          setUser(userResponse.data);
        } catch (tokenError: any) {
          console.error("Failed to fetch user with stored token:", tokenError);
          // Если токен невалиден, очистить и разлогинить
          await clearTokens();
          setAuthenticated(false);
        }
      } else {
        setAuthenticated(false);
      }
    } catch (e) {
      console.error('Failed to load tokens:', e);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearTokens = async () => {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setAuthenticated(false);
  };

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  // Login function
  const login = async (username_val: string, password_val: string) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/token/', {
        username: username_val,
        password: password_val,
      });

      const { access, refresh, user } = response.data; // Предполагаем, что user info тоже приходит
      await saveTokens(access, refresh);
      setUser(user); // Устанавливаем пользователя
      setAuthenticated(true);
      setLoading(false);
      navigation.dispatch( // <--- Теперь RESET должен работать с типизацией
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }], // <--- На Main, а не на Login после успешного логина
        })
      );
      return { success: true };
    } catch (error: any) {
      setLoading(false);
      const errorMessage = error.response?.data?.detail 
                           || error.response?.data?.error 
                           || error.response?.data?.message 
                           || 'Ошибка входа.';
      console.error("Login failed:", errorMessage);
      Alert.alert("Ошибка входа", errorMessage); // <--- Отображаем ошибку пользователю
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (username_val: string, password_val: string) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/register/', {
        username: username_val,
        password: password_val,
      });

      // Предполагаем, что регистрация не возвращает токены.
      // Если бэкенд возвращает токены при регистрации, используйте saveTokens.
      // Если нет, то после регистрации просто перенаправляем на экран входа.

      setLoading(false);
      Alert.alert('Успех!', 'Аккаунт успешно зарегистрирован. Пожалуйста, войдите.');
      navigation.dispatch( // <--- После регистрации НА ЭКРАН ВХОДА
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
      return { success: true };
    } catch (error: any) {
      setLoading(false);
      const errorMessage = error.response?.data?.detail || 'Ошибка регистрации.';
      console.error("Register failed:", errorMessage);
      Alert.alert("Ошибка регистрации", errorMessage); // <--- Отображаем ошибку пользователю
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = useCallback(async () => {
    await clearTokens();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );
  }, [navigation]); // navigation в зависимостях

  const value = { user, accessToken, refreshToken, authenticated, loading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};