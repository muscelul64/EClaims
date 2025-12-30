import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
//import { useUserStore } from '@/stores/use-user-store';
import { useTranslation } from 'react-i18next';

export const getTimeArray = (t: any) => {
    const arr = [
        {
            key: 10,
            value: `10 ${t('statementFirstScreen.minutes') || 'minutes'}`,
        },
        {
            key: 20,
            value: `20 ${t('statementFirstScreen.minutes') || 'minutes'}`,
        },
        {
            key: 30,
            value: `30 ${t('statementFirstScreen.minutes') || 'minutes'}`,
        },
        {
            key: 45,
            value: `45 ${t('statementFirstScreen.minutes') || 'minutes'}`,
        },
        {
            key: 60,
            value: `1 ${t('statementFirstScreen.hour') || 'hour'}`,
        },
    ];
    for (let i = 2; i <= 24; i++) {
        arr[i + 3] = {
            key: i * 60,
            value: `${i} ${t('statementFirstScreen.hours') || 'hours'}`,
        };
    }
    return arr;
};

export default function NewStatementScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    //const { user } = useUserStore();
    
    const backgroundColor = useThemeColor({}, 'background');
    const primaryColor = useThemeColor({}, 'tint');
    
    const timeArray = getTimeArray(t);

    const onTimePick = (selectedTime: number) => {
        const date = new Date(Date.now() - 1000 * 60 * selectedTime);
        // Navigate to time screen with selected time
        router.push({
            pathname: '/statements/time',
            params: { time: date.toISOString() }
        });
    };

    const switchToTimeScreen = () => {
        // Navigate to time screen without pre-selected time
        router.push('/statements/time');
    };

    const showTimePickerModal = () => {
        Alert.alert(
            t('statementFirstScreen.modalTitle') || 'How much time has passed since the event?',
            t('statementFirstScreen.modalDescription') || 'You have 24 hours from the time of the accident to complete an amicable agreement',
            [
                ...timeArray.map((item) => ({
                    text: item.value,
                    onPress: () => onTimePick(item.key)
                })),
                {
                    text: t('common.cancel') || 'Cancel',
                    style: 'cancel'
                }
            ],
            { cancelable: true }
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ThemedText>{t('common.back')}</ThemedText>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.illustrationContainer}>
                    {/* Placeholder for illustration - replace with actual SVG when available */}
                    <View style={[styles.illustration, { borderColor: primaryColor }]}>
                        <ThemedText style={styles.illustrationText}>📋</ThemedText>
                    </View>
                </View>
                
                <View style={styles.textContainer}>
                    <ThemedText style={styles.title}>
                        {t('statementFirstScreen.title') || 'Did the event occur recently?'}
                    </ThemedText>
                    <ThemedText style={styles.description}>
                        {t('statementFirstScreen.description') || 'Are you at the location and close to the time of the event? eClaims Solution can help you complete the data'}
                    </ThemedText>
                </View>
            </ScrollView>
            
            <View style={styles.buttonContainer}>
                <ThemedButton
                    title={t('common.yes') || 'Yes'}
                    onPress={showTimePickerModal}
                    variant="primary"
                    style={styles.button}
                />
                <ThemedButton
                    title={t('common.no') || 'No'}
                    onPress={switchToTimeScreen}
                    variant="secondary"
                    style={styles.button}
                />
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
        padding: 20,
        paddingTop: 10,
    },
    backButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    illustrationContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    illustration: {
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    illustrationText: {
        fontSize: 60,
    },
    textContainer: {
        alignItems: 'center',
        marginVertical: 40,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.8,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        paddingBottom: 40,
    },
    button: {
        flex: 0.4,
        marginHorizontal: 10,
    },
});