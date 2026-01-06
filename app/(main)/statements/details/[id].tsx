import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { useCustomThemeColor, useThemeColor } from '@/hooks/use-theme-color';
import { ClaimStatement, useStatementsStore } from '@/stores/use-statements-store';
import { useTranslation } from 'react-i18next';

export default function StatementDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const { getStatement, deleteStatement, updateStatement } = useStatementsStore();
  const [statement, setStatement] = useState<ClaimStatement | null>(null);
  
  // Theme-aware status colors
  const getStatusColor = (status: string) => {
    const draftColor = useCustomThemeColor({ light: '#FF9800', dark: '#FFB74D' });
    const submittedColor = useCustomThemeColor({ light: '#2196F3', dark: '#64B5F6' });
    const processingColor = useCustomThemeColor({ light: '#FF5722', dark: '#FF7043' });
    const completedColor = useCustomThemeColor({ light: '#4CAF50', dark: '#66BB6A' });
    
    const colors = {
      draft: draftColor,
      submitted: submittedColor,
      processing: processingColor,
      completed: completedColor,
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };
  
  // Theme-aware severity colors
  const getSeverityColor = (severity: string) => {
    const minorColor = useCustomThemeColor({ light: '#4CAF50', dark: '#66BB6A' });
    const moderateColor = useCustomThemeColor({ light: '#FF9800', dark: '#FFB74D' });
    const severeColor = useCustomThemeColor({ light: '#F44336', dark: '#FF7043' });
    const defaultColor = useCustomThemeColor({ light: '#9E9E9E', dark: '#757575' });
    
    switch (severity) {
      case 'minor': return minorColor;
      case 'moderate': return moderateColor;
      case 'severe': return severeColor;
      default: return defaultColor;
    }
  };
  
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackgroundColor = useCustomThemeColor({ light: '#ffffff', dark: '#1c1c1c' });
  const borderColor = useCustomThemeColor({ light: '#e1e1e1', dark: '#333' });

  useEffect(() => {
    if (id) {
      const foundStatement = getStatement(id as string);
      setStatement(foundStatement || null);
    }
  }, [id, getStatement]);

  if (!statement) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <ThemedButton
            title={t('common.back')}
            onPress={() => router.back()}
            variant="secondary"
            style={styles.headerButton}
          />
          <ThemedText style={styles.headerTitle}>
            {t('statements.statementDetails')}
          </ThemedText>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            {t('statements.statementNotFound')}
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      t('statements.deleteStatement') || 'Delete Statement',
      t('statements.deleteConfirmation') || 'Are you sure you want to delete this statement?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.delete') || 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteStatement(statement.id);
            router.back();
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    if (statement.status === 'draft') {
      // Navigate to edit flow
      // For now, just show alert since edit is not implemented\n      Alert.alert(\n        'Edit Statement',\n        'Statement editing will be available in a future update.',\n        [{ text: String(t('common.ok')) }]\n      );
    } else {
      Alert.alert(
        t('statements.cannotEdit'),
        String(t('statements.cannotEditSubmitted')),
        [{ text: String(t('common.ok')) }]
      );
    }
  };

  const handleSubmit = () => {
    if (statement.status === 'draft') {
      Alert.alert(
        t('statements.submitStatement') || 'Submit Statement',
        t('statements.submitConfirmation') || 'Are you sure you want to submit this statement?',
        [
          { text: t('common.cancel') || 'Cancel', style: 'cancel' },
          {
            text: t('statements.submit') || 'Submit',
            onPress: () => {
              updateStatement(statement.id, {
                status: 'submitted',
                submittedAt: Date.now()
                // referenceNumber: `REF-${Date.now()}` // Commented out as not in interface
              });
              setStatement(prev => prev ? {
                ...prev,
                status: 'submitted',
                submittedAt: Date.now(),
                referenceNumber: `REF-${Date.now()}`
              } : null);
            }
          }
        ]
      );
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ro-RO');
  };

  const statusColor = STATUS_COLORS[statement.status];

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
          {t('statements.statementDetails')}
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusColor }]}>
          <ThemedText style={styles.statusTitle}>
            {t(`statementStatus.${statement.status}`)}
          </ThemedText>
          {/* statement.referenceNumber && (
            <ThemedText style={styles.reference}>
              {statement.referenceNumber}
            </ThemedText>
          ) */}
        </View>

        {/* Vehicle Information */}
        <View style={[styles.section, { backgroundColor: cardBackgroundColor, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>
            {t('statements.vehicleInfo')}
          </ThemedText>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>{t('vehicles.make')}:</ThemedText>
            <ThemedText style={styles.infoValue}>{statement.vehicle.make}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>{t('vehicles.model')}:</ThemedText>
            <ThemedText style={styles.infoValue}>{statement.vehicle.model}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>{t('vehicles.licensePlate')}:</ThemedText>
            <ThemedText style={styles.infoValue}>{statement.vehicle.licensePlate}</ThemedText>
          </View>
          {statement.vehicle.year && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>{t('vehicles.year')}:</ThemedText>
              <ThemedText style={styles.infoValue}>{statement.vehicle.year}</ThemedText>
            </View>
          )}
        </View>

        {/* Incident Information */}
        <View style={[styles.section, { backgroundColor: cardBackgroundColor, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>
            {t('statements.incidentInfo')}
          </ThemedText>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>{t('statements.type')}:</ThemedText>
            <ThemedText style={styles.infoValue}>
              {t(`statementType.${statement.type}`)}
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>{t('statements.date')}:</ThemedText>
            <ThemedText style={styles.infoValue}>
              {formatDate(statement.incidentDate)}
            </ThemedText>
          </View>
          {statement.location.address && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>{t('statements.location')}:</ThemedText>
              <ThemedText style={styles.infoValue}>{statement.location.address}</ThemedText>
            </View>
          )}
          {statement.description && (
            <View style={styles.infoColumn}>
              <ThemedText style={styles.infoLabel}>{t('statements.description')}:</ThemedText>
              <ThemedText style={[styles.infoValue, styles.descriptionText]}>
                {statement.description}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Damages */}
        {statement.damages.length > 0 && (
          <View style={[styles.section, { backgroundColor: cardBackgroundColor, borderColor }]}>
            <ThemedText style={styles.sectionTitle}>
              {t('statements.damages')} ({statement.damages.length})
            </ThemedText>
            {statement.damages.map((damage, index) => (
              <View key={damage.id} style={styles.damageItem}>
                <View style={styles.damageHeader}>
                  <ThemedText style={styles.damageArea}>{damage.area}</ThemedText>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(damage.severity) }]}>
                    <ThemedText style={styles.severityText}>
                      {t(`severity.${damage.severity}`)}
                    </ThemedText>
                  </View>
                </View>
                {damage.description && (
                  <ThemedText style={styles.damageDescription}>
                    {damage.description}
                  </ThemedText>
                )}
                {damage.photos.length > 0 && (
                  <ThemedText style={styles.damagePhotos}>
                    📷 {damage.photos.length} {t('statements.photos')}
                  </ThemedText>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Photos */}
        {statement.photos.length > 0 && (
          <View style={[styles.section, { backgroundColor: cardBackgroundColor, borderColor }]}>
            <ThemedText style={styles.sectionTitle}>
              {t('statements.photos')} ({statement.photos.length})
            </ThemedText>
            <View style={styles.photoStats}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statIcon}>📷</ThemedText>
                <ThemedText style={styles.statText}>
                  {statement.photos.filter(p => p.type === 'general').length} {t('photos.general')}
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statIcon}>🔍</ThemedText>
                <ThemedText style={styles.statText}>
                  {statement.photos.filter(p => p.type === 'general').length} {String(t('photos.general'))}
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statIcon}>📄</ThemedText>
                <ThemedText style={styles.statText}>
                  {statement.photos.filter(p => p.type === 'registration').length} {String(t('photos.documents'))}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Timestamps */}
        <View style={[styles.section, { backgroundColor: cardBackgroundColor, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>
            {t('statements.timeline')}
          </ThemedText>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>{t('statements.created')}:</ThemedText>
            <ThemedText style={styles.infoValue}>
              {formatDate(statement.createdAt)}
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>{t('statements.updated')}:</ThemedText>
            <ThemedText style={styles.infoValue}>
              {formatDate(statement.updatedAt)}
            </ThemedText>
          </View>
          {statement.submittedAt && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>{t('statements.submitted')}:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {formatDate(statement.submittedAt)}
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.footer}>
        <View style={styles.actionButtons}>
          {statement.status === 'draft' && (
            <>
              <ThemedButton
                title={t('common.edit')}
                onPress={handleEdit}
                variant="secondary"
                style={styles.editButton}
              />
              <ThemedButton
                title={t('statements.submit')}
                onPress={handleSubmit}
                variant="primary"
                style={styles.submitButton}
              />
            </>
          )}
          <ThemedButton
            title={t('common.delete')}
            onPress={handleDelete}
            variant="secondary"
            style={styles.deleteButton}
          />
        </View>
      </View>
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
    padding: 20,
  },
  statusBanner: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  referenceNumber: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  section: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoColumn: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.6,
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  descriptionText: {
    marginTop: 4,
    lineHeight: 20,
  },
  damageItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  damageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  damageArea: {
    fontSize: 16,
    fontWeight: '600',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  damageDescription: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  damagePhotos: {
    fontSize: 12,
    opacity: 0.6,
  },
  photoStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  statText: {
    fontSize: 14,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#F44336',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.6,
  },
});