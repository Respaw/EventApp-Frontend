import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // <--- ИСПРАВЛЕННЫЙ ИМПОРТ
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useNavigation, NavigationProp } from '@react-navigation/native'; // <--- ДОБАВЛЕН NavigationProp
import api from '../../utils/api'; // Проверьте путь
import { useAuth } from '../AuthContext'; // Проверьте путь

// --- Типизация для RootStackParamList ---
// ОБЯЗАТЕЛЬНО должна совпадать с App.tsx!
type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  CreateEvent: undefined;
  EventDetail: { eventId: number; eventTitle: string };
};

const CreateEventScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>(); // <--- ТИПИЗАЦИЯ
  const { user } = useAuth(); // Получаем информацию о текущем пользователе
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [requiredParticipants, setRequiredParticipants] = useState('');
  const [requiredFunds, setRequiredFunds] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [eventTime, setEventTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false); // Состояние для индикатора загрузки

  useEffect(() => {
    navigation.setOptions({
      title: 'Создать новое событие',
    });
  }, [navigation]);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEventDate(selectedDate);
    }
  };

  const onChangeTime = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setEventTime(selectedTime);
    }
  };

  const handleCreateEvent = async () => {
    if (!title || !location) {
      Alert.alert('Ошибка', 'Пожалуйста, введите название и место проведения события.');
      return;
    }

    // Объединяем дату и время
    const combinedDateTime = new Date(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate(),
      eventTime.getHours(),
      eventTime.getMinutes()
    );

    setIsCreating(true); // Включаем индикатор
    try {
      const payload = {
        title,
        description: description || null, // Если описание пустое, отправляем null
        location,
        event_time: combinedDateTime.toISOString(),
        required_participants: requiredParticipants ? parseInt(requiredParticipants, 10) : null,
        required_funds: requiredFunds ? parseFloat(requiredFunds).toFixed(2) : null,
        // organizer_id не нужен, бэкенд берет его из токена
      };
      
      const response = await api.post('/events/', payload);
      // console.log('Event created:', response.data); // <--- Убедитесь, что эта строка не создает "Text strings"
      Alert.alert('Успех!', 'Событие успешно создано!');
      navigation.navigate('Main'); // Возвращаемся на главный экран
    } catch (error: any) {
      console.error('Error creating event:', error.response?.data || error.message);
      Alert.alert('Ошибка', error.response?.data?.detail || 'Не удалось создать событие.');
    } finally {
      setIsCreating(false); // Выключаем индикатор
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* <Text style={styles.title}>Создать новое событие</Text> */} {/* <--- Теперь в заголовке */}

      <Text style={styles.label}>Название события:</Text>
      <TextInput
        style={styles.input}
        placeholder="Название"
        value={title}
        onChangeText={setTitle}
        textContentType="none" // <--- ИСПРАВЛЕНИЕ
        autoComplete="off"     // <--- ИСПРАВЛЕНИЕ
      />

      <Text style={styles.label}>Описание (необязательно):</Text>
      <TextInput
        style={styles.input}
        placeholder="Подробности о событии"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        textContentType="none" // <--- ИСПРАВЛЕНИЕ
        autoComplete="off"     // <--- ИСПРАВЛЕНИЕ
      />

      <Text style={styles.label}>Место проведения:</Text>
      <TextInput
        style={styles.input}
        placeholder="Место проведения"
        value={location}
        onChangeText={setLocation}
        textContentType="addressCityAndState" // <--- Возможно, это более уместно
        autoComplete="address-line1"
      />

      <Text style={styles.label}>Количество участников (необязательно):</Text>
      <TextInput
        style={styles.input}
        placeholder="Например, 10"
        keyboardType="numeric" // <--- ИСПРАВЛЕНИЕ
        value={requiredParticipants}
        onChangeText={text => setRequiredParticipants(text.replace(/[^0-9]/g, ''))} // Только цифры
        textContentType="none" // <--- ИСПРАВЛЕНИЕ
        autoComplete="off"     // <--- ИСПРАВЛЕНИЕ
      />

      <Text style={styles.label}>Требуемые средства (необязательно):</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        keyboardType="numeric"
        value={requiredFunds}
        onChangeText={text => setRequiredFunds(text.replace(/[^0-9.]/g, ''))} // Только цифры и точка
        textContentType="none" // <--- ИСПРАВЛЕНИЕ
        autoComplete="off"     // <--- ИСПРАВЛЕНИЕ
      />

      <Text style={styles.label}>Дата:</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
        <Text style={styles.datePickerButtonText}>{format(eventDate, 'dd.MM.yyyy')}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={eventDate}
          mode="date"
          display="default"
          onChange={onChangeDate}
          minimumDate={new Date()}
        />
      )}

      <Text style={styles.label}>Время:</Text>
      <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.datePickerButton}>
        <Text style={styles.datePickerButtonText}>{format(eventTime, 'HH:mm')}</Text>
      </TouchableOpacity>
      {showTimePicker && (
        <DateTimePicker
          value={eventTime}
          mode="time"
          display="default"
          onChange={onChangeTime}
        />
      )}

      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateEvent}
        disabled={isCreating}
      >
        {isCreating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createButtonText}>Создать событие</Text>
        )}
      </TouchableOpacity>
      {/* <Text>Debug: {JSON.stringify(user)}</Text> */} {/* <--- Пример потенциального "Text strings" */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    marginTop: 15,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 5, // Уменьшил маржин, чтобы не было "белых" строк
    color: '#333',
  },
  datePickerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 5,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 25,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CreateEventScreen;