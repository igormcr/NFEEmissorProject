import { Stack } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { getNfeStatus } from '@/lib/nfe-api';

export default function NfeStatusScreen() {
    const [correlationId, setCorrelationId] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleStatus = async () => {
        if (!correlationId.trim()) {
            Alert.alert('Campo obrigatório', 'Informe o correlationId da operação.');
            return;
        }

        setLoading(true);

        try {
            const response = await getNfeStatus(correlationId.trim());
            setResult(JSON.stringify(response.data ?? response, null, 2));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Não foi possível buscar o status.';
            Alert.alert('Erro', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ title: 'Status da operação' }} />
            <ScrollView contentContainerStyle={styles.container}>
                <ThemedText type="title">Status da operação</ThemedText>

                <View style={styles.field}>
                    <Text style={styles.label}>Correlation ID</Text>
                    <TextInput value={correlationId} onChangeText={setCorrelationId} style={styles.input} placeholder="ID recebido ao emitir" />
                </View>

                <Pressable onPress={handleStatus} style={[styles.primaryButton, loading && styles.disabled]}>
                    <Text style={styles.primaryButtonText}>{loading ? 'Consultando...' : 'Consultar status'}</Text>
                </Pressable>

                {result ? (
                    <View style={styles.resultBox}>
                        <ThemedText type="smallBold">Resultado</ThemedText>
                        <Text style={styles.resultText}>{result}</Text>
                    </View>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    container: {
        padding: 24,
        gap: 18,
    },
    field: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.light.text,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d7dce5',
        borderRadius: 10,
        padding: 12,
        backgroundColor: '#fff',
        color: Colors.light.text,
    },
    primaryButton: {
        backgroundColor: '#0b3d91',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
    disabled: {
        opacity: 0.7,
    },
    resultBox: {
        backgroundColor: '#eef3ff',
        borderRadius: 12,
        padding: 16,
        gap: 8,
    },
    resultText: {
        fontSize: 12,
        color: Colors.light.text,
    },
});
