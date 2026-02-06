// Feature flags (client + server)
//
// Flip this single boolean to enable/disable the AI question assistant UI + API.
export const ENABLE_AI_QUESTION_ASSISTANT = false;

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
