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
import { consultarNfe } from '@/lib/nfe-api';

export default function ConsultarScreen() {
    const [chave, setChave] = useState('');
    const [uf, setUf] = useState('SP');
    const [ambiente, setAmbiente] = useState('1');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleConsultar = async () => {
        if (!chave.trim()) {
            Alert.alert('Campo obrigatório', 'Informe a chave da NFe.');
            return;
        }

        setLoading(true);

        try {
            const response = await consultarNfe({ chave: chave.trim(), uf: uf as any, ambiente: ambiente as any });
            setResult(JSON.stringify(response.data ?? response, null, 2));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Não foi possível consultar a NFe.';
            Alert.alert('Erro', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ title: 'Consultar NFe' }} />
            <ScrollView contentContainerStyle={styles.container}>
                <ThemedText type="title">Consultar NFe</ThemedText>

                <View style={styles.field}>
                    <Text style={styles.label}>Chave da NFe</Text>
                    <TextInput value={chave} onChangeText={setChave} style={styles.input} placeholder="Chave da nota" />
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>UF</Text>
                    <TextInput value={uf} onChangeText={setUf} style={styles.input} placeholder="SP" maxLength={2} />
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Ambiente</Text>
                    <TextInput value={ambiente} onChangeText={setAmbiente} style={styles.input} placeholder="1" maxLength={1} />
                </View>

                <Pressable onPress={handleConsultar} style={[styles.primaryButton, loading && styles.disabled]}>
                    <Text style={styles.primaryButtonText}>{loading ? 'Consultando...' : 'Consultar'}</Text>
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
