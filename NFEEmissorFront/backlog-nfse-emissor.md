# Backlog do Emissor de NFS-e (Frontend + BFF)

> Versão revisada após: (1) foco do MVP na contadora e seus clientes do meio musical, (2) decisão de criar um backend próprio (BFF) com banco SQL para custodiar dados e certificados.

## 1. Visão do produto

**Problema:** a contadora atende vários artistas e bandas que se apresentam em todo o país. Hoje ela emite notas acessando portais diferentes, cliente por cliente, o que é lento e sujeito a erro.

**Objetivo do MVP:** permitir que ela emita e consulte NFS-e de todos os seus clientes em um único lugar, rápido e com segurança, inclusive pelo celular logo após um show.

**Premissas (validar na descoberta):**

- O documento principal é a **NFS-e** (serviço: show, cachê, execução musical), não a NFe de produto. Confirmar o enquadramento na lista de serviços da LC 116 (item 12).
- O padrão nacional da NFS-e (LC 214/2025) é obrigatório para os municípios desde jan/2026, mas a adesão e a emissão pelo ambiente nacional ainda variam por município. Não assumir cobertura total.
- O backend (BFF) será a única camada que fala com o provedor de emissão e a única que toca em certificados.
- O provedor de emissão (Emissor Nacional direto ou gateway) **ainda não foi definido**.

**Usuária principal:** contadora (mãe do desenvolvedor). **Usuários futuros:** outros contadores, os próprios clientes.

## 2. Roadmap por fases

| Fase | Foco | Épicos | Resultado esperado |
|---|---|---|---|
| **Sprint 0** | Descoberta e decisões | E0, base de E1 | Escopo validado, provedor escolhido, repositório e CI prontos |
| **MVP (alfa)** | Emitir de ponta a ponta em homologação | E1, E2, E3, E4, E6 | Emissão de NFS-e em homologação para 2 a 3 clientes reais |
| **MVP (beta)** | Consulta, cancelamento e piloto | E5, E7, E8 | 1 cliente real em produção, acompanhado pela contadora |
| **Pós-MVP** | Escala e conveniência | E9 e backlog futuro | Mais clientes, relatórios, outros usuários |

---

## E0. Descoberta e alinhamento (com a contadora)

**Objetivo:** validar escopo, regras fiscais e fluxo real antes de aprofundar o código.

- [ ] E0.1 Entrevistar a contadora (30 a 60 min) sobre o processo atual de emissão
- [ ] E0.2 Listar os clientes reais e classificar: regime (MEI, Simples, PF autônomo, PJ), município-sede e códigos de serviço usados
- [ ] E0.3 Mapear os últimos 20 a 30 shows: contratante, cidade de execução, valor, retenções, município onde a nota foi emitida
- [ ] E0.4 Confirmar o enquadramento de serviço (LC 116, item 12) e as regras de ISS para apresentações em outros municípios
- [ ] E0.5 Levantar os municípios dos clientes e verificar quais já emitem pelo padrão nacional
- [ ] E0.6 Definir como a contadora acessa hoje os portais (certificado dela, procuração, login de cada cliente)
- [ ] E0.7 Avaliar provedores de emissão (Emissor Nacional direto × gateway): cobertura de municípios, custo, SLA, ambiente de homologação, documentação
- [ ] E0.8 Decidir escopo final do MVP e lista do que fica fora
- [ ] E0.9 Registrar riscos e decisões (ADRs curtos)

**Critérios de aceite:**
- Existe um documento de escopo aprovado pela contadora
- Provedor de emissão escolhido, com justificativa registrada
- Lista de clientes-piloto definida (2 a 3)

---

## E1. Fundação do backend (BFF) e arquitetura

**Objetivo:** criar a API que serve o frontend, persiste os dados e integra com o provedor.

- [ ] E1.1 Definir a stack e a estrutura do projeto (ex.: .NET, camadas API / domínio / infraestrutura)
- [ ] E1.2 Modelar o banco SQL: Usuário, Prestador, Certificado, Tomador, ModeloDeServico, Nota, LogDeAuditoria
- [ ] E1.3 Modelar multi-cliente com `TenantId` desde o início (contadora → clientes)
- [ ] E1.4 Configurar migrations, seeds de desenvolvimento e ambientes (dev, homologação, produção)
- [ ] E1.5 Implementar autenticação (login, sessão curta, refresh; avaliar MFA)
- [ ] E1.6 Implementar autorização por prestador (o usuário só acessa clientes que são dele)
- [ ] E1.7 Criar a interface `IEmissorNfse` isolando o provedor, com implementação para homologação
- [ ] E1.8 Padronizar tratamento de erros, validação de entrada e contrato da API (OpenAPI/Swagger)
- [ ] E1.9 Configuração por ambiente e gestão de segredos (sem segredos no repositório)

**Critérios de aceite:**
- API sobe em ambiente de desenvolvimento com banco migrado
- Um usuário não consegue acessar dados de prestador que não lhe pertence (coberto por teste)
- O provedor pode ser trocado sem alterar as regras de negócio

---

## E2. Segurança e custódia de certificados (prioridade crítica)

**Objetivo:** guardar e usar certificados de terceiros com o menor risco possível.

- [ ] E2.1 Decidir o armazenamento: Azure Key Vault (arquivo ou chave mestra) × criptografia em camada de aplicação com envelope encryption
- [ ] E2.2 Endpoint de upload do certificado (.pfx) com validação: formato, senha, validade, CNPJ/CPF do titular × prestador
- [ ] E2.3 Criptografar arquivo e senha separadamente; nunca persistir em texto
- [ ] E2.4 Garantir que nenhum endpoint devolva o arquivo ou a senha (somente metadados: titular, documento, validade, status)
- [ ] E2.5 Assinatura e transmissão feitas apenas no backend, com o certificado carregado em memória e descartado ao final
- [ ] E2.6 Alerta de vencimento de certificado (ex.: 60, 30 e 7 dias) por cliente
- [ ] E2.7 Fluxo de troca e de revogação/remoção definitiva de certificado
- [ ] E2.8 Trilha de auditoria: quem usou qual certificado, quando e em qual nota
- [ ] E2.9 Hardening: HTTPS obrigatório, CORS restrito, rate limiting, headers de segurança, logs sem dados sensíveis
- [ ] E2.10 Varredura de segredos no CI (ex.: gitleaks) e revisão de dependências
- [ ] E2.11 Backup criptografado do banco e plano de restauração testado

**Critérios de aceite:**
- Nenhum certificado ou senha aparece em texto no banco, nos logs ou em respostas da API
- Toda utilização de certificado gera registro de auditoria
- Remoção de certificado apaga o material criptografado de fato (verificado)

---

## E3. Cadastros (prestadores, contratantes e modelos)

**Objetivo:** reduzir o trabalho repetitivo por show.

- [ ] E3.1 CRUD de prestadores (clientes da contadora): documento, razão/nome, regime, município, inscrição municipal, código de serviço e tributação padrão
- [ ] E3.2 CRUD de tomadores/contratantes (casas de show, produtoras, prefeituras), com validação de CPF/CNPJ e busca de CEP
- [ ] E3.3 Modelos de serviço reutilizáveis (descrição, código, alíquota, retenções padrão)
- [ ] E3.4 Seleção do prestador ativo no contexto do usuário
- [ ] E3.5 Importação em lote de tomadores (CSV), se a descoberta indicar necessidade

**Critérios de aceite:**
- A contadora cadastra um prestador completo em poucos minutos
- Dados obrigatórios para emissão são validados no cadastro, não só na emissão

---

## E4. Emissão de NFS-e

**Objetivo:** emitir a nota de forma confiável, mesmo com falhas do provedor.

- [ ] E4.1 Definir o fluxo de emissão: rascunho → validação → envio → resultado
- [ ] E4.2 Tipar e validar o payload (campos da NFS-e conforme o provedor escolhido)
- [ ] E4.3 Cálculo e conferência de valores: ISS, retenções (ISS, IR, INSS, quando aplicável) e líquido
- [ ] E4.4 Regras de município e de local de execução do serviço, conforme apurado em E0
- [ ] E4.5 Idempotência (chave única por emissão) para evitar nota duplicada
- [ ] E4.6 Processamento assíncrono com fila e reprocessamento (ex.: Hangfire), com status: pendente, autorizada, rejeitada, erro
- [ ] E4.7 Tradução das rejeições do provedor/município em mensagens compreensíveis
- [ ] E4.8 Persistir XML enviado, resposta bruta e número/chave da nota
- [ ] E4.9 Emissão rápida a partir de um modelo ("mesma nota do último show, novo valor e data")
- [ ] E4.10 Suporte a municípios fora do padrão nacional (conforme a estratégia definida em E0.7)

**Critérios de aceite:**
- Emissão ponta a ponta em homologação para os prestadores-piloto
- Duplo clique ou reenvio não gera duas notas
- Uma rejeição chega ao usuário com causa e ação sugerida

---

## E5. Consulta, histórico, documentos e cancelamento

**Objetivo:** acompanhar e administrar as notas emitidas.

- [ ] E5.1 Listagem com paginação e filtros: prestador, período, status, tomador, valor
- [ ] E5.2 Consulta por chave/número e sincronização de status com o provedor
- [ ] E5.3 Visualização e download de XML e PDF
- [ ] E5.4 Compartilhamento/reenvio da nota por e-mail ou WhatsApp
- [ ] E5.5 Cancelamento de nota, com motivo, prazo legal e registro de auditoria
- [ ] E5.6 Exportação simples de notas por período (CSV) para a contabilidade

**Critérios de aceite:**
- Localizar uma nota antiga de um cliente leva segundos
- Cancelamento respeita as regras do município/provedor e fica registrado

---

## E6. Frontend (Expo/React)

**Objetivo:** adaptar o app existente ao novo backend e ao contexto multi-cliente.

- [ ] E6.1 Migrar `nfe-api.ts` para consumir o BFF; centralizar cliente HTTP (timeout, interceptors, erro padronizado)
- [ ] E6.2 Transformar `certificate-storage.ts` em fluxo de upload + status; remover qualquer persistência local de certificado
- [ ] E6.3 Telas de login e sessão
- [ ] E6.4 Seletor de cliente ativo, sempre visível
- [ ] E6.5 Telas de cadastro (prestadores, tomadores, modelos)
- [ ] E6.6 Tela de emissão otimizada para celular (poucos campos, uso de modelos)
- [ ] E6.7 Telas de consulta/histórico e de status, com estados de loading, vazio e erro
- [ ] E6.8 Indicador visual do ambiente ativo (homologação × produção)
- [ ] E6.9 Gestão de estado e cache (ex.: TanStack Query), ESLint/Prettier e TypeScript em modo strict
- [ ] E6.10 Acessibilidade básica e responsividade (web no celular como prioridade)

**Critérios de aceite:**
- Fluxo completo utilizável no navegador do celular
- Nenhum dado sensível persistido no dispositivo
- Fica evidente em qual cliente e ambiente o usuário está operando

---

## E7. Testes e homologação

- [ ] E7.1 Testes unitários: cálculos, validações, regras de negócio
- [ ] E7.2 Testes de integração do backend com o provedor mockado e banco de teste
- [ ] E7.3 Testes de autorização (isolamento entre clientes)
- [ ] E7.4 Testes de componente nas telas principais do frontend
- [ ] E7.5 Teste E2E do fluxo crítico: login → selecionar cliente → emitir → consultar
- [ ] E7.6 Rodada completa em homologação com dados reais dos clientes-piloto
- [ ] E7.7 Piloto assistido em produção com 1 cliente, acompanhado pela contadora
- [ ] E7.8 Definir meta mínima de cobertura e critérios de "go-live"

**Critérios de aceite:**
- Nenhuma emissão em produção antes de uma rodada completa aprovada em homologação
- Piloto concluído sem incidentes fiscais

---

## E8. DevOps, observabilidade e operação

- [ ] E8.1 Pipeline de CI: build, lint, typecheck, testes e scan de segredos em cada PR
- [ ] E8.2 Pipeline de CD com ambientes separados (homologação e produção)
- [ ] E8.3 Containerização (Docker) e hospedagem (ex.: Azure)
- [ ] E8.4 Monitoramento de erros e métricas (ex.: Sentry, Application Insights) com alertas
- [ ] E8.5 Logs estruturados, sem dados sensíveis
- [ ] E8.6 Estratégia de versionamento, changelog e plano de rollback
- [ ] E8.7 Rotina de backup e teste de restauração

---

## E9. Documentação, LGPD e governança

- [ ] E9.1 README atualizado: visão geral, arquitetura (diagrama frontend → BFF → provedor), variáveis de ambiente, como rodar
- [ ] E9.2 Criar/atualizar `CONTRIBUTING.md` e `SKILLS.md`, referenciados no README
- [ ] E9.3 Documentação da API (OpenAPI) e do fluxo de emissão
- [ ] E9.4 Mapeamento de dados pessoais e base legal (LGPD); definir papéis: contadora (operadora) e clientes (titulares)
- [ ] E9.5 Termos de uso e política de privacidade
- [ ] E9.6 Procedimento de resposta a incidentes (vazamento de certificado)
- [ ] E9.7 Templates de PR e issues, fluxo de branches
- [ ] E9.8 Definir responsabilidade fiscal: a ferramenta emite, a contadora valida

---

## 3. Fora do MVP (backlog futuro)

- Emissão de NFe de produto (merchandising: CDs, camisetas)
- Apuração de impostos, guias e integração com sistema contábil
- Relatórios e dashboards avançados
- App nativo (se a web no celular for suficiente, pode nem ser necessário)
- Acesso direto dos clientes (artistas) com perfil próprio
- Multi-contador (várias contadoras) e cobrança/planos

## 4. Riscos principais

| # | Risco | Impacto | Mitigação |
|---|---|---|---|
| R1 | Vazamento de certificado de terceiros | Crítico | E2 completo, auditoria, Key Vault, MFA, plano de incidente |
| R2 | Município do cliente fora do padrão nacional | Alto | Mapear em E0.5; escolher provedor com boa cobertura; camada `IEmissorNfse` |
| R3 | Regras fiscais erradas (local do ISS, retenções) | Alto | Validação contínua pela contadora; homologação; escopo mínimo de regras no MVP |
| R4 | Dependência do provedor (indisponibilidade, mudança de API, custo) | Médio | Abstração do provedor, fila com reprocessamento, monitoramento |
| R5 | Emissão duplicada ou incorreta | Alto | Idempotência, conferência antes de enviar, cancelamento |
| R6 | Escopo crescer antes do MVP funcionar | Médio | Lista "fora do MVP" e revisão de escopo a cada sprint |
| R7 | Única pessoa desenvolvendo (risco de capacidade) | Médio | Fases pequenas, entregas em homologação cedo, documentação |

## 5. Definição de pronto (DoD)

- Código revisado, com testes do que for regra de negócio ou segurança
- Lint, typecheck e testes passando no CI
- Sem segredos no repositório e sem dados sensíveis em logs
- Validado em homologação quando tocar na emissão
- Documentação atualizada quando mudar contrato, fluxo ou configuração

## 6. Decisões em aberto

1. Provedor de emissão: Emissor Nacional direto ou gateway? (E0.7)
2. O backend manipula o .pfx ou apenas repassa credenciais/procuração? (depende do provedor)
3. Custódia: Azure Key Vault ou criptografia em camada de aplicação? (E2.1)
4. Como a contadora atua por cliente: certificado de cada um ou procuração eletrônica? (E0.6)
5. Web no celular basta ou será preciso app nativo? (E6)
