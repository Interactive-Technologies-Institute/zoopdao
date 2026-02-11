// Feature flags (client + server)
//
// Flip this single boolean to enable/disable the AI question assistant UI + API.
export const ENABLE_AI_QUESTION_ASSISTANT = true;

// Round 7 orchestration policy (Aquari first + specialist reveals).
// Keep enabled in dev to stabilize avatar scene behavior.
export const ENABLE_ROUND7_SCENE_ORCHESTRATION = true;
export const ENABLE_ROUND7_LLM_PLANNER_FALLBACK = false;
// Round 7 speaker generation mode:
// true  -> normal chat style (plain-text prompt, no rigid one-sentence repair loop)
// false -> strict constrained mode (legacy behavior)
export const ENABLE_ROUND7_FREE_CHAT = false;
// Round 7 Pipeline V2 (new deterministic path).
export const ENABLE_ROUND7_PIPELINE_V2 = true;
export const ROUND7_PIPELINE_LOG_LEVEL_DEFAULT = 'step' as const;

// Rounds 0..6: show only the current user's avatar (hide other humans + all AI).
// Round 7: show the full assembly.
export const SHOW_ONLY_USER_AVATAR_ROUNDS_0_TO_6 = true;

// Per-position AI visibility (applies whenever AI avatars are rendered, e.g. Round 7).
// Set any of these to `false` to hide that AI avatar slot.
//
// Position mapping is tied to the "standard" assembly layout:
// bottom-center = current user
// bottom-left = administration (Galeria)
// top-left = research (Tuga)
// top-mid = reception (Aquari)
// top-right = operations (Tropicus)
// bottom-right = bar (Doce)
export const SHOW_AI_AVATAR_BOTTOM_LEFT = true;
export const SHOW_AI_AVATAR_TOP_LEFT = true;
export const SHOW_AI_AVATAR_TOP_MID = true;
export const SHOW_AI_AVATAR_TOP_RIGHT = true;
export const SHOW_AI_AVATAR_BOTTOM_RIGHT = true;
