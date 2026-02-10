# ZD-182 — Workflow Ideal e Hipótese de Implementação (Round 7)

## 1) Objetivo
Ter uma conversa de Round 7 estável, contextual e previsível:
- O utilizador envia mensagem.
- O backend escolhe quem responde (Aquari ou especialista) sem quebrar regras da cena.
- O provider devolve conteúdo útil (não placeholders/IDs/erros opacos).
- A UI mostra apenas quem está ativo no `scenePlan` e respeita a ordem de fala.

## 2) Workflow ideal (end-to-end)

### Step A — Input do utilizador
1. UI envia `POST /api/ai/messages/batch` com:
   - `gameId`, `proposalId`, `round=7`, `userId`, `latestUserMessage`, `agents`, `locale`.
2. Backend valida request, autorização e idempotência (`clientRequestId`).

### Step B — Contexto
3. Backend monta contexto com:
   - proposta (título, objetivos, funcionalidades, texto),
   - histórico recente da discussão,
   - resumo (se existir),
   - RAG (se houver chunks relevantes).

### Step C — Decisão de agente (orquestração)
4. Backend calcula `userTurn` e estado atual (`activeAgentIds`).
5. Aplica política de turno:
   - Turno 1: Aquari forçado.
   - Turnos 2-4: Aquari + especialista opcional (reveal com handoff quando necessário).
   - Turno 5: sem novos reveals.
6. Router decide especialista:
   - regra local por score/keywords,
   - planner LLM só quando baixa confiança/ambiguidade.
7. Resultado vira `scenePlan`:
   - `speakingOrder`, `activeAgentIds`, `revealAgentIds`, `routing`.

### Step D — Geração de mensagem
8. Para cada agente em `speakingOrder`, backend envia payload estruturado ao provider:
   - identidade não-humana,
   - contexto de proposta + discussão,
   - regras de output (uma frase, sem prefixo, mesma língua da última mensagem do user),
   - constraints de segurança.
9. Backend valida output:
   - rejeita placeholder, ID-like e respostas inválidas,
   - tenta repair uma vez,
   - fallback contextual só se provider falhar.

### Step E — Persistência e resposta
10. Backend persiste mensagens AI em `discussion_messages`.
11. Responde à UI com:
   - `messages[]`,
   - `scenePlan`,
   - `errors[]`,
   - `errorMode` (`none` | `soft_fallback` | `hard_error`).
12. UI renderiza apenas pelo `scenePlan` (sem inferências paralelas).

## 3) Hipótese de implementação (simples e robusta)

### Hipótese principal
O problema atual não é só o router; é uma combinação de:
- falha recorrente do provider (`Unexpected processing error`),
- excesso de caminhos de fallback/regras concorrentes,
- mistura de idioma por resolução de locale inconsistente,
- respostas genéricas hardcoded a sobrepor comportamento desejado.

### Estratégia proposta
1. **Single source of truth da cena**
   - O backend decide `scenePlan` uma única vez por request.
   - A UI só executa `scenePlan`.

2. **Prompt estruturado único por speaker**
   - Manter payload JSON estruturado para o provider.
   - Incluir instrução explícita: responder na mesma língua da `latestUserMessage`.

3. **Fallback mínimo e rastreável**
   - Fallback apenas quando provider falha de facto.
   - Não usar respostas genéricas fixas para perguntas abertas se houver contexto suficiente.

4. **Planner com gate estrito**
   - Planner apenas em baixa confiança (turnos 2-4).
   - Se planner falhar: usar rule-router + Aquari, sem quebrar turno.

5. **Validação de output forte**
   - Rejeitar placeholders (`Processing`, `Unexpected processing error`) e IDs opacos.
   - Se inválido: repair curto; se falhar, fallback contextual curto.

## 4) Contrato mínimo recomendado

### Input API (UI -> backend)
- manter contrato atual.
- adicionar apenas campos opcionais de debug quando necessário.

### Output API (backend -> UI)
- `messages[]` (compatível com hoje)
- `scenePlan` obrigatório
- `errorMode` com semântica real
- `errors[]` com códigos consistentes

## 5) Critérios de aceitação
- Pergunta aberta recebe resposta contextual (não template genérico repetido).
- Pergunta sobre entidade específica ativa especialista correto quando permitido pelo turno.
- Língua da resposta segue a última mensagem do user.
- Nenhum avatar invisível aparece a escrever.
- Logs permitem localizar falha por etapa em menos de 1 minuto.

## 6) Anti-patterns a evitar
- Múltiplas funções a competir para gerar resposta final fora do fluxo principal.
- Fallbacks genéricos antes de tentar geração contextual real.
- Misturar decisão de cena no frontend e no backend ao mesmo tempo.
- Responder `errorMode: none` quando o provider falhou e houve fallback não trivial.
