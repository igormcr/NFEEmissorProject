import * as DocumentPicker from 'expo-document-picker';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { localCertificates, getLocalCertificateBlob } from '@/lib/certificate-catalog';
import { clearCertificateInfo, loadCertificateInfo, saveCertificateInfo } from '@/lib/certificate-storage';
import { associateCertificateClient, createClient, listClients, uploadCertificate } from '@/lib/nfe-api';
import { CertificateInfo, Client } from '@/types/nfe';

export default function CertificadoScreen() {
    const [certificates, setCertificates] = useState<CertificateInfo[]>([]);
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
    const [selectedFilePassword, setSelectedFilePassword] = useState('');
    const [passwords, setPasswords] = useState<Record<string, string>>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [certificateClientSelections, setCertificateClientSelections] = useState<Record<string, string>>({});
    const [associatingId, setAssociatingId] = useState<string | null>(null);
    const [showClientForm, setShowClientForm] = useState(false);
    const [clientName, setClientName] = useState('');
    const [clientCnpj, setClientCnpj] = useState('');
    const [creatingClient, setCreatingClient] = useState(false);

    useEffect(() => {
        loadCertificateInfo().then(setCertificates);
        listClients().then((response) => {
            setClients(response.data);
            setSelectedClientId(response.data[0]?.id ?? null);
        }).catch((error) => setErrorMessage(error instanceof Error ? error.message : 'Não foi possível carregar os clientes.'));
    }, []);

    const saveCertificates = async (nextCertificates: CertificateInfo[]) => {
        setCertificates(nextCertificates);
        await saveCertificateInfo(nextCertificates);
    };

    const handleCreateClient = async () => {
        const legalName = clientName.trim();
        const cnpj = clientCnpj.replace(/\D/g, '');

        if (!legalName || !cnpj) {
            setErrorMessage('Informe a razão social e o CNPJ do cliente.');
            return;
        }

        if (cnpj.length !== 14) {
            setErrorMessage('O CNPJ deve conter 14 dígitos.');
            return;
        }

        setCreatingClient(true);
        setErrorMessage(null);
        try {
            const response = await createClient({
                legalName,
                tradeName: null,
                cnpj,
                stateRegistration: null,
                municipalRegistration: null,
                taxRegime: null,
                address: {
                    logradouro: '',
                    numero: '',
                    bairro: '',
                    codigoMunicipio: '',
                    nomeMunicipio: '',
                    uf: 'SP',
                    cep: '',
                    codigoPais: '1058',
                    nomePais: 'Brasil',
                },
            });
            setClients((current) => [...current, response.data]);
            setSelectedClientId(response.data.id);
            setClientName('');
            setClientCnpj('');
            setShowClientForm(false);
            Alert.alert('Cliente cadastrado', 'Agora selecione o certificado desse cliente.');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Não foi possível cadastrar o cliente.';
            setErrorMessage(message);
            Alert.alert('Falha ao cadastrar cliente', message);
        } finally {
            setCreatingClient(false);
        }
    };

    const handleAssociateClient = async (certificate: CertificateInfo) => {
        const clientId = certificateClientSelections[certificate.id];
        if (!clientId) {
            setErrorMessage('Selecione um cliente para este certificado.');
            return;
        }
        setAssociatingId(certificate.id);
        setErrorMessage(null);
        try {
            const response = await associateCertificateClient(certificate.id, clientId);
            const updated = response.data as CertificateInfo;
            await saveCertificates(certificates.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
            Alert.alert('Sucesso', 'Cliente associado ao certificado.');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Não foi possível associar o cliente.';
            setErrorMessage(message);
            Alert.alert('Falha ao associar cliente', message);
        } finally {
            setAssociatingId(null);
        }
    };

    const renderClientSelector = (certificate: CertificateInfo) => {
        const selected = certificateClientSelections[certificate.id] ?? certificate.clientId;
        return (
            <View style={styles.associationBox}>
                <Text style={styles.associationLabel}>Cliente deste certificado</Text>
                <View style={styles.clientList}>
                    {clients.map((client) => (
                        <Pressable
                            key={client.id}
                            onPress={() => setCertificateClientSelections((current) => ({ ...current, [certificate.id]: client.id }))}
                            style={[styles.clientOption, client.id === selected && styles.clientOptionSelected]}>
                            <Text style={styles.clientOptionText}>{client.legalName} - {client.cnpj}</Text>
                        </Pressable>
                    ))}
                </View>
                <Pressable
                    onPress={() => void handleAssociateClient(certificate)}
                    disabled={associatingId === certificate.id}
                    style={[styles.primaryButton, associatingId === certificate.id && styles.disabled]}>
                    <Text style={styles.primaryButtonText}>
                        {associatingId === certificate.id ? 'Associando...' : 'Associar cliente'}
                    </Text>
                </Pressable>
            </View>
        );
    };

    const saveFile = async (blob: Blob, fileName: string, password: string, id: string, localFileName?: string) => {
        setErrorMessage(null);
        if (!password) {
            setErrorMessage(`Informe a senha de ${fileName}.`);
            return;
        }

        setLoadingId(id);
        try {
            if (!selectedClientId) {
                throw new Error('Cadastre e selecione um cliente antes de salvar o certificado.');
            }
            const result = await uploadCertificate(blob, fileName, password, selectedClientId);
            const info = { ...(result.data as CertificateInfo), localFileName };
            const withoutPrevious = certificates.filter((certificate) => certificate.id !== info.id);
            await saveCertificates([...withoutPrevious, info]);
            setPasswords((current) => ({ ...current, [id]: '' }));
            setEditingId(null);
            Alert.alert('Sucesso', `${fileName} foi salvo com segurança.`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Não foi possível salvar o certificado.';
            setErrorMessage(message);
            Alert.alert('Falha ao salvar certificado', message);
            console.error('Certificate upload failed', error);
        } finally {
            setLoadingId(null);
        }
    };

    const handleSaveLocal = async (localCertificate: (typeof localCertificates)[number]) => {
        try {
            const password = passwords[localCertificate.name] ?? '';
            const blob = await getLocalCertificateBlob(localCertificate.asset);
            await saveFile(blob, localCertificate.name, password, localCertificate.name, localCertificate.name);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Não foi possível ler o certificado local.';
            setErrorMessage(message);
            console.error('Local certificate read failed', error);
        }
    };

    const handleSaveSelectedFile = async () => {
        if (!selectedFile) {
            setErrorMessage('Selecione um certificado A1 (.pfx ou .p12).');
            return;
        }
        const response = await fetch(selectedFile.uri);
        if (!response.ok) {
            setErrorMessage('Não foi possível ler o arquivo selecionado.');
            return;
        }
        await saveFile(await response.blob(), selectedFile.name, selectedFilePassword, selectedFile.name);
    };

    const handlePickFile = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['application/x-pkcs12', 'application/octet-stream'],
            copyToCacheDirectory: true,
            multiple: false,
        });
        if (!result.canceled && result.assets[0]) {
            setSelectedFile(result.assets[0]);
            setSelectedFilePassword('');
        }
    };

    const handleClear = async () => {
        await clearCertificateInfo();
        setCertificates([]);
        setPasswords({});
        setErrorMessage(null);
        Alert.alert('Limpo', 'Todos os certificados configurados foram removidos.');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ title: 'Certificados' }} />
            <ScrollView contentContainerStyle={styles.container}>
                <ThemedText type="title">Certificados</ThemedText>
                <Text style={styles.description}>
                    Selecione um certificado da pasta local, informe a senha e salve individualmente.
                </Text>

                <View style={styles.sectionHeader}>
                    <Text style={styles.label}>Cliente do certificado</Text>
                    <Pressable onPress={() => setShowClientForm((current) => !current)}>
                        <Text style={styles.linkText}>{showClientForm ? 'Fechar' : '+ Cadastrar cliente'}</Text>
                    </Pressable>
                </View>

                {showClientForm && (
                    <View style={styles.clientForm}>
                        <TextInput
                            value={clientName}
                            onChangeText={setClientName}
                            placeholder="Razão social"
                            style={styles.input}
                        />
                        <TextInput
                            value={clientCnpj}
                            onChangeText={setClientCnpj}
                            placeholder="CNPJ"
                            keyboardType="numeric"
                            style={styles.input}
                        />
                        <Pressable
                            onPress={() => void handleCreateClient()}
                            disabled={creatingClient}
                            style={[styles.primaryButton, creatingClient && styles.disabled]}>
                            <Text style={styles.primaryButtonText}>
                                {creatingClient ? 'Cadastrando...' : 'Cadastrar e selecionar cliente'}
                            </Text>
                        </Pressable>
                    </View>
                )}

                <View style={styles.clientList}>
                    {clients.map((client) => (
                        <Pressable
                            key={client.id}
                            onPress={() => setSelectedClientId(client.id)}
                            style={[styles.clientOption, client.id === selectedClientId && styles.clientOptionSelected]}>
                            <Text style={styles.clientOptionText}>{client.legalName} - {client.cnpj}</Text>
                        </Pressable>
                    ))}
                    {!clients.length && (
                        <Text style={styles.emptyText}>Nenhum cliente cadastrado. Cadastre um cliente para associar o certificado.</Text>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Outro certificado A1</Text>
                    <Pressable onPress={handlePickFile} style={styles.secondaryButton}>
                        <Text style={styles.secondaryButtonText}>
                            {selectedFile ? selectedFile.name : 'Selecionar arquivo .PFX ou .P12'}
                        </Text>
                    </Pressable>
                    {selectedFile && (
                        <>
                            <TextInput
                                value={selectedFilePassword}
                                onChangeText={setSelectedFilePassword}
                                placeholder="Senha do certificado"
                                secureTextEntry
                                style={styles.input}
                            />
                            <Pressable onPress={handleSaveSelectedFile} style={styles.primaryButton}>
                                <Text style={styles.primaryButtonText}>Salvar arquivo selecionado</Text>
                            </Pressable>
                        </>
                    )}
                </View>

                <View style={styles.list}>
                    <Text style={styles.listTitle}>Certificados disponíveis</Text>
                    {localCertificates.map((localCertificate) => {
                        const configured = certificates.find((certificate) => certificate.localFileName === localCertificate.name);
                        const editing = editingId === localCertificate.name;
                        const loading = loadingId === localCertificate.name;

                        return (
                            <View key={localCertificate.name} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.cardTitleContainer}>
                                        <Text style={styles.cardTitle}>{localCertificate.name}</Text>
                                        <Text style={styles.cardStatus}>
                                            {configured ? `Status: ${configured.status}` : 'Ainda não configurado'}
                                        </Text>
                                    </View>
                                    <Pressable onPress={() => setEditingId(editing ? null : localCertificate.name)}>
                                        <Text style={styles.editText}>{editing ? 'Fechar' : 'Editar'}</Text>
                                    </Pressable>
                                </View>
                                {configured && (() => {
                                    const client = clients.find((item) => item.id === configured.clientId);
                                    const clientName = configured.clientName ?? client?.legalName;
                                    const clientCnpj = configured.clientCnpj ?? client?.cnpj;
                                    return (
                                        <Text style={styles.cardClient}>
                                            Cliente: {clientName ?? 'Não identificado'}
                                            {clientCnpj ? ` (${clientCnpj})` : ''}
                                        </Text>
                                    );
                                })()}
                                {configured && (
                                    <Text style={styles.cardDetails}>
                                        Validade: {new Date(configured.expiresAt).toLocaleDateString()}
                                    </Text>
                                )}
                                {configured && renderClientSelector(configured)}
                                {editing && (
                                    <View style={styles.editor}>
                                        <TextInput
                                            value={passwords[localCertificate.name] ?? ''}
                                            onChangeText={(value) =>
                                                setPasswords((current) => ({ ...current, [localCertificate.name]: value }))
                                            }
                                            placeholder="Senha do certificado"
                                            secureTextEntry
                                            style={styles.input}
                                        />
                                        <Pressable
                                            onPress={() => void handleSaveLocal(localCertificate)}
                                            disabled={loading}
                                            style={[styles.primaryButton, loading && styles.disabled]}
                                        >
                                            <Text style={styles.primaryButtonText}>
                                                {loading ? 'Salvando...' : configured ? 'Atualizar certificado' : 'Salvar certificado'}
                                            </Text>
                                        </Pressable>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                    {certificates
                        .filter((certificate) => !certificate.localFileName)
                        .map((certificate) => (
                            <View key={certificate.id} style={styles.card}>
                                <Text style={styles.cardTitle}>{certificate.subject ?? 'Certificado personalizado'}</Text>
                                <Text style={styles.cardClient}>
                                    Cliente: {certificate.clientName ?? 'Não identificado'}
                                    {certificate.clientCnpj ? ` (${certificate.clientCnpj})` : ''}
                                </Text>
                                <Text style={styles.cardStatus}>Status: {certificate.status}</Text>
                                <Text style={styles.cardDetails}>
                                    Validade: {new Date(certificate.expiresAt).toLocaleDateString()}
                                </Text>
                                {renderClientSelector(certificate)}
                            </View>
                        ))}
                </View>

                {errorMessage && (
                    <View style={styles.error}>
                        <Text style={styles.errorText}>{errorMessage}</Text>
                    </View>
                )}

                <Pressable onPress={handleClear} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>Limpar certificados salvos</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.light.background },
    container: { padding: 24, gap: 18 },
    description: { color: Colors.light.text, opacity: 0.8 },
    section: { gap: 10 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    label: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
    linkText: { color: '#0b3d91', fontWeight: '700' },
    clientForm: { gap: 10, padding: 14, borderRadius: 10, backgroundColor: '#eef3ff' },
    list: { gap: 12 },
    listTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
    card: { padding: 14, borderRadius: 10, backgroundColor: '#fff', gap: 8 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    cardTitleContainer: { flex: 1, gap: 4 },
    cardTitle: { fontWeight: '700', color: Colors.light.text },
    cardStatus: { color: '#52627a' },
    cardDetails: { color: Colors.light.text },
    cardClient: { color: '#0b3d91', fontWeight: '700' },
    associationBox: { gap: 10, padding: 12, borderRadius: 10, backgroundColor: '#f5f7fb' },
    associationLabel: { fontSize: 13, fontWeight: '700', color: Colors.light.text },
    clientList: { gap: 8 },
    clientOption: { borderWidth: 1, borderColor: '#d7dce5', borderRadius: 10, padding: 12, backgroundColor: '#fff' },
    clientOptionSelected: { borderColor: '#0b3d91', backgroundColor: '#eef3ff' },
    clientOptionText: { color: Colors.light.text },
    emptyText: { color: '#9a6700' },
    editText: { color: '#0b3d91', fontWeight: '700' },
    editor: { gap: 10, marginTop: 6 },
    input: { borderWidth: 1, borderColor: '#d7dce5', borderRadius: 10, padding: 12, backgroundColor: '#fff', color: Colors.light.text },
    primaryButton: { backgroundColor: '#0b3d91', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
    primaryButtonText: { color: '#fff', fontWeight: '700' },
    secondaryButton: { backgroundColor: '#eef3ff', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
    secondaryButtonText: { color: Colors.light.text, fontWeight: '700' },
    error: { padding: 14, borderRadius: 10, backgroundColor: '#ffe8e8' },
    errorText: { color: '#a40000' },
    disabled: { opacity: 0.6 },
});
