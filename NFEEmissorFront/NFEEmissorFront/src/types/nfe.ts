export type Ambiente = '1' | '2';

export type Uf =
    | 'AC'
    | 'AL'
    | 'AM'
    | 'AP'
    | 'BA'
    | 'CE'
    | 'DF'
    | 'ES'
    | 'GO'
    | 'MA'
    | 'MG'
    | 'MS'
    | 'MT'
    | 'PA'
    | 'PB'
    | 'PE'
    | 'PI'
    | 'PR'
    | 'RJ'
    | 'RN'
    | 'RO'
    | 'RR'
    | 'RS'
    | 'SC'
    | 'SE'
    | 'SP'
    | 'TO';

export type CertificateInfo = {
    id: string;
    localFileName?: string;
    subject: string | null;
    cnpj: string | null;
    issuer: string | null;
    serialNumber: string | null;
    clientId?: string | null;
    clientName?: string | null;
    clientCnpj?: string | null;
    validFrom: string;
    expiresAt: string;
    status: 'active' | 'expired' | 'revoked';
};

export type Client = {
    id: string;
    legalName: string;
    tradeName: string | null;
    cnpj: string;
    stateRegistration: string | null;
    municipalRegistration: string | null;
    taxRegime: string | null;
    certificateId: string | null;
    address: EnderecoRequest;
};

export type ApiResponse<T = unknown> = {
    data?: T;
    status?: number;
    message?: string;
};

export type EnderecoRequest = {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    codigoMunicipio: string;
    nomeMunicipio: string;
    uf: Uf;
    cep: string;
    codigoPais: string;
    nomePais: string;
    telefone?: string;
};

export type DestinatarioRequest = {
    cnpjCpf?: string;
    nomeRazaoSocial: string;
    indicadorIe: string;
    endereco: EnderecoRequest;
};

export type ItemNfeRequest = {
    codigo: string;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
};

export type EmitirRequest = {
    ambiente: Ambiente;
    uf: Uf;
    cnpjEmitente: string;
    naturezaOperacao: string;
    modelo: string;
    serie: string;
    numeroNfe: number;
    dataEmissao: string;
    valorTotal: number;
    destinatario: DestinatarioRequest;
    itens: ItemNfeRequest[];
};

export type StatusResponse = {
    correlationId?: string;
    status?: string;
    message?: string;
    [key: string]: unknown;
};

export type ConsultaRequest = {
    chave: string;
    uf: Uf;
    ambiente: Ambiente;
};

export type CancelarRequest = {
    ambiente: Ambiente;
    uf: Uf;
    chaveAcesso: string;
    cnpjEmitente: string;
    protocoloAutorizacao: string;
    justificativa: string;
};

export type CartaCorrecaoRequest = {
    ambiente: Ambiente;
    uf: Uf;
    chaveAcesso: string;
    cnpjEmitente: string;
    correcao: string;
    sequenciaEvento?: number;
};

export type InutilizarRequest = {
    ambiente: Ambiente;
    uf: Uf;
    cnpjEmitente: string;
    ano: string;
    serie: string;
    numeroInicial: number;
    numeroFinal: number;
    justificativa: string;
    modelo?: string;
};
