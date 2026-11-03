import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { CertificateInfo } from '@/types/nfe';

const CERTIFICATE_INFO_KEY = 'nfe.certificate.info.v2';

async function getItem(key: string): Promise<string | null> {
    if (Platform.OS !== 'web') {
        return SecureStore.getItemAsync(key);
    }

    return typeof window !== 'undefined' ? window.sessionStorage.getItem(key) : null;
}

async function setItem(key: string, value: string): Promise<void> {
    if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(key, value);
        return;
    }

    if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(key, value);
    }
}

export async function saveCertificateInfo(certificates: CertificateInfo[]): Promise<void> {
    await setItem(CERTIFICATE_INFO_KEY, JSON.stringify(certificates));
}

export async function loadCertificateInfo(): Promise<CertificateInfo[]> {
    const raw = await getItem(CERTIFICATE_INFO_KEY);
    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw) as CertificateInfo[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export async function clearCertificateInfo(): Promise<void> {
    if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(CERTIFICATE_INFO_KEY);
        return;
    }

    if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(CERTIFICATE_INFO_KEY);
    }
}
