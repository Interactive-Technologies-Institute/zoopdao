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
