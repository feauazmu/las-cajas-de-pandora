# Spec: Las Cajas de Pandora — MVP

Status: ready-for-agent

A comedic, Cookie-Clicker-style browser idle game. **Pandora**, a West Highland White Terrier, is the pompous boss of **Las Cajas de Pandora**, a vegan dog-food company. The player clicks Pandora to produce **Croquetas**, buys **Producers** and **Upgrades**, and buys **Expansions** that move the company through three **Stages**.

Read `CONTEXT.md` first: all domain terms below are used exactly as defined there. Per `AGENTS.md`, code, identifiers, comments and docs are in English; every player-facing string is in Spanish.

## 1. Scope

### In scope (MVP)

- Clicking Pandora, Croquetas counter, croquetas-per-second (CPS).
- 3 Stages, 12 Producers (4 per Stage), ~28 Upgrades, 2 Expansions.
- Inversionista random bonus event.
- News Ticker, flavor text, Pandora Quotes, Memos.
- Autosave, offline earnings with a "while you were away" popup, reset, mute toggles.
- Code-synthesized SFX; one generated music loop per Stage.
- Generated image assets committed to the repo, with a prompt manifest.

### Out of scope

- Achievements, prestige/reset-for-bonus, save export/import.
- Mobile/touch layout (desktop only; it must not break on a narrow window, but it is not designed for one).
- i18n / language toggle (strings are centralized so it can be added later).
- Voiced lines.
- Deployment (runs locally via `npm run dev` / `npm run build && npm run preview`).
- An end-of-game screen: after Stage 3 the game is endless.

### Extensibility requirement

More Stages will be added after the MVP. Stages, Producers, Upgrades, Expansions and content must be **data definitions**, not code branches. Adding Stage 4 should only mean adding data entries, strings and assets, with no logic changes.

## 2. Tech stack

- **Vite + TypeScript** (strict), **plain DOM + CSS**, no UI framework, no game engine.
- **Vitest** for unit tests of the pure game logic.
- No runtime network calls. All assets are static files.
- Scripts: `dev`, `build`, `preview`, `test`, `typecheck`, `balance` (see §9).

### Suggested layout

```
src/
  game/          # pure, DOM-free, deterministic (injected clock + RNG)
    defs.ts      # Stage / Producer / Upgrade / Expansion definitions + balance constants
    state.ts     # GameState type, initial state
    engine.ts    # click, buy*, tick, offline, inversionista, derived values (cps, costs)
    save.ts      # serialize / deserialize / migrate (versioned)
  content/
    es.ts        # ALL player-facing Spanish strings (names, flavor, ticker, quotes, memos, UI)
  format/
    number.ts    # es-CO long-scale formatter
  ui/            # DOM rendering, input, effects, popups
  audio/
    sfx.ts       # Web Audio synthesized effects
    music.ts     # per-Stage loop player with crossfade
  main.ts
public/assets/
  img/ ...  music/ ...
assets-manifest.json   # prompts + model + params for every generated asset
scripts/balance.ts     # headless pacing simulation
```

The engine is a deep module. The UI only calls its small interface (`click`, `buyProducer`, `buyUpgrade`, `buyExpansion`, `clickInversionista`, `tick(now)`, selectors) and never changes state directly. All randomness and time go through injected `rng()` and `now()`, so tests are deterministic.

## 3. Game state

```ts
interface GameState {
  version: number;              // save schema version, starts at 1
  croquetas: number;            // current bank
  totalCroquetas: number;       // lifetime produced (stats; unlock conditions)
  totalClicks: number;
  stage: number;                // 1..3 (index into stage defs)
  producers: Record<ProducerId, number>;   // owned counts
  upgrades: UpgradeId[];        // purchased
  frenzyUntil: number | null;   // epoch ms; Ronda de Financiación active until
  nextInversionistaAt: number;  // epoch ms
  lastSavedAt: number;          // epoch ms, for offline earnings
  settings: { musicMuted: boolean; sfxMuted: boolean };
}
```

Numbers are plain JS `number` (doubles). The MVP never gets near 1e308.

## 4. Economy

### Clicking

- Base click value: **1 croqueta**.
- Click value = `(1 × clickMultiplier) + (cps × clickCpsFraction)`, where `clickMultiplier` and `clickCpsFraction` come from click Upgrades. The frenzy multiplier applies to the click value as well.

### Producers

- Cost of the next unit: `ceil(baseCost × 1.15^owned)`.
- Producer CPS = `baseCps × owned × (product of its purchased Upgrade multipliers)`.
- Total CPS = sum of Producer CPS × (7 while a frenzy is active).
- A Stage's Producers are visible and purchasable only once `state.stage >= producer.stage`. Earlier Producers keep producing forever.
- Buying one at a time only (no ×10/×100 bulk buy in the MVP).

### Starting balance values

These are **starting values** that must be tuned with the balance script (§9).

| # | Stage | Producer (es) | id | baseCost | baseCps |
|---|---|---|---|---|---|
| 1 | Cocina | Cachorro Becario | `intern_puppy` | 15 | 0.2 |
| 2 | Cocina | Abuela Vecina | `neighbor_grandma` | 100 | 1 |
| 3 | Cocina | Licuadora Industrial | `industrial_blender` | 600 | 5 |
| 4 | Cocina | Food Truck | `food_truck` | 4 000 | 25 |
| 5 | Fábrica | Línea de Ensamblaje | `assembly_line` | 30 000 | 120 |
| 6 | Fábrica | Gatos Contadores | `accountant_cats` | 200 000 | 600 |
| 7 | Fábrica | Camión Repartidor | `delivery_truck` | 1 500 000 | 3 000 |
| 8 | Fábrica | Laboratorio de Tofu | `tofu_lab` | 10 000 000 | 15 000 |
| 9 | Multinacional | Influencer Canino | `dog_influencer` | 100 000 000 | 80 000 |
| 10 | Multinacional | Lobby en el Congreso | `congress_lobby` | 800 000 000 | 450 000 |
| 11 | Multinacional | Satélite Publicitario | `ad_satellite` | 6 000 000 000 | 2 500 000 |
| 12 | Multinacional | Colonia en Marte | `mars_colony` | 50 000 000 000 | 14 000 000 |

### Expansions

| From → To | Name (es, suggested) | id | Cost |
|---|---|---|---|
| Cocina → Fábrica | "Comprar la Fábrica" | `buy_factory` | 50 000 |
| Fábrica → Multinacional | "Salir a Bolsa" | `go_public` | 150 000 000 |

- Costs croquetas only. No other requirement.
- Always visible at the top of the Store, showing its cost and a progress bar (`croquetas / cost`, capped at 100%). The button is enabled when affordable.
- Buying one deducts the cost, increments `stage`, and then: shows that Stage's **Memo** in a modal, swaps Pandora's image and the background, crossfades the music, and plays a fanfare SFX. It also reveals the new Producers and switches the Ticker to the new Stage's headlines.
- In Stage 3 (the last Stage) the Expansion slot is hidden. The game continues endlessly.

### Upgrades

- One-time purchases. Once unlocked, they show as a row of icons at the top of the Store (above the Producers). Hovering shows a tooltip with the name, effect, cost and flavor text.
- **Producer upgrades**: 2 per Producer (24 total). Each is ×2 to that Producer's output.
  - Tier 1: unlocks at 1 owned; cost = `baseCost × 10`.
  - Tier 2: unlocks at 10 owned; cost = `baseCost × 100`.
- **Click upgrades** (4):
  | id | Effect | Unlock | Cost |
  |---|---|---|---|
  | `click_1` | click ×2 | 50 total clicks | 100 |
  | `click_2` | click ×2 | 500 total clicks | 5 000 |
  | `click_3` | click ×2 | Stage ≥ 2 | 500 000 |
  | `click_4` | +1% of CPS per click | Stage ≥ 2 and 1 000 total clicks | 20 000 000 |
- Once unlocked, an Upgrade stays visible until bought, even if the unlock condition later becomes false.

### Inversionista (bonus event)

- Spawns at a random time 2–5 minutes after the previous one was clicked or left (uniform, via `rng`). The first one appears 2–5 minutes after the game starts.
- It walks across the scene area and is clickable for **12 s**, then leaves.
- On click, choose at random 50/50:
  - **Ronda de Financiación**: production ×7 for 30 s (`frenzyUntil = now + 30 000`). Another frenzy while one is active resets the timer; it does not stack.
  - **Cheque Gordo**: instantly gain `min(croquetas × 0.15, cps × 900) + 13`.
- Show a toast with the outcome, push a matching headline to the front of the Ticker, and play a distinct SFX.
- It does not spawn while the tab is hidden, and offline time never produces one.
- While a frenzy is active, show a visible indicator with the remaining seconds.

### Game loop

- Render with `requestAnimationFrame`. The engine's `tick(now)` adds croquetas using the real elapsed time since the last tick (`cps × dt`). Clamp `dt` to ≤ 1 s per tick while visible. Longer gaps (tab hidden, then shown again) go through the offline path instead.
- The counter updates every frame. The Store's affordability state updates at least 4×/s.

### Offline earnings

- On load, and when the tab becomes visible again after being hidden ≥ 60 s: `elapsed = min(now − lastSavedAt, 8 h)`, and `gain = baseCps × elapsed`. The frenzy never applies offline.
- If `gain > 0`, show a "Mientras no estabas…" popup with the elapsed time and croquetas gained, plus a short Pandora line.
- Offline efficiency is **100%**. This is a tunable constant (`OFFLINE_EFFICIENCY = 1`, `OFFLINE_CAP_MS = 8h`).

## 5. Persistence

- Save key: `lcdp.save.v1` in `localStorage`. JSON of `GameState`.
- Autosave every 10 s, on `visibilitychange` → hidden, and on `pagehide`.
- `save.ts` exposes `serialize`, `deserialize` and `migrate(fromVersion)`. An unknown or corrupt save falls back to a new game without crashing (log a warning).
- Settings (mute flags) live inside the save.
- **Reset** ("Borrar partida") shows a confirmation dialog, then clears the save and reloads to a fresh state. The Stage 1 intro Memo shows again.

## 6. Screen & UX

Desktop, two columns (minimum supported width 1024 px):

```
┌──────────────────────────────────────────────┬────────────────────────┐
│ [News Ticker — scrolling headlines]          │  TIENDA                │
│                                              │  ┌──────────────────┐  │
│   Stage background (full column)             │  │ Expansión  ▓▓▓░░ │  │
│                                              │  └──────────────────┘  │
│        123.456 croquetas                     │  [upg][upg][upg]...    │
│        por segundo: 1.234,5                  │  ─────────────────     │
│                                              │  [icon] Cachorro  x12  │
│            ( Pandora — clickable )  💬       │         cost / cps     │
│                                              │  [icon] Abuela    x3   │
│   [Inversionista walks across here]          │  ...                   │
│                                              │                        │
│ [🎵 mute] [🔊 mute] [Borrar partida]          │                        │
└──────────────────────────────────────────────┴────────────────────────┘
```

- **Pandora click feedback** (all four): CSS squash/bounce, a floating "+N" at the cursor that drifts up and fades, a croqueta-icon particle burst, and a synthesized click SFX.
- **Quotes**: a speech bubble next to Pandora. It triggers at most once every 15 s, with a 10% chance per click, and always on the first click of a session and after an Expansion. Lines come from the current Stage's pool. The bubble auto-hides after 4 s.
- **Store rows**: icon, name, owned count, next cost, and CPS contribution. Rows you can't afford are dimmed. The tooltip shows the flavor text. Each Stage's rows are grouped under that Stage's name.
- **Upgrade icons** reuse the Producer's icon (or the croqueta icon for click upgrades) inside a CSS frame with a "×2" badge. The tier-2 frame looks distinct (e.g. gold).
- **News Ticker**: a continuously scrolling marquee that cycles through the current Stage's headlines in random order without repeating until all have shown. Inversionista outcome headlines are pushed to the front.
- **Memos**: a modal styled as a corporate memo ("MEMORANDO — De: Pandora, Presidenta…") with a single dismiss button.
- **Stage 1 intro Memo** on a new game.
- All numbers go through the formatter (§7).
- Stage visual change: the background and Pandora image crossfade (~600 ms).

## 7. Number formatting (es-CO, long scale)

`formatCroquetas(n)`:

- `n < 1 000 000`: an integer with es-CO grouping → `123.456`. CPS values below 1 000 show one decimal (`1,5`).
- `n ≥ 1 000 000`: 3 significant digits in es-CO decimal style plus a long-scale word:
  - 10^6 millón / millones
  - 10^9 mil millones
  - 10^12 billón / billones
  - 10^15 mil billones
  - 10^18 trillón / trillones
  - 10^21 mil trillones
  - 10^24 cuatrillón / cuatrillones (extend the same pattern if ever needed)
- Use the singular only when the displayed number is exactly 1 (`1 millón`, `1,5 millones`, `2 mil millones`).
- Use `Intl.NumberFormat('es-CO')` for digits and separators (verified: `1.234.567,891`, `1,5`).
- Unit-test the boundaries (999.999 → 1 millón, 999,5 millones rounding, singular vs plural).

## 8. Content (Spanish)

All strings live in `src/content/es.ts`, keyed by the ids above. The implementing agent **writes all of it**, and it ships without human review. Voice: **neutral Latin American Spanish**. Pandora (she, "la jefa") speaks with pompous corporate grandeur about a vegan dog-food empire. The comedy is the gap between that grandeur and the fact that she is a small white dog. Keep it PG and punch at corporate culture, not at real people or groups.

Minimum counts:

| Content | Count |
|---|---|
| Producer name + flavor line | 12 |
| Upgrade name + flavor line | 28 |
| Expansion name + flavor line | 2 |
| Ticker headlines per Stage | 10 (30 total) |
| Inversionista outcome headlines | 2 per outcome (4) |
| Pandora Quotes per Stage | 5 (15 total) |
| Memos | 3 (Stage 1 intro + one per Expansion) |
| Offline popup Pandora lines | 3 |
| UI strings | all (buttons, labels, tooltips, confirm dialog, toasts) |

## 9. Balance & pacing

- **Target**: an active player (≈ 5 clicks/s while clicking, buying greedily) reaches **La Fábrica at ~15–20 min** and **La Multinacional at ~50–65 min**.
- `scripts/balance.ts` (run via `npm run balance`) runs the real engine headlessly with a simulated greedy player. The player buys whatever has the best `cost / ΔCPS` among affordable items, and buys an Expansion as soon as it's affordable. It prints the time to each Expansion and to the first unit of each Producer. Inversionista is disabled in the simulation, or averaged with a seeded RNG.
- Tune `baseCost`, `baseCps` and the Expansion costs in `defs.ts` until the targets are met. Record the final simulated times in a comment at the top of `defs.ts`.

## 10. Audio

### SFX (Web Audio API, synthesized at runtime, no files)

| Event | Sound |
|---|---|
| Click Pandora | short soft "pop" (pitch jitter ±10%) |
| Buy Producer/Upgrade | bright two-note "cha-ching" |
| Can't afford (click on a disabled item) | muted low blip |
| Quote bubble | small bark-like blip (quick pitch-down chirp) |
| Inversionista appears | subtle rising shimmer |
| Inversionista clicked | coin cascade (lump) or rising arpeggio (frenzy) |
| Expansion | short fanfare (3–4 notes, major) |

- The `AudioContext` is created or resumed on the first user gesture (browser autoplay policy).
- There's a master SFX gain, and the SFX mute toggle sets it to 0.

### Music

- One instrumental loop per Stage, 60–90 s, looping seamlessly, at low volume (it sits under the SFX).
  1. **Cocina**: light acoustic, playful, a hint of cumbia; homey.
  2. **Fábrica**: upbeat industrial funk, mechanical rhythm.
  3. **Multinacional**: pompous orchestral "corporate epic".
- Crossfade (~1.5 s) on Expansion. It starts on the first user gesture. The music mute toggle is remembered.
- Files: `public/assets/music/stage-{1,2,3}.mp3` (or `.ogg`, whichever the model returns). Keep each file ≤ ~2 MB.

## 11. Asset generation (dev time)

Assets are generated with the **creation-tool MCP** by the implementing agent and **committed** to `public/assets/`. No generation happens at runtime.

### Manifest

`assets-manifest.json` records, for every asset: `path`, `model`, `params` (aspect ratio, background, quality, seed if any), `prompt` (the full final prompt), `stylePrefix` (the shared one), `references` (input images used), and `costUsd`. Anyone can regenerate or extend the set, including future Stages, and stay consistent.

### Style prefix (shared by all images)

> Cute flat vector cartoon illustration, bold clean outlines, soft pastel palette with warm accents, simple shading, children's-book comedy tone, no text.

### Pandora consistency

1. Generate a **master reference** first: Pandora, a West Highland White Terrier (white fluffy coat, upright pointed ears, dark eyes, black nose), full body, neutral pose, transparent background. Save it as `public/assets/img/pandora-ref.png` (not shown in game).
2. Generate every Pandora image with the master as an `input_reference`, using a model that supports both **transparent background** and **reference images** (e.g. `openai/gpt-image-1`, `openai/gpt-5-image`, `openai/gpt-image-2.5-*`, all verified in the catalog).

### Image list (≈ 21)

| Asset | Path | Notes |
|---|---|---|
| Pandora master reference | `img/pandora-ref.png` | transparent, 1:1 |
| Pandora — Cocina | `img/pandora-1.png` | apron, wooden spoon, pot of lentils; transparent, ~2:3 |
| Pandora — Fábrica | `img/pandora-2.png` | business suit + hard hat, pointing at a chart; transparent |
| Pandora — Multinacional | `img/pandora-3.png` | tycoon, monocle, on a throne of kibble boxes; transparent |
| Background ×3 | `img/bg-{1,2,3}.png` | home kitchen / vegan kibble factory / skyscraper HQ penthouse; opaque, 3:4 or 2:3 to fill the left column; low detail in the center where Pandora stands |
| Producer icons ×12 | `img/producer-<id>.png` | transparent, 1:1, readable at 48 px |
| Croqueta icon | `img/croqueta.png` | a single cute kibble piece with a small leaf (vegan); transparent, 1:1; used for the counter, particles and click upgrades |
| Inversionista | `img/inversionista.png` | a cat in a suit with a briefcase and money bag, side view walking; transparent |

Export and compress to reasonable web sizes (e.g. icons ≤ 256 px, Pandora ≤ 768 px tall, backgrounds ≤ 1600 px on the long side, WebP or optimized PNG).

### Music

Use the music modality (the catalog lists `google/lyria-3-pro-preview` and `google/lyria-3-clip-preview`) with the per-Stage descriptions in §10. Record the prompts in the manifest.

## 12. Testing & acceptance

### Unit tests (Vitest, `src/game` + `src/format`)

- Producer cost progression (`1.15^n`, ceil).
- CPS with multiple Upgrades and a frenzy.
- Click value with each click Upgrade, including the %-of-CPS one.
- Upgrade unlock conditions, and that unlocked Upgrades stay visible.
- Expansion: can't buy when unaffordable; buying advances the Stage and deducts the cost; no Expansion past the last Stage.
- A Stage's Producers can't be bought before that Stage.
- Inversionista: spawn window, 12 s expiry, both outcomes (seeded RNG), lump formula, frenzy timer reset without stacking.
- Offline gain: cap at 8 h, excludes frenzy, zero when elapsed < 0 (clock skew).
- Save round-trip; corrupt save → new game; migrate from version 1 is the identity.
- Number formatter boundaries (§7).

### Acceptance checklist

- [ ] `npm run dev` runs the game; `npm run build` produces a static bundle that works from `npm run preview`.
- [ ] `npm test` and `npm run typecheck` pass.
- [ ] `npm run balance` reports Stage 2 at ~15–20 min and Stage 3 at ~50–65 min.
- [ ] All three Stages are playable end to end: each has its own Pandora image, background, music loop, Producers, Ticker headlines and Quotes.
- [ ] Reloading keeps progress; closing for a while shows the offline popup with a correct capped gain.
- [ ] Inversionista appears, is clickable, and both outcomes work and are announced.
- [ ] Mute toggles persist; there is no audio before the first user gesture and no console errors about autoplay.
- [ ] No English text is visible to the player; no Spanish identifiers in code.
- [ ] `assets-manifest.json` lists every generated asset with its prompt and model.
- [ ] Adding a hypothetical Stage 4 requires only data, strings and assets (demonstrate by reading `defs.ts`, not by adding one).
