# Documento de Escopo: Emissor de NFS-e (MVP)

> **Como usar:** preencha tudo que estiver entre `[colchetes]`. Itens marcados com 🔎 já vêm com uma sugestão baseada no que foi conversado e **precisam ser validados** com a contadora. Apague as dicas em *itálico* quando terminar.

| Campo | Valor |
|---|---|
| Projeto | [nome do projeto] |
| Versão do documento | 0.1 (rascunho) |
| Data | [dd/mm/aaaa] |
| Responsável (desenvolvimento) | [nome] |
| Patrocinadora / aprovadora | [nome da contadora] |
| Status | Rascunho / Em revisão / Aprovado |

---

## 1. Contexto e problema

*Descreva a situação atual em poucas linhas, com as palavras da contadora. Quanto mais concreto, melhor.*

- Quem é a usuária e como trabalha hoje: [ex.: atende N clientes do meio musical, emite notas em portais diferentes]
- Como a emissão é feita hoje (passo a passo resumido): [...]
- Principais dores: [ex.: tempo gasto, erros, retrabalho, dependência de cada portal]
- Volume aproximado: [nº de clientes] clientes, [nº] notas por mês

## 2. Objetivo do MVP

*Uma ou duas frases: o que a contadora conseguirá fazer ao final que hoje não consegue, ou faz com muito esforço.*

🔎 Permitir que a contadora emita e consulte NFS-e de todos os seus clientes em um único lugar, de forma rápida e segura, inclusive pelo celular.

**Como saberemos que deu certo (metas mensuráveis):**

- [ex.: emitir uma nota em menos de X minutos (hoje: Y minutos)]
- [ex.: atender N clientes no sistema em até X semanas]
- [ex.: zero notas emitidas em duplicidade]

## 3. Usuários e partes interessadas

| Papel | Quem | O que precisa |
|---|---|---|
| Usuária principal | [contadora] | Emitir e consultar notas de vários clientes |
| Clientes (prestadores) | [artistas/bandas] | Ter as notas emitidas corretamente; proteção dos seus dados |
| Contratantes (tomadores) | [casas de show, produtoras, prefeituras...] | Receber a nota correta, com as retenções |
| Desenvolvimento | [nome] | Escopo claro e estável |

## 4. O que está DENTRO do escopo

*Liste funcionalidades em linguagem de negócio, não técnica. Cada item deve poder ser verificado ("funciona / não funciona").*

🔎 Sugestão inicial:

- [ ] Cadastro de clientes (prestadores) com regime, município e dados fiscais
- [ ] Cadastro de contratantes (tomadores) e de modelos de serviço reutilizáveis
- [ ] Envio e guarda segura do certificado digital de cada cliente
- [ ] Emissão de NFS-e para [município(s)/padrão nacional: definir]
- [ ] Cálculo de ISS e retenções aplicáveis: [listar quais]
- [ ] Consulta e histórico de notas por cliente, com filtros
- [ ] Download de XML e PDF; envio por [e-mail / WhatsApp]
- [ ] Cancelamento de nota
- [ ] Alerta de vencimento de certificado
- [ ] Acesso por login, com isolamento entre clientes
- [ ] Uso confortável pelo navegador do celular
- [ ] [outro item]

## 5. O que está FORA do escopo (neste MVP)

*Tão importante quanto o anterior. Serve para evitar mal-entendidos e para proteger o prazo.*

🔎 Sugestão inicial:

- Emissão de NFe de produto (venda de mercadorias, merchandising)
- Apuração de impostos, guias e integração com sistema contábil
- Relatórios e dashboards avançados
- Aplicativo nativo (iOS/Android)
- Acesso direto dos clientes (artistas) ao sistema
- Uso por outros contadores e cobrança/planos
- [outro item]

## 6. Regras de negócio e fiscais

*Preencher com a contadora. É aqui que mora o maior risco de erro.*

| Tema | Regra / decisão | Fonte/validação |
|---|---|---|
| Documento emitido | 🔎 NFS-e (serviço); confirmar item da lista de serviços (LC 116, item 12) | [contadora] |
| Regimes atendidos no MVP | [MEI / Simples / PF autônomo / PJ: quais?] | [...] |
| Município de emissão | [sempre o do prestador? depende do local do show?] | [...] |
| Local de incidência do ISS | [regra para shows em outros municípios] | [...] |
| Retenções (ISS, IR, INSS, outras) | [quando se aplicam, quando o tomador é prefeitura/PJ] | [...] |
| Códigos de serviço/tributação padrão | [lista por cliente] | [...] |
| Prazo e regras de cancelamento | [...] | [...] |
| Municípios sem emissão pelo padrão nacional | [como tratar: fora do MVP? via provedor?] | [...] |

## 7. Requisitos de segurança e privacidade

🔎 Sugestão inicial (validar o nível de exigência):

- Certificados e senhas guardados de forma criptografada, nunca em texto
- Nenhum arquivo ou senha de certificado retorna para a tela depois do envio
- Cada usuário só acessa os clientes que lhe pertencem
- Registro de auditoria: quem usou qual certificado, quando e para qual nota
- Acesso com login e sessão segura (MFA: [sim / não / futuro])
- Conformidade com a LGPD: [papéis: contadora é operadora? termos de uso?]
- Backup dos dados: [frequência desejada]

## 8. Requisitos de uso (não funcionais)

- Dispositivos: [celular / computador / ambos]
- Desempenho esperado: [ex.: emissão concluída em até X segundos, quando o provedor estiver disponível]
- Disponibilidade esperada: [ex.: horário comercial / 24h]
- Quantidade de usuários simultâneos: [1 / poucos]
- Idioma/acessibilidade: [português; requisitos especiais?]

## 9. Integrações e dependências

| Item | Decisão | Status |
|---|---|---|
| Provedor de emissão | [Emissor Nacional direto / gateway: qual?] | [em avaliação / decidido] |
| Ambiente de homologação disponível | [sim / não] | [...] |
| Custo do provedor | [R$ / nota ou mensalidade] | [...] |
| Certificados dos clientes | [A1 de cada cliente / procuração / outro] | [...] |
| Hospedagem | [ex.: Azure] | [...] |

## 10. Entregas e cronograma

*Ajuste as datas com a realidade de tempo disponível.*

| Marco | Descrição | Data prevista |
|---|---|---|
| M0 | Escopo aprovado e provedor escolhido | [data] |
| M1 | Backend + cadastros + certificados seguros | [data] |
| M2 | Emissão em **homologação** para clientes-piloto | [data] |
| M3 | Consulta, histórico e cancelamento | [data] |
| M4 | Piloto em **produção** com 1 cliente, acompanhado | [data] |
| M5 | Liberação para os demais clientes | [data] |

**Clientes-piloto:** [cliente 1], [cliente 2], [cliente 3]

## 11. Critérios de aceite do MVP

*Condições objetivas para a contadora dizer "está aprovado".*

- [ ] Emissão em homologação concluída para todos os clientes-piloto, sem erro de cálculo
- [ ] Piloto em produção com [nº] notas emitidas e conferidas por ela
- [ ] Nenhuma nota duplicada em [período] de uso
- [ ] Certificados não são expostos em nenhuma tela, resposta ou log (verificado)
- [ ] Ela consegue localizar uma nota antiga de um cliente em menos de [X] segundos/cliques
- [ ] Tempo para emitir uma nota: [meta] (hoje: [valor])
- [ ] [outro critério]

## 12. Premissas e restrições

**Premissas (o que estamos assumindo ser verdade):**

- A contadora estará disponível para validar regras e testar em homologação: [frequência]
- Os clientes-piloto fornecerão certificado válido e autorização de uso
- O provedor escolhido cobre os municípios dos clientes-piloto
- [outra premissa]

**Restrições (limites que não dependem de nós):**

- Tempo de desenvolvimento disponível: [horas/semana]
- Orçamento de infraestrutura e provedor: [R$]
- Legislação e mudanças fiscais (padrão nacional da NFS-e, reforma tributária)
- [outra restrição]

## 13. Riscos principais

| Risco | Impacto | Mitigação | Responsável |
|---|---|---|---|
| Vazamento de certificado de terceiros | Crítico | Criptografia, cofre de segredos, auditoria, MFA | [dev] |
| Município sem emissão pelo padrão nacional | Alto | Mapear cedo; provedor com boa cobertura | [dev + contadora] |
| Regra fiscal aplicada errada | Alto | Validação pela contadora; homologação | [contadora] |
| Indisponibilidade/mudança do provedor | Médio | Camada de abstração; fila com reprocessamento | [dev] |
| Escopo crescer antes do MVP ficar pronto | Médio | Esta seção 5 + revisão por marco | [dev] |
| [outro risco] | | | |

## 14. Controle de mudanças

*Combine desde já como pedidos novos serão tratados.*

- Todo pedido fora do escopo é registrado em [local: lista/issue] e classificado como: entra no MVP (troca por outro item) / pós-MVP / descartado
- Mudanças no escopo só valem após aprovação de [contadora] e registro na tabela abaixo

| Data | Mudança | Impacto (prazo/esforço) | Aprovada por |
|---|---|---|---|
| | | | |

## 15. Glossário (opcional)

| Termo | Significado |
|---|---|
| NFS-e | Nota Fiscal de Serviços Eletrônica |
| Prestador | Quem presta o serviço (o artista/banda) |
| Tomador | Quem contrata o serviço (casa de show, produtora etc.) |
| Certificado A1 | Certificado digital em arquivo (.pfx) usado para assinar documentos fiscais |
| Homologação | Ambiente de testes do provedor/prefeitura, sem valor fiscal |
| [termo] | [significado] |

## 16. Aprovação

Declaro que li e concordo com o escopo descrito neste documento para o MVP.

| Nome | Papel | Data | Assinatura / "de acordo" |
|---|---|---|---|
| [contadora] | Aprovadora | | |
| [desenvolvedor] | Responsável técnico | | |
