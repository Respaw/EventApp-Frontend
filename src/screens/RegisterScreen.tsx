import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';

function RegisterScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Состояние для индикатора загрузки

  const handleRegister = async () => {
    if (!username || !password || !passwordConfirm) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля.');
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert('Ошибка', 'Пароли не совпадают.');
      return;
    }

    setIsLoading(true); // Включаем индикатор загрузки

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, password_confirm: passwordConfirm }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Успех', 'Регистрация прошла успешно! Теперь вы можете войти.');
        navigation.navigate('Login');
      } else {
        const errorMessage = data.username ? data.username[0] : data.password ? data.password[0] : data.password_confirm ? data.password_confirm[0] : data.detail || 'Ошибка регистрации.';
        Alert.alert('Ошибка регистрации', errorMessage);
      }
    } catch (error: any) {
      Alert.alert('Ошибка сети', 'Не удалось подключиться к серверу.');
      console.error(error);
    } finally {
      setIsLoading(false); // Выключаем индикатор загрузки в любом случае
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Регистрация</Text>
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
      <TextInput
        style={styles.input}
        placeholder="Подтвердите пароль"
        value={passwordConfirm}
        onChangeText={setPasswordConfirm}
        secureTextEntry
        editable={!isLoading}
      />
      <Button title={isLoading ? "Регистрация..." : "Зарегистрироваться"} onPress={handleRegister} disabled={isLoading} />
      {isLoading && <ActivityIndicator size="small" color="#0000ff" style={styles.activityIndicator} />}
      
      <Button title="Уже есть аккаунт? Войти" onPress={() => navigation.navigate('Login')} disabled={isLoading} />
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

export default RegisterScreen;