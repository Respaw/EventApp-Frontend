// App.tsx
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/AuthContext';

// Импорты экранов
import MainScreen from './src/screens/MainScreen';
import CreateEventScreen from './src/screens/CreateEventScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { authState, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Загрузка приложения...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {authState.authenticated ? (
        <>
          <Stack.Screen name="Main" component={MainScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'Новое событие' }} />
          <Stack.Screen
            name="EventDetail"
            component={EventDetailScreen}
            options={({ route }: any) => ({ title: route.params?.eventTitle || 'Детали' })}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Регистрация' }} />
        </>
      )}
    </Stack.Navigator>
  );
};

function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default App;