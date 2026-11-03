# NFEEmissorProject

Plataforma para **emissão e consulta de Nota Fiscal Eletrônica (NFe)** voltada a pequenos negócios e contadores, com foco em uso simples e manuseio seguro de certificados digitais.

O repositório reúne o aplicativo (Front) e o BFF (Backend for Frontend). Um **assistente fiscal com IA (RAG)** está sendo desenvolvido em um repositório separado e será integrado a este projeto.

> **Status:** em desenvolvimento. O Front possui as telas principais; o BFF e a integração com o assistente estão em construção.

## Visão geral

| Módulo | Pasta | Descrição |
|--------|-------|-----------|
| Front | [`NFEEmissorFront`](./NFEEmissorFront) | Interface em Expo + React (TypeScript) para emitir, consultar e acompanhar NFe e gerenciar certificados |
| BFF | [`NFEEmissorBFF`](./NFEEmissorBFF) | Camada intermediária entre o Front e a API de NFe: autenticação, dados dos clientes, certificados e roteamento |
| Assistente fiscal (RAG) | [Repositório separado](https://github.com/igormcr/Assistente-Fiscal-de-NFe--RAG----Integra--o-com-o-NFEEmissorFront) | Assistente com IA que explica rejeições da SEFAZ e tira dúvidas de preenchimento, citando a documentação oficial |

## Arquitetura

```mermaid
flowchart LR
    U[Usuário] --> F[NFEEmissorFront<br/>Expo + React + TS]
    F --> B[NFEEmissorBFF]
    B --> DB[(Banco SQL)]
    B --> N[API de NFe]
    B -. rota de proxy .-> A[Assistente Fiscal RAG<br/>repositório separado]
    A --> V[(Banco vetorial)]
    A --> L[LLM]
```

**Decisões de projeto:**
- O Front não fala diretamente com a API de NFe nem guarda certificados de terceiros: isso passa pelo BFF.
- O assistente de IA é um serviço separado, acessado apenas pelo BFF, que mascara dados sensíveis (CNPJ, CPF, nomes) antes de qualquer chamada.
- Certificados digitais e chaves privadas **nunca** são enviados a serviços de IA.

## Funcionalidades

**Já disponíveis (Front):**
- Emissão de NFe por integração com API externa
- Consulta de status e histórico de notas
- Gerenciamento de certificado
- Interface responsiva com suporte web

**Em desenvolvimento:**
- BFF com autenticação, cadastro de clientes e armazenamento seguro de certificados
- Migração do Front para consumir o BFF
- Assistente fiscal com IA: explicar rejeições, analisar XML e tirar dúvidas, sempre com citação da fonte

## Como rodar

### Pré-requisitos
- Node.js 18+ e npm ou yarn
- (Opcional) Expo CLI para testes em dispositivos móveis
- Pré-requisitos do BFF: _[preencher conforme a stack do BFF]_

### Front

```bash
cd NFEEmissorFront
npm install
npm start
```

Abra a URL de desenvolvimento no navegador. Detalhes adicionais na documentação da pasta `NFEEmissorFront`.

### BFF

```bash
cd NFEEmissorBFF
# _[preencher: comandos de restore, configuração e execução]_
```

### Variáveis de ambiente

Copie os arquivos de exemplo (`.env.example`) de cada módulo e preencha com seus valores. **Nunca** versione chaves, senhas ou certificados.

## Estrutura do repositório

```
NFEEmissorProject/
├── NFEEmissorFront/   # App Expo + React (TypeScript)
│   └── src/
│       ├── app/          # telas: emitir, consultar, status, certificado
│       ├── components/   # componentes reutilizáveis
│       ├── lib/          # client da API e helpers de certificado
│       ├── constants/ hooks/ types/
├── NFEEmissorBFF/     # Backend for Frontend
└── README.md
```

## Roadmap

- [x] Telas principais do Front (emitir, consultar, status, certificado)
- [x] Monorepo com Front e BFF
- [ ] BFF: contrato da API (OpenAPI) e esquema SQL
- [ ] BFF: certificados criptografados e autenticação
- [ ] BFF: endpoints de emissão, consulta e status
- [ ] Front: consumir o BFF, login e cadastro de clientes
- [ ] Integração com o assistente fiscal (explicar erro, analisar XML, chat com citações)
- [ ] Testes, CI/CD e deploy no Azure

## Segurança e privacidade

- Certificados digitais são tratados como dados críticos: armazenamento criptografado e acesso restrito.
- Dados de clientes não devem ser usados em testes, demos ou capturas de tela; use dados fictícios ou ambiente de homologação.
- Respostas do assistente de IA são **apoio informativo** e não substituem a validação de um contador.

## Contribuição

Sugestões e issues são bem-vindas. Antes de abrir um PR, rode os testes e siga os tipos definidos em `src/types/` para os formatos de payload.

## Autor

**Igor Marinho Carneiro Rodrigues** — Desenvolvedor Full-Stack  
GitHub: [@igormcr](https://github.com/igormcr)

## Licença

Consulte o arquivo `LICENSE` do repositório. _[adicionar a licença escolhida, caso ainda não exista]_
