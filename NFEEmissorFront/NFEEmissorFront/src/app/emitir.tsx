import { Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { emitirNfe, listClients } from '@/lib/nfe-api';
import { Client } from '@/types/nfe';

type ItemForm = {
    codigo: string;
    descricao: string;
    quantidade: string;
    valorUnitario: string;
    ncm: string;
    cfop: string;
    unidade: string;
};

const emptyItem: ItemForm = {
    codigo: '1',
    descricao: '',
    quantidade: '1',
    valorUnitario: '',
    ncm: '',
    cfop: '5102',
    unidade: 'UN',
};

const parseNumber = (value: string) => Number(value.replace(',', '.')) || 0;
const onlyDigits = (value: string) => value.replace(/\D/g, '');

function Field({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    required = false,
}: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'numeric' | 'email-address';
    required?: boolean;
}) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}{required ? ' *' : ''}</Text>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#8a94a6"
                keyboardType={keyboardType}
                style={styles.input}
                autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
            />
        </View>
    );
}

function Section({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <View style={styles.section}>
            <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <Text style={styles.sectionDescription}>{description}</Text>
            </View>
            {children}
        </View>
    );
}

export default function EmitirScreen() {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [clientSearch, setClientSearch] = useState('');
    const [gerarDanfe, setGerarDanfe] = useState(true);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [ambienteEmissao, setAmbienteEmissao] = useState<'1' | '2'>('2');
    const [serie, setSerie] = useState('1');
    const [numeroNfe, setNumeroNfe] = useState('1');
    const [naturezaOperacao, setNaturezaOperacao] = useState('Venda de produção do estabelecimento');
    const [recipient, setRecipient] = useState({ document: '', name: '', email: '', ie: '', street: '', number: '', neighborhood: '', cityCode: '', city: '', uf: 'SP', cep: '' });
    const [items, setItems] = useState<ItemForm[]>([{ ...emptyItem }]);
    const [additionalInfo, setAdditionalInfo] = useState('');

    useEffect(() => {
        listClients()
            .then((response) => {
                setClients(response.data);
                setSelectedClientId(response.data[0]?.id ?? null);
            })
            .catch((error) => Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível carregar os clientes.'));
    }, []);

    const selectedClient = clients.find((client) => client.id === selectedClientId);
    const filteredClients = useMemo(() => {
        const search = clientSearch.trim().toLowerCase();
        if (!search) return clients;
        return clients.filter((client) => `${client.legalName} ${client.tradeName ?? ''} ${client.cnpj}`.toLowerCase().includes(search));
    }, [clientSearch, clients]);
    const total = items.reduce((sum, item) => sum + parseNumber(item.quantidade) * parseNumber(item.valorUnitario), 0);

    const updateItem = (index: number, field: keyof ItemForm, value: string) => {
        setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
    };

    const updateRecipient = (field: keyof typeof recipient, value: string) => {
        setRecipient((current) => ({ ...current, [field]: value }));
    };

    const handleEmitir = async () => {
        if (!selectedClient) {
            Alert.alert('Dados obrigatórios', 'Selecione o cliente emitente.');
            return;
        }
        if (!recipient.name.trim() || !recipient.street.trim() || !items.some((item) => item.descricao.trim())) {
            Alert.alert('Dados obrigatórios', 'Preencha o destinatário e adicione pelo menos um produto com descrição.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ambienteEmissao,
                serie,
                numeroNfe: Number(numeroNfe) || 1,
                naturezaOperacao,
                tipoOperacao: '1',
                formatoImpressaoDanfe: '1',
                tipoEmissao: '1',
                finalidadeEmissao: '1',
                consumidorFinal: '0',
                indicadorPresencaComprador: '0',
                emitente: {
                    cnpj: onlyDigits(selectedClient.cnpj),
                    razaoSocial: selectedClient.legalName,
                    nomeFantasia: selectedClient.tradeName ?? selectedClient.legalName,
                    inscricaoEstadual: selectedClient.stateRegistration ?? '',
                    inscricaoMunicipal: selectedClient.municipalRegistration ?? '',
                    cnaeFiscal: '',
                    codigoRegimeTributario: selectedClient.taxRegime ?? '3',
                    endereco: selectedClient.address,
                },
                destinatario: {
                    cnpj: onlyDigits(recipient.document),
                    nomeRazaoSocial: recipient.name,
                    inscricaoEstadual: recipient.ie,
                    indicadorIe: recipient.ie ? '1' : '9',
                    email: recipient.email,
                    endereco: {
                        logradouro: recipient.street,
                        numero: recipient.number,
                        bairro: recipient.neighborhood,
                        codigoMunicipio: recipient.cityCode,
                        nomeMunicipio: recipient.city,
                        uf: recipient.uf,
                        cep: onlyDigits(recipient.cep),
                        codigoPais: '1058',
                        nomePais: 'Brasil',
                    },
                },
                produtos: items.filter((item) => item.descricao.trim()).map((item) => {
                    const quantity = parseNumber(item.quantidade);
                    const unitPrice = parseNumber(item.valorUnitario);
                    const itemTotal = quantity * unitPrice;
                    return {
                        codigoProduto: item.codigo,
                        descricao: item.descricao,
                        ncmSh: item.ncm,
                        cfop: item.cfop,
                        unidadeComercial: item.unidade,
                        quantidadeComercial: quantity,
                        valorUnitarioComercial: unitPrice,
                        valorBruto: itemTotal,
                        unidadeTributavel: item.unidade,
                        quantidadeTributavel: quantity,
                        valorUnitarioTributavel: unitPrice,
                        valorFrete: 0,
                        valorSeguro: 0,
                        valorDesconto: 0,
                        valorOutrasDespesas: 0,
                        indicadorComposicaoTotal: '1',
                        impostos: {
                            icms: {
                                cst: '00',
                                origem: '0',
                                baseCalculo: itemTotal,
                                modalidadeBaseCalculo: '3',
                                aliquota: 0,
                                valor: 0,
                                baseCalculoSt: 0,
                                modalidadeBaseCalculoSt: '4',
                                aliquotaSt: 0,
                                valorSt: 0,
                                mvaAjustado: 0,
                                percentualReducaoBaseCalculo: 0,
                                percentualDiferimento: 0,
                                valorIcmsDiferido: 0,
                                valorIcmsOperacao: 0,
                                valorDesonerado: 0,
                                percentualFcp: 0,
                                valorFcp: 0,
                            },
                            pis: { cst: '01', baseCalculo: itemTotal, aliquota: 0, valor: 0 },
                            cofins: { cst: '01', baseCalculo: itemTotal, aliquota: 0, valor: 0 },
                        },
                    };
                }),
                transporte: { modalidadeFrete: '9' },
                pagamentos: [{ meioPagamento: '01', valor: total }],
                notasReferenciadas: [],
                informacoesAdicionais: additionalInfo,
                informacoesAdicionaisFisco: '',
            };
            const response = await emitirNfe(payload, gerarDanfe, selectedClient.id);
            setResult(JSON.stringify(response.data ?? response, null, 2));
        } catch (error) {
            Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível emitir a NFe.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ title: 'Emitir NFe' }} />
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <ThemedText type="title">Emitir NFe</ThemedText>
                <Text style={styles.intro}>Preencha os dados por etapas. Campos com * são obrigatórios.</Text>

                <Section title="1. Emitente" description="Escolha uma empresa cadastrada. Os dados fiscais serão preenchidos automaticamente.">
                    <Field label="Pesquisar cliente" value={clientSearch} onChangeText={setClientSearch} placeholder="Razão social ou CNPJ" />
                    <View style={styles.clientList}>
                        {filteredClients.map((client) => (
                            <Pressable key={client.id} onPress={() => setSelectedClientId(client.id)} style={[styles.clientOption, client.id === selectedClientId && styles.clientOptionSelected]}>
                                <Text style={styles.clientOptionTitle}>{client.legalName}</Text>
                                <Text style={styles.clientOptionText}>{client.tradeName || 'Sem nome fantasia'} · CNPJ {client.cnpj}</Text>
                            </Pressable>
                        ))}
                        {!clients.length && <Text style={styles.hint}>Cadastre um cliente para começar.</Text>}
                        {!!clients.length && !filteredClients.length && <Text style={styles.hint}>Nenhum cliente encontrado.</Text>}
                    </View>
                </Section>

                <Section title="2. Dados da nota" description="Defina o ambiente e a operação da emissão.">
                    <View style={styles.choiceRow}>
                        <Text style={styles.label}>Ambiente</Text>
                        <View style={styles.choiceGroup}>
                            {(['2', '1'] as const).map((value) => (
                                <Pressable key={value} onPress={() => setAmbienteEmissao(value)} style={[styles.choice, ambienteEmissao === value && styles.choiceSelected]}>
                                    <Text style={ambienteEmissao === value ? styles.choiceTextSelected : styles.choiceText}>{value === '2' ? 'Homologação' : 'Produção'}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                    <View style={styles.twoColumns}>
                        <Field label="Série" value={serie} onChangeText={setSerie} keyboardType="numeric" required />
                        <Field label="Número da NFe" value={numeroNfe} onChangeText={setNumeroNfe} keyboardType="numeric" required />
                    </View>
                    <Field label="Natureza da operação" value={naturezaOperacao} onChangeText={setNaturezaOperacao} required />
                </Section>

                <Section title="3. Destinatário" description="Informe quem receberá a mercadoria ou serviço.">
                    <Field label="CPF ou CNPJ" value={recipient.document} onChangeText={(value) => updateRecipient('document', value)} keyboardType="numeric" placeholder="Opcional" />
                    <Field label="Nome ou razão social" value={recipient.name} onChangeText={(value) => updateRecipient('name', value)} required />
                    <View style={styles.twoColumns}>
                        <Field label="E-mail" value={recipient.email} onChangeText={(value) => updateRecipient('email', value)} keyboardType="email-address" />
                        <Field label="Inscrição estadual" value={recipient.ie} onChangeText={(value) => updateRecipient('ie', value)} />
                    </View>
                    <View style={styles.separator} />
                    <Text style={styles.subheading}>Endereço</Text>
                    <Field label="Logradouro" value={recipient.street} onChangeText={(value) => updateRecipient('street', value)} required />
                    <View style={styles.twoColumns}>
                        <Field label="Número" value={recipient.number} onChangeText={(value) => updateRecipient('number', value)} />
                        <Field label="CEP" value={recipient.cep} onChangeText={(value) => updateRecipient('cep', value)} keyboardType="numeric" />
                    </View>
                    <Field label="Bairro" value={recipient.neighborhood} onChangeText={(value) => updateRecipient('neighborhood', value)} />
                    <View style={styles.twoColumns}>
                        <Field label="Cidade" value={recipient.city} onChangeText={(value) => updateRecipient('city', value)} />
                        <Field label="UF" value={recipient.uf} onChangeText={(value) => updateRecipient('uf', value.toUpperCase())} />
                    </View>
                    <Field label="Código do município" value={recipient.cityCode} onChangeText={(value) => updateRecipient('cityCode', value)} keyboardType="numeric" />
                </Section>

                <Section title="4. Produtos" description="Adicione os itens. O total e o pagamento são calculados automaticamente.">
                    {items.map((item, index) => (
                        <View key={`${index}-${item.codigo}`} style={styles.itemCard}>
                            <View style={styles.itemHeader}>
                                <Text style={styles.subheading}>Item {index + 1}</Text>
                                {items.length > 1 && <Pressable onPress={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Text style={styles.removeText}>Remover</Text></Pressable>}
                            </View>
                            <View style={styles.twoColumns}>
                                <Field label="Código" value={item.codigo} onChangeText={(value) => updateItem(index, 'codigo', value)} />
                                <Field label="Unidade" value={item.unidade} onChangeText={(value) => updateItem(index, 'unidade', value.toUpperCase())} />
                            </View>
                            <Field label="Descrição" value={item.descricao} onChangeText={(value) => updateItem(index, 'descricao', value)} required />
                            <View style={styles.twoColumns}>
                                <Field label="Quantidade" value={item.quantidade} onChangeText={(value) => updateItem(index, 'quantidade', value)} keyboardType="numeric" required />
                                <Field label="Valor unitário" value={item.valorUnitario} onChangeText={(value) => updateItem(index, 'valorUnitario', value)} keyboardType="numeric" required />
                            </View>
                            <View style={styles.twoColumns}>
                                <Field label="NCM" value={item.ncm} onChangeText={(value) => updateItem(index, 'ncm', value)} keyboardType="numeric" />
                                <Field label="CFOP" value={item.cfop} onChangeText={(value) => updateItem(index, 'cfop', value)} keyboardType="numeric" />
                            </View>
                            <Text style={styles.itemTotal}>Total do item: R$ {(parseNumber(item.quantidade) * parseNumber(item.valorUnitario)).toFixed(2)}</Text>
                        </View>
                    ))}
                    <Pressable onPress={() => setItems((current) => [...current, { ...emptyItem, codigo: String(current.length + 1) }])} style={styles.secondaryButton}>
                        <Text style={styles.secondaryButtonText}>+ Adicionar produto</Text>
                    </Pressable>
                    <Text style={styles.total}>Total da nota: R$ {total.toFixed(2)}</Text>
                </Section>

                <Section title="5. Finalização" description="Revise as informações antes de transmitir a nota.">
                    <View style={styles.choiceRow}>
                        <Text style={styles.label}>Gerar DANFE em PDF</Text>
                        <Switch value={gerarDanfe} onValueChange={setGerarDanfe} />
                    </View>
                    <Field label="Informações adicionais" value={additionalInfo} onChangeText={setAdditionalInfo} placeholder="Opcional" />
                    <Pressable onPress={handleEmitir} style={[styles.primaryButton, loading && styles.disabled]}>
                        <Text style={styles.primaryButtonText}>{loading ? 'Enviando...' : 'Emitir NFe'}</Text>
                    </Pressable>
                </Section>

                {result ? <View style={styles.resultBox}><ThemedText type="smallBold">Resposta da emissão</ThemedText><Text style={styles.resultText}>{result}</Text></View> : null}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.light.background },
    container: { padding: 20, gap: 16 },
    intro: { color: '#596579', marginTop: -8 },
    section: { backgroundColor: '#f7f9fc', borderColor: '#e1e6ef', borderRadius: 16, borderWidth: 1, gap: 14, padding: 16 },
    sectionHeading: { gap: 4 },
    sectionTitle: { color: Colors.light.text, fontSize: 18, fontWeight: '700' },
    sectionDescription: { color: '#596579', fontSize: 13, lineHeight: 18 },
    field: { flex: 1, gap: 6 },
    label: { color: Colors.light.text, fontSize: 13, fontWeight: '700' },
    input: { backgroundColor: '#fff', borderColor: '#d3dae6', borderRadius: 9, borderWidth: 1, color: Colors.light.text, padding: 11 },
    twoColumns: { flexDirection: 'row', gap: 10 },
    choiceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
    choiceGroup: { flexDirection: 'row', gap: 6 },
    choice: { borderColor: '#cbd3df', borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
    choiceSelected: { backgroundColor: '#0b3d91', borderColor: '#0b3d91' },
    choiceText: { color: Colors.light.text, fontSize: 12 },
    choiceTextSelected: { color: '#fff', fontSize: 12, fontWeight: '700' },
    clientList: { gap: 8 },
    clientOption: { backgroundColor: '#fff', borderColor: '#d3dae6', borderRadius: 9, borderWidth: 1, gap: 3, padding: 11 },
    clientOptionSelected: { backgroundColor: '#eef3ff', borderColor: '#0b3d91' },
    clientOptionTitle: { color: Colors.light.text, fontWeight: '700' },
    clientOptionText: { color: '#596579', fontSize: 12 },
    hint: { color: '#9a6700' },
    separator: { borderTopColor: '#e1e6ef', borderTopWidth: 1, marginTop: 2 },
    subheading: { color: Colors.light.text, fontSize: 14, fontWeight: '700' },
    itemCard: { backgroundColor: '#fff', borderColor: '#dfe5ee', borderRadius: 10, borderWidth: 1, gap: 11, padding: 12 },
    itemHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
    removeText: { color: '#b42318', fontSize: 13, fontWeight: '700' },
    itemTotal: { color: '#596579', fontSize: 13, fontWeight: '700' },
    secondaryButton: { alignItems: 'center', borderColor: '#0b3d91', borderRadius: 9, borderWidth: 1, padding: 12 },
    secondaryButtonText: { color: '#0b3d91', fontWeight: '700' },
    total: { color: Colors.light.text, fontSize: 17, fontWeight: '700', textAlign: 'right' },
    primaryButton: { alignItems: 'center', backgroundColor: '#0b3d91', borderRadius: 10, paddingVertical: 14 },
    primaryButtonText: { color: '#fff', fontWeight: '700' },
    disabled: { opacity: 0.7 },
    resultBox: { backgroundColor: '#eef3ff', borderRadius: 12, gap: 8, padding: 16 },
    resultText: { color: Colors.light.text, fontSize: 12 },
});
