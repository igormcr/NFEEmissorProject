# Assistente Fiscal de NFe (RAG) + Integração com o NFEEmissorFront

> Marque as tasks com `[x]` conforme avançar. Ritmo base: 8 semanas (estique para 10 a 12 se precisar, mantendo a ordem).

**Início:** ____/____/______  **Meta de conclusão:** ____/____/______

## Visão geral da arquitetura

```
NFEEmissorFront (Expo/React/TS)
   ├── src/app/emitir.tsx, consultar.tsx, status ...   (já existem)
   ├── src/app/assistente.tsx                           (NOVO: chat fiscal)
   └── src/lib/assistant-api.ts                         (NOVO: client do assistente)
            │
            ▼
   Back-for-front (SQL, dados dos clientes)             (já planejado)
            │
            ▼
   nfe-assistant (Python + FastAPI)                     (NOVO: RAG + avaliação)
            │
            ▼
   Postgres + pgvector  |  LLM + embeddings  |  Langfuse/OpenTelemetry
```

**Princípios:**
- O assistente é um **serviço separado**, que nunca recebe certificado digital nem chave privada.
- Dados sensíveis (CNPJ, CPF, nomes, endereços) são **mascarados** antes de ir ao LLM.
- Toda resposta cita a **fonte oficial** e traz o aviso de que é apoio, não parecer fiscal.

---

## Fase 0: Preparação (2 a 3 dias)

- [ ] Confirmar o recorte inicial do corpus (MOC da NF-e + tabela de rejeições + CFOP)
- [ ] Baixar os documentos do Portal Nacional da NF-e (MOC, Notas Técnicas, tabelas)
- [ ] Verificar licença/condições de uso de cada fonte
- [ ] Criar repositório `nfe-assistant` no GitHub (licença + README inicial)
- [ ] Criar estrutura de pastas: `/api`, `/eval`, `/infra`, `/docs`, `/data`
- [ ] Definir stack: Python + FastAPI, Postgres + pgvector, Docker Compose
- [ ] Escolher provedor de LLM e de embeddings e criar chaves de API
- [ ] Criar `.env.example` e garantir `.env` no `.gitignore`
- [ ] Separar **XMLs de exemplo anonimizados/de homologação** para testes (nunca dados reais de clientes)

---

## Semana 1: Ingestão do corpus fiscal

- [ ] Subir Postgres + pgvector com Docker Compose
- [ ] Criar esquema: documentos, chunks, embeddings, metadados (fonte, versão, seção, página)
- [ ] Extrair texto dos PDFs/HTML do MOC e das Notas Técnicas
- [ ] Tratar tabelas (rejeições, CFOP, CST/CSOSN) como registros estruturados, não só texto corrido
- [ ] Implementar *chunking* inicial (tamanho fixo com sobreposição)
- [ ] Gerar embeddings e salvar no banco
- [ ] Criar script de ingestão do corpus completo
- [ ] Testar buscas manuais ("rejeição 539", "CFOP venda interestadual") e conferir resultados
- [ ] Commit e README com instruções de execução

**Entrega:** corpus fiscal ingerido e pesquisável.

---

## Semana 2: RAG básico

- [ ] Criar endpoint `POST /chat` (pergunta, top-k, prompt com contexto, resposta com citações)
- [ ] Prompt que responde "não encontrei na documentação" quando não há base
- [ ] Incluir aviso fixo: apoio informativo, validar com contador
- [ ] Implementar streaming da resposta
- [ ] Criar `POST /explicar-rejeicao` (recebe código + mensagem, devolve causa, correção e fonte)
- [ ] Testar com 20 perguntas manuais e anotar falhas

**Entrega:** API respondendo dúvidas fiscais com fontes.

---

## Semana 3: Dataset e pipeline de avaliação

- [ ] Montar dataset com 50 a 100 casos
  - [ ] 30+ casos de rejeição (código/mensagem → causa e solução documentadas)
  - [ ] 20+ dúvidas de preenchimento (campos, CFOP, CST/CSOSN)
  - [ ] 10+ perguntas "armadilha" sem resposta no corpus
- [ ] Registrar para cada caso: pergunta, resposta esperada, trecho-fonte correto
- [ ] Implementar métricas de recuperação (recall@k, MRR)
- [ ] Implementar métricas de geração (fidelidade ao contexto, relevância) com RAGAS ou LLM-as-judge
- [ ] Criar script único que roda a avaliação e gera relatório
- [ ] Registrar a **linha de base** em `/docs/resultados.md`

**Entrega:** números reais da versão inicial.

---

## Semana 4: Melhorar a recuperação

- [ ] Implementar busca híbrida (vetorial + full-text/BM25)
- [ ] Medir e registrar
- [ ] Adicionar *reranking*
- [ ] Medir e registrar
- [ ] Busca por **código exato** (rejeição, CFOP, NCM) antes da busca semântica
- [ ] Medir e registrar
- [ ] Testar estratégias de *chunking* (por seção/campo do MOC)
- [ ] Medir e registrar
- [ ] Tabela "antes e depois" por técnica em `/docs/resultados.md`

**Entrega:** comparativo com ganhos mensuráveis.

---

## Semana 5: Análise de XML + observabilidade

- [ ] Endpoint `POST /analisar-xml`: lê XML de NFe e extrai campos relevantes (parser, não LLM)
- [ ] Mascarar CNPJ/CPF/nomes/endereços antes de qualquer chamada ao LLM
- [ ] Explicar campos e inconsistências prováveis com saída estruturada (JSON validado)
- [ ] Avaliar a análise de XML com casos de teste (XMLs válidos e com erros conhecidos)
- [ ] Integrar *tracing* (Langfuse ou OpenTelemetry): prompt, contexto, latência, tokens, custo
- [ ] Painel simples de custo e latência por consulta
- [ ] Cache, rate limiting, *timeouts*, *retries* e *fallback* de modelo
- [ ] Proteções contra *prompt injection* (XML e texto do usuário são entrada não confiável)
- [ ] Garantir que logs não guardam dados sensíveis

**Entrega:** serviço robusto e observável.

---

## Semana 6: Integração com o NFEEmissorFront

- [ ] Definir contrato da API do assistente (OpenAPI) e tipos em `src/types/`
- [ ] Criar `src/lib/assistant-api.ts` (client do assistente)
- [ ] Passar a chamada pelo back-for-front (autenticação, limites e mascaramento centralizados)
- [ ] Criar tela `src/app/assistente.tsx` (chat com streaming e citações)
- [ ] Adicionar botão **"Explicar erro"** na tela de status/consulta quando houver rejeição
- [ ] Adicionar **"Analisar XML"** a partir de uma NFe emitida/consultada
- [ ] Citações clicáveis que abrem o trecho da documentação
- [ ] Botões 👍/👎 salvos no banco e usados para ampliar o dataset
- [ ] Estados de carregamento e erro tratados na interface
- [ ] Pedir para a usuária-alvo testar e anotar dificuldades reais

**Entrega:** assistente dentro do app, útil em um fluxo real.

---

## Semana 7: Deploy e qualidade

- [ ] Dockerfile do `nfe-assistant`
- [ ] CI/CD (GitHub Actions): testes + avaliação a cada PR, comentando as métricas
- [ ] Deploy no Azure (Container Apps ou similar)
- [ ] Segredos e variáveis de ambiente com segurança
- [ ] Testes unitários e de integração nos pontos críticos
- [ ] Limite de custo/orçamento configurado no provedor de LLM e na nuvem
- [ ] URL pública funcionando (demo com dados fictícios/homologação)

**Entrega:** serviço no ar e integrado.

---

## Semana 8: Vitrine

- [ ] README final do `nfe-assistant`
  - [ ] Problema e motivação (domínio regulado, erros crípticos)
  - [ ] Diagrama de arquitetura (use o do topo deste arquivo)
  - [ ] Decisões técnicas e *trade-offs* (privacidade, mascaramento, serviço separado)
  - [ ] Resultados com números (antes e depois)
  - [ ] Como rodar localmente
  - [ ] Limitações e próximos passos
- [ ] Atualizar o README do NFEEmissorFront descrevendo a integração
- [ ] Gravar vídeo demo de 1 a 2 minutos (emitir → rejeição → "Explicar erro")
- [ ] Post técnico (LinkedIn ou blog)
- [ ] Atualizar currículo e LinkedIn com o projeto e métricas concretas
- [ ] Fixar os dois repositórios no perfil do GitHub
- [ ] Preparar roteiro para entrevista (2 min e 10 min)

**Entrega:** portfólio pronto para recrutadores.

---

## Extensões (se sobrar tempo)

- [ ] Sugestão de CFOP/CST/NCM a partir da descrição da operação, com justificativa e confiança
- [ ] Agente com ferramentas (consultar status na SEFAZ via sua API e explicar o retorno)
- [ ] Comparar modelos (custo × qualidade) no seu dataset
- [ ] Suporte a mais estados e legislação específica
- [ ] Avaliação contínua em produção com o feedback dos usuários

---

## Cuidados permanentes

- [ ] Nunca enviar certificado digital, chave privada ou senha a nenhum serviço de IA
- [ ] Nunca usar dados reais de clientes em testes, demos ou prints
- [ ] Sempre exibir fonte + aviso de que a resposta é apoio e deve ser validada por contador
- [ ] Revisar periodicamente se o corpus está atualizado (Notas Técnicas mudam)

## Registro de progresso

| Semana | Início | Fim | Status | Observações |
|--------|--------|-----|--------|-------------|
| 0 | | | | |
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |
| 6 | | | | |
| 7 | | | | |
| 8 | | | | |
