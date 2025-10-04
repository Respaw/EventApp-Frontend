import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../AuthContext'; // Путь к AuthContext: из src/screens/ -> src/AuthContext.tsx, это один ../

function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { onLogin } = useAuth(); 

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, введите логин и пароль.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await onLogin(username, password); 

      if (result.success) {
        // УСПЕШНЫЙ ВХОД: УДАЛЯЕМ ЯВНУЮ НАВИГАЦИЮ.
        // AppNavigator (в App.tsx) автоматически переключится на AppStack,
        // когда authState.authenticated станет true, и отобразит MainScreen.
        // navigation.navigate('Main'); // <-- ЭТА СТРОКА УДАЛЕНА
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