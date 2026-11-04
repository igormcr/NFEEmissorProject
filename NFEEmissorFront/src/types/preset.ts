export type NotePreset = {
  id: string;
  name: string;
  naturezaOperacao: string;
  informacoesAdicionais: string;
};

export type RecipientPreset = {
  id: string;
  name: string;
  document: string;
  recipientName: string;
  email: string;
  ie: string;
  street: string;
  number: string;
  neighborhood: string;
  cityCode: string;
  city: string;
  uf: string;
  cep: string;
};

export type ProductPreset = {
  id: string;
  name: string;
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
};

export type PresetCatalog = {
  notes: NotePreset[];
  recipients: RecipientPreset[];
  products: ProductPreset[];
};
