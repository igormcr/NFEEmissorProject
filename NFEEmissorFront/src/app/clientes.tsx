import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { createClient, deleteClient, listClients } from '@/lib/nfe-api';
import { Client } from '@/types/nfe';

const emptyAddress = { logradouro: '', numero: '', bairro: '', codigoMunicipio: '', nomeMunicipio: '', uf: 'SP' as const, cep: '', codigoPais: '1058', nomePais: 'Brasil' };

export default function ClientesScreen() {
    const [clients, setClients] = useState<Client[]>([]);
    const [legalName, setLegalName] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [loading, setLoading] = useState(false);

    const loadClients = async () => {
        try {
            setClients((await listClients()).data);
        } catch (error) {
            Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível carregar os clientes.');
        }
    };

    useEffect(() => {
        void loadClients();
    }, []);

    const handleCreate = async () => {
        if (!legalName.trim() || !cnpj.trim()) {
            Alert.alert('Dados obrigatórios', 'Informe a razão social e o CNPJ.');
            return;
        }
        setLoading(true);
        try {
            await createClient({
                legalName: legalName.trim(),
                tradeName: null,
                cnpj,
                stateRegistration: null,
                municipalRegistration: null,
                taxRegime: null,
                address: emptyAddress,
            });
            setLegalName('');
            setCnpj('');
            await loadClients();
        } catch (error) {
            Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível cadastrar o cliente.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (client: Client) => {
        Alert.alert('Excluir cliente', `Excluir ${client.legalName}?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteClient(client.id);
                        await loadClients();
                    } catch (error) {
                        Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível excluir o cliente.');
                    }
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ title: 'Clientes' }} />
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Clientes (emitentes)</Text>
                <Text style={styles.description}>Cadastre os prestadores atendidos pelo contador. Cada emissão usará o cliente selecionado.</Text>
                <TextInput value={legalName} onChangeText={setLegalName} placeholder="Razão social" style={styles.input} />
                <TextInput value={cnpj} onChangeText={setCnpj} placeholder="CNPJ" keyboardType="numeric" style={styles.input} />
                <Pressable onPress={handleCreate} style={[styles.primaryButton, loading && styles.disabled]}>
                    <Text style={styles.primaryButtonText}>{loading ? 'Salvando...' : 'Cadastrar cliente'}</Text>
                </Pressable>
                <View style={styles.list}>
                    {clients.map((client) => (
                        <View key={client.id} style={styles.card}>
                            <View style={styles.cardInfo}>
                                <Text style={styles.cardTitle}>{client.legalName}</Text>
                                <Text style={styles.cardText}>CNPJ: {client.cnpj}</Text>
                                <Text style={client.certificateId ? styles.ready : styles.pending}>
                                    {client.certificateId ? 'Certificado vinculado' : 'Certificado ainda não vinculado'}
                                </Text>
                            </View>
                            <Pressable onPress={() => handleDelete(client)}><Text style={styles.delete}>Excluir</Text></Pressable>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.light.background },
    container: { padding: 24, gap: 14 },
    title: { fontSize: 24, fontWeight: '700', color: Colors.light.text },
    description: { color: Colors.light.text, opacity: 0.75 },
    input: { borderWidth: 1, borderColor: '#d7dce5', borderRadius: 10, padding: 12, backgroundColor: '#fff' },
    primaryButton: { backgroundColor: '#0b3d91', borderRadius: 10, padding: 14, alignItems: 'center' },
    primaryButtonText: { color: '#fff', fontWeight: '700' },
    disabled: { opacity: 0.7 },
    list: { gap: 10, marginTop: 8 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    cardInfo: { flex: 1, gap: 4 },
    cardTitle: { fontWeight: '700', color: Colors.light.text },
    cardText: { color: Colors.light.text },
    ready: { color: '#237a43' },
    pending: { color: '#9a6700' },
    delete: { color: '#b42318', fontWeight: '700' },
});
