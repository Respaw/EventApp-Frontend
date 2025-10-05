import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../AuthContext'; // Путь из src/screens/ к src/AuthContext.tsx

function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // ИСПОЛЬЗУЕМ `login` ИЗ НОВОГО AuthContext
  const { login } = useAuth(); 

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, введите логин и пароль.');
      return;
    }

    setIsLoading(true);

    try {
      // Вызываем `login`
      const result = await login(username, password); 

      if (result.success) {
        // Навигация теперь управляется App.tsx, который реагирует на изменение authState.authenticated
        // navigation.navigate('Main'); // Эту строку мы удаляли
      } else {
        Alert.alert('Ошибка входа', result.error || 'Неизвестная ошибка при входе.');
      }
    } catch (error: any) {
      console.error('Login process error:', error);
      Alert.alert('Ошибка', 'Произошла ошибка сети или непредвиденная ошибка.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Вход</Text>
      <TextInput
        style={styles.input}
        placeholder="Логин"
        value={username} 
        onChangeText={setUsername} 
        autoCapitalize="none"
        editable={!isLoading}
      />
      <TextInput
        style={styles.input}
        placeholder="Пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
      />
      <Button 
        title={isLoading ? "Вход..." : "Войти"} 
        onPress={handleLogin} 
        disabled={isLoading} 
      />
      {isLoading && <ActivityIndicator size="small" color="#0000ff" style={styles.activityIndicator} />}
      
      <Button 
        title="Зарегистрироваться" 
        onPress={() => navigation.navigate('Register')} 
        disabled={isLoading} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  activityIndicator: {
    marginTop: 10,
  },
});

export default LoginScreen;