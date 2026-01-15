# Fluxo das Rondas: Do Mapa à Visualização de Histórias

## 📋 Visão Geral Simplificada (Lógica de Conceitos)

```
MAP → START → MOVE → CARD → WRITE → SUBMIT → NEXT_ROUND → END → SAVE → BROWSE
```

**Conceitos-chave:**
- **MAP**: Visualização do mapa com stops selecionáveis
- **START**: Escolha do stop inicial (ronda 0)
- **MOVE**: Movimento para novo stop (rondas 1-6)
- **CARD**: Seleção automática de carta baseada no stop
- **WRITE**: Escrita da resposta na história
- **SUBMIT**: Submissão da resposta
- **NEXT_ROUND**: Transição automática para próxima ronda
- **END**: Fim do jogo (ronda 7 - reflexão)
- **SAVE**: Guardar história completa
- **BROWSE**: Navegar histórias de outros jogadores

---

## 🔄 Fluxo Detalhado: Frontend ↔ Backend ↔ Database

### **FASE 1: INICIALIZAÇÃO DO JOGO**

#### 1.1 Carregamento da Página (`/routes/[code]/game/+page.ts`)

**Frontend:**
- `load()` function executa no servidor (SvelteKit)

**Chamadas à Base de Dados:**
```typescript
// 1. Buscar jogo
supabase.from('games').select('*').eq('code', code).single()

// 2. Buscar jogadores
supabase.from('players').select('*').eq('game_id', gameId)

// 3. Buscar rondas
supabase.from('rounds').select('*')

// 4. Buscar stops
supabase.from('stops').select('*')

// 5. Buscar cartas
supabase.from('cards').select('id, type, title, hero_steps, character_category, prompt_text(text)')
  .eq('prompt_text.lang', locale)

// 6. Buscar game_rounds
supabase.from('game_rounds').select('*').eq('game_id', gameId)

// 7. Buscar player_moves
supabase.from('player_moves').select('*').eq('game_id', gameId)

// 8. Buscar player_cards
supabase.from('player_cards').select('*').eq('game_id', gameId)

// 9. Buscar player_answers
supabase.from('player_answers').select('*').eq('game_id', gameId)
```

**Estado Inicial:**
- Dados passados para `GameState` constructor
- Subscrições Supabase Realtime configuradas

---

### **FASE 2: RONDA 0 - INÍCIO NO MAPA**

#### 2.1 Visualização do Mapa (`/components/map.svelte`)

**Frontend:**
- Componente `Map` renderiza stops
- `selectableStops` calcula stops iniciais disponíveis
- `handleStopClick()` captura clique no stop

**Lógica Frontend:**
```typescript
// Determina stops selecionáveis
if (playerState === 'starting') {
  return gameState.getInitialStops(); // Filtra stops com initial=true
}
```

**Função Frontend:**
- `gameState.getInitialStops()` → Filtra `stops` onde `initial = true`

#### 2.2 Seleção do Stop Inicial (`game-state.svelte.ts`)

**Frontend:**
```typescript
gameState.playerStart(stopId)
```

**Chamada Backend:**
```typescript
supabase.rpc('player_start', {
  game_code: this.code,
  stop_id: stopId
})
```

**Backend (RPC `player_start`):**
```sql
-- 1. Busca game_id pelo código
SELECT id INTO v_game_id FROM games WHERE code = game_code;

-- 2. Valida jogador
SELECT id INTO v_player_id FROM players 
WHERE user_id = auth.uid() AND game_id = v_game_id;

-- 3. Valida stop inicial
SELECT 1 FROM stops WHERE id = stop_id AND initial = TRUE;

-- 4. Insere movimento (ronda 0)
INSERT INTO player_moves (player_id, stop_id, round, game_id)
VALUES (v_player_id, stop_id, 0, v_game_id);

-- 5. Verifica se todos iniciaram
PERFORM check_starting_round_completion(v_game_id);
```

**Database Updates:**
- `player_moves`: INSERT novo movimento (round=0)
- `games`: UPDATE state='playing' (se todos iniciaram)
- `game_rounds`: INSERT nova ronda com dice_roll (via `roll_dice()`)

**Realtime Updates:**
- `subscribePlayerMoves()` → Adiciona movimento ao estado local
- `subscribeGame()` → Atualiza `gameState.state` para 'playing'
- `subscribeGameRounds()` → Adiciona nova `GameRound` ao array

---

### **FASE 3: RONDAS 1-6 - MOVIMENTO E ESCRITA**

#### 3.1 Visualização do Dado (`/components/dice.svelte`)

**Frontend:**
- Componente mostra valor do dado da ronda atual
- Valor vem de `gameRounds.find(r => r.round === currentRound)?.dice_roll`

**Fonte de Dados:**
- `game_rounds.dice_roll` (gerado por `roll_dice()` no backend)

#### 3.2 Seleção do Stop para Movimento (`/components/map.svelte`)

**Frontend:**
```typescript
// Calcula stops alcançáveis
if (playerState === 'moving') {
  return gameState.getPossibleStops(currentStopId, dice);
}
```

**Função Frontend:**
- `gameState.getPossibleStops(stopId, moves)` → Algoritmo BFS para calcular stops alcançáveis em N movimentos

**Lógica:**
- Usa `stop.paths` para navegar grafo
- Retorna stops exatamente a `moves` distância do stop atual

#### 3.3 Movimento do Jogador (`game-state.svelte.ts`)

**Frontend:**
```typescript
gameState.playerMove(stopId)
```

**Chamada Backend:**
```typescript
supabase.rpc('player_move', {
  game_code: this.code,
  game_round: this.currentRound,
  stop_id: stopId,
  p_hero_step: this.currentRound,
  p_character_category: characterCategory
})
```

**Backend (RPC `player_move`):**
```sql
-- 1. Busca game_id e player_id
SELECT id INTO v_game_id FROM games WHERE code = game_code;
SELECT id INTO v_player_id FROM players 
WHERE user_id = auth.uid() AND game_id = v_game_id;

-- 2. Valida ronda existe
SELECT 1 FROM game_rounds 
WHERE game_id = v_game_id AND round = game_round;

-- 3. Busca tipo do stop
SELECT type, name INTO stop_type, stop_name 
FROM stops WHERE id = stop_id;

-- 4. Seleciona carta baseada no tipo:
--    - Se landmark: busca carta com title = stop_name
--    - Outros: seleciona carta aleatória do mesmo tipo
SELECT id INTO drawn_card_id FROM cards 
WHERE type = stop_type [AND title = stop_name]
ORDER BY RANDOM() LIMIT 1;

-- 5. Insere movimento
INSERT INTO player_moves (game_id, player_id, stop_id, round)
VALUES (v_game_id, v_player_id, stop_id, game_round);

-- 6. Insere carta selecionada
INSERT INTO player_cards (game_id, player_id, card_id, round)
VALUES (v_game_id, v_player_id, drawn_card_id, game_round);

RETURN drawn_card_id;
```

**Database Updates:**
- `player_moves`: INSERT novo movimento
- `player_cards`: INSERT carta selecionada

**Realtime Updates:**
- `subscribePlayerMoves()` → Adiciona movimento ao estado
- `subscribePlayerCards()` → Adiciona carta ao estado
- `buildPlayerState()` → Atualiza estado do jogador para 'writing'

#### 3.4 Abertura do Dialog de Escrita (`/components/story-dialog.svelte`)

**Frontend:**
```typescript
// Efeito reativo abre dialog quando estado muda para 'writing'
$effect(() => {
  if (playerState === 'writing') {
    openStoryDialog = true;
  }
});
```

**Inicialização do Timer:**
```typescript
if (currentGameRound && !currentGameRound.timer_duration) {
  gameState.startRoundTimer();
}
```

**Função Timer (`game-state.svelte.ts`):**
```typescript
async startRoundTimer() {
  const durationSeconds = Math.floor(Math.random() * 3 + 2) * 60; // 2-4 min
  
  await supabase.from('game_rounds')
    .update({ timer_duration: durationSeconds })
    .eq('id', currentGameRound.id);
}
```

**Database Updates:**
- `game_rounds`: UPDATE `timer_duration`

**Realtime Updates:**
- `subscribeRoundTimer()` → Atualiza `roundTimerDuration` no estado

#### 3.5 Escrita da Resposta (`/components/story-dialog.svelte`)

**Frontend:**
- Componente `Textarea` permite escrita
- Mostra carta atual e histórico de respostas anteriores
- Timer countdown visível

**Estado:**
- `currentAnswer` (string) armazena texto digitado

#### 3.6 Submissão da Resposta (`/components/story-dialog.svelte`)

**Frontend:**
```typescript
function submitAnswer() {
  if (currentAnswer.trim() === '') {
    gameState.submitAnswer('(Empty submission)');
  } else {
    gameState.submitAnswer(currentAnswer);
  }
  openStoryDialog = false;
}
```

**Chamada Backend (`game-state.svelte.ts`):**
```typescript
async submitAnswer(answer: string) {
  await supabase.rpc('player_answer', {
    game_code: this.code,
    game_round: this.currentRound,
    answer
  });
}
```

**Backend (RPC `player_answer`):**
```sql
-- 1. Busca game_id e player_id
SELECT id INTO v_game_id FROM games WHERE code = game_code;
SELECT id INTO v_player_id FROM players 
WHERE user_id = auth.uid() AND game_id = v_game_id;

-- 2. Valida ronda existe
SELECT 1 FROM game_rounds 
WHERE game_id = v_game_id AND round = game_round;

-- 3. Insere resposta
INSERT INTO player_answers (game_id, player_id, answer, round)
VALUES (v_game_id, v_player_id, answer, game_round);

-- 4. Verifica se ronda completa
PERFORM check_round_completion(v_game_id);
```

**Backend (`check_round_completion`):**
```sql
-- 1. Busca ronda atual
SELECT COALESCE(MAX(round), 0) INTO current_round 
FROM game_rounds WHERE game_id = p_game_id;

-- 2. Conta jogadores e respostas
SELECT COUNT(*) INTO player_count FROM players WHERE game_id = p_game_id;
SELECT COUNT(*) INTO answer_count FROM player_answers pa
JOIN players p ON pa.player_id = p.id
WHERE p.game_id = p_game_id AND pa.round = current_round;

-- 3. Se todos responderam:
IF player_count = answer_count THEN
  -- Se ronda 6 (última): marca jogo como 'finished'
  IF current_round >= 6 THEN
    UPDATE games SET state = 'finished' WHERE id = p_game_id;
  -- Senão: cria próxima ronda
  ELSE
    PERFORM roll_dice(p_game_id); -- Cria game_rounds com novo dice_roll
  END IF;
END IF;
```

**Database Updates:**
- `player_answers`: INSERT resposta
- `games`: UPDATE `state='finished'` (se ronda 6)
- `game_rounds`: INSERT nova ronda (se não for última)

**Realtime Updates:**
- `subscribePlayerAnswers()` → Adiciona resposta ao estado
- `subscribeGameRounds()` → Adiciona nova ronda (se criada)
- `subscribeGame()` → Atualiza `gameState.state` para 'finished' (se fim)
- `buildPlayerState()` → Atualiza estado do jogador para 'done'

---

### **FASE 4: RONDA 7 - REFLEXÃO FINAL**

#### 4.1 Escrita da Reflexão (`/components/story-dialog.svelte`)

**Frontend:**
- Mesmo fluxo que rondas anteriores
- Ronda 7 não requer movimento (usa último stop da ronda 6)
- Mostra carta "post-story" especial

**Lógica:**
```typescript
// Ronda 7 usa último stop da ronda 6
const lastStopId = moves.find(m => m.round === 6)?.stop_id || 1;
```

#### 4.2 Submissão da Reflexão

**Frontend/Backend:**
- Mesmo processo que rondas anteriores
- `player_answer()` insere resposta com `round=7`

---

### **FASE 5: FIM DO JOGO E SALVAMENTO**

#### 5.1 Dialog de Fim (`/components/end-dialog.svelte`)

**Frontend:**
```typescript
// Abre automaticamente quando jogo termina
$effect(() => {
  if (gameState.state === 'finished') {
    openEndDialog = true;
  }
});
```

**Funcionalidades:**
- Mostra todas as histórias dos jogadores
- Permite editar respostas próprias
- Formulário para salvar história pública

#### 5.2 Edição de Respostas (`/components/end-dialog.svelte`)

**Frontend:**
```typescript
async function saveEdit(answer: PlayerAnswer) {
  await gameState.updatePlayerAnswer(answer.id, editedContent);
}
```

**Chamada Backend (`game-state.svelte.ts`):**
```typescript
async updatePlayerAnswer(answerId: number, newText: string) {
  await supabase.from('player_answers')
    .update({ answer: newText })
    .eq('id', answerId);
  
  // Atualiza estado local
  this.playersAnswers = this.playersAnswers.map(a =>
    a.id === answerId ? { ...a, answer: newText } : a
  );
}
```

**Database Updates:**
- `player_answers`: UPDATE `answer` WHERE `id = answerId`

**Realtime Updates:**
- `subscribePlayerAnswers()` → Atualiza resposta no estado (evento UPDATE)

#### 5.3 Salvamento da História (`/components/end-dialog.svelte`)

**Frontend:**
```typescript
async function handleGameEnd() {
  const id = await gameState.saveStory(playerName, storyTitle);
  goto(`/stories/${id}`);
}
```

**Chamada Backend (`game-state.svelte.ts`):**
```typescript
async saveStory(name: string, title: string) {
  // 1. Constrói dados das rondas
  const roundsData = Array.from({ length: 8 }, (_, i) => {
    const card = this.playersCards.find(pc => 
      pc.player_id === this.playerId && pc.round === i
    );
    const cardDetails = card ? 
      this.cards.find(c => c.id === card.card_id) : null;
    const answer = this.playersAnswers.find(pa =>
      pa.player_id === this.playerId && pa.round === i
    );
    
    return {
      round: i,
      card_id: card?.card_id || null,
      type: cardDetails?.type || null,
      answer: answer?.answer || '',
      public_story: true
    };
  });

  // 2. Extrai tipos de cartas únicos
  const cardTypes = Array.from(new Set(
    Object.values(roundsData)
      .map(r => r.type)
      .filter(t => t !== null)
  ));

  // 3. Combina todas as respostas em texto completo
  const fullStory = Object.values(roundsData)
    .map(r => r.answer)
    .filter(a => a.trim().length > 0)
    .join('\n\n');

  // 4. Chama RPC
  const { data, error } = await supabase.rpc('save_story', {
    p_player_name: name,
    p_story_title: title,
    p_character: {
      type: character.character,
      nickname: character.nickname,
      description: character.description
    },
    p_rounds: roundsData,
    p_card_types: cardTypes,
    p_full_story: fullStory
  });
  
  return data;
}
```

**Backend (RPC `save_story`):**
```sql
CREATE FUNCTION save_story(
  p_player_name TEXT,
  p_story_title TEXT,
  p_character JSONB,
  p_rounds JSONB,
  p_card_types TEXT[],
  p_full_story TEXT
) RETURNS BIGINT AS $$
DECLARE
  v_story_id BIGINT;
BEGIN
  -- Valida character
  IF (p_character->>'type')::character_type IS NULL THEN
    RAISE EXCEPTION 'Invalid character type';
  END IF;

  -- Insere história
  INSERT INTO saved_stories (
    player_name,
    story_title,
    character,
    rounds,
    card_types,
    full_story,
    public_story
  )
  VALUES (
    p_player_name,
    p_story_title,
    p_character,
    p_rounds,
    p_card_types,
    p_full_story,
    true
  )
  RETURNING id INTO v_story_id;

  RETURN v_story_id;
END;
$$;
```

**Database Updates:**
- `saved_stories`: INSERT nova história pública

**Navegação:**
- Redireciona para `/stories/{story_id}`

---

### **FASE 6: NAVEGAÇÃO DE HISTÓRIAS**

#### 6.1 Listagem de Histórias (`/routes/stories/+page.ts`)

**Frontend Load:**
```typescript
export const load = async ({ url }) => {
  // Parâmetros de filtro
  const page = parseInt(url.searchParams.get('page') || '1');
  const search = url.searchParams.get('search') || '';
  const character = url.searchParams.get('character') || '';
  const cardTypes = url.searchParams.getAll('cardType');
  const sort = url.searchParams.get('sort') || 'latest';

  // Query base
  let query = supabase.from('saved_stories')
    .select('*', { count: 'exact' })
    .eq('public_story', true);

  // Filtros de busca
  if (search.trim()) {
    const searchTerms = search.trim().split(/\s+/);
    const conditions = [
      ...searchTerms.map(t => `player_name.ilike.%${t}%`),
      ...searchTerms.map(t => `story_title.ilike.%${t}%`),
      ...searchTerms.map(t => `character_search.fts.${t}`),
      ...searchTerms.map(t => `full_story.ilike.%${t}%`)
    ].join(',');
    query = query.or(conditions);
  }

  // Filtro por personagem
  if (character.trim()) {
    query = query.eq('character->>type', character);
  }

  // Filtro por tipos de cartas
  if (cardTypes.length > 0) {
    const conditions = cardTypes.map(t => `card_types.cs.{${t}}`).join(',');
    query = query.or(conditions);
  }

  // Paginação
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  // Ordenação e execução
  const { data: stories, error, count } = await query
    .order('created_at', { ascending: sort === 'oldest' })
    .range(from, to);

  return { stories, totalStories: count };
};
```

**Chamadas à Base de Dados:**
- `saved_stories`: SELECT com filtros, ordenação e paginação

**Frontend Component (`/routes/stories/+page.svelte`):**
- Renderiza lista de `StoryCard` components
- Filtros interativos (search, character, card types)
- Paginação

#### 6.2 Visualização de História Individual (`/routes/stories/[story_id]/+page.ts`)

**Frontend Load:**
```typescript
export const load = async ({ params }) => {
  // 1. Busca história
  const { data: story, error } = await supabase
    .from('saved_stories')
    .select('*')
    .eq('story_id', params.story_id)
    .single();

  // 2. Extrai card_ids das rondas
  const cardIds = Object.values(story.rounds)
    .map((r: any) => r.card_id)
    .filter((id: number | null) => typeof id === 'number' && id !== null);

  // 3. Busca detalhes das cartas
  const { data: cardData } = await supabase
    .from('cards')
    .select('id, type, title, prompt_text(text)')
    .in('id', cardIds)
    .eq('prompt_text.lang', currentLang);

  return { story, cards };
};
```

**Chamadas à Base de Dados:**
- `saved_stories`: SELECT por `story_id`
- `cards`: SELECT múltiplos por `id` com `prompt_text`

**Frontend Component (`/routes/stories/[story_id]/+page.svelte`):**
- Renderiza história completa com cartas e respostas
- Mostra personagem, rondas e respostas

---

## 📊 Resumo das Tabelas e Operações

### **Tabelas Principais:**

1. **`games`**
   - Operações: SELECT, UPDATE
   - Campos críticos: `state`, `code`

2. **`players`**
   - Operações: SELECT, UPDATE
   - Campos críticos: `id`, `game_id`, `user_id`, `is_active`

3. **`game_rounds`**
   - Operações: SELECT, INSERT, UPDATE
   - Campos críticos: `round`, `dice_roll`, `timer_duration`

4. **`player_moves`**
   - Operações: SELECT, INSERT (via RPC)
   - Campos críticos: `player_id`, `stop_id`, `round`

5. **`player_cards`**
   - Operações: SELECT, INSERT (via RPC)
   - Campos críticos: `player_id`, `card_id`, `round`

6. **`player_answers`**
   - Operações: SELECT, INSERT (via RPC), UPDATE
   - Campos críticos: `player_id`, `answer`, `round`

7. **`saved_stories`**
   - Operações: SELECT, INSERT (via RPC)
   - Campos críticos: `story_id`, `player_name`, `story_title`, `rounds`, `full_story`

---

## 🔔 Subscrições Realtime (Supabase)

### **Canais Ativos:**

1. **`game`** → Monitora mudanças em `games.state`
2. **`game_rounds`** → Monitora INSERT de novas rondas
3. **`players`** → Monitora UPDATE de jogadores
4. **`player_moves`** → Monitora INSERT de movimentos
5. **`player_cards`** → Monitora INSERT de cartas
6. **`player_answers`** → Monitora INSERT/UPDATE de respostas
7. **`round_timers`** → Monitora UPDATE de `timer_duration`

### **Efeitos das Subscrições:**

- Atualização automática do estado local quando outros jogadores agem
- Sincronização em tempo real entre todos os jogadores
- Transições automáticas de rondas quando todos completam

---

## 🎯 Pontos de Decisão Críticos

1. **Início do Jogo**: Todos devem escolher stop inicial antes de avançar
2. **Movimento**: Stop deve ser alcançável com número de movimentos do dado
3. **Carta**: Selecionada automaticamente baseada no tipo do stop
4. **Ronda Completa**: Todos devem responder antes de avançar
5. **Fim do Jogo**: Ronda 6 completa → estado 'finished'
6. **Salvamento**: Opcional, mas necessário para visualização pública

