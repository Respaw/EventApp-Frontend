import React, { useState, useCallback, useEffect } from 'react'; // <--- ДОБАВЛЕН useEffect
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // <--- Обновленный импорт
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native'; // <--- ДОБАВЛЕН useRoute
// import AsyncStorage from '@react-native-async-storage/async-storage'; // <--- Больше не нужен, используем api
import { useAuth } from '../AuthContext';
import api from '..//../utils/api'; // <--- Импортируем наш настроенный api

// Типы для детальной информации
type Participant = {
  id: number;
  participant_username: string;
  status: string; // "joined" или "not_joined"
  paid_amount: string; // Сумма приходит как строка
};

// <--- ДОБАВЛЕНА ТИПИЗАЦИЯ ДЛЯ EventDetailRouteParamList
type EventDetailRouteParamList = {
  EventDetail: {
    eventId: number;
    eventTitle: string;
  };
};

type EventDetailRouteProp = RouteProp<EventDetailRouteParamList, 'EventDetail'>;


type EventDetails = {
  id: number;
  title: string;
  description: string; // Добавлено, если описание приходит с бэкенда
  location: string;
  required_funds: string; // Это строка, как в нашей модели
  current_funds: string; // Новое поле для общей собранной суммы
  participants: Participant[];
  organizer: { // Добавлено для проверки организатора
    id: number;
    username: string;
  }
};

// Принимаем props навигации с явной типизацией
function EventDetailScreen() { // <--- Убрал { route, navigation }: any
  const navigation = useNavigation(); // <--- Используем useNavigation hook
  const route = useRoute<EventDetailRouteProp>(); // <--- Используем useRoute hook для типизации параметров
  const { eventId, eventTitle } = route.params; // <--- Получаем eventTitle

  const { user, logout, authenticated } = useAuth(); // <--- ИЗМЕНЕНО: logout вместо onLogout
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isContributing, setIsContributing] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');

  // Устанавливаем заголовок экрана
  useEffect(() => {
    navigation.setOptions({ title: eventTitle || 'Детали события' });
  }, [navigation, eventTitle]);


  const fetchEventDetails = useCallback(async () => {
    setIsLoadingDetails(true);
    try {
      // ИСПОЛЬЗУЕМ API (Axios) ВМЕСТО fetch
      const response = await api.get(`/events/${eventId}/`);
      setEvent(response.data);
    } catch (error: any) {
      console.error("Error fetching event detail:", error.response?.data || error.message);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        // Если 401/403, то разлогиниваемся
        logout();
        // Навигация теперь будет обработана App.tsx
      }
      Alert.alert('Ошибка', error.response?.data?.detail || 'Не удалось загрузить детали события');
    } finally {
      setIsLoadingDetails(false);
    }
  }, [eventId, logout]); // <--- logout в зависимостях

  useFocusEffect(
    useCallback(() => {
      fetchEventDetails();
    }, [fetchEventDetails])
  );
  
  const handleJoinEvent = async () => {
    if (!authenticated) {
      Alert.alert('Внимание', 'Для присоединения необходимо войти в систему.');
      return;
    }

    try {
      // ИСПОЛЬЗУЕМ API (Axios) ВМЕСТО fetch
      const response = await api.post(`/events/${eventId}/join/`);
      Alert.alert('Успех!', response.data.status || 'Вы успешно присоединились к событию!');
      fetchEventDetails(); // Обновляем информацию об участниках
    } catch (error: any) {
      console.error("Error joining event:", error.response?.data || error.message);
      Alert.alert('Ошибка', error.response?.data?.detail || 'Не удалось присоединиться.');
    }
  };

   const handleContribute = async () => {
    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Ошибка', 'Пожалуйста, введите корректную сумму.');
      return;
    }
    if (!authenticated) {
      Alert.alert('Внимание', 'Для внесения средств необходимо войти в систему.');
      return;
    }
    
    setIsContributing(true);

    try {
      // ИСПОЛЬЗУЕМ API (Axios) ВМЕСТО fetch
      const response = await api.post(`/events/${eventId}/contribute/`, { amount });
      setContributionAmount('');
      Alert.alert('Успех!', response.data.status || 'Ваш взнос принят!');
      fetchEventDetails(); // Обновляем данные после взноса
    } catch (error: any) {
      console.error("Error contributing:", error.response?.data || error.message);
      Alert.alert('Ошибка', error.response?.data?.detail || 'Не удалось внести платеж.');
    } finally {
      setIsContributing(false);
    }
  };

  const isParticipant = event?.participants.some(
    p => p.participant_username === user?.username
  );

  // Проверяем, является ли текущий пользователь организатором
  const isOrganizer = user && event?.organizer.id === user.id;

  if (isLoadingDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Загрузка деталей события...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Событие не найдено или произошла ошибка загрузки.</Text>
        <Button title="Назад" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const collectedFunds = parseFloat(event.current_funds || "0").toFixed(2);
  const requiredFunds = parseFloat(event.required_funds || "0").toFixed(2);
  const descriptionText = event.description ? event.description.trim() : '';


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.location}>{event.location}</Text>
        {descriptionText ? (
          <Text style={styles.description}>{descriptionText}</Text>
        ) : (
          <Text style={styles.noDescription}>Описание отсутствует</Text>
        )}
        {isOrganizer && <Text style={styles.organizerNote}>Вы организатор этого события.</Text>}
      </View>

      <View style={styles.tabContainer}>
        <View style={[styles.tab, styles.activeTab]}>
          <Text style={styles.activeTabText}>Участники ({event.participants.length})</Text>
        </View>
        <View style={styles.tab}>
          <Text style={styles.tabText}>Чат (скоро)</Text> {/* <--- Обернул в Text */}
        </View>
      </View>
      
      {parseFloat(event.required_funds || "0") > 0 && (
        <View style={styles.financialsContainer}>
          <Text style={styles.financialsText}> {/* <--- Обернул в Text */}
            Собрано: {collectedFunds} из {requiredFunds} руб.
          </Text>
        </View>
      )}


      <FlatList
        data={event.participants}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.participantRow}>
            <Text style={styles.participantName}>{item.participant_username}</Text>
            <Text style={styles.participantStatus}>Внес: {parseFloat(item.paid_amount).toFixed(2)} руб.</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Пока нет участников</Text>}
      />

      <View style={styles.footer}>
        {authenticated ? (
          isParticipant ? (
            <View>
              {parseFloat(event.required_funds || "0") > 0 && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Сумма взноса, руб."
                    keyboardType="numeric"
                    value={contributionAmount}
                    onChangeText={setContributionAmount}
                    editable={!isContributing}
                  />
                  <TouchableOpacity
                    style={[styles.actionButton, isContributing && styles.disabledButton]}
                    onPress={handleContribute}
                    disabled={isContributing}
                  >
                    {isContributing ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.actionButtonText}>Внести средства</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            // Пользователь аутентифицирован, но не участник (и не организатор)
            !isOrganizer && (
              <TouchableOpacity style={styles.actionButton} onPress={handleJoinEvent}>
                <Text style={styles.actionButtonText}>Присоединиться к событию</Text>
              </TouchableOpacity>
            )
          )
        ) : (
          <Text style={styles.authPrompt}>Войдите в систему, чтобы участвовать или внести взнос.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F3F3F3' 
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  container: { flex: 1, backgroundColor: '#F3F3F3' },
  header: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  location: { fontSize: 16, color: '#666', marginTop: 4 },
  description: { 
    fontSize: 15, 
    color: '#555', 
    marginTop: 10, 
    lineHeight: 22 
  },
  noDescription: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 10,
  },
  organizerNote: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  tabContainer: { flexDirection: 'row', backgroundColor: 'white', paddingHorizontal: 20, paddingTop: 10, borderBottomWidth: 1, borderColor: '#eee' },
  tab: { paddingVertical: 10, paddingHorizontal: 15, borderBottomWidth: 2, borderColor: 'transparent' },
  activeTab: { borderBottomColor: '#007AFF' },
  tabText: { fontSize: 16, color: '#666' },
  activeTabText: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  participantRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 15, 
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderColor: '#eee',
    alignItems: 'center',
  },
  participantName: { fontSize: 16, color: '#333' },
  participantStatus: { fontSize: 14, color: '#888' },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#666' },
  footer: { 
    padding: 20, 
    borderTopWidth: 1, 
    borderColor: '#eee', 
    backgroundColor: 'white',
    // position: 'absolute', // Если хотите, чтобы футер был всегда внизу
    // bottom: 0,
    // left: 0,
    // right: 0,
  },
  financialsContainer: { 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    backgroundColor: '#eef5ff',
    borderBottomWidth: 1, 
    borderColor: '#ddeeff',
  },
  financialsText: { 
    fontSize: 16, 
    fontWeight: '500', 
    color: '#0052cc' 
  },
  input: { 
    height: 48, 
    borderColor: '#ddd', 
    borderWidth: 1, 
    marginBottom: 12, 
    paddingHorizontal: 12, 
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabledButton: {
    backgroundColor: '#a0c7ff', // Более бледный цвет для отключенной кнопки
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  authPrompt: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 10,
  },
});


export default EventDetailScreen;