import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
//import { useUserStore } from '@/stores/use-user-store';
import { useTranslation } from 'react-i18next';

export default function StatementTimeScreen() {
  const router = useRouter();
  const { time } = useLocalSearchParams();
  const { t } = useTranslation();
  //const { user } = useUserStore();
  
  const [eventDate, setEventDate] = useState(() => {
    if (time && typeof time === 'string') {
      return new Date(time);
    }
    return new Date();
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#e1e1e1', dark: '#333' }, 'icon');

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEventDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(eventDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setEventDate(newDate);
    }
  };

  const validateDateTime = () => {
    const now = new Date();
    const maxDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    const minDate = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48 hours ago

    if (eventDate < minDate) {
      Alert.alert(
        t('dates.invalidDate') || 'Invalid Date',
        t('statementTime.tooFarPast') || 'The selected time is too far in the past',
        [{ text: t('common.ok') || 'OK' }]
      );
      return false;
    }

    if (eventDate > maxDate) {
      Alert.alert(
        t('dates.invalidDate') || 'Invalid Date', 
        t('statementTime.tooFarFuture') || 'The selected time is too far in the future',
        [{ text: t('common.ok') || 'OK' }]
      );
      return false;
    }

    return true;
  };

  const handleContinue = () => {
    if (!validateDateTime()) {
      return;
    }

    // Navigate to location/GPS screen
    router.push({
      pathname: '/statements/location',
      params: { 
        time: eventDate.toISOString()
      }
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedButton
          title={t('common.back')}
          onPress={() => router.back()}
          variant="secondary"
          style={styles.headerButton}
        />
        <ThemedText style={styles.headerTitle}>
          {t('statementTime.title')}
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <ThemedText style={styles.sectionTitle}>
            {t('statementTime.whenDidItHappen')}
          </ThemedText>
          
          <ThemedText style={styles.description}>
            {t('statementTime.description')}
          </ThemedText>

          {/* Date Selection */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('statementTime.date')}</ThemedText>
            <TouchableOpacity
              style={[styles.dateTimeButton, { borderColor }]}
              onPress={() => setShowDatePicker(true)}
            >
              <ThemedText style={styles.dateTimeText}>
                {formatDate(eventDate)}
              </ThemedText>
              <ThemedText style={styles.dateTimeIcon}>📅</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Time Selection */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>{t('statementTime.time')}</ThemedText>
            <TouchableOpacity
              style={[styles.dateTimeButton, { borderColor }]}
              onPress={() => setShowTimePicker(true)}
            >
              <ThemedText style={styles.dateTimeText}>
                {formatTime(eventDate)}
              </ThemedText>
              <ThemedText style={styles.dateTimeIcon}>⏰</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Current Event Time Display */}
          <View style={styles.summaryContainer}>
            <ThemedText style={styles.summaryTitle}>
              {t('statementTime.eventTime')}
            </ThemedText>
            <ThemedText style={styles.summaryText}>
              {formatDate(eventDate)} {t('statementTime.at')} {formatTime(eventDate)}
            </ThemedText>
          </View>

          {/* Important Notes */}
          <View style={styles.notesContainer}>
            <ThemedText style={styles.notesTitle}>
              {t('statementTime.importantNotes')}
            </ThemedText>
            <ThemedText style={styles.notesText}>
              • {t('statementTime.note1')}
            </ThemedText>
            <ThemedText style={styles.notesText}>
              • {t('statementTime.note2')}
            </ThemedText>
            <ThemedText style={styles.notesText}>
              • {t('statementTime.note3')}
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <ThemedButton
          title={t('common.continue')}
          onPress={handleContinue}
          variant="primary"
          style={styles.continueButton}
        />
      </View>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={eventDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
          minimumDate={new Date(Date.now() - 48 * 60 * 60 * 1000)}
        />
      )}
      
      {showTimePicker && (
        <DateTimePicker
          value={eventDate}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
  },
  headerButton: {
    minWidth: 80,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 80,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    minHeight: 50,
  },
  dateTimeText: {
    fontSize: 16,
    flex: 1,
  },
  dateTimeIcon: {
    fontSize: 20,
  },
  summaryContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 15,
    marginVertical: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
  },
  notesContainer: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#FF9800',
  },
  notesText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
    opacity: 0.8,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  continueButton: {
    backgroundColor: '#2196F3',
  },
});