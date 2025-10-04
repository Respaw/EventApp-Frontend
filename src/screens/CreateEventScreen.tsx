// CreateEventScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../AuthContext';  // Путь к AuthContext: из src/screens/ -> src/AuthContext.tsx, это один ../
import api from '../../utils/api'; // <-- ИСПРАВЛЕННЫЙ ПУТЬ К API.TS
import { format } from 'date-fns';

function CreateEventScreen({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventTime, setEventTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const { authState, onLogout } = useAuth();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [requiredFunds, setRequiredFunds] = useState('');
  const [requiredParticipants, setRequiredParticipants] = useState('');

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || eventTime;
    setShowDatePicker(Platform.OS === 'ios');
    setEventTime(currentDate);
  };

  const onChangeTime = (event: any, selectedTime?: Date) => {
    const currentTime = selectedTime || eventTime;
    setShowTimePicker(Platform.OS === 'ios');
    setEventTime(currentTime);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const showTimepicker = () => {
    setShowTimePicker(true);
  };

  const handleCreateEvent = async () => {
    if (!authState?.accessToken) {
      Alert.alert('Ошибка', 'Токен доступа отсутствует. Пожалуйста, войдите снова.');
      onLogout();
      navigation.navigate('Login');
      return;
    }

    if (!title.trim() || !location.trim() || !eventTime) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все обязательные поля: название, место и время.');
      return;
    }

    const parsedFunds = parseFloat(requiredFunds);
    const parsedParticipants = parseInt(requiredParticipants, 10);

    if (requiredFunds.trim() !== '' && (isNaN(parsedFunds) || parsedFunds < 0)) {
        Alert.alert('Ошибка', 'Целевая сумма должна быть положительным числом.');
        return;
    }
    if (requiredParticipants.trim() !== '' && (isNaN(parsedParticipants) || parsedParticipants < 1)) {
        Alert.alert('Ошибка', 'Количество участников должно быть целым числом, не менее 1.');
        return;
    }

    setIsLoading(true);

    try {
      const eventTimeISO = eventTime.toISOString();

      const response = await api.post('/events/', {
        title,
        description: description.trim() === '' ? null : description,
        location,
        event_time: eventTimeISO,
        required_participants: requiredParticipants.trim() === '' ? null : parsedParticipants,
        required_funds: requiredFunds.trim() === '' ? null : parsedFunds,
      });

      Alert.alert('Успех', 'Событие успешно создано!');
      navigation.goBack();
    } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            Alert.alert('Сессия истекла', 'Пожалуйста, войдите снова.');
            onLogout();
        } else {
            const errorMessage = error.response?.data?.detail || error.message || 'Неизвестная ошибка';
            Alert.alert('Не удалось создать событие', JSON.stringify(errorMessage));
            console.error("API Error:", error.response?.data || error);
        }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Название события:</Text>
      <TextInput
        style={styles.input}
        placeholder="Например, День рождения"
        value={title}
        onChangeText={setTitle}
        editable={!isLoading}
      />

      <Text style={styles.label}>Описание (необязательно):</Text>
      <TextInput
        style={styles.input}
        placeholder="Подробности о событии"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        editable={!isLoading}
      />

      <Text style={styles.label}>Место проведения:</Text>
      <TextInput
        style={styles.input}
        placeholder="Например, Кафе 'Удача'"
        value={location}
        onChangeText={setLocation}
        editable={!isLoading}
      />

      <Text style={styles.label}>Целевая сумма (необязательно, руб.):</Text>
      <TextInput
        style={styles.input}
        placeholder="Например, 1000.00"
        value={requiredFunds}
        onChangeText={setRequiredFunds}
        keyboardType="numeric"
        editable={!isLoading}
      />

      <Text style={styles.label}>Количество участников (необязательно):</Text>
      <TextInput
        style={styles.input}
        placeholder="Например, 5"
        value={requiredParticipants}
        onChangeText={setRequiredParticipants}
        keyboardType="numeric"
        editable={!isLoading}
      />

      <TouchableOpacity onPress={showDatepicker} style={styles.datePickerButton} disabled={isLoading}>
        <Text style={styles.datePickerButtonText}>Дата: {format(eventTime, 'dd.MM.yyyy')}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          testID="datePicker"
          value={eventTime}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}
      <TouchableOpacity onPress={showTimepicker} style={styles.datePickerButton} disabled={isLoading}>
        <Text style={styles.datePickerButtonText}>Время: {format(eventTime, 'HH:mm')}</Text>
      </TouchableOpacity>
      {showTimePicker && (
        <DateTimePicker
          testID="timePicker"
          value={eventTime}
          mode="time"
          display="default"
          onChange={onChangeTime}
        />
      )}

      <Button
        title={isLoading ? "Создание..." : "Создать событие"}
        onPress={handleCreateEvent}
        disabled={isLoading}
      />
      {isLoading && <ActivityIndicator size="small" color="#0000ff" style={styles.activityIndicator} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  label: {
    fontSize: 18,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  datePickerButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  activityIndicator: {
    marginTop: 10,
  },
});

export default CreateEventScreen;