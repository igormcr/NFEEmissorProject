import { Asset } from 'expo-asset';

export type LocalCertificate = {
    name: string;
    asset: number;
};

export const localCertificates: LocalCertificate[] = [
    {
        name: 'Alan Mathison Turing (1).pfx',
        asset: require('../../certs/Alan Mathison Turing (1).pfx.base64.txt'),
    },
    {
        name: 'Ferdinand Georg Frobenius.pfx',
        asset: require('../../certs/Ferdinand Georg Frobenius.pfx.base64.txt'),
    },
    {
        name: 'Pierre de Fermat.pfx',
        asset: require('../../certs/Pierre de Fermat.pfx.base64.txt'),
    },
    {
        name: 'Wayne Enterprises, Inc..pfx',
        asset: require('../../certs/Wayne Enterprises, Inc..pfx.base64.txt'),
    },
];

export async function getLocalCertificateBlob(assetModule: number): Promise<Blob> {
    const asset = Asset.fromModule(assetModule);
    await asset.downloadAsync();
    const uri = asset.localUri ?? asset.uri;
    const response = await fetch(uri);

    if (!response.ok) {
        throw new Error('Não foi possível ler o certificado local.');
    }

    const base64 = (await response.text()).replace(/\s/g, '');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new Blob([bytes], { type: 'application/x-pkcs12' });
}
