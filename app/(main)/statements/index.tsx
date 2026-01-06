import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { useUniversalLinkVehicleAutoSelection } from '@/hooks/use-deeplink-vehicle-auto-selection';
import { useCustomThemeColor, useThemeColor } from '@/hooks/use-theme-color';
import { ClaimStatement, useStatementsStore } from '@/stores/use-statements-store';
import { useTranslation } from 'react-i18next';

const STATUS_COLORS = {
  draft: '#FF9800',
  submitted: '#2196F3',
  processing: '#FF5722',
  completed: '#4CAF50',
};

const STATUS_ICONS = {
  draft: '📝',
  submitted: '📤',
  processing: '⏳',
  completed: '✅',
};

export default function StatementsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { statements, isLoading, loadStatements } = useStatementsStore();
  const [refreshing, setRefreshing] = useState(false);
  
  // Auto-select vehicle from deeplink if available
  useUniversalLinkVehicleAutoSelection({
    enableDebugLogs: false,
    screenName: 'Statements'
  });
  
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackgroundColor = useCustomThemeColor({ light: '#ffffff', dark: '#1c1c1c' });
  const borderColor = useCustomThemeColor({ light: '#e1e1e1', dark: '#333' });

  useEffect(() => {
    loadStatements();
  }, [loadStatements]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStatements();
    setRefreshing(false);
  }, [loadStatements]);

  const handleCreateStatement = () => {
    router.push('/statements/new');
  };

  const handleStatementPress = (statement: ClaimStatement) => {
    // Navigate to statement details
    router.push({
      pathname: '/statements/details/[id]',
      params: { id: statement.id }
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStatementCard = ({ item: statement }: { item: ClaimStatement }) => {
    const statusColor = STATUS_COLORS[statement.status];
    const statusIcon = STATUS_ICONS[statement.status];
    
    return (
      <TouchableOpacity
        style={[styles.statementCard, { backgroundColor: cardBackgroundColor, borderColor }]}
        onPress={() => handleStatementPress(statement)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <ThemedText style={styles.cardTitle}>
              {statement.vehicle.make} {statement.vehicle.model}
            </ThemedText>
            <ThemedText style={styles.cardSubtitle}>
              {statement.vehicle.licensePlate}
            </ThemedText>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <ThemedText style={styles.statusIcon}>
              {statusIcon}
            </ThemedText>
            <ThemedText style={styles.statusText}>
              {t(`statementStatus.${statement.status}`)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardRow}>
            <ThemedText style={styles.cardLabel}>
              {t('statements.type')}:
            </ThemedText>
            <ThemedText style={styles.cardValue}>
              {t(`statementType.${statement.type}`)}
            </ThemedText>
          </View>
          
          <View style={styles.cardRow}>
            <ThemedText style={styles.cardLabel}>
              {t('statements.date')}:
            </ThemedText>
            <ThemedText style={styles.cardValue}>
              {formatDate(statement.incidentDate)}
            </ThemedText>
          </View>
          
          {statement.location.address && (
            <View style={styles.cardRow}>
              <ThemedText style={styles.cardLabel}>
                {t('statements.location')}:
              </ThemedText>
              <ThemedText style={[styles.cardValue, styles.locationText]} numberOfLines={1}>
                {statement.location.address}
              </ThemedText>
            </View>
          )}

        </View>

        <View style={styles.cardFooter}>
          <View style={styles.cardStats}>
            {statement.photos.length > 0 && (
              <View style={styles.statItem}>
                <ThemedText style={styles.statIcon}>📷</ThemedText>
                <ThemedText style={styles.statText}>
                  {statement.photos.length}
                </ThemedText>
              </View>
            )}
            
            {statement.damages.length > 0 && (
              <View style={styles.statItem}>
                <ThemedText style={styles.statIcon}>🔧</ThemedText>
                <ThemedText style={styles.statText}>
                  {statement.damages.length}
                </ThemedText>
              </View>
            )}
          </View>
          
          <ThemedText style={styles.lastUpdated}>
            {t('statements.updated')}: {formatDate(statement.updatedAt)}
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <ThemedText style={styles.emptyIcon}>📋</ThemedText>
      <ThemedText style={styles.emptyTitle}>
        {t('statements.noStatements')}
      </ThemedText>
      <ThemedText style={styles.emptyDescription}>
        {t('statements.createFirstStatement')}
      </ThemedText>
      <ThemedButton
        title={t('statements.createNew')}
        onPress={handleCreateStatement}
        variant="primary"
        style={styles.emptyActionButton}
      />
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <ThemedText style={styles.headerTitle}>
          {t('statements.myStatements')}
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          {statements.length} {t('statements.total')}
        </ThemedText>
      </View>
      
      {statements.length > 0 && (
        <ThemedButton
          title={t('statements.createNew')}
          onPress={handleCreateStatement}
          variant="primary"
          style={styles.createButton}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {statements.length === 0 && !isLoading ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={statements}
          renderItem={renderStatementCard}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.6,
  },
  createButton: {
    marginLeft: 16,
    backgroundColor: '#4CAF50',
  },
  statementCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
  },
  statusIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 14,
    opacity: 0.6,
    width: 80,
  },
  cardValue: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  locationText: {
    opacity: 0.8,
  },
  referenceText: {
    fontFamily: 'monospace',
    color: '#2196F3',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  cardStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  lastUpdated: {
    fontSize: 12,
    opacity: 0.5,
  },
  separator: {
    height: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  emptyActionButton: {
    backgroundColor: '#4CAF50',
    minWidth: 200,
  },
});