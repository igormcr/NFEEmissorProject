# NFEEmissorBFF

Back-for-front (BFF) responsável por autenticar usuários, custodiar certificados
digitais e intermediar as chamadas do frontend para a API fiscal de NFe.

## Funcionalidades atuais

- Cadastro, login e consulta do usuário autenticado.
- Tokens Bearer assinados com HMAC-SHA256, com validade de sete dias.
- Cadastro, atualização, listagem e exclusão de clientes (emitentes).
- Upload de certificados A1 (`.pfx`) em memória, com validação da senha e dos
  metadados do certificado.
- Criptografia do arquivo e da senha do certificado antes da persistência.
- Associação de um certificado a um cliente e exposição somente de metadados
  públicos do certificado.
- Isolamento dos usuários: clientes e certificados são sempre consultados pelo
  `userId` autenticado.
- Proxy autenticado para emissão, consulta, status, cancelamento, carta de
  correção e inutilização de NFe.
- Encaminhamento do certificado descriptografado apenas para a API fiscal
  durante a chamada, sem devolvê-lo ao frontend.

## API

Todas as rotas abaixo, exceto registro e login, exigem
`Authorization: Bearer <token>`.

| Método | Rota | Finalidade |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Criar usuário |
| `POST` | `/api/v1/auth/login` | Autenticar usuário |
| `GET` | `/api/v1/auth/me` | Obter usuário autenticado |
| `GET/POST` | `/api/v1/clientes` | Listar ou criar clientes |
| `PUT/DELETE` | `/api/v1/clientes/:id` | Atualizar ou excluir cliente |
| `GET` | `/api/v1/certificados` | Listar metadados de certificados |
| `POST` | `/api/v1/certificados` | Enviar certificado (`multipart/form-data`) |
| `PATCH` | `/api/v1/certificados/:id/cliente` | Associar certificado a cliente |
| `DELETE` | `/api/v1/certificados/:id` | Remover certificado |
| `*` | `/api/v1/nfe/*` | Encaminhar operação para a API fiscal |

As operações de certificado e NFe que dependem de um cliente exigem o header
`X-Client-Id`.

## Configuração

Crie um arquivo `.env` com:

```env
DB_HOST=localhost
DB_PORT=1433
DB_USER=usuario
DB_PASSWORD=senha
DB_NAME=NFEEmissor
JWT_SECRET=uma-chave-com-pelo-menos-32-caracteres
FISCAL_API_URL=http://localhost:5082
PORT=3000
NODE_ENV=development
```

`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` e `JWT_SECRET` são obrigatórios.
O banco atual é SQL Server/Azure SQL. As migrações em `database/` devem ser
executadas antes de iniciar o serviço; o TypeORM está configurado com
`synchronize: false`.

## Execução local

```bash
npm install
npm run dev
```

Para gerar e executar a versão compilada:

```bash
npm run build
npm start
```

O endpoint `GET /` retorna o status básico do serviço.

## Segurança

- Nunca versione `.env`, senhas, chaves privadas ou certificados reais.
- O arquivo `.pfx` e sua senha são criptografados separadamente no banco.
- A resposta da API contém apenas metadados do certificado.
- `trustServerCertificate: true` está mantido para desenvolvimento local; a
  configuração de produção deve validar o certificado do servidor SQL.
- O BFF é a única camada que deve manipular certificados; o frontend não deve
  enviar credenciais diretamente à API fiscal.
