import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Button, Alert, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../AuthContext'; // Путь из src/screens/ к src/AuthContext.tsx
import api from '../../utils/api'; // Путь из src/screens/ к utils/api.ts

// Типы
interface Event {
  id: number;
  title: string;
  description: string | null;
  location: string;
  event_time: string; // ISO string
  organizer: number; // ID пользователя
  required_participants: number | null;
  current_participants: number; // Предполагаем, что бэкенд будет отдавать это
  required_funds: string | null; // DecimalField в Django, обычно строка в JSON
  current_funds: string; // Предполагаем, что бэкенд будет отдавать это
}

const MainScreen = ({ navigation }: any) => {
  // ИСПОЛЬЗУЕМ `logout` ИЗ НОВОГО AuthContext И `authState`
  const { authState, logout } = useAuth(); 
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // API-запрос к эндпоинту получения событий
      const response = await api.get('/events/'); // Убедитесь, что этот эндпоинт правильный
      setEvents(response.data);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      if (err.response && err.response.status === 401) {
        Alert.alert('Сессия истекла', 'Пожалуйста, войдите снова.', [
          { text: 'OK', onPress: logout } // Перенаправляем на вход при 401
        ]);
      } else {
        setError('Не удалось загрузить события. ' + (err.response?.data?.detail || err.message));
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [logout]); // logout теперь является зависимостью

  // Загрузка событий при фокусировке на экране
  useFocusEffect(
    useCallback(() => {
      fetchEvents();
      return () => {
        // Очистка при разфокусировке, если нужно
      };
    }, [fetchEvents])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchEvents();
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <View style={styles.eventCard}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventLocation}>{item.location}</Text>
      <Text style={styles.eventTime}>{new Date(item.event_time).toLocaleString()}</Text>
      {/* TODO: Добавить отображение суммы, участников, прогресс-бара */}
      <Button 
        title="Подробнее" 
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id, eventTitle: item.title })} 
      />
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Загрузка событий...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Повторить" onPress={fetchEvents} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>
        Привет, {authState.user?.username || 'пользователь'}!
      </Text>
      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.emptyListText}>Событий пока нет. Создайте первое!</Text>}
        contentContainerStyle={events.length === 0 && styles.emptyListContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      />
      {/* ИСПОЛЬЗУЕМ TouchableOpacity ВМЕСТО Button ДЛЯ СТИЛИЗАЦИИ */}
      <TouchableOpacity 
        style={styles.createButton} 
        onPress={() => navigation.navigate('CreateEvent')} 
      >
        <Text style={styles.createButtonText}>Создать новое событие</Text>
      </TouchableOpacity>
      
      {/* Кнопка "Выйти" может оставаться Button, если ей не нужны кастомные стили */}
      <Button title="Выйти" onPress={logout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f0f2f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  eventCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  eventLocation: {
    fontSize: 16,
    color: '#666',
    marginBottom: 3,
  },
  eventTime: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
  },
  emptyListText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#777',
    marginTop: 20,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
    createButton: {
    backgroundColor: '#007bff', // Пример цвета
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MainScreen;