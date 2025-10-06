import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator, RefreshControl, TouchableOpacity, Button } from 'react-native';
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native'; // <--- ДОБАВИЛ NavigationProp
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../AuthContext';
import api from '../../utils/api';

// --- Типизация для RootStackParamList ---
// ОБЯЗАТЕЛЬНО должна совпадать с App.tsx!
type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  CreateEvent: undefined;
  EventDetail: { eventId: number; eventTitle: string };
};

// Типы для Event
interface Event {
  id: number;
  title: string;
  description: string | null;
  location: string;
  event_time: string; // ISO string
  organizer: number; // ID пользователя
  required_participants: number | null;
  current_participants: number;
  required_funds: string | null; // DecimalField в Django, обычно строка в JSON
  current_funds: string; // DecimalField в Django, обычно строка в JSON
}

const MainScreen: React.FC = () => { // <--- ИСПОЛЬЗУЕМ React.FC ДЛЯ ЛУЧШЕЙ ТИПИЗАЦИИ
  const navigation = useNavigation<NavigationProp<RootStackParamList>>(); // <--- ТИПИЗАЦИЯ ДЛЯ NAVIGATION
  const { user, logout, loading: authLoading, authenticated } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Функция для выхода (объявлена до использования) ---
  const handleLogout = useCallback(() => {
    Alert.alert(
      "Выход",
      "Вы уверены, что хотите выйти?",
      [
        { text: "Отмена", style: "cancel" },
        { text: "Выйти", onPress: logout }
      ],
      { cancelable: true }
    );
  }, [logout]);


  // --- Установка опций навигации (для заголовка и кнопок в шапке) ---
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: user ? `Привет, ${user.username}!` : 'Главная',
      headerRight: () => (
        <Button onPress={handleLogout} title="Выйти" color="#FF3B30" />
      ),
      headerLeft: () => ( // <--- Добавил кнопку "Создать" в заголовок
        <Button onPress={() => navigation.navigate('CreateEvent')} title="Создать" color="#007AFF" />
      ),
    });
  }, [navigation, user, handleLogout]); // handleLogout теперь в зависимостях

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/events/');
      setEvents(response.data);
    } catch (err: any) {
      console.error('Error fetching events:', err.response?.data || err.message);
      if (err.response && err.response.status === 401) {
        Alert.alert('Сессия истекла', 'Пожалуйста, войдите снова.', [
          { text: 'OK', onPress: logout }
        ]);
      } else {
        setError('Не удалось загрузить события. ' + (err.response?.data?.detail || err.message));
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [logout]);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
      return () => {
        setIsLoading(true);
      };
    }, [fetchEvents])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchEvents();
  };

   // --- Компонент для рендера карточки события ---
  const renderEventCard = useCallback(({ item }: { item: Event }) => { // <--- Явная типизация для renderItem
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.eventCard}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id, eventTitle: item.title })}
      >
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventLocation}>{item.location}</Text>
        <Text style={styles.eventTime}>
          {new Date(item.event_time).toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        {item.required_participants !== null && ( // Проверяем на null
          <Text style={styles.eventParticipants}>Участники: {item.current_participants || 0} / {item.required_participants}</Text>
        )}
        {item.required_funds && parseFloat(item.required_funds) > 0 && (
          <Text style={styles.eventFunds}>
            Собрано: {parseFloat(item.current_funds || "0").toFixed(2)} / {parseFloat(item.required_funds).toFixed(2)} руб.
          </Text>
        )}
        <View style={styles.detailsButtonContainer}>
          <Text style={styles.detailsButtonText}>Подробнее</Text>
        </View>
      </TouchableOpacity>
    );
  }, [navigation]); // navigation в зависимостях useCallback

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Загрузка событий...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchEvents}>
          <Text style={styles.retryButtonText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {events.length === 0 ? (
        <View style={styles.emptyListContainer}>
          <Text style={styles.emptyListText}>Событий пока нет.</Text>
          <Text style={styles.emptyListHintText}>Будьте первым, кто создаст событие!</Text>
          {/* Кнопка "Создать" будет в шапке, но можно продублировать и тут */}
          {/* <TouchableOpacity
            style={styles.createEventButton}
            onPress={() => navigation.navigate('CreateEvent')}
          >
            <Text style={styles.createEventButtonText}>Создать новое событие</Text>
          </TouchableOpacity> */}
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventCard} // <--- ИСПОЛЬЗУЕМ ОБЪЯВЛЕННЫЙ renderEventCard
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.flatListContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
        />
      )}

      {/* Кнопка "Создать новое событие" теперь только в заголовке, убрана из футера */}
      {/* Если хотите вернуть её в футер, раскомментируйте, но лучше оставить в заголовке для чистоты */}
      {/* {events.length > 0 && (
        <TouchableOpacity
          style={styles.createEventButton}
          onPress={() => navigation.navigate('CreateEvent')}
        >
          <Text style={styles.createEventButtonText}>Создать новое событие</Text>
        </TouchableOpacity>
      )} */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyListText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  emptyListHintText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  flatListContent: {
    paddingBottom: 15,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  eventLocation: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  eventTime: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  eventParticipants: {
    fontSize: 14,
    color: '#555',
    marginBottom: 3,
  },
  eventFunds: {
    fontSize: 14,
    color: '#0052cc',
    fontWeight: '500',
    marginBottom: 10,
  },
  detailsButtonContainer: {
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  detailsButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createEventButton: { // Этот стиль теперь используется только для кнопки в emptyListContainer
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  createEventButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MainScreen;