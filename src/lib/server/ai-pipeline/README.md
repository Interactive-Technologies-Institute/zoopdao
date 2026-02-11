# AI Pipeline (Server)

Esta pasta centraliza a pipeline de IA no backend.

## Core

- `prompts.ts`: identidade/políticas do non-human speaker.
- `context.ts`: montagem de contexto (proposal/history/summary/RAG).
- `validators.ts`: validações de output.
- `summary.ts`: resumo rolling da discussão.

## Round 7

- `round7/executor.ts`: orquestração principal da ronda 7.
- `round7/provider.ts`: chamada única ao provider IAEDU.
- `round7/prompt.ts`: prompt textual final enviado ao modelo.
- `round7/context.ts`: integração do contexto específico da ronda 7.
- `round7/context.ts`: integração do contexto específico da ronda 7 + resolução/persistência do `thread_id` por conversa.
- `round7/routing.ts`: política de cena (atual: aquari-only).
- `round7/response.ts`: contrato HTTP de sucesso/erro.
- `round7/logger.ts`: logs estruturados por etapa.
- `round7/types.ts`: tipos da pipeline da ronda 7.

## Compatibilidade

Existem wrappers mínimos em `src/lib/server/` para `ai-context`, `ai-prompts`, `ai-summary` e `ai-validators` enquanto os imports legados são migrados para esta pasta.
