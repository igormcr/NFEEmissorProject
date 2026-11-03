import * as DocumentPicker from 'expo-document-picker';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { createClient, deleteClient, listClients, uploadCertificate } from '@/lib/nfe-api';
import { Client } from '@/types/nfe';

const emptyAddress = { logradouro: '', numero: '', bairro: '', codigoMunicipio: '', nomeMunicipio: '', uf: 'SP' as const, cep: '', codigoPais: '1058', nomePais: 'Brasil' };

export default function ClientesScreen() {
    const [clients, setClients] = useState<Client[]>([]);
    const [legalName, setLegalName] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
    const [certificatePassword, setCertificatePassword] = useState('');
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
        const normalizedCnpj = cnpj.replace(/\D/g, '');
        if (!legalName.trim() || !normalizedCnpj) {
            Alert.alert('Dados obrigatórios', 'Informe a razão social e o CNPJ.');
            return;
        }
        if (normalizedCnpj.length !== 14) {
            Alert.alert('CNPJ inválido', 'O CNPJ deve conter 14 dígitos.');
            return;
        }
        if (!selectedFile || !certificatePassword) {
            Alert.alert('Certificado obrigatório', 'Selecione o arquivo A1 e informe a senha para concluir a configuração.');
            return;
        }
        setLoading(true);
        try {
            const clientResponse = await createClient({
                legalName: legalName.trim(),
                tradeName: null,
                cnpj: normalizedCnpj,
                stateRegistration: null,
                municipalRegistration: null,
                taxRegime: null,
                address: emptyAddress,
            });
            const fileResponse = await fetch(selectedFile.uri);
            if (!fileResponse.ok) {
                throw new Error('Não foi possível ler o arquivo do certificado.');
            }
            await uploadCertificate(
                await fileResponse.blob(),
                selectedFile.name,
                certificatePassword,
                clientResponse.data.id,
            );
            setLegalName('');
            setCnpj('');
            setSelectedFile(null);
            setCertificatePassword('');
            await loadClients();
            Alert.alert('Configuração concluída', 'Cliente e certificado foram cadastrados e vinculados.');
        } catch (error) {
            Alert.alert(
                'Configuração incompleta',
                error instanceof Error
                    ? `${error.message} O cliente pode ter sido cadastrado sem certificado; confira a lista antes de tentar novamente.`
                    : 'Não foi possível concluir o cadastro do cliente e do certificado.',
            );
        } finally {
            setLoading(false);
        }
    };

    const handlePickCertificate = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['application/x-pkcs12', 'application/octet-stream'],
            copyToCacheDirectory: true,
            multiple: false,
        });
        if (!result.canceled && result.assets[0]) {
            setSelectedFile(result.assets[0]);
            setCertificatePassword('');
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
                <Text style={styles.title}>Configurar cliente</Text>
                <Text style={styles.description}>Cadastre o emitente e vincule seu certificado A1 em uma única etapa.</Text>
                <TextInput value={legalName} onChangeText={setLegalName} placeholder="Razão social" style={styles.input} />
                <TextInput value={cnpj} onChangeText={setCnpj} placeholder="CNPJ" keyboardType="numeric" style={styles.input} />
                <Pressable onPress={() => void handlePickCertificate()} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>
                        {selectedFile ? selectedFile.name : 'Selecionar certificado A1 (.pfx ou .p12)'}
                    </Text>
                </Pressable>
                <TextInput
                    value={certificatePassword}
                    onChangeText={setCertificatePassword}
                    placeholder="Senha do certificado"
                    secureTextEntry
                    style={styles.input}
                />
                <Pressable onPress={() => void handleCreate()} disabled={loading} style={[styles.primaryButton, loading && styles.disabled]}>
                    <Text style={styles.primaryButtonText}>{loading ? 'Configurando...' : 'Cadastrar cliente e certificado'}</Text>
                </Pressable>
                <Text style={styles.sectionTitle}>Clientes configurados</Text>
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
    secondaryButton: { borderWidth: 1, borderColor: '#0b3d91', borderRadius: 10, padding: 14, alignItems: 'center', backgroundColor: '#fff' },
    secondaryButtonText: { color: '#0b3d91', fontWeight: '700' },
    disabled: { opacity: 0.7 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text, marginTop: 10 },
    list: { gap: 10, marginTop: 8 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    cardInfo: { flex: 1, gap: 4 },
    cardTitle: { fontWeight: '700', color: Colors.light.text },
    cardText: { color: Colors.light.text },
    ready: { color: '#237a43' },
    pending: { color: '#9a6700' },
    delete: { color: '#b42318', fontWeight: '700' },
});
