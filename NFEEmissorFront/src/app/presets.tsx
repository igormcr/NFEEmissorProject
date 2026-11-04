import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { loadPresetCatalog, savePresetCatalog } from '@/lib/preset-storage';
import type { NotePreset, PresetCatalog, ProductPreset, RecipientPreset } from '@/types/preset';

type PresetKind = 'notes' | 'recipients' | 'products';
type PresetForm = NotePreset | RecipientPreset | ProductPreset;

const emptyCatalog: PresetCatalog = { notes: [], recipients: [], products: [] };
const emptyForm = {
  notes: { id: '', name: '', naturezaOperacao: 'Venda de produção do estabelecimento', informacoesAdicionais: '' },
  recipients: { id: '', name: '', document: '', recipientName: '', email: '', ie: '', street: '', number: '', neighborhood: '', cityCode: '', city: '', uf: '', cep: '' },
  products: { id: '', name: '', codigo: '1', descricao: '', ncm: '', cfop: '5102', unidade: 'UN' },
} satisfies { [K in PresetKind]: PresetForm };

function Input({ label, value, onChangeText, multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; multiline?: boolean }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} style={[styles.input, multiline && styles.multiline]} multiline={multiline} /></View>;
}

export default function PresetsScreen() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState<PresetCatalog>(emptyCatalog);
  const [kind, setKind] = useState<PresetKind>('notes');
  const [form, setForm] = useState<PresetForm>(emptyForm.notes);
  const [editingId, setEditingId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    if (!user) return undefined;
    let active = true;
    loadPresetCatalog(user.id).then((value) => { if (active) setCatalog(value); })
      .catch((error) => Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível carregar os presets.'));
    return () => { active = false; };
  }, [user]));

  const selectKind = (nextKind: PresetKind) => {
    setKind(nextKind);
    setEditingId(null);
    setForm({ ...emptyForm[nextKind] });
  };

  const updateForm = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const handleSave = async () => {
    if (!user || !form.name.trim()) {
      Alert.alert('Dados obrigatórios', 'Informe um nome para o preset.');
      return;
    }
    const nextPreset = { ...form, name: form.name.trim(), id: editingId ?? `${Date.now()}` } as PresetForm;
    const nextCatalog = {
      ...catalog,
      [kind]: editingId
        ? catalog[kind].map((preset) => preset.id === editingId ? nextPreset : preset)
        : [...catalog[kind], nextPreset],
    } as PresetCatalog;
    try {
      await savePresetCatalog(user.id, nextCatalog);
      setCatalog(nextCatalog);
      setEditingId(null);
      setForm({ ...emptyForm[kind] });
      Alert.alert('Preset salvo', 'Ele já estará disponível na tela de emissão.');
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível salvar o preset.');
    }
  };

  const editPreset = (preset: PresetForm) => {
    setEditingId(preset.id);
    setForm({ ...preset });
  };

  const deletePreset = (id: string) => {
    Alert.alert('Excluir preset?', 'Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        if (!user) return;
        const nextCatalog = { ...catalog, [kind]: catalog[kind].filter((preset) => preset.id !== id) } as PresetCatalog;
        await savePresetCatalog(user.id, nextCatalog);
        setCatalog(nextCatalog);
      } },
    ]);
  };

  const presets = catalog[kind];
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Presets de emissão' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText type="title">Presets por bloco</ThemedText>
        <Text style={styles.intro}>Crie configurações independentes para reutilizar dados da nota, destinatários e produtos.</Text>
        <View style={styles.kindRow}>
          {([
            ['notes', 'Dados da nota'],
            ['recipients', 'Destinatário'],
            ['products', 'Produto'],
          ] as const).map(([value, label]) => <Pressable key={value} onPress={() => selectKind(value)} style={[styles.kindButton, kind === value && styles.kindButtonSelected]}><Text style={kind === value ? styles.kindTextSelected : styles.kindText}>{label}</Text></Pressable>)}
        </View>
        <View style={styles.card}>
          <Text style={styles.heading}>{editingId ? 'Editar preset' : `Novo preset: ${kind === 'notes' ? 'dados da nota' : kind === 'recipients' ? 'destinatário' : 'produto'}`}</Text>
          <Input label="Nome do preset" value={form.name} onChangeText={(value) => updateForm('name', value)} />
          {kind === 'notes' && <><Input label="Natureza da operação" value={(form as NotePreset).naturezaOperacao} onChangeText={(value) => updateForm('naturezaOperacao', value)} /><Input label="Informações adicionais" value={(form as NotePreset).informacoesAdicionais} onChangeText={(value) => updateForm('informacoesAdicionais', value)} multiline /></>}
          {kind === 'products' && <><View style={styles.row}><Input label="Código" value={(form as ProductPreset).codigo} onChangeText={(value) => updateForm('codigo', value)} /><Input label="Descrição" value={(form as ProductPreset).descricao} onChangeText={(value) => updateForm('descricao', value)} /></View><View style={styles.row}><Input label="NCM" value={(form as ProductPreset).ncm} onChangeText={(value) => updateForm('ncm', value)} /><Input label="CFOP" value={(form as ProductPreset).cfop} onChangeText={(value) => updateForm('cfop', value)} /></View><Input label="Unidade" value={(form as ProductPreset).unidade} onChangeText={(value) => updateForm('unidade', value.toUpperCase())} /></>}
          {kind === 'recipients' && <><Input label="CPF ou CNPJ" value={(form as RecipientPreset).document} onChangeText={(value) => updateForm('document', value)} /><Input label="Nome ou razão social" value={(form as RecipientPreset).recipientName} onChangeText={(value) => updateForm('recipientName', value)} /><View style={styles.row}><Input label="E-mail" value={(form as RecipientPreset).email} onChangeText={(value) => updateForm('email', value)} /><Input label="Inscrição estadual" value={(form as RecipientPreset).ie} onChangeText={(value) => updateForm('ie', value)} /></View><Input label="Logradouro" value={(form as RecipientPreset).street} onChangeText={(value) => updateForm('street', value)} /><View style={styles.row}><Input label="Número" value={(form as RecipientPreset).number} onChangeText={(value) => updateForm('number', value)} /><Input label="CEP" value={(form as RecipientPreset).cep} onChangeText={(value) => updateForm('cep', value)} /></View><Input label="Bairro" value={(form as RecipientPreset).neighborhood} onChangeText={(value) => updateForm('neighborhood', value)} /><View style={styles.row}><Input label="Cidade" value={(form as RecipientPreset).city} onChangeText={(value) => updateForm('city', value)} /><Input label="UF" value={(form as RecipientPreset).uf} onChangeText={(value) => updateForm('uf', value.toUpperCase())} /></View><Input label="Código do município" value={(form as RecipientPreset).cityCode} onChangeText={(value) => updateForm('cityCode', value)} /></>}
          <View style={styles.actions}>{editingId && <Pressable onPress={() => { setEditingId(null); setForm({ ...emptyForm[kind] }); }} style={styles.secondaryButton}><Text style={styles.secondaryText}>Cancelar</Text></Pressable>}<Pressable onPress={handleSave} style={styles.primaryButton}><Text style={styles.primaryText}>{editingId ? 'Atualizar preset' : 'Salvar preset'}</Text></Pressable></View>
        </View>
        {presets.map((preset) => <View key={preset.id} style={styles.presetCard}><View style={styles.presetHeader}><Text style={styles.heading}>{preset.name}</Text><Text style={styles.detail}>{kind === 'products' ? `CFOP ${(preset as ProductPreset).cfop}` : kind === 'notes' ? (preset as NotePreset).naturezaOperacao : (preset as RecipientPreset).recipientName}</Text></View><View style={styles.actions}><Pressable onPress={() => editPreset(preset)}><Text style={styles.link}>Editar</Text></Pressable><Pressable onPress={() => deletePreset(preset.id)}><Text style={styles.deleteText}>Excluir</Text></Pressable></View></View>)}
        {!presets.length && <Text style={styles.empty}>Nenhum preset deste tipo salvo.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: 20, gap: 16 },
  intro: { color: '#596579', lineHeight: 20 },
  kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kindButton: { borderColor: '#cbd3df', borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 9 },
  kindButtonSelected: { backgroundColor: '#0b3d91', borderColor: '#0b3d91' },
  kindText: { color: Colors.light.text, fontSize: 12 },
  kindTextSelected: { color: '#fff', fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: '#f7f9fc', borderColor: '#e1e6ef', borderRadius: 16, borderWidth: 1, gap: 12, padding: 16 },
  presetCard: { backgroundColor: '#fff', borderColor: '#dfe5ee', borderRadius: 12, borderWidth: 1, gap: 8, padding: 14 },
  heading: { color: Colors.light.text, fontSize: 16, fontWeight: '700' },
  field: { flex: 1, gap: 5 },
  label: { color: Colors.light.text, fontSize: 12, fontWeight: '700' },
  input: { backgroundColor: '#fff', borderColor: '#d3dae6', borderRadius: 8, borderWidth: 1, color: Colors.light.text, padding: 10 },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  actions: { alignItems: 'center', flexDirection: 'row', gap: 16, justifyContent: 'flex-end' },
  primaryButton: { backgroundColor: '#0b3d91', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11 },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { borderColor: '#0b3d91', borderRadius: 8, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  secondaryText: { color: '#0b3d91', fontWeight: '700' },
  presetHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  detail: { color: '#596579', fontSize: 13 },
  link: { color: '#0b3d91', fontWeight: '700' },
  deleteText: { color: '#b42318', fontWeight: '700' },
  empty: { color: '#596579', textAlign: 'center' },
});
