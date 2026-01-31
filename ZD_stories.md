# ZD-121-171: Adapt LogaCulture to ZoopDAO Flow - Story Breakdown

---

## ZD-121: Audit existing SVG assets (excluding aquarium)

**Overview:**
Review all current `.svg` assets except the aquarium assembly table to identify what exists, where it’s used, and what function it serves in the UI.

**Goal:**
Produce a complete, usage-aware SVG inventory that can be used to create the replacement plan and production backlog.

**Description:**
a) Inventory all `.svg` files used in the app, excluding the aquarium assembly table image.
b) For each SVG, document current usage (component/page) and function.
c) Flag any SVGs that appear unused (no refs found).

**Acceptance Criteria:**
1) Inventory list includes all non-aquarium SVG assets with usage context.
2) Each SVG has a documented purpose (what it visually represents / UI function).

**Completion Criteria:**
1) Audit report is complete and ready for planning (ZD-122).

**Audit Report (non-aquarium SVGs):**
- Excluded per brief: `static/images/aquarium/assembly_table.svg`.
- Usage references found in:
  - `src/lib/components/character-card.svelte`
  - `src/lib/components/story-card.svelte`
  - `src/lib/components/end-dialog.svelte`
  - `src/lib/components/card.svelte`
  - `src/lib/components/story-dialog.svelte`

### Inventory — Card backgrounds (used by `src/lib/components/card.svelte` and post-story in `src/lib/components/story-dialog.svelte`)
| Asset | Current usage | Function |
| --- | --- | --- |
| `static/images/cards/landmark.svg` | Card background for `landmark` type | Round prompt card. |
| `static/images/cards/nature.svg` | Card background for `nature` type | Round prompt card. |
| `static/images/cards/sense.svg` | Card background for `sense` type | Round prompt card. |
| `static/images/cards/history.svg` | Card background for `history` type | Round prompt card. |
| `static/images/cards/action.svg` | Card background for `action` type | Round prompt card. |
| `static/images/cards/post-story.svg` | Post-story card background | Closing prompt card. |

### Inventory — Character badges (used by `src/lib/components/story-card.svelte` and `src/lib/components/end-dialog.svelte`)
| Asset | Current usage | Function |
| --- | --- | --- |
| `static/images/characters/badges/scientist.svg` | Badge avatar | Character identity. |
| `static/images/characters/badges/time-traveller.svg` | Badge avatar | Character identity. |
| `static/images/characters/badges/local-specialist.svg` | Badge avatar | Character identity. |
| `static/images/characters/badges/water.svg` | Badge avatar | Character identity. |
| `static/images/characters/badges/vulcanic-rock.svg` | Badge avatar | Character identity. |
| `static/images/characters/badges/nature-lover.svg` | Badge avatar | Character identity. |
| `static/images/characters/badges/child.svg` | Badge avatar | Character identity. |
| `static/images/characters/badges/different-needs.svg` | Badge avatar | Character identity. |
| `static/images/characters/badges/iberian-green-frog.svg` | Badge avatar | Character identity. |
| `static/images/characters/badges/non-human-being.svg` | Badge avatar | Character identity. |
| `static/images/characters/badges/custom.svg` | Badge avatar | Custom character / fallback identity. |
| `static/images/characters/badges/trocaz-pigeon.svg` | Badge avatar | Species identity. |
| `static/images/characters/badges/monk-seal.svg` | Badge avatar | Species identity. |
| `static/images/characters/badges/zinos-petrel.svg` | Badge avatar | Species identity. |

### Inventory — Character cards (used by `src/lib/components/character-card.svelte` and round 0 in `src/lib/components/story-dialog.svelte`)
| Asset | Current usage | Function |
| --- | --- | --- |
| `static/images/characters/cards/scientist.svg` | Character card background | Character selection/intro. |
| `static/images/characters/cards/time-traveller.svg` | Character card background | Character selection/intro. |
| `static/images/characters/cards/local-specialist.svg` | Character card background | Character selection/intro. |
| `static/images/characters/cards/water.svg` | Character card background | Character selection/intro. |
| `static/images/characters/cards/vulcanic-rock.svg` | Character card background | Character selection/intro. |
| `static/images/characters/cards/nature-lover.svg` | Character card background | Character selection/intro. |
| `static/images/characters/cards/child.svg` | Character card background | Character selection/intro. |
| `static/images/characters/cards/different-needs.svg` | Character card background | Character selection/intro. |
| `static/images/characters/cards/iberian-green-frog.svg` | Character card background | Character selection/intro. |
| `static/images/characters/cards/non-human-being.svg` | Character card background | Character selection/intro. |
| `static/images/characters/cards/custom.svg` | Character card background | Custom character / fallback. |
| `static/images/characters/cards/trocaz-pigeon.svg` | Character card background | Character selection/intro. |
| `static/images/characters/cards/monk-seal.svg` | Character card background | Character selection/intro. |
| `static/images/characters/cards/zinos-petrel.svg` | Character card background | Character selection/intro. |

### Inventory — Illustrations (raster, tutorial/round transition)
| Asset | Current usage | Function |
| --- | --- | --- |
| `static/images/illustrations/step_1_1.png` | `src/lib/components/round-transition.svelte` | Round transition illustration (step 1, variant 1). |
| `static/images/illustrations/step_1_2.png` | `src/lib/components/round-transition.svelte` | Round transition illustration (step 1, variant 2). |
| `static/images/illustrations/step_2_1.png` | `src/lib/components/round-transition.svelte`, `src/routes/+page.svelte` | Round transition + homepage tutorial illustration (step 2, variant 1). |
| `static/images/illustrations/step_2_2.png` | `src/lib/components/round-transition.svelte` | Round transition illustration (step 2, variant 2). |
| `static/images/illustrations/step_3_1.png` | `src/lib/components/round-transition.svelte` | Round transition illustration (step 3, variant 1). |
| `static/images/illustrations/step_3_2.png` | `src/lib/components/round-transition.svelte` | Round transition illustration (step 3, variant 2). |
| `static/images/illustrations/step_4_1.png` | `src/lib/components/round-transition.svelte`, `src/routes/+page.svelte` | Round transition + homepage tutorial illustration (step 4, variant 1). |
| `static/images/illustrations/step_4_2.png` | `src/lib/components/round-transition.svelte` | Round transition illustration (step 4, variant 2). |
| `static/images/illustrations/step_5_1.png` | `src/lib/components/round-transition.svelte`, `src/routes/+page.svelte` | Round transition + homepage tutorial illustration (step 5, variant 1). |
| `static/images/illustrations/step_5_2.png` | `src/lib/components/round-transition.svelte` | Round transition illustration (step 5, variant 2). |
| `static/images/illustrations/step_6_1.png` | `src/lib/components/round-transition.svelte`, `src/routes/+page.svelte` | Round transition + homepage tutorial illustration (step 6, variant 1). |
| `static/images/illustrations/step_6_2.png` | `src/lib/components/round-transition.svelte` | Round transition illustration (step 6, variant 2). |

---

## ZD-122: Define SVG replacement plan + production backlog

**Overview:**
Use the ZD-121 inventory to decide which assets are reused, revised, or regenerated, and to create an ordered backlog for design/production.

**Goal:**
Create a ready-to-execute plan that preserves current UI behavior while shifting visual identity to ZoopDAO.

**Description:**
a) Define global SVG delivery constraints (drop-in, scalable, optimized).
b) Define a minimal style guide for the ZoopDAO SVG set (framing, strokes, textures, palette usage).
c) Assign each SVG a plan category (reuse/revise/regenerate) and a replacement concept.
d) Prioritize execution order (P0 cards → P1 badges → P2 character cards → P3 misc/legacy).

**Acceptance Criteria:**
1) Every SVG in ZD-121 has a plan category and replacement concept.
2) Backlog has clear priorities and “done” checks per asset family.
3) Global delivery constraints are documented for consistent output.

**Completion Criteria:**
1) Backlog is ready to split into production tasks (ZD-123+).

### Global export requirements (applies to all SVG deliverables)
- Preserve filenames and paths (drop-in replacement).
- Keep `viewBox` set; avoid fixed pixel assumptions; scale cleanly at `64x64` (badges) and `w-64 h-96` (cards).
- Convert text to paths; avoid external fonts; inline styles only.
- Use ZoopDAO palette tokens from `src/app.css` (teal/sand/seafoam family); maintain contrast for overlaid text.
- Optimize output (remove editor metadata, unnecessary groups, unused defs).

### Plan — Card backgrounds
| Asset | Plan | Replacement concept (ZoopDAO) |
| --- | --- | --- |
| `static/images/cards/landmark.svg` | Revise | Aquarium map pin + waypoint grid, teal/sand palette. |
| `static/images/cards/nature.svg` | Revise | Species silhouette + kelp/coral texture. |
| `static/images/cards/sense.svg` | Revise | Sonar rings + eye/wave motif. |
| `static/images/cards/history.svg` | Revise | Archive scroll + tank blueprint layers. |
| `static/images/cards/action.svg` | Revise | Hand/gear collaboration emblem with ripples. |
| `static/images/cards/post-story.svg` | Revise | Proposal report sheet + seal/reef watermark. |

### Plan — Character badges
| Asset | Plan | Replacement concept (ZoopDAO) |
| --- | --- | --- |
| `static/images/characters/badges/scientist.svg` | Revise | Lab goggles + specimen vial with aquatic glyphs. |
| `static/images/characters/badges/time-traveller.svg` | Revise | Chrono ring + coral strata. |
| `static/images/characters/badges/local-specialist.svg` | Revise | Beacon/map marker + shoreline contour. |
| `static/images/characters/badges/water.svg` | Revise | Flowing wave crest + plankton dots. |
| `static/images/characters/badges/vulcanic-rock.svg` | Revise | Basalt column + hydrothermal vent lines. |
| `static/images/characters/badges/nature-lover.svg` | Revise | Leaf + fish tail hybrid mark. |
| `static/images/characters/badges/child.svg` | Revise | Playful fish + bubble trail. |
| `static/images/characters/badges/different-needs.svg` | Revise | Accessibility icon merged with wave arc. |
| `static/images/characters/badges/iberian-green-frog.svg` | Revise | Frog silhouette with lily + tide lines. |
| `static/images/characters/badges/non-human-being.svg` | Revise | Cephalopod/whale icon with orbiting nodes. |
| `static/images/characters/badges/custom.svg` | Revise | Neutral placeholder with ZoopDAO seal. |
| `static/images/characters/badges/trocaz-pigeon.svg` | Revise | Trocaz pigeon profile + sea breeze motif. |
| `static/images/characters/badges/monk-seal.svg` | Revise | Monk seal head + reef contour. |
| `static/images/characters/badges/zinos-petrel.svg` | Revise | Petrel in flight over wave lines. |

### Plan — Character cards
| Asset | Plan | Replacement concept (ZoopDAO) |
| --- | --- | --- |
| `static/images/characters/cards/scientist.svg` | Revise | Scientist vignette with aquarium lab desk + teal lighting. |
| `static/images/characters/cards/time-traveller.svg` | Revise | Time portal + layered reef history strata. |
| `static/images/characters/cards/local-specialist.svg` | Revise | Coastal map + observation tools. |
| `static/images/characters/cards/water.svg` | Revise | Water currents + microfauna patterns. |
| `static/images/characters/cards/vulcanic-rock.svg` | Revise | Volcanic rock texture + vent glow. |
| `static/images/characters/cards/nature-lover.svg` | Revise | Reef garden + sprouting mangrove. |
| `static/images/characters/cards/child.svg` | Revise | Playful aquarium doodles + bubbles. |
| `static/images/characters/cards/different-needs.svg` | Revise | Inclusive symbols + calm wave texture. |
| `static/images/characters/cards/iberian-green-frog.svg` | Revise | Frog habitat with wetland plants. |
| `static/images/characters/cards/non-human-being.svg` | Revise | Abstract marine intelligence + node network. |
| `static/images/characters/cards/custom.svg` | Revise | Blank template with ZoopDAO frame and subtle watermark. |
| `static/images/characters/cards/trocaz-pigeon.svg` | Revise | Pigeon + laurel/sea breeze motif. |
| `static/images/characters/cards/monk-seal.svg` | Revise | Monk seal + sandy seabed texture. |
| `static/images/characters/cards/zinos-petrel.svg` | Revise | Petrel in flight over open water. |

### Plan — Illustrations (tutorial/round transition)
| Asset set | Plan | Replacement concept (ZoopDAO) |
| --- | --- | --- |
| `static/images/illustrations/step_{1..6}_{1..2}.png` | Revise | Replace game/tutorial imagery with ZoopDAO governance flow illustrations (proposal, discussion, voting, outcome) using the assembly-table palette and aquarium context. |

---

## ZD-123: Produce revised card background SVGs (ZoopDAO)

**Overview:**
Revise the card background SVGs so the card deck reflects ZoopDAO identity while preserving type recognition (landmark/nature/sense/history/action/post-story).

**Goal:**
Replace the card SVGs in-place with a consistent ZoopDAO visual system that remains readable behind existing text layouts.

**Description:**
- Update the following files in-place:
  - `static/images/cards/landmark.svg`
  - `static/images/cards/nature.svg`
  - `static/images/cards/sense.svg`
  - `static/images/cards/history.svg`
  - `static/images/cards/action.svg`
  - `static/images/cards/post-story.svg`
- Validate with existing UI components:
  - `src/lib/components/card.svelte`
  - `src/lib/components/story-dialog.svelte`

**Acceptance Criteria:**
1) Each card type is visually distinct and matches the ZoopDAO palette.
2) Overlaid text remains readable without adding new text styling hacks.
3) No clipping/overflow artifacts at `w-64 h-96` sizing.

**Completion Criteria:**
1) All listed SVG files are updated and render correctly in the app.

---

## ZD-124: Produce revised character badge SVGs (ZoopDAO)

**Overview:**
Revise character badge SVGs used as avatars so they share a consistent framing and icon language aligned with ZoopDAO.

**Goal:**
Replace badge SVGs in-place and ensure they read well when circular-cropped in UI.

**Description:**
- Update all files under `static/images/characters/badges/*.svg` in-place.
- Validate with:
  - `src/lib/components/story-card.svelte`
  - `src/lib/components/end-dialog.svelte`

**Acceptance Criteria:**
1) Badges are legible from `32px` up to `128px` and look consistent as a set.
2) `custom.svg` is a neutral, high-quality fallback.
3) No important details are lost when cropped to a circle.

**Completion Criteria:**
1) Badge set is complete and visually consistent.

---

## ZD-125: Produce revised character card background SVGs (ZoopDAO)

**Overview:**
Revise the character card background SVGs used for character intro/selection screens.

**Goal:**
Replace character card SVGs in-place with safe text-overlay areas and consistent styling.

**Description:**
- Update all files under `static/images/characters/cards/*.svg` in-place.
- Validate with:
  - `src/lib/components/character-card.svelte`
  - round 0 view in `src/lib/components/story-dialog.svelte`

**Acceptance Criteria:**
1) Text overlays remain readable across all cards without extra shadows/overrides.
2) Card backgrounds align stylistically with the badge set (ZD-124).
3) No clipping/overflow artifacts at `w-64 h-96` sizing.

**Completion Criteria:**
1) Character card set is complete and visually consistent.

---

## ZD-126: Revise tutorial + round transition illustrations (ZoopDAO)

**Overview:**
Revise the existing tutorial and round transition illustration PNGs so they match ZoopDAO identity and the updated governance narrative.

**Goal:**
Replace the illustration set in-place while preserving filenames and usage locations.

**Description:**
- Update in-place:
  - `static/images/illustrations/step_1_1.png` / `step_1_2.png`
  - `static/images/illustrations/step_2_1.png` / `step_2_2.png`
  - `static/images/illustrations/step_3_1.png` / `step_3_2.png`
  - `static/images/illustrations/step_4_1.png` / `step_4_2.png`
  - `static/images/illustrations/step_5_1.png` / `step_5_2.png`
  - `static/images/illustrations/step_6_1.png` / `step_6_2.png`
- Validate in UI:
  - `src/lib/components/round-transition.svelte`
  - `src/routes/+page.svelte`

**Acceptance Criteria:**
1) Illustrations reflect ZoopDAO governance flow (proposal → discussion → voting → outcome) and match the palette.
2) Images remain readable on common viewport sizes (mobile + desktop) and do not clash with overlaid UI text.
3) No missing files or broken image URLs in the pages/components that reference them.

**Completion Criteria:**
1) All listed `static/images/illustrations/*.png` files are updated and render correctly.

---

## ZD-140: Define UI color palette from assembly table visuals

**Overview:**
Establish a cohesive color palette derived from the assembly table images to guide buttons, typography, backgrounds, and key UI accents. This ensures visual consistency and a grounded ZoopDAO identity.

**Goal:**
Translate the assembly table imagery into a practical, reusable UI color system.

**Description:**
a) Extract dominant and accent colors from the assembly table images and document them.
b) Define primary/secondary/tertiary colors for buttons and interactive states.
c) Set typography colors for headings, body text, and muted text.
d) Specify background, surface, border, and focus/outline colors.
e) Provide contrast guidance to meet accessibility needs for text and controls.

**Acceptance Criteria:**
1. Palette includes primary/secondary/tertiary, background/surface, border, and text colors.
2. Buttons have defined default/hover/active/disabled states.
3. Typography colors are defined for headings, body, and muted text.
4. Palette references assembly table imagery as the source.

**Completion Criteria:**
1. Color tokens are documented and ready to be used in the UI.
2. Basic contrast checks are satisfied for primary text and primary buttons.

**Palette (source: static/images/aquarium/assembly_table.svg):**
- Primary (buttons): `#0c6b78` hover `#23c1d2` active `#05363d` disabled `#a8b3b3`
- Secondary (buttons): `#6aa85a` hover `#7fb56b` active `#1a3f43`
- Tertiary (buttons): `#b8b09c` hover `#d7d2c3` active `#7f8a8a`
- Background: `#c8fbff` (light water shimmer), deep background `#0f1717`
- Surface: `#d7d2c3`, muted surface `#b8b09c`
- Borders: `#7f8a8a`, strong border `#5b6464`
- Text: heading `#0a1f22`, body `#2f3a3a`, muted `#5b6464`
- Focus/outline: `#7fe3f2`

**Token mapping (src/app.css):**
`--zd-bg`, `--zd-bg-deep`, `--zd-surface`, `--zd-surface-muted`, `--zd-border`, `--zd-border-strong`,
`--zd-text`, `--zd-text-muted`, `--zd-text-subtle`, `--zd-primary`, `--zd-primary-hover`,
`--zd-primary-active`, `--zd-primary-disabled`, `--zd-secondary`, `--zd-secondary-hover`,
`--zd-secondary-active`, `--zd-tertiary`, `--zd-tertiary-hover`, `--zd-tertiary-active`, `--zd-focus`

--

## ZD-151: Update Homepage Branding and Text (English & Portuguese)

**Overview:**
Update the homepage to reflect ZoopDAO branding by replacing "LoGaCulture" with "ZoopDAO" and updating the tagline and navigation text in both English and Portuguese language files.

**Goal:**
Transform the homepage from game-focused messaging to DAO governance messaging for Aquário Vasco da Gama.

**Description:**
- Change main title from "LoGaCulture" to "ZoopDAO" in homepage component
- Update tagline from "Create your own story from the perspective of a character in the island of Madeira." to "Participate on the multispecies governance in Aquário Vasco da Gama"
- Change "Browse other players' stories" link text to "Browse other participants discussions"
- Update all related text in English (messages/en.json) and Portuguese (messages/pt.json) translation files

**Acceptance Criteria:**
1. Homepage displays "ZoopDAO" as the main title
2. Tagline reflects multispecies governance participation at Aquário Vasco da Gama
3. Navigation link text updated to "Browse other participants discussions" (or Portuguese equivalent)
4. All changes are reflected in both English and Portuguese language versions
5. No broken links or missing translations

**Completion Criteria:**
1. Code changes implemented and tested
2. Both language files updated with new translations
3. Visual verification of homepage matches requirements
4. No console errors or broken functionality

---

## ZD-152: Create New Proposal Form Structure

**Overview:**
Create a new "New Proposal" form page that replaces the "Start new game" button functionality, allowing users to submit governance proposals with a structured Theory of Change format.

**Goal:**
Enable users to create new governance proposals through a comprehensive form interface.

**Description:**
- Create new route/page for proposal creation (e.g., `/proposals/new` or replace homepage "Start new game" button)
- Design form layout with exit button in top right corner
- Implement form structure with sections for:
  - Title (scenario) field
  - Description section (Theory of Change structure)
  - Discussion field
  - Voting period selection
  - Submit button
- Form should navigate back to previous menu after submission
- Add exit button functionality to return to homepage

**Acceptance Criteria:**
1. New proposal form page is accessible from homepage
2. Form contains all required fields (title, description sections, discussion, voting period)
3. Exit button in top right corner returns to homepage
4. Submit button adds proposal to proposals list and returns to previous menu
5. Form validation prevents submission with empty required fields

**Completion Criteria:**
1. Form page created and accessible
2. All form fields implemented
3. Navigation flow works correctly
4. Form data structure defined for backend integration

---

## ZD-153: Implement Theory of Change Form Fields

**Overview:**
Implement the mandatory Theory of Change fields within the proposal form description section, organized in a cascaded (waterfall-style) hierarchical structure, including long-term objectives, preconditions, indicative steps, key indicators, and functionalities.

**Goal:**
Capture structured proposal data following Theory of Change methodology with all mandatory fields organized in a cascaded relationship where each level is nested under the previous level.

**Description:**
- Implement "Long-term objectives" section with minimum 2 objectives required (top level)
- Organize fields in cascaded/waterfall structure:
  - **Level 1: Long-term Objectives** (minimum 2 required)
    - **Level 2: Preconditions and Goals** (4 fields per objective, nested under each objective)
      - **Level 3: Indicative Steps** (1 or more steps per precondition, nested under each precondition)
      - **Level 3: Key Indicators** (1 or more indicators per precondition, nested under each precondition)
- Add "Functionalities" field (top level, separate from cascaded structure)
- All fields should be mandatory and validated
- Form should support dynamic addition/removal of objectives, preconditions, and their nested fields
- UI must clearly show the hierarchical relationship between objectives → preconditions → (indicative steps + key indicators)
- Each precondition must have both indicative steps and key indicators as nested children

**Acceptance Criteria:**
1. Long-term objectives section allows minimum 2 objectives (top level)
2. Each objective has 4 preconditions/goals fields nested directly under it (cascaded from objective)
3. Each precondition has indicative steps nested directly under it (cascaded from precondition)
4. Each precondition has key indicators nested directly under it (cascaded from precondition)
5. Indicative steps and key indicators are siblings at the same level under each precondition
6. Functionalities field is present and mandatory (top level, independent)
7. Form validation ensures all mandatory fields are completed at each cascaded level
8. Dynamic fields can be added/removed for objectives, preconditions, and their nested children
9. UI visually represents the cascaded/waterfall hierarchy (indentation, nesting, or visual grouping)
10. Data structure maintains parent-child relationships: Objective → Precondition → (Indicative Steps + Key Indicators)

**Completion Criteria:**
1. All Theory of Change fields implemented in cascaded structure
2. Form validation working correctly for all nested levels
3. Data structure supports nested objectives/preconditions/steps/indicators with proper parent-child relationships
4. UI clearly displays the waterfall/cascaded organization of fields
5. Form is user-friendly and intuitive despite hierarchical complexity

---

## ZD-154: Add Voting Period Selection to Proposal Form

**Overview:**
Implement voting period selection dropdown with predefined quarterly meeting periods for the organization.

**Goal:**
Allow proposal creators to select appropriate voting periods from organization's meeting schedule.

**Description:**
- Create voting period selection component/dropdown
- Predefine quarterly periods:
  - March 16th to 20th
  - June 20th to 24th
  - September 21st to 25th
  - December 14th to 18th
- Display periods in user-friendly format
- Make selection mandatory
- Store selected period with proposal data

**Acceptance Criteria:**
1. Voting period dropdown displays all 4 quarterly periods
2. Periods are displayed in readable format (e.g., "March 16-20, 2024")
3. Selection is mandatory before form submission
4. Selected period is saved with proposal data
5. Periods can be extended in the future without code changes (configurable)

**Completion Criteria:**
1. Voting period selector implemented
2. All 4 periods available for selection
3. Selection is validated and saved correctly
4. Periods are configurable for future updates

---

## ZD-155: Implement Proposal Submission and Listing

**Overview:**
Implement proposal submission functionality that saves proposals to a list and displays them on the homepage, replacing the "Enter game code" section.

**Goal:**
Enable proposal creation, storage, and display in a proposals list accessible from the homepage.

**Description:**
- Create database schema/table for proposals (if needed)
- Implement proposal submission API endpoint
- Save proposal data including all form fields and voting period
- Create proposals list component to display on homepage
- Replace "Enter game code / Join existing game" section with proposals list
- Display proposals that are in current voting period
- Make proposals clickable to enter "Current proposal" flow
- Update homepage layout to show proposals list

**Acceptance Criteria:**
1. Proposals are saved to database/storage after submission
2. Proposals list displays on homepage in place of game code entry
3. Only proposals in current voting period are shown
4. Clicking a proposal navigates to "Current proposal" flow
5. Proposal data includes all form fields and voting period
6. Proposals are displayed with title and voting period information

**Completion Criteria:**
1. Backend storage for proposals implemented
2. Proposals list component created and integrated
3. Homepage updated with proposals list
4. Navigation to proposal flow working
5. Data persistence verified

---

## ZD-156: Hide Character Type Selection in Lobby

**Overview:**
Modify the lobby page to skip the character type selection screen and show only the character selection, defaulting to human character type.

**Goal:**
Simplify lobby flow by removing character type choice and defaulting to human characters only.

**Description:**
- Modify lobby page (`src/routes/[code]/lobby/+page.svelte`) to hide character type selection
- Set default character category to 'human'
- Skip directly to character selection step
- Remove or hide the category selection UI (human/non-human buttons)
- Update lobby state to automatically set human category

**Acceptance Criteria:**
1. Lobby page no longer shows character type selection screen
2. Users go directly to character selection
3. Only human characters are available for selection
4. No broken functionality in lobby flow
5. Character selection works as before but without type choice

**Completion Criteria:**
1. Lobby page updated to skip type selection
2. Default category set to human
3. Character selection flow works correctly
4. No UI glitches or broken states

---

## ZD-157: Update Character Selection to Role Selection

**Overview:**
Transform character selection into role selection with 6 new roles (administration, research, reception, operations, bar, cleaning) and update related descriptions and field labels.

**Goal:**
Replace game characters with organizational roles relevant to Aquário Vasco da Gama governance.

**Description:**
- Replace 6 character types with 6 roles:
  - Administration
  - Research
  - Reception
  - Operations (mention electricity and plumbing in description)
  - Bar
  - Cleaning
- Update "Select your character" text to "Select your role"
- Change "Character name" field to "Name"
- Update description field label from "What are you...?" to "How long are you at the organization? How do you describe your responsibilities?"
- Update role descriptions in translation files (en.json and pt.json)
- Update character data structure to support roles
- Modify character option component to display roles

**Acceptance Criteria:**
1. Lobby shows "Select your role" instead of "Select your character"
2. All 6 roles are available with correct names
3. Role descriptions are updated appropriately
4. Name field label changed from "Character name" to "Name"
5. Description field prompt updated to organization-focused questions
6. All changes reflected in both English and Portuguese
7. Role selection works functionally the same as character selection

**Completion Criteria:**
1. Role data structure updated
2. UI components updated with new role names and descriptions
3. Translation files updated for all role-related text
4. Role selection flow tested and working
5. Database schema updated if needed

---

## ZD-158: Update Tutorial for ZoopDAO Context

**Overview:**
Update the game tutorial to reflect ZoopDAO governance context, changing references from game elements to assembly participation elements.

**Goal:**
Transform tutorial from game instructions to governance participation guide.

**Description:**
- Update tutorial step 1 (keep as is)
- Update tutorial step 2: Change map reference to assembly aquarium with players around table (poker table style)
- Update tutorial step 3 (keep as is)
- Update tutorial step 4: Change story sheet reference to input text bar for talking with assembly, including send message and chat history buttons
- Update tutorial step 5: Update player badge position and function description (bottom of aquarium, shows player message to assembly)
- Update tutorial step 6: Change dice reference to digital clock showing current local time (hours, minutes, seconds)
- Update tutorial step 7 (keep as is)
- Update tutorial step 8: Change "Start playing" button text to "Start participating"
- Update all tutorial text in translation files (en.json and pt.json)
- Modify tutorial component to reflect new context

**Acceptance Criteria:**
1. All 8 tutorial steps updated with ZoopDAO context
2. Map reference changed to assembly aquarium
3. Story sheet changed to input text bar with send/chat history
4. Player badge description updated for new position and function
5. Dice changed to digital clock reference
6. "Start playing" changed to "Start participating"
7. All tutorial text updated in both languages
8. Tutorial flow works correctly with new content

**Completion Criteria:**
1. Tutorial component updated with new steps
2. Translation files updated for all tutorial text
3. Tutorial displays correctly with new content
4. All references to game elements changed to governance elements

---

## ZD-159: Replace Map with Aquarium Assembly Table

**Overview:**
Replace the game map component with an aquarium assembly table image, maintaining current map functions but adapting the visual representation.

**Goal:**
Transform the visual centerpiece from Madeira island map to aquarium assembly table for governance discussions.

**Description:**
- Replace map component (`src/lib/components/map.svelte`) with aquarium assembly table ('static/images/aquarium/assembly_table.svg')
- Use background color should be HEX #b3e4eb
- Use generated aquarium image as background/centerpiece
- Maintain current functions that are on top of the map (to be changed later per requirements)
- Position aquarium image in center of game view
- Ensure responsive design works with new image
- Update map-related CSS and styling
- Remove map-specific functionality (stops, movement) if not needed

**Acceptance Criteria:**
1. Map component replaced with aquarium assembly table
2. Aquarium image displays correctly in game view
3. Current map functions remain accessible (to be updated in future stories)
4. Responsive design maintained
5. No broken layouts or missing elements
6. Image loads and displays properly

**Completion Criteria:**
1. Aquarium image integrated into component
2. Map component replaced/updated
3. Visual layout tested and working
4. No console errors or broken functionality

---

## ZD-160: Add AI Agents Visualization After Each Round

**Overview:**
Implement visualization of AI agents and human participants around the table after each round, with flexible participant composition totaling 6 participants (minimum 1 human and minimum 1 AI agent, with maximum 5 of each type). AI random agents display 1-3 messages commenting on the proposal point, with full debate enabled only in the final discussion round.

**Goal:**
Add AI agent participation alongside human participants to provide commentary and discussion on proposal points throughout the governance process, supporting flexible assembly compositions with a total of 6 participants.

**Description:**
- Create AI agent visualization component showing agents around the aquarium table
- Create participant visualization component supporting both AI agents and human participants
- Support flexible participant composition with total of 6 participants:
  - Minimum 1 human participant (required)
  - Minimum 1 AI agent (required)
  - Maximum 5 human participants
  - Maximum 5 AI agents
  - Total must equal 6 participants (e.g., 1 human + 5 AI, 2 humans + 4 AI, 3 humans + 3 AI, 4 humans + 2 AI, 5 humans + 1 AI)
- Implement AI message generation for each round (1-3 messages per agent)
- Display agent messages after each round completion
- For rounds 1-6: Agents comment on specific proposal point
- For round 7 (discussion): Enable full opinion and debate from all AI agents plus user comments and all human participants
- Design agent UI to show around the aquarium (similar to player badges but visually distinct)
- Design human participant UI to show around the aquarium (using player badges)
- Integrate with round completion flow
- Store AI messages with proposal discussion data
- Store human participant messages with proposal discussion data
- Ensure proper positioning of all 6 participants around the aquarium table

**Acceptance Criteria:**
1. System supports flexible participant composition totaling exactly 6 participants
2. Minimum requirement: at least 1 human participant and at least 1 AI agent must be present
3. Maximum constraint: no more than 5 of each type (humans or AI agents)
4. All valid compositions are supported: (1H+5AI, 2H+4AI, 3H+3AI, 4H+2AI, 5H+1AI)
5. All 6 participants (humans + AI agents) are visualized around the aquarium table
6. After each round (1-6), agents display 1-3 messages commenting on proposal point
7. In round 7 (discussion), full debate is enabled with all AI agents and user
8. Agent messages are contextually relevant to the proposal point
9. Agent visualization is visually distinct from player badges
10. Messages are saved with discussion data
11. Participant positioning around aquarium accommodates exactly 6 participants

**Completion Criteria:**
1. AI agent component created and integrated
2. Participant component created supporting both AI agents and humans
3. Flexible participant composition logic implemented and validated (total 6 participants)
4. Message generation logic implemented
5. Round-based message display working
6. Final round debate functionality enabled
7. Visual design matches requirements and accommodates exactly 6 participants
8. Participant positioning algorithm handles all valid compositions around aquarium

---

## ZD-161: Implement Discussion Input Bar and Chat History

**Overview:**
Add input text bar with send and chat history buttons to replace the story sheet functionality, enabling real-time discussion during governance rounds.

**Goal:**
Enable participants to engage in discussion through a chat-like interface during proposal rounds.

**Description:**
- Create input text bar component for discussion messages
- Add send button (arrow icon on the right) to submit messages
- Add chat history button (chat balloon icon on the left) to view message history
- Move "Story Telling" button to the left side of the input text bar
- Implement chat history dialog/modal to display all messages
- Store messages with round and participant information
- Display messages in chronological order
- Integrate with round flow to show messages in context
- Update UI layout to accommodate new input bar

**Acceptance Criteria:**
1. Input text bar is visible and functional in game view
2. Send button (arrow icon) submits messages correctly
3. Chat history button (balloon icon) opens message history
4. "Story Telling" button moved to left of input bar
5. Messages are saved and retrievable
6. Chat history displays all messages chronologically
7. Messages are associated with correct round and participant
8. Input bar is accessible throughout the game flow

**Completion Criteria:**
1. Input bar component created and styled
2. Send functionality implemented
3. Chat history dialog created
4. Message storage and retrieval working
5. UI layout updated correctly
6. Integration with game flow complete

---

## ZD-162: Create Database Table and API for AI/Human Messages with Gemini Integration

**Overview:**
Create a database table to store AI agent and human participant messages, implement an API endpoint using Google Gemini API to generate contextual AI messages based on agent roles and proposal context, and establish the data structure to input messages with AI agent context.

**Goal:**
Enable persistent storage of discussion messages and generate contextually relevant AI agent messages using Google Gemini API with role-specific system prompts.

**Description:**
- Create database migration for `discussion_messages` table with fields:
  - id (primary key)
  - game_id (references games table)
  - proposal_id (references proposals table, nullable)
  - round (integer, 0-7)
  - participant_type (enum: 'human' | 'ai_agent')
  - participant_id (references players.id for humans, or agent identifier for AI)
  - agent_role (enum: administration, research, reception, operations, bar, cleaning - nullable, only for AI agents)
  - content (text, the message content)
  - created_at (timestamp)
  - metadata (jsonb, optional context like proposal point, chat history, etc.)
- Create API endpoint `/api/ai/messages` following the pattern from `/api/ai/+server.ts`
- Implement Google Gemini API integration using `@google/genai` package
- Create role-specific system prompts for each AI agent role (administration, research, reception, operations, bar, cleaning)
- Structure message generation to include:
  - Agent role context (from system prompt)
  - Proposal point context (current round's proposal section)
  - Chat history context (previous messages in the discussion)
  - Round context (which round of the 7 rounds)
- Implement message generation logic:
  - For rounds 1-6: Generate 1-3 messages per AI agent commenting on specific proposal point
  - For round 7: Generate full debate messages from all AI agents
  - Include chat history in context for more coherent responses
- Create Zod schema for message validation (content, role, round, etc.)
- Store generated AI messages in database table
- Store human participant messages when submitted through input bar
- Implement message retrieval functions to fetch chat history for a game/proposal

**Acceptance Criteria:**
1. Database table `discussion_messages` created with all required fields
2. Table includes proper foreign key relationships and indexes
3. API endpoint `/api/ai/messages` created and functional
4. Google Gemini API integration working using `gemini-2.5-flash` model
5. System prompts defined for all 6 AI agent roles
6. Message generation includes agent role context from system prompts
7. Message generation includes proposal point context for rounds 1-6
8. Message generation includes chat history context for coherent responses
9. Messages are validated using Zod schema before storage
10. AI messages are generated and stored in database
11. Human messages can be stored in the same table structure
12. Message retrieval functions work correctly for chat history
13. API follows authentication pattern from example (session check)
14. Error handling implemented for API failures

**Completion Criteria:**
1. Database migration created and applied
2. API endpoint implemented following example pattern
3. Gemini API integration working with proper configuration
4. All 6 role-specific system prompts created
5. Message generation logic implemented with context handling
6. Message storage and retrieval functions working
7. Zod schemas defined and validated
8. Error handling and logging implemented
9. API tested with various scenarios (different rounds, roles, contexts)

---

## ZD-163: Replace Dice with Digital Clock

**Overview:**
Replace the dice component with a digital clock displaying current local time in hours, minutes, and seconds format.

**Goal:**
Transform the random dice element into a time-tracking element for governance sessions.

**Description:**
- Replace dice component (`src/lib/components/dice.svelte`) with digital clock component
- Display current local time in HH:MM:SS format
- Update clock in real-time (update every second)
- Position clock in same location as dice was
- Update tutorial reference (already covered in ZD-158)
- Remove dice-related functionality (rolling, random numbers)
- Update translation files if needed
- Style clock to match design system

**Acceptance Criteria:**
1. Dice component replaced with digital clock
2. Clock displays current local time in HH:MM:SS format
3. Clock updates every second in real-time
4. Clock is positioned where dice was previously
5. No dice-related functionality remains
6. Clock styling matches design system

**Completion Criteria:**
1. Digital clock component created
2. Dice component removed/replaced
3. Real-time time updates working
4. Positioning and styling correct
5. No broken references to dice

---

## ZD-164: Implement Discussion Input Button and Round Transitions

**Overview:**
Implement conditional display logic for discussion input elements based on the current round, showing a "Discussion Input" button for rounds 1-6 that opens the story dialog, and displaying the input text bar only in round 7 (discussion round).

**Goal:**
Enable round-appropriate discussion input mechanisms: button-triggered dialog for rounds 1-6, and direct text input bar for the final discussion round.

**Description:**
- Create "Discussion Input" button component to replace input bar position for rounds 1-6
- Implement conditional rendering logic in game view:
  - Rounds 1-6: Display "Discussion Input" button in the position where input bar normally appears
  - Round 7: Hide "Discussion Input" button and display the discussion input text bar instead
- Wire "Discussion Input" button click handler to:
  - Open the story dialog component (`src/lib/components/story-dialog.svelte`)
  - Trigger round timer start (using `gameState.startRoundTimer()`)
  - Ensure dialog opens with correct round context
- Update game view component (`src/routes/[code]/game/+page.svelte`) to conditionally render:
  - Discussion Input button (rounds 1-6)
  - Discussion Input Bar component (round 7 only)
- Ensure story dialog component properly handles being opened from discussion input button
- Maintain existing story dialog functionality (timer, round navigation, answer submission)
- Update button styling to match design system and be visually consistent with input bar position
- Add appropriate translation keys for "Discussion Input" button text in both English and Portuguese

**Acceptance Criteria:**
1. "Discussion Input" button is visible in rounds 1-6 in the position where input bar normally appears
2. "Discussion Input" button is hidden in round 7
3. Discussion input text bar is hidden in rounds 1-6
4. Discussion input text bar is visible only in round 7
5. Clicking "Discussion Input" button opens story dialog component
6. Story dialog opens with correct round context when triggered from button
7. Round timer starts automatically when story dialog opens from discussion input button
8. Story dialog functionality remains intact (timer, navigation, submission)
9. Button styling matches design system and is visually consistent
10. Translation keys added for button text in both languages
11. Conditional rendering logic works correctly for all round transitions

**Completion Criteria:**
1. Discussion Input button component created
2. Conditional rendering logic implemented in game view
3. Button click handler integrated with story dialog
4. Round timer start functionality working when dialog opens from button
5. Input bar visibility logic updated for round 7 only
6. Translation files updated with button text
7. All round transitions tested and working correctly
8. UI/UX verified for both button and input bar states

---

## ZD-165: Update Terminology from "Story" to "Discussion"

**Overview:**
Replace all references to "story", "stories", and story-related terminology with "discussion", "discussions" throughout the application, including UI text, components, and data structures.

**Goal:**
Align application terminology with governance context by removing game narrative language.

**Description:**
- Update all UI text from "story" to "discussion" in translation files
- Change "Your final story" to "Your final discussion"
- Update "Story Telling" button text
- Change component names and references (story-dialog, story-card, etc.)
- Update database schema/field names if applicable
- Update API endpoints and data structures
- Change "save story" to "submit discussion and vote"
- Update "player name" and "story title" references (hide player name, change story title)
- Update all related text in both English and Portuguese

**Acceptance Criteria:**
1. All "story" references changed to "discussion" in UI
2. "Your final story" changed to "Your final discussion"
3. "Story Telling" button updated
4. Component names updated where appropriate
5. Database/API references updated if needed
6. "Save story" changed to "Submit discussion and vote"
7. All changes reflected in both languages
8. No broken functionality from terminology changes

**Completion Criteria:**
1. Translation files updated comprehensively
2. Component references updated
3. Data structure names updated
4. All UI text reflects new terminology
5. Functionality verified after changes

---

## ZD-166: Final Discussion Voting + AI Fallback Flow

**Overview:**
Finalize the discussion end flow by adding mandatory voting, saving the full round-7 discussion (user + AI), and ensuring AI fallback messages always display sequentially when the API fails.

**Goal:**
Guarantee a complete, votable final discussion experience with reliable AI messaging and persisted vote data.

**Description:**
- Add vote selection (Yes/No/Abstain) to the final report and make submission mandatory.
- Change the submit button text to "Submit discussion and vote".
- Hide participant name/title fields; auto-fill values for save payload.
- Persist vote with saved discussions (DB column + RPC update).
- Save the full round-7 discussion using the message history (user + AI).
- Ensure AI fallback messages render in the UI even when `/api/ai/messages` fails.
- Show AI typing bubbles sequentially (one agent at a time) with a brief gap between agents.
- Store AI messages without blocking UI; keep persistence best-effort.

**Acceptance Criteria:**
1. Three voting buttons (Yes, No, Abstain) are visible in the final report.
2. "Save story" button is replaced by "Submit discussion and vote".
3. Submission is blocked until a vote is selected.
4. Participant name/title inputs are hidden but still sent in the save payload.
5. Vote is saved with the discussion record.
6. Round 7 save includes all discussion messages (user + AI).
7. AI fallback messages appear in bubbles on API errors.
8. AI typing bubbles are sequential (only one at a time) with a short gap.

**Completion Criteria:**
1. Final report UI updated with voting controls and mandatory submission.
2. DB migration adds vote column and `save_discussion` handles vote.
3. Round-7 discussion saved with message history (user + AI).
4. AI fallback flow updates UI first and persists best-effort.
5. Sequential AI typing bubbles with brief inter-message delay.
6. Translations updated for new voting labels and prompts.

---

## ZD-167: Adapt Browse Stories to Browse Discussions

**Overview:**
Transform the "Browse stories" page to "Browse discussions" page, adapting saved stories functionality to display saved discussions from proposal participations.

**Goal:**
Enable users to browse and read discussions from past proposal participations instead of game stories.

**Description:**
- Kept the `/stories` route but updated labels and copy to discussions context
- Mapped `saved_discussions` records to the existing stories UI shape in loaders
- Ensured browsing only shows public discussions and backfilled visibility defaults
- Hardened character/role filter labels when translation keys are missing
- Updated translations (EN/PT) for discussions terminology and browse labels
- Adjusted browse navigation button to use client-side routing for reliability

**Acceptance Criteria:**
1. `/stories` shows saved discussions with discussion wording
2. Saved discussions load from `saved_discussions` and map to UI shape
3. Filters/search operate on discussion fields without crashes
4. Public-only discussions are listed
5. Labels/CTAs updated in EN/PT
6. Browse button navigates reliably to the list

**Completion Criteria:**
1. Loaders query `saved_discussions` and map fields
2. UI copy updated to discussions in EN/PT
3. Role filter labels are resilient to missing translations
4. Public visibility defaults/backfill in migration
5. Browse link uses client-side navigation

---

## ZD-168: Replace Image Gallery with View Full Proposal Button

**Overview:**
Deactivate the image gallery button and replace it with a "Full Proposal" button (text + icon) that displays the complete proposal details in a discussion view, similar to the proposal preview shown before entering the lobby.

**Goal:**
Provide easy access to view the full proposal details during discussion participation, replacing the game-focused image gallery functionality.

**Description:**
- Remove or deactivate the image gallery button (`IslandDialog`) from the game view
- Create "Full Proposal" button component with text and icon
- Position button in the same location where image gallery button was (right side, middle of screen)
- Implement button click handler to open proposal view/dialog
- Display full proposal details in a dialog or modal similar to proposal preview page (`/proposals/[id]/preview`)
- Include all proposal sections: title, objectives, preconditions, indicative steps, key indicators, functionalities, discussion
- Ensure proposal data is accessible from game state (proposal_id should be available)
- Style button to match design system and be visually consistent with other game view buttons
- Add appropriate translation keys for "View Full Proposal" button text in both English and Portuguese
- Ensure button is disabled until tour is completed (same as other game view buttons)

**Acceptance Criteria:**
1. Image gallery button is deactivated/removed from game view
2. "View Full Proposal" button is visible in the same position as image gallery button
3. Button displays text and icon appropriately
4. Clicking button opens proposal details view
5. Proposal view shows all proposal sections (title, objectives, preconditions, steps, indicators, functionalities, discussion)
6. Proposal view matches the style of proposal preview page
7. Button is disabled until tour is completed
8. Translation keys added for button text in both languages
9. Button styling matches design system

**Completion Criteria:**
1. Image gallery button removed/deactivated
2. View Full Proposal button component created
3. Proposal view dialog/modal implemented
4. Proposal data integration working
5. Translation files updated
6. Button positioning and styling verified
7. Functionality tested and working

---

## ZD-169: Translation Consistency Check and Save Discussion Dialog Updates

**Overview:**
Inspect and update translation files (en.json and pt.json) for syntax and context consistency, focusing on updating the save_discussion pop-up dialog to replace "game" terminology with "discussion" terminology throughout.

**Goal:**
Ensure all translation strings are consistent with ZoopDAO governance context and update save discussion dialog to use appropriate terminology.

**Description:**
- Review all translation keys in `messages/en.json` and `messages/pt.json` for:
  - Syntax errors (missing commas, brackets, quotes)
  - Context consistency (game vs discussion terminology)
  - Missing translations or placeholder text
- Focus on save_discussion dialog (`end-dialog.svelte`) related translations:
  - Update "game" references to "discussion" or "participation"
  - Update "player" references to "participant" where appropriate
  - Update "story" references to "discussion" (if any remain)
  - Ensure all dialog text reflects governance context
- Check translation keys used in:
  - `do_you_want_to_save`
  - `save_story` / `submit_discussion_and_vote`
  - `save_form`
  - `your_story_wont_saved`
  - `player_name` / `participant_name`
  - `story_title` / `discussion_title`
  - Any other save dialog related keys
- Verify consistency between English and Portuguese versions
- Update help dialog text if it still references "game" terminology
- Ensure all new terminology is properly translated in both languages
- Test save dialog to verify all text displays correctly

**Acceptance Criteria:**
1. All translation files have valid JSON syntax (no syntax errors)
2. Save discussion dialog uses "discussion" terminology instead of "game"
3. Save discussion dialog uses "participant" terminology instead of "player" where appropriate
4. All translation keys are consistent between English and Portuguese
5. No placeholder text or missing translations in critical paths
6. Help dialog text updated to governance context
7. All dialog text reflects ZoopDAO governance context
8. Translation files pass JSON validation

**Completion Criteria:**
1. Translation files reviewed and syntax errors fixed
2. Save discussion dialog translations updated
3. All "game" references changed to appropriate governance terminology
4. English and Portuguese translations are consistent
5. Help dialog translations updated
6. All changes tested in UI
7. JSON files validated for syntax correctness

---

## ZD-170: Mode Selection Page and Timer Implementation

**Overview:**
Add a mode selection page before role selection in the lobby flow, allowing users to choose between Pedagogic Mode (with timer) and Decision-Making Mode (without timer), and implement timer functionality that shows only in the last round with appropriate durations.

**Goal:**
Enable users to select their preferred discussion mode and implement timer functionality that only appears in the final discussion round with mode-appropriate durations.

**Description:**
- Create new mode selection page/route before role selection in lobby flow
- Design mode selection UI in the style of role lobby (similar visual design)
- Implement two mode options:
  - **Pedagogic Mode**: Discussion with Timer (educational/learning focus)
  - **Decision-Making Mode**: Discussion without Timer (focused decision-making)
- Store selected mode in game state or URL parameters
- Update lobby flow to show mode selection before role selection
- Replace digital clock component with timer component (reverse previous commit changes)
- Implement timer visibility logic:
  - Pedagogic Mode: Timer shown in all rounds (1-7)
  - Decision-Making Mode: No timer displayed at all
- Implement timer duration logic:
  - Rounds 1-6: 1 minute timer (Pedagogic Mode only)
  - Round 7 (discussion): 2 minute timer (Pedagogic Mode only)
  - Decision-Making Mode: No timer displayed in any round
- Update timer component to respect mode selection
- Ensure timer starts automatically when round begins (if mode requires it)
- Update game state to track mode selection
- Add translation keys for mode selection page (mode names, descriptions) in both languages
- Update lobby URL structure to include mode parameter if needed

**Acceptance Criteria:**
1. Mode selection page appears before role selection in lobby flow
2. Two mode options are available: Pedagogic Mode and Decision-Making Mode
3. Mode selection UI matches role lobby visual style
4. Selected mode is stored and accessible throughout game flow
5. Digital clock is replaced with timer component
6. Timer displays in all rounds (1-7) in Pedagogic Mode
7. Timer duration is 1 minute for rounds 1-6 (Pedagogic Mode only)
8. Timer duration is 2 minutes for round 7 (Pedagogic Mode only)
9. No timer displays in Decision-Making Mode (any round)
10. Timer starts automatically when round begins (Pedagogic Mode only)
11. Translation keys added for mode selection in both languages
12. Mode selection persists through game flow

**Completion Criteria:**
1. Mode selection page created and integrated into lobby flow
2. Mode selection UI styled to match role lobby
3. Timer component implemented (replacing digital clock)
4. Timer visibility logic working (all rounds in Pedagogic Mode, none in Decision-Making Mode)
5. Timer duration logic working (1 min for rounds 1-6, 2 min for round 7 in Pedagogic Mode)
6. Mode-based timer display logic working
7. Game state updated to track mode selection
8. Translation files updated with mode selection text
9. All timer functionality tested in both modes
10. Lobby flow tested with mode selection

---

## ZD-171: Complete Discussion view with proposal actions and round points

**Overview:**
Add a consistent "View full proposal" action to discussion cards and ensure each card reflects the proposal points tied to its round, aligning discussion UX with assembly behavior.

**Goal:**
Provide a clear path to the full proposal from discussion cards and display accurate round-specific proposal points.

**Description:**
a) Add an input-style button below each discussion card to view the full proposal, duplicating the assembly button behavior.
b) Wire the button to the same navigation/handler used in assembly.
c) Ensure discussion cards show the proposal points for their corresponding round.
d) Validate that the displayed points update correctly when rounds change.

**Acceptance Criteria:**
1. Each discussion card includes a "View full proposal" button below the card, matching assembly styling and behavior.
2. Clicking the button opens the full proposal view for the card’s proposal.
3. Discussion cards show the proposal points specific to the card’s round.

**Completion Criteria:**
1. UI behavior matches assembly button for all discussion cards.
2. Round-specific points are confirmed correct across multiple rounds and proposals.

---

## ZD-172: Remove “Discussion” field from initial proposal flow

**Overview:**
Remove the “Discussion” field from the initial proposal creation and proposal display surfaces (new proposal form, proposals list, and “view full proposal” popups). Discussion should exist only as messages saved in the history browser (chat), not as a proposal attribute.

**Goal:**
Ensure proposals contain only proposal data, while discussion content is captured exclusively in the discussion/history system.

**Description:**
a) Remove the “Discussion” input from the new proposal form UI and validation.
b) Remove “Discussion” from proposal list card displays and any proposal preview/full-proposal popups.
c) Ensure proposal creation no longer writes a “discussion” field to storage (client payload, API, and DB schema if applicable).
d) Confirm discussion messages remain available via the history browser and continue to be saved per round/participant.
e) If legacy proposal records include a “discussion” field, define a safe handling strategy (ignore/hide, or migrate content into history if required).

**Acceptance Criteria:**
1. New proposal form has no “Discussion” field and submits successfully without it.
2. Proposals list and “view full proposal” popups do not display a “Discussion” field.
3. Proposal create/update payloads do not include a “discussion” attribute.
4. Discussion continues to be captured and viewable via the history browser (chat).

**Completion Criteria:**
1. UI, API, and persistence layers are aligned with the removal (no dead fields/validators).
2. Manual verification confirms proposals render correctly and discussion history remains intact.

---

## ZD-173: Make Portuguese the primary language (default locale)

**Overview:**
Set Portuguese as the default language shown to users across the app, while keeping English available as an option. This ensures the initial experience matches the primary audience and content context.

**Goal:**
Load Portuguese by default on first visit and persist the user’s chosen language thereafter.

**Description:**
a) Set the app’s default locale to Portuguese (`pt`) for first-time visitors.
b) Ensure language selection (if present) still allows switching to English and persists via storage/cookie.
c) Update any locale detection logic to prefer Portuguese when no explicit user preference exists.
d) Verify that all key routes/components render Portuguese strings by default.

**Acceptance Criteria:**
1) On first visit (no stored preference), the UI loads in Portuguese.
2) If the user switches language, the chosen language persists across refresh and navigation.
3) English remains selectable and renders correctly when chosen.

**Completion Criteria:**
1) Default locale behavior is implemented and verified across core flows (home, proposals, lobby/game).
2) Language preference persistence is validated.

---

## ZD-174: Replace “play/game” wording with “participation/discussion” across the UI

**Overview:**
Update the product language to remove game-centric terms (“play”, “game”, “player”, etc.) and replace them with governance-centric terms (“participation”, “discussion”, “participant”) throughout UI text, buttons, and flows. This aligns LogaCulture legacy messaging with ZoopDAO’s DAO participation purpose.

**Goal:**
Ensure all user-facing copy reflects multispecies governance participation instead of gameplay.

**Description:**
a) Audit all user-facing strings (UI components + `messages/en.json` and `messages/pt.json`) for “play/game” concepts.
b) Replace labels, buttons, and sentences with “participation” and/or “discussion” equivalents while keeping meaning and UX clarity.
c) Update route/page titles and empty states that reference “game” (e.g., join game, start game, game code).
d) Ensure any remaining “game” terminology is limited to internal code identifiers only (not user-facing).
e) Review for consistency across flows: homepage, lobby, proposal creation, rounds, discussion, and history.

**Acceptance Criteria:**
1) No user-facing UI text contains “play” or “game” wording in English or Portuguese (unless explicitly justified).
2) Updated copy uses “participate/participation” and/or “discussion” consistently across primary flows.
3) Buttons and navigation labels remain clear and not misleading after copy changes.

**Completion Criteria:**
1) `messages/en.json` and `messages/pt.json` are updated and verified in the UI.
2) Manual walkthrough confirms the main flows contain the new terminology end-to-end.



---


## ZD-180: Epic — Finish AI assembly with switchable LLM provider (IAEDU GPT-4o gateway + keep Gemini)

**Overview:**
Complete the AI assembly integration using IAEDU OpenAI GPT-4o in TypeScript while preserving the existing Gemini script. Add a single configuration switch so the app can change providers without refactoring call sites.

**Goal:**
Run the AI assembly end-to-end with a consistent API shape, and allow switching between IAEDU OpenAI GPT-4o and Gemini via one variable.

**Description:**
a) Implement IAEDU OpenAI GPT-4o integration in the current AI server/API layer in TypeScript.
b) Keep the Gemini script in its current location (do not remove or rewrite it).
c) Add one configuration variable (env or constant) to choose active provider/model.
d) Standardize inputs/outputs so UI and storage do not depend on provider-specific fields.
e) Add basic reliability and error handling for AI calls.

**Acceptance Criteria:**
1) AI assembly runs end-to-end using IAEDU OpenAI GPT-4o.
2) Gemini integration remains available and unchanged in its location.
3) Switching a single variable changes the active provider.
4) AI API responses follow one consistent schema regardless of provider.

**Completion Criteria:**
1) Provider switching is documented and manually verified for both providers.
2) Error handling is consistent and user-safe across providers.

---

## ZD-180a: Spike — Define unified LLM provider interface and message schema

**Overview:**
Define a single, provider-agnostic contract for AI generation so multiple LLMs can be swapped without changing UI and storage logic.

**Goal:**
Lock down the request/response schema used by the AI assembly for all providers.

**Description:**
a) Define TypeScript types for AI requests (proposal id, round, proposal point, recent messages, mode).
b) Define TypeScript types for AI responses (agent id/name, message text, timestamps, round metadata, provider info).
c) Define error shapes and retry/timeout policy requirements.
d) Specify any required constraints (length limits, formatting rules) to support UI rendering.

**Acceptance Criteria:**
1) A single TS interface exists for “generate AI messages” used by all providers.
2) Output schema includes all metadata needed by UI and history storage.

**Completion Criteria:**
1) Schema is referenced by the IAEDU OpenAI GPT-4o and Gemini provider implementations.

---

## ZD-180b: Implement IAEDU GPT-4o gateway provider in TypeScript

**Overview:**
Add a production-ready IAEDU OpenAI GPT-4o provider that implements the unified interface for AI assembly generation.

**Goal:**
Generate AI assembly messages using IAEDU OpenAI GPT-4o with the standardized schema.

**Description:**
a) Implement an IAEDU provider module that conforms to the unified interface.
b) Add env-based configuration for endpoint, channel, thread, and API key.
c) Ensure outputs map into the standard response schema (no provider-specific leakage).
d) Add minimal logging/metrics hooks for debugging failures.

**Acceptance Criteria:**
1) IAEDU OpenAI GPT-4o provider generates valid messages for each round and returns the standard schema.
2) Missing/invalid config returns a clear, safe error.

**Completion Criteria:**
1) Manual verification shows AI generation works in at least two rounds using IAEDU OpenAI GPT-4o.

---

## ZD-180c: Add provider switch variable (IAEDU OpenAI GPT-4o vs Gemini) without moving Gemini code

**Overview:**
Enable switching the active AI provider by changing a single variable, keeping Gemini code in place.

**Goal:**
Switch providers without modifying UI code or multiple call sites.

**Description:**
a) Add one config variable (e.g., `LLM_PROVIDER=iaedu|gemini`) read by the AI server layer.
b) Route requests to the correct provider adapter based on the variable.
c) Keep Gemini script untouched and wrap it only via a thin adapter if required.

**Acceptance Criteria:**
1) Changing only `LLM_PROVIDER` switches the running provider.
2) No additional UI changes are required when switching providers.

**Completion Criteria:**
1) Both providers are verified to return the same response schema.

---

## ZD-180d: Add reliability layer for AI calls (timeouts, retries, consistent errors)

**Overview:**
Improve the robustness of AI calls to prevent UI hangs and provide consistent failure handling.

**Goal:**
Make AI assembly resilient to transient failures while staying predictable for the UI.

**Description:**
a) Add request timeouts and bounded retries where appropriate.
b) Normalize provider errors into a single error response shape.
c) Ensure partial failures are handled safely (e.g., some AI agents fail but UI still works).

**Acceptance Criteria:**
1) AI endpoints time out safely and return consistent errors.
2) Transient failures can recover without user-facing crashes.

**Completion Criteria:**
1) Manual testing confirms UI remains stable under simulated AI failures.

---

## ZD-180e: Smoke test IAEDU OpenAI GPT-4o endpoint

**Overview:**
Add a minimal terminal-based smoke test to verify the IAEDU OpenAI GPT-4o gateway responds with a basic message.

**Goal:**
Validate connectivity and request format for IAEDU before relying on it in the UI.

**Description:**
a) Add a simple Node script that posts a "hello world" message to the IAEDU endpoint.
b) Read configuration from `.env` (IAEDU endpoint, API key, channel, thread, user info).
c) Print status code and a short response preview.

**Acceptance Criteria:**
1) Running the script succeeds when network/DNS is available.
2) Script exits with a clear error when configuration is missing.

**Completion Criteria:**
1) Manual test is run and output logged in the terminal.

---

## ZD-181: Epic — Documents upload (Round 7) + RAG using Supabase (pgvector) + LangChain.js + OpenRouter (bge-m3 OpenAI-compatible)

**Overview:**
Enable document uploads from the last round input bar and use those documents for retrieval-augmented generation (RAG). Store embeddings in Supabase Postgres with `pgvector`, implement ingestion/retrieval via LangChain.js, and use OpenRouter (bge-m3, OpenAI-compatible) for embeddings.

**Goal:**
Allow participants to ground final-round discussion with uploaded documents that can be searched and injected into AI prompts.

**Description:**
a) Activate the existing “add documents” UI button (from ZD-161) in the last round input bar.
b) Persist uploaded documents and derived chunks/embeddings in Supabase using `pgvector` (1024-dim for bge-m3).
c) Implement RAG ingestion (extract text → chunk → embed → store) in TypeScript using OpenRouter embeddings.
d) Implement RAG retrieval using LangChain.js `SupabaseVectorStore` with metadata filters (proposal/round).
e) Inject retrieved context into AI generation in a safe, token-bounded format with citations/metadata.

**Acceptance Criteria:**
1) Users can upload documents in the last round and see them attached to the proposal/round.
2) Embeddings are stored and searchable via Supabase `pgvector`.
3) AI calls can retrieve relevant chunks and use them as context in the final round.

**Completion Criteria:**
1) End-to-end upload → ingest → retrieve → AI prompt injection is manually verified.
2) Retrieval is correctly scoped (no cross-proposal leakage).

---

## ZD-181a: Wire “add documents” button (Round 7) to real upload flow

**Overview:**
Turn the existing Round 7 “add documents” UI into a functional upload feature with clear UX states.

**Goal:**
Allow a user to attach one or more documents to a proposal during the final round.

**Description:**
a) Implement file selection and upload initiation from the existing button.
b) Add upload progress/success/error states.
c) Display an attachments list (name, size, status) associated to the current proposal/round.

**Acceptance Criteria:**
1) Upload works from the Round 7 input bar and shows clear success/failure feedback.
2) Uploaded files appear in an attachments list tied to the active proposal/round.

**Completion Criteria:**
1) Manual verification covers multiple files and failure cases.

---

## ZD-181b: Spike — Define Supabase RAG schema + migrations (documents, chunks, embeddings with pgvector)

**Overview:**
Define the Supabase Postgres schema needed for RAG storage and retrieval using `pgvector`, aligned with Supabase + LangChain docs.

**Goal:**
Create a DB foundation compatible with `SupabaseVectorStore` (table + `match_documents` RPC).

**Description:**
a) Enable `vector` extension in the `extensions` schema.
b) Create `documents` for file metadata and `document_chunks` for chunk content + embeddings.
c) Add `embedding extensions.vector(1024)` (bge-m3) and an `ivfflat` cosine index.
d) Add `match_documents` RPC with `query_embedding`, `match_count`, and `filter` JSONB.
e) Define baseline RLS expectations for documents/chunks.

**Acceptance Criteria:**
1) Schema supports proposal/round-scoped documents and chunk embeddings.
2) `match_documents` returns `id, content, metadata, similarity` for LangChain.

**Completion Criteria:**
1) Migrations are ready to apply and match Supabase/LangChain naming.

---

## ZD-181c: Implement LangChain ingestion pipeline (load → split → embed → store)

**Overview:**
Implement the ingestion pipeline that turns uploaded documents into searchable embeddings stored in Supabase.

**Goal:**
Prepare uploaded documents for retrieval by chunking and embedding them.

**Description:**
a) Define the supported file types for ingestion (expected: `.txt`, `.md`, `.pdf`, `.xlsx`, `.docx`, `.pptx`).
b) Use LangChain loaders to extract text for supported types (where available).
c) Chunk text with `RecursiveCharacterTextSplitter` (deterministic size/overlap).
d) Build LangChain `Document` objects (pageContent + metadata) with `proposal_id`, `round`, `document_id`, `filename`, `storage_path`.
e) Embed with OpenRouter (bge-m3) and insert into `document_chunks` directly (schema matches docs: `content`, `metadata`, `embedding`).
f) Track ingestion status in `documents.metadata` (pending/indexed/failed).

**Acceptance Criteria:**
1) Uploading a document results in stored chunks with embeddings in Supabase.
2) Ingestion status is visible for troubleshooting.

**Completion Criteria:**
1) Unit tests validate ingestion: document record, chunk inserts, embeddings call, and indexed status updates.

---

## ZD-181d: Implement LangChain retrieval via `SupabaseVectorStore` (top-k + metadata filters)

**Overview:**
Implement retrieval using LangChain.js to return the most relevant chunks for a user/AI query.

**Goal:**
Retrieve high-signal context scoped to the active proposal/round.

**Description:**
a) Use `SupabaseVectorStore` with `tableName: 'document_chunks'` and `queryName: 'match_documents'`.
b) Apply metadata filters (`proposal_id`, `round`) via the filter JSONB (`metadata @> filter`).
c) Use `SupabaseFilterRPCCall` when advanced filters are needed.
d) Return chunks with citations from metadata (doc id/name, chunk id, similarity).

**Acceptance Criteria:**
1) Retrieval returns top-k relevant chunks for a query.
2) Retrieval is correctly scoped to the proposal/round and does not leak other proposals’ docs.

**Completion Criteria:**
1) Unit tests confirm retrieved chunks match uploaded content and scope (proposal/round).

---

## ZD-181e: Integrate RAG context into AI prompting (Round 7)

**Overview:**
Inject retrieved document context into AI prompts in a structured, token-bounded way.

**Goal:**
Improve AI responses by grounding them in participant-provided documents.

**Description:**
a) Fetch retrieved chunks for the Round 7 query using LangChain retrieval.
b) Add context blocks with `source` metadata (filename, chunk id, similarity).
c) Enforce a strict token/length budget for injected context and strip low-signal chunks.

**Acceptance Criteria:**
1) AI responses can reference uploaded documents using retrieved chunks.
2) Context injection respects a fixed token/length budget.

**Completion Criteria:**
1) Unit tests confirm AI prompt payload includes bounded RAG context and metadata.

---

## ZD-181f: Add access control + scoping rules for documents and retrieval

**Overview:**
Prevent cross-proposal data leakage by enforcing strict scoping for document storage and retrieval.

**Goal:**
Ensure documents and embeddings are only accessible within the correct proposal context.

**Description:**
a) Enforce proposal/round scoping in `match_documents` filter.
c) Ensure storage bucket policies match DB scoping rules.
b) Harden Supabase RLS for `documents` and `document_chunks`.
c) Define behavior for public vs private proposals (if applicable).

**Acceptance Criteria:**
1) A user cannot retrieve chunks from other proposals.
2) Document reads/writes follow the project’s access rules.

**Completion Criteria:**
1) Unit tests confirm no cross-proposal retrieval is possible.

---

## ZD-181g: Document lifecycle and UX hygiene (limits, delete, reindex, failure states)

**Overview:**
Add the operational features needed to keep document upload and RAG stable over time.

**Goal:**
Make document uploads safe, manageable, and debuggable.

**Description:**
a) Enforce file size/type limits with friendly UI errors.
b) Decide soft delete vs hard delete and document the choice.
c) Add delete document (cascade delete chunks/embeddings).
d) Add reindex/retry for failed ingestions.
e) Add limits per proposal/round to prevent runaway storage costs.

**Acceptance Criteria:**
1) Unsupported files are rejected with clear messaging.
2) Deleting a document removes its chunks/embeddings from retrieval results.

**Completion Criteria:**
1) Unit tests cover upload limits and delete/reindex flows.

---

## ZD-182: Epic — Add per-round AI assistant button (one-sentence question, max 3 per round)

**Overview:**
Add an AI assistant button near the submit button to help the user think about the current proposal point in each round. The assistant returns exactly one sentence question and is limited to a maximum of 3 questions per round, with the button text showing how many are left.

**Goal:**
Help users reflect on the proposal point without generating their message, and prevent spam by limiting prompts per round.

**Description:**
a) Add a UI button near the submit button to request an “AI question”.
b) Enforce “one sentence question only” output.
c) Enforce per-round limit: max 3 AI questions per round per user/session.
d) Update button label to indicate remaining questions (e.g., “AI question (2 left)”).
e) Disable/hide the button when no questions remain, and reset counts when the round changes.

**Acceptance Criteria:**
1) Button is available near submit during rounds with discussion input.
2) Each click returns exactly one sentence question relevant to the current round’s proposal point.
3) The user can request at most 3 questions per round; after that the control is disabled/hidden.
4) Button text always indicates remaining questions for the current round.

**Completion Criteria:**
1) Limit logic is verified by requesting 3 questions, then confirming the 4th is blocked.
2) Round change resets the remaining questions counter.

---

## ZD-182a: Implement assistant button UI with remaining-questions label and per-round counter

**Overview:**
Implement the UI behavior for the assistant button, including remaining questions display and per-round limits.

**Goal:**
Make the assistant interaction clear and self-limiting in the UI.

**Description:**
a) Add the assistant button near submit and render remaining count in the label.
b) Track per-round usage count and remaining questions (max 3).
c) Disable/hide the button when remaining reaches 0.
d) Reset count when the round changes.

**Acceptance Criteria:**
1) Button label updates after each use to reflect remaining questions.
2) Button disables/hides at 0 remaining and resets on round change.

**Completion Criteria:**
1) Manual verification confirms the per-round counter behaves correctly.

---

## ZD-182b: Create assistant API endpoint (one-sentence question only) with per-round limit enforcement

**Overview:**
Implement the server endpoint that returns a single-sentence question and enforces the per-round maximum.

**Goal:**
Provide safe, consistent assistant questions and enforce limits server-side.

**Description:**
a) Create/extend API endpoint to generate one-sentence questions based on proposal point + round context.
b) Enforce output constraint (exactly one sentence; trim and validate).
c) Enforce max 3 questions per round (server-side), returning a clear “limit reached” response.
d) Keep the response shape stable for UI consumption.

**Acceptance Criteria:**
1) Endpoint returns exactly one sentence question per request.
2) 4th request in the same round returns a limit-reached response and does not generate a new question.

**Completion Criteria:**
1) Manual verification confirms both the one-sentence constraint and the per-round limit.

---

## ZD-182c: Make assistant round-aware and optionally RAG-aware (still one sentence)

**Overview:**
Improve relevance of the assistant question by incorporating round context and (optionally) retrieved document chunks when available, while still returning only one sentence.

**Goal:**
Generate higher-quality, grounded questions without changing the one-sentence constraint.

**Description:**
a) Include round number, proposal point, and recent user/AI messages as context.
b) Optionally fetch RAG context (from ZD-181d) for the same proposal/round and use it as supporting context.
c) Ensure the final output is still exactly one sentence question.

**Acceptance Criteria:**
1) Questions are clearly related to the current round’s proposal point.
2) Output remains one sentence even when RAG context exists.

**Completion Criteria:**
1) Manual verification confirms improved relevance without breaking constraints.

---

## ZD-142 Review text and colors of Instruction pop-up

**Overview:**
Review the text and colors used inside the instruction pop-up to ensure they match the ZoopDAO palette, remain readable, and reflect the current flow copy.

**Goal:**
Improve visual consistency, readability, and instruction copy without changing behavior.

**Description:**
a) Identify the instruction pop-up opened by the instruction/help button and confirm its component entry point.
b) Review the instruction copy for current flow accuracy (no legacy map references).
c) Audit background, text, border, and button colors inside the pop-up.
d) Align pop-up colors with the ZoopDAO palette and verify contrast for readability.
e) Verify hover/focus states for interactive elements within the pop-up.
f) Update the relevant module styles, copy, and color tokens as needed.
g) Modules/scripts to review: `src/routes/[code]/game/+page.svelte`, `src/lib/components/help-dialog.svelte`, `src/app.css`, `tailwind.config.ts` (and `src/lib/components/ui/shepherd/custom-css.css` if the instruction flow uses the Shepherd tour).

**Acceptance Criteria:**
1) Instruction copy reflects the current discussion flow (no map references).
2) Pop-up colors align with the ZoopDAO palette and are visually consistent with surrounding UI.
3) Text and buttons meet readable contrast levels against the pop-up background.
4) Hover/focus states remain clear and accessible.

**Completion Criteria:**
1) Updated copy and colors are applied and visually verified on desktop and mobile.

---

## ZD-143: Review card titles colors and concistencies

**Overview:**
Review card title colors and ensure the Round 0 scenario card renders the proposal title/content consistently with the history view.

**Goal:**
Improve readability and consistency for card titles and ensure the Round 0 proposal card displays correctly.

**Description:**
a) Audit card title colors across relevant views and align them with the ZoopDAO palette.
b) Verify contrast for card title text across card variants.
c) Identify the Round 0 card rendering in the discussion dialog.
d) Ensure the proposal title/content card renders when proposal text exists.
e) Keep the Round 0 card style consistent with the story history view.
f) Modules/scripts to review: `src/lib/components/story-dialog.svelte`, card components, `src/app.css`, `tailwind.config.ts`.

**Acceptance Criteria:**
1) Card titles use palette-aligned colors with readable contrast.
2) Round 0 scenario card shows the proposal title/content.
3) Round 0 card matches the history view styling.

**Completion Criteria:**
1) Updated card title colors and Round 0 card are visually verified in the discussion dialog and history view.

---

## ZD-144 Review colors of Input text bar and chat history

**Overview:**
Review the colors of the input text bar and chat history UI to ensure readability and palette alignment, and update the chat message content to white text.

**Goal:**
Improve readability and consistency of the input text bar and chat history UI.

**Description:**
a) Audit colors of the input text bar and chat history area in Round 7.
b) Ensure chat message content text is white and readable against its background.
c) Verify contrast for text and icons inside the chat history area.
d) Confirm hover/focus states remain readable and consistent.
e) Modules/scripts to review: `src/routes/[code]/game/+page.svelte`, `src/lib/components/discussion-input-bar.svelte` (or equivalent), `src/app.css`, `tailwind.config.ts`.

**Acceptance Criteria:**
1) Input text bar and chat history colors align with the ZoopDAO palette.
2) Chat message content text is white and remains readable.
3) Text/icon contrast inside the chat history area remains readable.

**Completion Criteria:**
1) Updated colors are visually verified in Round 7.

---

## ZD-145: Epic — BoS colors palette and font

**Overview:**
Create a configuration-driven theme system to switch between AVG and BoS/project-chuva. The BoS palette must follow the provided colors and the reference in `static/images/bos_logos.png`. Font switching is tracked but not wired yet.

**Goal:**
Enable fast palette and font switching without code edits, and make BoS visually consistent across core UI screens.

**Description:**
a) Add/confirm config variables for theme and font in `src/lib/config/theme.ts` (`ZOOP_THEME`, `ZOOP_FONT_PROFILE`).
b) Define theme token maps for AVG and BoS in `src/app.css`, and map Tailwind colors to CSS variables in `tailwind.config.ts`.
c) Implement BoS palette tokens using HEX: `#D20A0A`, `#3CA5E6`, `#E6C800`, `#3CA03C`, `#000000`, aligned to the BoS visual reference.
 d) De-hardcode UI colors so components read from theme tokens (buttons, dialogs, cards, input bars).
 e) Use `static/images/bos_logos.png` as the visual reference and add theme-ready SVG variants for UI usage.
g) Modules/scripts to review: `src/lib/config/theme.ts`, `src/app.css`, `tailwind.config.ts`, `src/lib/components/ui/button/button.svelte`, `src/lib/components/discussion-input-bar.svelte`, `src/lib/components/discussion-history-dialog.svelte`, `src/routes/[code]/game/+page.svelte`.

**Acceptance Criteria:**
1) A single config variable switches between AVG and BoS themes at runtime.
2) BoS palette uses the provided HEX colors and matches the reference image.
3) Core UI components use theme tokens instead of hardcoded colors.

**Completion Criteria:**
1) Theme switching is documented and visually verified on at least two core screens.
2) BoS theme renders consistently across buttons, cards, dialogs, and input bars.

---

## ZD-145a: Theme config + token map

**Overview:**
Implement theme selection and color token maps so the app can switch between AVG and BoS palettes at runtime.

**Goal:**
Centralize theme configuration and expose a consistent set of tokens to the UI.

**Description:**
a) Update `src/lib/config/theme.ts` to support `avg|bos`, resolve theme values, and apply `data-theme` at runtime.
b) Define CSS variables for each theme in `src/app.css` (primary, secondary, accent, background, surface, text, border, heading).
c) Map Tailwind colors to CSS variables in `tailwind.config.ts` so components use tokens by default.
d) Add `ZOOP_THEME_ASSET_PREFIX` to route theme-specific SVGs.

**Acceptance Criteria:**
1) Theme switching works by changing `ZOOP_THEME` in `src/lib/config/theme.ts` (env wiring pending).
2) All theme tokens are defined for AVG and BoS.
3) Tailwind color utilities reflect the active theme tokens.

**Completion Criteria:**
1) Runtime theme switching is verified for both themes.

---

## ZD-145b: Typography + font configuration

**Overview:**
Apply a configurable global font and ensure text colors use theme tokens with readable contrast. (Pending)

**Goal:**
Make typography consistent and theme-aware. (Font switching not implemented yet.)

**Description:**
a) Pending: Apply `--zd-font-family` to `body` and core typography styles in `src/app.css`.
b) Pending: Map Tailwind `fontFamily` to the CSS variable in `tailwind.config.ts`.
c) Ensure headings, body text, labels, and hints use theme text tokens (including BoS black).
d) Verify fallback fonts are present if Arial is unavailable.

**Acceptance Criteria:**
1) Text colors come from theme tokens and remain readable in BoS.

**Completion Criteria:**
1) Typography changes are verified once font switching is implemented.

---

## ZD-145c: Buttons + interactive controls

**Overview:**
Align buttons and interactive controls with theme tokens, including hover/active/disabled states.

**Goal:**
Ensure interactive elements reflect the active palette consistently.

**Description:**
a) Update `src/lib/components/ui/button/button.svelte` to use theme tokens for background, text, and borders.
b) Apply token-based styles to inputs and controls in `src/lib/components/discussion-input-bar.svelte`.
c) Define hover/active/disabled states for primary and secondary controls using BoS colors.

**Acceptance Criteria:**
1) Buttons and controls reflect the active theme across states.
2) BoS theme buttons use the BoS palette with readable contrast.

**Completion Criteria:**
1) Controls are visually verified in lobby and game views.

---

## ZD-145d: Surfaces + backgrounds

**Overview:**
Update cards, dialogs, panels, and backgrounds to use theme surface tokens.

**Goal:**
Remove hardcoded colors from major UI surfaces and ensure consistent contrast.

**Description:**
a) Apply surface/background tokens in dialogs and cards (e.g., `src/lib/components/discussion-history-dialog.svelte`, `src/lib/components/help-dialog.svelte`).
b) Update page-level backgrounds where necessary (e.g., `src/routes/[code]/game/+page.svelte`).
c) Ensure borders and overlays use theme border/overlay tokens.

**Acceptance Criteria:**
1) Core surfaces use theme tokens in all three themes.
2) BoS surfaces maintain readable contrast and hierarchy.

**Completion Criteria:**
1) Dialogs and cards are visually validated under BoS.

---

## ZD-145e: Update SVG assets for AVG/BoS theming

**Overview:**
Ensure existing SVG illustrations support AVG and BoS themes via theme-specific SVG variants. The `bos_logos.png` file is only a visual inspiration, not a required conversion target.

**Goal:**
Make all SVG-based illustrations theme-adaptive so they switch cleanly between AVG and BoS.

**Description:**
a) Add theme-specific SVG asset folders under `static/images/themes/{avg,bos}`.
b) Route components to themed assets using `ZOOP_THEME_ASSET_PREFIX`.
c) Introduce a dedicated functionality card SVG and allow cards to override asset type.
d) Add BoS-specific home illustration variants (`*_blop.svg`).
e) Verify SVGs render correctly under both AVG and BoS themes.

**Acceptance Criteria:**
1) Themed SVG assets exist for AVG and BoS and are routed via `ZOOP_THEME_ASSET_PREFIX`.
2) SVGs render correctly under both AVG and BoS themes without visual regressions.

**Completion Criteria:**
1) SVGs are verified in the UI across at least two screens for both themes.

---

## ZD-145f: Component audit + de-hardcode

**Overview:**
Audit components for hardcoded colors and replace them with theme tokens.

**Goal:**
Ensure the theme system fully controls color across UI components.

**Description:**
a) Scan for hardcoded HEX/RGB colors in `src` and replace with CSS variable tokens.
b) Prioritize dialogs, cards, input bars, headers, and buttons.
c) Update proposal CTA copy strings (`cards_drawn`, `try_for_yourself`) to match the new UI language.
d) Validate that theme switching no longer leaves legacy colors behind.

**Acceptance Criteria:**
1) No hardcoded palette colors remain in themeable UI components.
2) Theme changes update colors consistently across targeted components.

**Completion Criteria:**
1) Visual sweep completed on lobby, game, and discussion screens.

---

## ZD-146: Position participants (AI + users) around the assembly aquarium

**Overview:**
Align participant avatars (AI + users) in fixed, evenly spaced positions around the assembly aquarium so they remain consistent across screen sizes and do not drift into the aquarium focal area.

**Goal:**
Make participant avatar placement stable, legible, and visually balanced across responsive breakpoints.

**Description:**
a) Audit current participant placement and identify drift/overlap in responsive layouts.
b) Define a consistent positioning system (ring layout or anchor points) around the aquarium, similar to the old map-point system.
c) Support adaptive positioning for a variable number of participants (up to 6), with even spacing around the ring.
d) Apply consistent offsets and sizes per breakpoint to keep spacing balanced.
e) Ensure avatars do not overlap the aquarium image or round UI overlays.
f) Modules/scripts to review: `src/routes/[code]/game/+page.svelte`, `src/lib/components/participants-container.svelte` (and any avatar badge components).

**Acceptance Criteria:**
1) AI + user avatars are evenly distributed around the aquarium across common breakpoints.
2) Avatars never overlap the aquarium focal area or other critical UI (round indicator, dialogs).
3) Avatar spacing remains stable during round transitions and mode switches.

**Completion Criteria:**
1) Participant placement is visually verified on desktop and mobile in at least two rounds.

---

## ZD-146a: Cleanup legacy map/stop positioning code (preserve aquarium avatar positioning)

**Overview:**
Remove unused map and stop-point code left from the old map system, while preserving the new aquarium-based avatar positioning logic.

**Goal:**
Reduce dead code and avoid confusion without breaking participant placement around the aquarium.

**Description:**
a) Identify legacy map/stop assets and logic that are no longer used by the aquarium view.
b) Remove or archive obsolete map pan/zoom handlers and stop marker overlays.
c) Keep/replace any reusable positioning logic needed for avatar ring placement.
d) Verify map-position code is either repurposed for avatars or removed safely.
e) Modules/scripts to review: `src/lib/components/map.svelte`, `src/lib/state/map-position.svelte.ts`, `src/routes/[code]/game/+page.svelte`, old stop/map components if still present.

**Acceptance Criteria:**
1) No unused map/stop code remains in the active build.
2) Aquarium avatar positioning continues to work as expected.

**Completion Criteria:**
1) Build runs without references to removed map/stop modules.
2) Participant placement is visually verified after cleanup.

---

## ZD-147: Align step/indicative messages between rounds

**Overview:**
Place step and indicative messages in a consistent, readable location between rounds without overlapping the aquarium or avatars.

**Goal:**
Ensure round messaging appears predictably and does not obscure the assembly view.

**Description:**
a) Audit current step/indicative message placement during round transitions.
b) Define a fixed message region that avoids avatar zones and aquarium focal area.
c) Set responsive spacing and max-width rules for readability.
d) Ensure messages remain visible during transitions without obstructing critical controls.
e) Modules/scripts to review: round transition components and message overlay styles.

**Acceptance Criteria:**
1) Step/indicative messages appear in a consistent location between rounds.
2) Messages do not overlap avatars or the aquarium focal area.
3) Text remains readable on desktop and mobile.

**Completion Criteria:**
1) Message placement is visually verified on desktop and mobile for at least two rounds.

---

## ZD-148: Reposition “Full Proposal” button and match discussion input style (remove “View/Ver”)

**Overview:**
Move the “Full Proposal” button to test alternative placements across rounds, and update its styling to match the button used in the discussion input dialog. Remove the word “View/Ver” from the label.

**Goal:**
Achieve consistent styling and determine the best button placement for all rounds.

**Description:**
a) Identify the current “View full proposal” button placement across rounds.
b) Update the button styling to match the discussion input dialog button (same size, padding, font, and icon treatment).
c) Remove “View/Ver” from the label (e.g., use “Full proposal / Proposta completa” only).
d) Implement alternative placements (e.g., top-right, centered near round indicator, or near input bar) and compare usability.
e) Select the best placement based on visual balance and minimal overlap with avatars/messages.

**Acceptance Criteria:**
1) Button styling matches the discussion input dialog button.
2) Button label no longer includes “View/Ver”.
3) At least two alternative placements are tested across multiple rounds.

**Completion Criteria:**
1) Final placement is chosen and validated on desktop and mobile.

---

## ZD-175: Auto-show “Start Discussion” dialog until Round 7

**Overview:**
Change the discussion entry button label to “Start Discussion” and keep the discussion entry dialog visible by default throughout rounds 1–6 and transition phases, without requiring the user to click the button.

**Goal:**
Ensure the discussion entry dialog is always present before the discussion round begins, and avoid extra clicks.

**Description:**
a) Rename the discussion entry button label to “Start Discussion” (PT equivalent).
b) Show the discussion entry dialog automatically in rounds 1–6 and during transitions (persistent until Round 7).
c) Hide/disable the entry dialog once Round 7 starts and the discussion input bar is active.
d) Ensure the dialog does not block other critical UI (round indicator, help/exit).

**Acceptance Criteria:**
1) The button label reads “Start Discussion” (and PT translation).
2) The entry dialog is visible by default throughout rounds 1–6 and during transitions.
3) The dialog is no longer shown once Round 7 begins.
4) The dialog does not interfere with core UI elements.

**Completion Criteria:**
1) Manual verification confirms the dialog is always visible pre‑Round‑7 and hidden in Round 7.

---

## ZD-176: Epic — Real-time Avatar Bubble + Live History Updates (Round 7 Discussion)

**Overview:**
Deliver a live Round 7 discussion experience where avatar bubbles and the History dialog update instantly for user and AI messages.

**Goal:**
Make Round 7 feel real-time: no refresh, no reopen, and no visual regressions when sending or receiving messages.

**Description:**
a) Establish a single Round 7 discussion timeline as the source of truth for UI and History.
b) Implement optimistic UI updates for user sends and reconcile with realtime inserts.
c) Wire realtime subscription for inserts (game_id + round scope) to keep history live.
d) Ensure avatar bubbles (user + AI) immediately reflect the latest message.
e) Ensure History dialog updates live when open; no duplicates.
f) Enforce safe wrapping/clamping for bubbles and history items on small screens.
g) Modules/scripts to review: discussion state store, history dialog, avatar bubble components, realtime subscription wiring.

**Acceptance Criteria:**
1) User Send updates avatar chat circle immediately with the new message (no brief revert).
2) AI messages update their avatar bubbles immediately on arrival.
3) History dialog updates live when open (no reopen required).
4) No duplicate messages due to optimistic + realtime inserts.
5) Message text wraps and stays inside viewport on iPhone SE, iPhone, iPad mini, desktop.

**Completion Criteria:**
1) Manual verification on iPhone SE, iPhone, iPad mini, and desktop wide with History closed and open.

---

## ZD-176a: Round 7 timeline store + optimistic send

**Overview:**
Create a single Round 7 discussion timeline store and ensure user messages show immediately on send.

**Goal:**
Guarantee instant UI feedback for user messages without flashing previous content.

**Description:**
a) Create/confirm a single in-memory Round 7 timeline store as source of truth (the chat log for Round 7).
b) Normalize message shape (id/tempId, gameId, round, senderType, senderId, content, createdAt, status).
c) Optimistically insert user messages on Send using a `tempId` and `status: 'sending'` (avatar bubble + History update immediately).
d) Reconcile optimistic messages with DB-confirmed inserts by replacing `tempId` with real `id` and/or deduping by a stable key.
e) Ensure ordering is deterministic (createdAt primary, id secondary) and duplicates cannot appear.
f) Modules/scripts to review: timeline store, send handler, and merge/dedupe utilities.

**Acceptance Criteria:**
1) On Send, user bubble updates immediately with the new message.
2) No duplicate messages appear after realtime inserts confirm the optimistic send.

**Completion Criteria:**
1) Manual verification on mobile + desktop with two consecutive sends.

---

## ZD-176b: Realtime subscription + live History dialog

**Overview:**
Keep the History dialog live while open and in sync with realtime inserts.

**Goal:**
No reopen required to see new messages in History.

**Description:**
a) Subscribe to discussion message inserts (scoped by game_id + round) via Supabase realtime.
b) Merge new events into the timeline store using the same normalization + dedupe rules as ZD-176a.
c) Ensure History dialog reads from the timeline store (not from a one-time fetch) and re-renders live while open.
d) Add duplicate protections for the “fetch initial history + realtime inserts” overlap case.
e) Modules/scripts to review: realtime subscription wiring, timeline merge/dedupe, History dialog data source.

**Acceptance Criteria:**
1) New user/AI messages appear instantly in History when it is open.
2) Message order is correct and no duplicates appear.

**Completion Criteria:**
1) Manual verification with History dialog open during multiple AI/user messages.

---

## ZD-176c: Avatar bubbles + responsive safety

**Overview:**
Render avatar bubbles from the timeline store and ensure message wrapping on small screens.

**Goal:**
Keep bubble/snippet UI readable and within viewport on all target devices.

**Description:**
a) Avatar bubbles derive latest message per participant from the timeline store.
b) Ensure AI + user bubbles update immediately on new messages.
c) Add wrapping/clamp rules for long messages (no overflow on iPhone SE / iPad mini).
d) Modules/scripts to review: avatar bubble components and bubble layout styles.

**Acceptance Criteria:**
1) User/AI avatar bubbles update immediately when new messages arrive.
2) Long messages wrap and remain within viewport bounds on small screens.

**Completion Criteria:**
1) Visual verification on iPhone SE, iPhone, iPad mini, and desktop.

---

## ZD-176d: Chat Circles geometry + bounded hover expansion (matches sketch)

**Overview:**
Make the “chat circles” behave like the expected sketch: the expanded circle replaces the minimized circle at the same anchor position, grows to a large diameter (up to near the aquarium center space), fills the circle with readable text, and never escapes the aquarium+avatars bounds.

**Goal:**
Deliver a robust, predictable hover expansion for AI + user chat circles that:
- stays inside `.avatar-boundary` (the aquarium+avatars container box),
- prefers expanding inward (towards the aquarium center),
- uses circle geometry (not a fixed-width rectangle),
- and makes the text occupy the circle surface (minimal empty space), with scroll only when necessary.

**Implementation Notes / Guardrails:**
- Bounds source of truth is `.avatar-boundary` in `src/routes/[code]/game/+page.svelte` (same debug boundary used for avatar placement).
- Do **not** break the existing avatar margin rules: circles must stay inside `.avatar-boundary` at all times.
- Expanded hover should show the **full text** (scroll allowed).
- Max diameter should be “almost the aquarium diameter”: compute it from the aquarium/table rect rather than hardcoding.

**Step-by-step Plan (follow in order):**
1) **Capture bounds + aquarium center in the page**
   - File: `src/routes/[code]/game/+page.svelte`
   - Ensure we can read:
     - `boundsRect = avatarBoundary.getBoundingClientRect()` (already computed for layout debug / safe-area).
     - `aquariumCenter = center of aquarium/table rect` (prefer `aquariumLayout.tableLeft/top/width/height` which is object-contain accurate).
   - Add/confirm these values are passed down to `ParticipantsContainer` as props:
     - `chatBoundsRect` (left/top/right/bottom in viewport coords)
     - `aquariumCenter` (cx/cy)

2) **Plumb bounds/center into each badge component**
   - File: `src/lib/components/participants-container.svelte`
   - Pass `chatBoundsRect` + `aquariumCenter` to:
     - `src/lib/components/ai-agent.svelte`
     - `src/lib/components/player-badge.svelte`

3) **Create a single reusable “HoverCircle” implementation**
   - New file (recommended): `src/lib/components/chat-circle-hover.svelte`
   - Props (minimum):
     - `text`, `isTyping`, `colorVariant` (AI vs user),
     - `anchorEl` (the minimized circle button ref),
     - `boundsRect` (left/top/right/bottom),
     - `aquariumCenter` (cx/cy),
     - `maxDiameterPx` (computed outside or computed inside from aquarium/table).
   - This avoids AI/user drift and makes future rules easier.

4) **Compute dynamic diameter (circle geometry)**
   - Rule:
     - `diameter = clamp(f(textLength), minDiameter, maxDiameter)`
   - Requirements:
     - Short message => small circle.
     - Long message => bigger circle (up to max).
     - `maxDiameter` should be derived from aquarium/table (see step 6), not fixed.

5) **Anchor expansion to the minimized circle (replace position)**
   - Compute `anchorCenter` from `anchorEl.getBoundingClientRect()`.
   - Default expanded center = anchorCenter (so it “replaces” the minimized circle).

6) **Clamp to `.avatar-boundary` and prefer “inward” expansion**
   - Hard constraint:
     - Expanded circle must fit entirely inside `boundsRect`.
     - `cx = clamp(cx, bounds.left + r, bounds.right - r)`
     - `cy = clamp(cy, bounds.top + r, bounds.bottom - r)`
   - Inward preference:
     - If the circle would overflow, shift the center along the vector **towards** `aquariumCenter` before doing the final clamp.
     - This creates the “expands into the aquarium” feeling on narrow screens.

7) **Text filling rules (min empty space, no ugly breaks)**
   - Inside the circle:
     - Use dynamic padding based on diameter (smaller padding for longer texts).
     - Use dynamic font-size based on diameter + text length.
   - Typography:
     - `text-align: justify; text-justify: inter-word; text-align-last: center;`
     - `hyphens: auto;` (ensure `lang="pt"` / `lang="en"` is set on the text container so hyphenation works better).
     - Avoid breaking words unless necessary:
       - `word-break: normal; overflow-wrap: break-word;`
   - Overflow:
     - If text still does not fit at max diameter, allow `overflow: auto` inside the circle.

8) **Z-index + stacking context**
   - File: `src/lib/components/participants-container.svelte`
   - Keep the “hover brings participant-slot to front” rule so expanded circle overlays other avatars.

9) **Manual test matrix (required)**
   - Devices:
     - iPhone SE, iPhone, iPad mini, iPad 11, desktop.
   - Scenarios:
     - Very short message (1–2 words) => small circle.
     - Medium message => medium circle.
     - Long message => large circle centered in available aquarium space; scroll only if necessary.
     - Confirm expanded circle never leaves `.avatar-boundary`.

**Acceptance Criteria:**
1) Hover expansion replaces the minimized circle at the same anchor position (no sideways tooltip effect).
2) Expanded bubble is always circular (width == height) and size scales with message length.
3) Expanded bubble stays fully inside `.avatar-boundary` and prefers moving inward (towards aquarium center) when constrained.
4) Text occupies the circle area with minimal empty space; no “thin column” layout; scroll only when unavoidable.

**Completion Criteria:**
1) Visual verification passes on iPhone SE, iPhone, iPad mini, iPad 11, desktop (portrait + landscape where relevant).

---

## ZD-176e (Optional): Chat Circles advanced layout rules (portrait-inward + multi-message stacks)

**Overview:**
Extend the Round 7 “chat circles” UI with smarter placement and multi-message handling inspired by Chat Circles, without implementing full clustering.

**Goal:**
Improve readability and reduce collisions on constrained layouts (portrait/mobile) and in larger groups, while preserving the existing hard bounds (no circles outside the avatar boundary).

**Description:**
a) Portrait rule: when the viewport is portrait (or otherwise narrow), force chat circles to render **towards the inside of the aquarium** (invert side automatically) so they don’t run off-screen.\n
b) Multi-message rule: when a participant has multiple recent messages, render a **stack of 2–3 circles** (most recent on top) with decreasing opacity/scale; if more, show a `+N` indicator.\n
c) Collision safety: add simple collision/overlap avoidance (or fallback) so stacks don’t overlap key UI or each other on small screens.\n
d) Clamp: enforce that circles/snippets never escape the existing `.avatar-boundary` limits.\n
e) Optional: decide whether “inside” means toward the aquarium center (radial) vs. toward screen center; validate on iPhone SE + iPad mini portrait.

**Acceptance Criteria:**
1) In portrait, chat circles consistently render inward (towards aquarium center) for all participants.\n
2) With multiple messages per participant, stacks render up to 3 circles and `+N` appears when overflow.\n
3) Circles never overflow the screen or escape `.avatar-boundary`.\n
4) No major overlaps with round title/status pill/input bar on iPhone SE and iPad mini.

**Completion Criteria:**
1) Manual verification on iPhone SE, iPhone, iPad mini (portrait + landscape), and desktop.\n
2) Verified with 6 participants (1 user + 5 AIs) and multiple messages each.
