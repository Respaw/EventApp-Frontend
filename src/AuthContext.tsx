// src/AuthContext.tsx

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode } from 'js-base64';
import api from '../utils/api'; // Убедись, что путь '../utils/api' верный

// Описываем типы
type User = { id: number; username: string };
interface AuthState {
  accessToken: string | null;
  authenticated: boolean;
  user: User | null;
}
interface AuthContextType {
  authState: AuthState;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  initializing: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    accessToken: null,
    authenticated: false,
    user: null,
  });
  const [initializing, setInitializing] = useState(true);

  // Функция для извлечения данных пользователя из токена
  const parseJwt = (token: string): User | null => {
    try {
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(decode(payloadBase64));
      return { id: decodedPayload.user_id, username: decodedPayload.username };
    } catch (e) {
      console.error('Failed to decode JWT', e);
      return null;
    }
  };

  // Эффект для проверки токена при запуске
  useEffect(() => {
    const loadToken = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        if (accessToken) {
          const user = parseJwt(accessToken);
          if (user) {
            setAuthState({ accessToken, authenticated: true, user });
          } else {
            setAuthState({ accessToken: null, authenticated: false, user: null });
            await AsyncStorage.removeItem('accessToken');
          }
        }
      } catch (e) {
        console.error('Failed to load token from storage', e);
      } finally {
        setInitializing(false);
      }
    };
    loadToken();
  }, []);

  // Функция для входа
  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.post('/token/', { username, password });
      const { access } = response.data;
      const user = parseJwt(access);
      if (user) {
        await AsyncStorage.setItem('accessToken', access);
        setAuthState({ accessToken: access, authenticated: true, user });
        return { success: true };
      }
      return { success: false, error: 'Failed to parse token.' };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  // Функция для выхода
  const logout = async () => {
    await AsyncStorage.removeItem('accessToken');
    setAuthState({ accessToken: null, authenticated: false, user: null });
  };

  return (
    <AuthContext.Provider value={{ authState, initializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);