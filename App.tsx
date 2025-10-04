// src/App.tsx
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// ПРАВИЛЬНЫЕ ИМПОРТЫ
import { AuthProvider, useAuth } from './src/AuthContext';
import LoginScreen from './src/screens/LoginScreen'; 
import RegisterScreen from './src/screens/RegisterScreen'; 
import MainScreen from './src/screens/MainScreen'; 
import CreateEventScreen from './src/screens/CreateEventScreen'; 
import EventDetailScreen from './src/screens/EventDetailScreen'; 
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { authState, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Загрузка приложения...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {authState?.authenticated ? (
        <>
          <Stack.Screen name="Main" component={MainScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'Создать событие' }} />
          <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Детали события' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#666',
  },
});

export default App;