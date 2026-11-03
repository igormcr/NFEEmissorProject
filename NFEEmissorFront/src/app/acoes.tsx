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
import { cancelarNfe, enviarCartaCorrecao, inutilizarNfe } from '@/lib/nfe-api';

const initialData = {
    ambiente: '1',
    uf: 'SP',
    chaveAcesso: '',
    cnpjEmitente: '',
    protocoloAutorizacao: '',
    justificativa: '',
    correcao: '',
    sequenciaEvento: '1',
    ano: '2026',
    serie: '1',
    numeroInicial: '1',
    numeroFinal: '1',
};

export default function AcoesScreen() {
    const [selectedAction, setSelectedAction] = useState<'cancelar' | 'cce' | 'inutilizar'>('cancelar');
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const updateField = (field: string, value: string) => {
        setData((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = async () => {
        setLoading(true);

        try {
            let response;

            if (selectedAction === 'cancelar') {
                response = await cancelarNfe({
                    ambiente: data.ambiente as any,
                    uf: data.uf as any,
                    chaveAcesso: data.chaveAcesso,
                    cnpjEmitente: data.cnpjEmitente,
                    protocoloAutorizacao: data.protocoloAutorizacao,
                    justificativa: data.justificativa,
                });
            }

            if (selectedAction === 'cce') {
                response = await enviarCartaCorrecao({
                    ambiente: data.ambiente as any,
                    uf: data.uf as any,
                    chaveAcesso: data.chaveAcesso,
                    cnpjEmitente: data.cnpjEmitente,
                    correcao: data.correcao,
                    sequenciaEvento: Number(data.sequenciaEvento || 1),
                });
            }

            if (selectedAction === 'inutilizar') {
                response = await inutilizarNfe({
                    ambiente: data.ambiente as any,
                    uf: data.uf as any,
                    cnpjEmitente: data.cnpjEmitente,
                    ano: data.ano,
                    serie: data.serie,
                    numeroInicial: Number(data.numeroInicial || 1),
                    numeroFinal: Number(data.numeroFinal || 1),
                    justificativa: data.justificativa,
                    modelo: '55',
                });
            }

            setResult(JSON.stringify(response?.data ?? response ?? {}, null, 2));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Não foi possível completar a operação.';
            Alert.alert('Erro', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ title: 'Ações NFe' }} />
            <ScrollView contentContainerStyle={styles.container}>
                <ThemedText type="title">Ações NFe</ThemedText>

                <View style={styles.segmented}>
                    {['cancelar', 'cce', 'inutilizar'].map((action) => (
                        <Pressable
                            key={action}
                            onPress={() => setSelectedAction(action as 'cancelar' | 'cce' | 'inutilizar')}
                            style={[styles.segmentButton, selectedAction === action && styles.segmentButtonSelected]}>
                            <Text style={styles.segmentText}>{action}</Text>
                        </Pressable>
                    ))}
                </View>

                <View style={styles.fieldRow}>
                    <View style={styles.half}>
                        <Text style={styles.label}>Ambiente</Text>
                        <TextInput value={data.ambiente} onChangeText={(value) => updateField('ambiente', value)} style={styles.input} />
                    </View>
                    <View style={styles.half}>
                        <Text style={styles.label}>UF</Text>
                        <TextInput value={data.uf} onChangeText={(value) => updateField('uf', value)} style={styles.input} maxLength={2} />
                    </View>
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>CNPJ emitente</Text>
                    <TextInput value={data.cnpjEmitente} onChangeText={(value) => updateField('cnpjEmitente', value)} style={styles.input} />
                </View>

                {selectedAction !== 'inutilizar' && (
                    <View style={styles.field}>
                        <Text style={styles.label}>Chave de acesso</Text>
                        <TextInput value={data.chaveAcesso} onChangeText={(value) => updateField('chaveAcesso', value)} style={styles.input} />
                    </View>
                )}

                {selectedAction === 'cancelar' && (
                    <>
                        <View style={styles.field}>
                            <Text style={styles.label}>Protocolo</Text>
                            <TextInput value={data.protocoloAutorizacao} onChangeText={(value) => updateField('protocoloAutorizacao', value)} style={styles.input} />
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>Justificativa</Text>
                            <TextInput value={data.justificativa} onChangeText={(value) => updateField('justificativa', value)} style={styles.input} />
                        </View>
                    </>
                )}

                {selectedAction === 'cce' && (
                    <>
                        <View style={styles.field}>
                            <Text style={styles.label}>Correção</Text>
                            <TextInput value={data.correcao} onChangeText={(value) => updateField('correcao', value)} style={styles.input} />
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>Sequência do evento</Text>
                            <TextInput value={data.sequenciaEvento} onChangeText={(value) => updateField('sequenciaEvento', value)} keyboardType="numeric" style={styles.input} />
                        </View>
                    </>
                )}

                {selectedAction === 'inutilizar' && (
                    <>
                        <View style={styles.fieldRow}>
                            <View style={styles.half}>
                                <Text style={styles.label}>Ano</Text>
                                <TextInput value={data.ano} onChangeText={(value) => updateField('ano', value)} style={styles.input} />
                            </View>
                            <View style={styles.half}>
                                <Text style={styles.label}>Série</Text>
                                <TextInput value={data.serie} onChangeText={(value) => updateField('serie', value)} style={styles.input} />
                            </View>
                        </View>
                        <View style={styles.fieldRow}>
                            <View style={styles.half}>
                                <Text style={styles.label}>Nº inicial</Text>
                                <TextInput value={data.numeroInicial} onChangeText={(value) => updateField('numeroInicial', value)} keyboardType="numeric" style={styles.input} />
                            </View>
                            <View style={styles.half}>
                                <Text style={styles.label}>Nº final</Text>
                                <TextInput value={data.numeroFinal} onChangeText={(value) => updateField('numeroFinal', value)} keyboardType="numeric" style={styles.input} />
                            </View>
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>Justificativa</Text>
                            <TextInput value={data.justificativa} onChangeText={(value) => updateField('justificativa', value)} style={styles.input} />
                        </View>
                    </>
                )}

                <Pressable onPress={handleSubmit} style={[styles.primaryButton, loading && styles.disabled]}>
                    <Text style={styles.primaryButtonText}>{loading ? 'Processando...' : 'Enviar operação'}</Text>
                </Pressable>

                {result ? (
                    <View style={styles.resultBox}>
                        <ThemedText type="smallBold">Resposta</ThemedText>
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
    segmented: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    segmentButton: {
        backgroundColor: '#edf3ff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    segmentButtonSelected: {
        backgroundColor: '#0b3d91',
    },
    segmentText: {
        color: Colors.light.text,
        textTransform: 'capitalize',
        fontWeight: '700',
    },
    fieldRow: {
        flexDirection: 'row',
        gap: 12,
    },
    half: {
        flex: 1,
        gap: 8,
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
