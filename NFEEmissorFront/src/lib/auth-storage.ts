import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'nfe.auth.token';

async function getItem(): Promise<string | null> {
  if (Platform.OS !== 'web') return SecureStore.getItemAsync(TOKEN_KEY);
  return typeof window !== 'undefined' ? window.sessionStorage.getItem(TOKEN_KEY) : null;
}

async function setItem(value: string): Promise<void> {
  if (Platform.OS !== 'web') {
    await SecureStore.setItemAsync(TOKEN_KEY, value);
    return;
  }
  if (typeof window !== 'undefined') window.sessionStorage.setItem(TOKEN_KEY, value);
}

export const authStorage = {
  getToken: getItem,
  setToken: setItem,
  clear: async () => {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } else if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(TOKEN_KEY);
    }
  },
};
