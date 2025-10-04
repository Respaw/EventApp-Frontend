// AuthContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode } from 'js-base64'; // Для декодирования JWT
import api from '../utils/api'; // <-- ИСПРАВЛЕННЫЙ ПУТЬ К API.TS

// Импортируем компоненты из React Native для лоадера
import { View, Text, ActivityIndicator } from 'react-native'; // <-- ЭТА СТРОКА БЫЛА ПРОПУЩЕНА

interface User {
  username: string;
  id: number;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  authenticated: boolean;
  user: User | null;
}

interface AuthContextType {
  authState: AuthState;
  onLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onLogout: () => Promise<void>;
  initializing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    authenticated: false,
    user: null,
  });
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const loadTokens = async () => {
      try {
        const storedAccessToken = await AsyncStorage.getItem('accessToken');
        const storedRefreshToken = await AsyncStorage.getItem('refreshToken');

        if (storedAccessToken && storedRefreshToken) {
          const user = parseJwt(storedAccessToken);
          if (user) {
            setAuthState({
              accessToken: storedAccessToken,
              refreshToken: storedRefreshToken,
              authenticated: true,
              user: user,
            });
          } else {
            // Если токен невалиден, очищаем его
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('refreshToken');
          }
        }
      } catch (e) {
        console.error('Failed to load tokens from storage', e);
      } finally {
        setInitializing(false);
      }
    };

    loadTokens();
  }, []);

  const onLogin = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.post('/token/', {
        username,
        password,
      });

      const { access, refresh } = response.data;

      await AsyncStorage.setItem('accessToken', access);
      await AsyncStorage.setItem('refreshToken', refresh);
      const user = parseJwt(access);

      if (user) {
        setAuthState({
          accessToken: access,
          refreshToken: refresh,
          authenticated: true,
          user: user,
        });
        return { success: true };
      } else {
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        setAuthState({ accessToken: null, refreshToken: null, authenticated: false, user: null });
        return { success: false, error: 'Failed to parse user data from token.' };
      }

    } catch (error: any) {
      console.error('Login failed', error.response?.data || error);
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const onLogout = async () => {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    setAuthState({
      accessToken: null,
      refreshToken: null,
      authenticated: false,
      user: null,
    });
  };

  const parseJwt = (token: string): User | null => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decode(base64);
      const decoded = JSON.parse(jsonPayload);
      return {
        username: decoded.username,
        id: decoded.user_id,
      };
    } catch (e) {
      console.error('Failed to decode JWT', e);
      return null;
    }
  };

  if (initializing) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text>Загрузка...</Text>
        </View>
    );
  }

  return (
    <AuthContext.Provider value={{ authState, onLogin, onLogout, initializing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};