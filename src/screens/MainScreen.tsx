import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Button, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../AuthContext';

// Типы для Event
type Event = {
  id: number;
  title: string;
  location: string;
  organizer: string;
  participants_count: number;
};

function MainScreen({ navigation }: any) {
  const { authState, onLogout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Для загрузки списка событий

  const fetchEvents = useCallback(async () => {
    if (!authState?.accessToken) return; // Не пытаемся загрузить, если нет токена

    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/events/', {
        headers: {
          'Authorization': `Bearer ${authState.accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          Alert.alert('Сессия истекла', 'Пожалуйста, войдите снова.');
          onLogout();
        }
        throw new Error('Не удалось загрузить события');
      }

      const data: Event[] = await response.json();
      setEvents(data);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [authState?.accessToken, onLogout]); // Зависимость от токена и onLogout

  // Используем useFocusEffect для перезагрузки данных при фокусе на экране
  useFocusEffect(
    useCallback(() => {
      if (authState?.authenticated) {
        fetchEvents();
      }
      return () => {
        // Очистка при разфокусировке, если нужно
      };
    }, [authState?.authenticated, fetchEvents])
  );

  const handleCreateEventPress = () => {
    navigation.navigate('CreateEvent');
  };

  const handleEventPress = (eventId: number) => {
    navigation.navigate('EventDetail', { eventId });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Загрузка событий...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Мои события</Text>
        <Button title="Выйти" onPress={onLogout} />
      </View>
      
      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.eventCard} onPress={() => handleEventPress(item.id)}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventLocation}>{item.location}</Text>
            <View style={styles.eventInfo}>
              <Text style={styles.eventOrganizer}>Организатор: {item.organizer}</Text>
              <Text style={styles.eventParticipants}>Участников: {item.participants_count}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>У вас пока нет событий. Создайте первое!</Text>}
        refreshing={isLoading}
        onRefresh={fetchEvents}
      />

      <View style={styles.footer}>
        <Button title="Создать событие" onPress={handleCreateEventPress} />
      </View>
    </SafeAreaView>
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
  container: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  eventCard: {
    backgroundColor: 'white',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  eventInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingTop: 8,
  },
  eventOrganizer: {
    fontSize: 12,
    color: '#888',
  },
  eventParticipants: {
    fontSize: 12,
    color: '#888',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: 'white',
  },
});

export default MainScreen;