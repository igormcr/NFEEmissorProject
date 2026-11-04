import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { PresetCatalog } from '@/types/preset';

const STORAGE_PREFIX = 'nfe.presets.';
const emptyCatalog: PresetCatalog = { notes: [], recipients: [], products: [] };

async function getValue(key: string): Promise<string | null> {
  if (Platform.OS !== 'web') return SecureStore.getItemAsync(key);
  return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
}

async function setValue(key: string, value: string): Promise<void> {
  if (Platform.OS !== 'web') {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
}

export async function loadPresetCatalog(userId: string): Promise<PresetCatalog> {
  const value = await getValue(`${STORAGE_PREFIX}${userId}`);
  if (!value) return emptyCatalog;
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return {
        notes: parsed.map((preset) => ({
          id: String(preset.id ?? Date.now()),
          name: String(preset.name ?? 'Preset importado'),
          naturezaOperacao: String(preset.naturezaOperacao ?? ''),
          informacoesAdicionais: String(preset.informacoesAdicionais ?? ''),
        })),
        recipients: parsed.filter((preset) => preset.recipient).map((preset) => ({
          id: `${String(preset.id ?? Date.now())}-recipient`,
          name: String(preset.name ?? 'Destinatário importado'),
          document: String(preset.recipient.document ?? ''),
          recipientName: String(preset.recipient.name ?? ''),
          email: String(preset.recipient.email ?? ''),
          ie: String(preset.recipient.ie ?? ''),
          street: String(preset.recipient.street ?? ''),
          number: String(preset.recipient.number ?? ''),
          neighborhood: String(preset.recipient.neighborhood ?? ''),
          cityCode: String(preset.recipient.cityCode ?? ''),
          city: String(preset.recipient.city ?? ''),
          uf: String(preset.recipient.uf ?? ''),
          cep: String(preset.recipient.cep ?? ''),
        })),
        products: parsed.map((preset) => ({
          id: `${String(preset.id ?? Date.now())}-product`,
          name: String(preset.name ?? 'Produto importado'),
          codigo: '1',
          descricao: String(preset.descricao ?? ''),
          ncm: String(preset.ncm ?? ''),
          cfop: String(preset.cfop ?? '5102'),
          unidade: String(preset.unidade ?? 'UN'),
        })),
      };
    }
    const catalog = parsed as Partial<PresetCatalog>;
    return {
      notes: Array.isArray(catalog.notes) ? catalog.notes : [],
      recipients: Array.isArray(catalog.recipients) ? catalog.recipients : [],
      products: Array.isArray(catalog.products) ? catalog.products : [],
    };
  } catch {
    throw new Error('Não foi possível ler os presets salvos.');
  }
}

export async function savePresetCatalog(userId: string, catalog: PresetCatalog): Promise<void> {
  await setValue(`${STORAGE_PREFIX}${userId}`, JSON.stringify(catalog));
}
