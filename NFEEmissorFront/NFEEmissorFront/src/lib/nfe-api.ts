import axios, { type InternalAxiosRequestConfig } from 'axios';

import { authStorage } from '@/lib/auth-storage';
import { Ambiente, CancelarRequest, CartaCorrecaoRequest, ConsultaRequest, InutilizarRequest, Uf, Client } from '@/types/nfe';

const baseURL = process.env.EXPO_PUBLIC_BFF_URL ?? 'http://localhost:3000';

async function addAuthHeader(config: InternalAxiosRequestConfig) {
    const token = await authStorage.getToken();
    if (token) config.headers.set('Authorization', 'Bearer ' + token);
    return config;
}

const api = axios.create({ baseURL, timeout: 30000 });
const bffApi = axios.create({ baseURL, timeout: 30000 });
api.interceptors.request.use(addAuthHeader);
bffApi.interceptors.request.use(addAuthHeader);

export async function emitirNfe(payload: Record<string, unknown>, gerarDanfe: boolean, clientId: string) {
    return api.post('/api/v1/nfe/emitir', payload, { params: { gerarDanfe }, headers: { 'X-Client-Id': clientId } });
}
export async function getNfeStatus(correlationId: string) { return api.get(`/api/v1/nfe/status/${correlationId}`); }
export async function getStatusServico(uf: Uf, ambiente: Ambiente) { return api.get('/api/v1/nfe/status-servico', { params: { uf, ambiente } }); }
export async function consultarNfe({ chave, uf, ambiente }: ConsultaRequest) { return api.get('/api/v1/nfe/consulta', { params: { chave, uf, ambiente } }); }
export async function cancelarNfe(payload: CancelarRequest) { return api.post('/api/v1/nfe/cancelar', payload); }
export async function enviarCartaCorrecao(payload: CartaCorrecaoRequest) { return api.post('/api/v1/nfe/cce', payload); }
export async function inutilizarNfe(payload: InutilizarRequest) { return api.post('/api/v1/nfe/inutilizar', payload); }

export async function uploadCertificate(file: Blob, fileName: string, password: string, clientId: string) {
    const formData = new FormData();
    formData.append('file', file, fileName);
    formData.append('password', password);
    try {
        return await bffApi.post('/api/v1/certificados', formData, { headers: { 'X-Client-Id': clientId } });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const serverMessage = error.response?.data?.message;
            if (typeof serverMessage === 'string') throw new Error(serverMessage);
            if (!error.response) throw new Error('Não foi possível conectar ao BFF. Verifique se ele está rodando em http://localhost:3000.');
        }
        throw error;
    }
}

export async function associateCertificateClient(certificateId: string, clientId: string) {
    return bffApi.patch(`/api/v1/certificados/${certificateId}/cliente`, { clientId });
}
export async function listClients() { return bffApi.get<Client[]>('/api/v1/clientes'); }
export async function createClient(client: Omit<Client, 'id' | 'certificateId'>) { return bffApi.post<Client>('/api/v1/clientes', client); }
export async function updateClient(id: string, client: Omit<Client, 'id' | 'certificateId'>) { return bffApi.put<Client>(`/api/v1/clientes/${id}`, client); }
export async function deleteClient(id: string) { return bffApi.delete(`/api/v1/clientes/${id}`); }

export default api;
