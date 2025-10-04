import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../AuthContext';

// Типы для детальной информации
type Participant = {
  id: number;
  participant_username: string;
  status: string;
  paid_amount: string; // Сумма приходит как строка
};

type EventDetails = {
  id: number;
  title: string;
  location: string;
  required_funds: string; // Это строка, как в нашей модели
  total_collected: number;
  participants: Participant[];
};

function EventDetailScreen({ route, navigation }: any) {
  const { eventId } = route.params;
  const { user, onLogout } = useAuth();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false); // Для загрузки деталей события
  const [isContributing, setIsContributing] = useState(false); // Для кнопки "Внести"
  const [contributionAmount, setContributionAmount] = useState('');

  const fetchEventDetails = useCallback(async () => {
    setIsLoadingDetails(true); // Включаем индикатор загрузки деталей
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        onLogout();
        navigation.navigate('Login'); 
        return;
      }
      const response = await fetch(`http://127.0.0.1:8000/api/v1/events/${eventId}/`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          onLogout();
          navigation.navigate('Login');
        }
        throw new Error('Не удалось загрузить детали события');
      }
      const data: EventDetails = await response.json();
      setEvent(data);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setIsLoadingDetails(false); // Выключаем индикатор загрузки деталей
    }
  }, [eventId, onLogout, navigation]);

  useFocusEffect(
    useCallback(() => {
      fetchEventDetails();
    }, [fetchEventDetails])
  );
  
  const handleJoinEvent = async () => {
    // Здесь тоже можно добавить isLoading, если захочешь
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        onLogout();
        navigation.navigate('Login');
        return;
      }
      const response = await fetch(`http://127.0.0.1:8000/api/v1/events/${eventId}/join/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.status || 'Не удалось присоединиться');
      }
      Alert.alert('Успех!', data.status);
      fetchEventDetails(); // Обновляем информацию об участниках
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    }
  };

   const handleContribute = async () => {
    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Ошибка', 'Пожалуйста, введите корректную сумму.');
      return;
    }
    
    setIsContributing(true); // ВКЛЮЧАЕМ ИНДИКАТОР ВЗНОСА

    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
       if (!accessToken) {
        onLogout();
        navigation.navigate('Login');
        return;
      }
      const response = await fetch(`http://127.0.0.1:8000/api/v1/events/${eventId}/contribute/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ amount }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.status || 'Не удалось внести платеж');
      }
      // Предполагаем, что бэкенд возвращает обновленное событие или статус
      // Лучше всего перезапросить данные
      // setEvent(data); // Если бэкенд возвращает полное событие
      setContributionAmount(''); // Очищаем поле ввода
      Alert.alert('Успех!', 'Ваш взнос принят!');
      fetchEventDetails(); // Обновляем данные после взноса
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setIsContributing(false); // ВЫКЛЮЧАЕМ ИНДИКАТОР ВЗНОСА В ЛЮБОМ СЛУЧАЕ
    }
  };

  const isParticipant = event?.participants.some(
    p => p.participant_username === user?.username
  );

  if (isLoadingDetails) { // Этот isLoading относится к загрузке ВСЕХ деталей события
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" /></View>;
  }

  if (!event) {
    return <View style={styles.container}><Text>Событие не найдено.</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.location}>{event.location}</Text>
      </View>
      <View style={styles.tabContainer}>
        <View style={[styles.tab, styles.activeTab]}>
          <Text style={styles.activeTabText}>Участники ({event.participants.length})</Text>
        </View>
        <View style={styles.tab}>
          <Text style={styles.tabText}>Чат</Text>
        </View>
      </View>
      
      <View style={styles.financialsContainer}>
        <Text style={styles.financialsText}>
          Собрано: {event.total_collected} из {event.required_funds} руб.
        </Text>
      </View>

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

      {isParticipant && (
        <View style={styles.footer}>
          <TextInput
            style={styles.input}
            placeholder="Сумма, руб."
            keyboardType="numeric"
            value={contributionAmount}
            onChangeText={setContributionAmount}
            editable={!isContributing}
          />
          <Button
            title={isContributing ? "Внесение..." : "Внести"}
            onPress={handleContribute}
            disabled={isContributing}
          />
          {isContributing && <ActivityIndicator size="small" color="#0000ff" style={styles.activityIndicator} />}
        </View>
      )}

      {!isParticipant && (
        <View style={styles.footer}>
          <Button title="Присоединиться к событию" onPress={handleJoinEvent} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#F3F3F3' },
  header: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 28, fontWeight: 'bold' },
  location: { fontSize: 16, color: '#666', marginTop: 4 },
  tabContainer: { flexDirection: 'row', backgroundColor: 'white', paddingHorizontal: 20, paddingTop: 10, },
  tab: { paddingVertical: 10, paddingHorizontal: 15, borderBottomWidth: 2, borderColor: 'transparent' },
  activeTab: { borderBottomColor: '#007AFF' },
  tabText: { fontSize: 16, color: '#666' },
  activeTabText: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  participantRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#eee' },
  participantName: { fontSize: 16 },
  participantStatus: { fontSize: 14, color: '#888' },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#666' },
  footer: { padding: 20, borderTopWidth: 1, borderColor: '#eee', backgroundColor: 'white' },
  financialsContainer: { 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    backgroundColor: '#eef5ff' 
  },
  financialsText: { 
    fontSize: 16, 
    fontWeight: '500', 
    color: '#0052cc' 
  },
  input: { 
    height: 40, 
    borderColor: 'gray', 
    borderWidth: 1, 
    marginBottom: 12, 
    paddingHorizontal: 8, 
    borderRadius: 8 
  },
  activityIndicator: {
    marginTop: 10,
  },
});


export default EventDetailScreen;