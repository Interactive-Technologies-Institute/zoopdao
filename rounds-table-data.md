# Títulos e Descrições para a Tabela `rounds` do Supabase

Baseado no mapeamento ZD-169, aqui estão os títulos e descrições para cada rodada:

## SQL INSERT Statements

```sql
-- Limpar dados existentes (opcional)
-- DELETE FROM rounds;

-- Inserir os dados das rodadas
INSERT INTO rounds (id, index, title, description) VALUES
-- Round 0: Proposal Title
(0, 0, 'Proposal Title', 'Review the proposal title and scenario. Understand the context and purpose of this governance proposal.'),

-- Round 1: Long-term Objective 1
(1, 1, 'Long-term Objective 1', 'Discuss the first long-term objective of the proposal. Share your perspective on how this objective aligns with the organization''s goals.'),

-- Round 2: Long-term Objective 2
(2, 2, 'Long-term Objective 2', 'Discuss the second long-term objective of the proposal. Consider how this objective complements the first and contributes to the overall vision.'),

-- Round 3: Preconditions and Goals
(3, 3, 'Preconditions and Goals', 'Examine the preconditions and requirements needed to achieve the objectives. Discuss what must be in place for the proposal to succeed.'),

-- Round 4: Indicative Steps
(4, 4, 'Indicative Steps', 'Review the initial steps outlined in the proposal. Discuss the practical actions needed to move forward and any concerns or suggestions.'),

-- Round 5: Key Indicators
(5, 5, 'Key Indicators', 'Evaluate the key performance indicators (KPIs) proposed. Discuss whether these indicators effectively measure success and progress.'),

-- Round 6: Functionalities
(6, 6, 'Functionalities', 'Examine the functionalities and features proposed. Discuss how these will be implemented and their impact on operations.'),

-- Round 7: Final Discussion
(7, 7, 'Final Discussion', 'Engage in open discussion about the proposal. Share your final thoughts, concerns, and perspectives before voting.')
ON CONFLICT (id) DO UPDATE SET
    index = EXCLUDED.index,
    title = EXCLUDED.title,
    description = EXCLUDED.description;
```

## Dados em Formato Tabela

| ID | Index | Title | Description |
|----|-------|-------|-------------|
| 0 | 0 | Proposal Title | Review the proposal title and scenario. Understand the context and purpose of this governance proposal. |
| 1 | 1 | Long-term Objective 1 | Discuss the first long-term objective of the proposal. Share your perspective on how this objective aligns with the organization's goals. |
| 2 | 2 | Long-term Objective 2 | Discuss the second long-term objective of the proposal. Consider how this objective complements the first and contributes to the overall vision. |
| 3 | 3 | Preconditions and Goals | Examine the preconditions and requirements needed to achieve the objectives. Discuss what must be in place for the proposal to succeed. |
| 4 | 4 | Indicative Steps | Review the initial steps outlined in the proposal. Discuss the practical actions needed to move forward and any concerns or suggestions. |
| 5 | 5 | Key Indicators | Evaluate the key performance indicators (KPIs) proposed. Discuss whether these indicators effectively measure success and progress. |
| 6 | 6 | Functionalities | Examine the functionalities and features proposed. Discuss how these will be implemented and their impact on operations. |
| 7 | 7 | Final Discussion | Engage in open discussion about the proposal. Share your final thoughts, concerns, and perspectives before voting. |

## Traduções em Português

| ID | Index | Title (PT) | Description (PT) |
|----|-------|-----------|------------------|
| 0 | 0 | Título da Proposta | Revê o título e cenário da proposta. Compreende o contexto e propósito desta proposta de governança. |
| 1 | 1 | Objetivo de Longo Prazo 1 | Discute o primeiro objetivo de longo prazo da proposta. Partilha a tua perspetiva sobre como este objetivo se alinha com os objetivos da organização. |
| 2 | 2 | Objetivo de Longo Prazo 2 | Discute o segundo objetivo de longo prazo da proposta. Considera como este objetivo complementa o primeiro e contribui para a visão geral. |
| 3 | 3 | Pré-condições e Objetivos | Examina as pré-condições e requisitos necessários para alcançar os objetivos. Discute o que deve estar em vigor para a proposta ter sucesso. |
| 4 | 4 | Etapas Indicativas | Revê as etapas iniciais delineadas na proposta. Discute as ações práticas necessárias para avançar e quaisquer preocupações ou sugestões. |
| 5 | 5 | Indicadores-Chave | Avalia os indicadores-chave de desempenho (KPIs) propostos. Discute se estes indicadores medem efetivamente o sucesso e o progresso. |
| 6 | 6 | Funcionalidades | Examina as funcionalidades e características propostas. Discute como serão implementadas e o seu impacto nas operações. |
| 7 | 7 | Discussão Final | Participa numa discussão aberta sobre a proposta. Partilha os teus pensamentos finais, preocupações e perspetivas antes de votar. |

## Notas

- Os títulos e descrições estão alinhados com o mapeamento ZD-169
- As traduções em português estão disponíveis nos arquivos de mensagens (messages/pt.json)
- Os dados podem ser inseridos diretamente no Supabase usando o SQL acima
- O `ON CONFLICT` garante que os dados sejam atualizados se já existirem

