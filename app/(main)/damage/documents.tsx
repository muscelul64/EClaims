import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCameraStore } from '@/stores/use-camera-store';
import { useTranslation } from 'react-i18next';

const DocumentCard = ({ 
  title, 
  description, 
  icon, 
  count,
  onPress 
}: {
  title: string;
  description: string;
  icon: string;
  count: number;
  onPress: () => void;
}) => {
  const cardColor = useThemeColor({}, 'tint');
  
  return (
    <TouchableOpacity onPress={onPress} style={[styles.documentCard, { backgroundColor: cardColor }]}>
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <ThemedText style={styles.cardIcon}>{icon}</ThemedText>
        </View>
        <View style={styles.cardText}>
          <ThemedText style={styles.cardTitle}>{title}</ThemedText>
          <ThemedText style={styles.cardDescription}>{description}</ThemedText>
        </View>
        <View style={styles.countContainer}>
          <ThemedText style={styles.countText}>{count}</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function DocumentsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { getPhotosByType } = useCameraStore();
  const backgroundColor = useThemeColor({}, 'background');

  const documents = [
    {
      id: 'id',
      title: t('camera.id'),
      description: t('camera.idMessage'),
      icon: '🆔',
      route: '/damage/camera/id'
    },
    {
      id: 'license',
      title: t('camera.drivingLicense'),
      description: t('camera.licenseMessage'),
      icon: '📄',
      route: '/damage/camera/license'
    },
    {
      id: 'registration',
      title: t('camera.registration'),
      description: t('camera.registrationMessage'),
      icon: '📋',
      route: '/damage/camera/registration'
    }
  ];

  const getDocumentCount = (type: string) => {
    return getPhotosByType(type as any).length;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText>← {t('common.back')}</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{t('damage.documents')}</ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructions}>
          <ThemedText style={styles.instructionsTitle}>
            {t('damage.documentsInstructions')}
          </ThemedText>
          <ThemedText style={styles.instructionsText}>
            {t('damage.documentsDescription')}
          </ThemedText>
        </View>

        {/* Document Cards */}
        <View style={styles.documentsContainer}>
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              title={doc.title}
              description={doc.description}
              icon={doc.icon}
              count={getDocumentCount(doc.id)}
              onPress={() => router.push(doc.route as any)}
            />
          ))}
        </View>

        {/* Tips Section */}
        <View style={styles.tips}>
          <ThemedText style={styles.tipsTitle}>{t('damage.photoTips')}</ThemedText>
          <View style={styles.tipItem}>
            <ThemedText style={styles.tipText}>• {t('damage.tip1')}</ThemedText>
          </View>
          <View style={styles.tipItem}>
            <ThemedText style={styles.tipText}>• {t('damage.tip2')}</ThemedText>
          </View>
          <View style={styles.tipItem}>
            <ThemedText style={styles.tipText}>• {t('damage.tip3')}</ThemedText>
          </View>
        </View>
      </ScrollView>
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
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructions: {
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  documentsContainer: {
    marginBottom: 30,
  },
  documentCard: {
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 15,
  },
  cardIcon: {
    fontSize: 32,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#FFF',
    opacity: 0.9,
  },
  countContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tips: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    padding: 15,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tipItem: {
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 18,
    opacity: 0.8,
  },
});