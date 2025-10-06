// В App.tsx
import { NavigationContainer, CommonActions, NavigationProp } from '@react-navigation/native'; // <--- Добавил NavigationProp
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MainScreen from './src/screens/MainScreen';
import CreateEventScreen from './src/screens/CreateEventScreen';
import EventDetailScreen from './src/screens/EventDetailScreen'; // <--- Убедитесь, что этот импорт есть

// --- RootStackParamList должен быть определен ЗДЕСЬ и быть одинаковым везде ---
type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  CreateEvent: undefined; // Добавлено
  EventDetail: { eventId: number; eventTitle: string }; // Добавлено
};

const Stack = createNativeStackNavigator<RootStackParamList>(); // <--- Типизация для Stack

const AppContent = () => {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {authenticated ? (
        <>
          <Stack.Screen name="Main" component={MainScreen} />
          <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ headerShown: true, title: 'Новое событие' }} />
          <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ headerShown: true }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}