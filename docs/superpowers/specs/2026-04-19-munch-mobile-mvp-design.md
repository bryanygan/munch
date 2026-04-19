# Munch Mobile — MVP Design Spec

**Date:** 2026-04-19
**Status:** Approved pending implementation-plan
**Author:** Bryan Gan (brainstorm with Claude)

## 1. Purpose and scope

Munch is a Tinder-style dish discovery app. The user swipes on dishes they would or wouldn't want to eat; a recommendation engine builds a taste vector from their swipes and reveals a Top-3 dish match after enough signal has been gathered.

This spec covers the **mobile MVP** — iOS-first, Android-compatible via React Native + Expo. It is a complete rewrite of the existing web prototype (HTML/CSS/JS in the separate `munchmatch-prototype` repo, under `munchmatch-v3/`), not a port. That repo is referenced as source material only and is not modified by this build.

### In scope

- Curated dish database (~300 dishes) bundled with the app
- Onboarding (allergens, dietary restrictions, price range)
- Swipe-based discovery screen with live match-confidence indicator
- Pluggable recommendation engine (flavor similarity + categorical affinity + popularity tie-break)
- Top-3 match reveal after 10 likes (hard cap at 40 total swipes)
- Matches gallery (liked dishes history)
- Basic profile (swipe stats — no radar chart in MVP)
- Settings / filters (re-open preferences, reset session, reset all data)
- Local-only persistence via AsyncStorage, designed for future cloud sync

### Explicit non-goals

To prevent scope creep during implementation:

- No auth / user accounts (local-only)
- No cloud sync
- No Google Places / restaurant integration
- No "Order Now" functionality — button renders as a disabled "Coming Soon" teaser
- No social features, friend matching, or group recommendations
- No context-aware recommendation signals enabled (location, time-of-day) — the engine's plug-in points exist; no scorer implementations ship
- No radar chart / "Top Taste Attributes" on Profile — data is captured, visualization is v1.1
- No masonry gallery or search on Matches — simple 2-column grid only
- No dark-mode toggle (system theme only; design tokens support both)
- No push notifications, in-app messaging, or analytics
- No E2E tests or crash reporting

### Forward-compatibility principle

Every data model and architectural choice is evaluated against the Phase-2+ feature list (restaurants, user accounts, social, context-aware, delivery). Where a small investment now avoids a future rewrite, we make it (examples: pluggable scorer interface, repository pattern for persistence, schema-versioned storage). Where the investment is large and the future may never arrive, we punt (example: multi-device sync).

## 2. Technology stack

- **Expo (SDK 52+)** managed workflow — iOS/Android parity, OTA updates, minimal native-tooling friction during development
- **React Native 0.76+** with the **New Architecture** (Fabric + TurboModules) for smooth swipe animations
- **TypeScript** strict mode throughout
- **React Navigation v7** — native stack navigator (iOS-native push/pop feel), bottom tabs for main navigation
- **Zustand** for state management — one store per domain (`usePreferencesStore`, `useSessionStore`, `useLikedHistoryStore`)
- **React Native Reanimated 3 + Gesture Handler** — 60fps gesture-driven swipe animations on the UI thread
- **expo-haptics** — tactile feedback on swipe commit and match reveal
- **@react-native-async-storage/async-storage** — local persistence, accessed via a repository wrapper so SQLite or cloud sync can be substituted later without UI changes
- **Jest + React Native Testing Library + fast-check** — unit, integration, and property-based testing

## 3. Folder structure

Feature-sliced, not type-sliced. Each feature owns its own screens, components, and hooks. A shared `domain/` layer holds types, state, and pure logic that are consumed across features.

```
src/
  app/                      # Expo Router entry, navigators, theme provider
  features/
    onboarding/             # Welcome, AllergenPicker, DietPicker, PriceRangePicker
    discover/               # SwipeScreen, SwipeCard, MatchPotentialBar, DetailsSheet
    match/                  # MatchRevealScreen (Top-3)
    matches/                # LikedGalleryScreen (2-col grid)
    profile/                # ProfileScreen (basic stats, no radar in MVP)
    settings/               # SettingsScreen (re-open prefs, reset data)
  domain/
    dish/                   # Dish type, dish repository (loads JSON)
    preferences/            # Preferences type, store, AsyncStorage adapter
    session/                # SwipeSession type (taste vector, like count, history)
    recommendation/         # Scorer interface, scorers/, engine.ts
  shared/
    components/             # Button, Card, GlassPanel, Chip, Toggle, ProgressBar
    theme/                  # Colors, typography, spacing (tokens from mockups)
    hooks/                  # useHaptic, usePlatform, etc.
    utils/                  # Cosine similarity, vector math, blurhash decoder
  data/
    foods.json              # Curated ~300 dishes
    cuisineRegions.ts       # Region → countries mapping
```

**Rationale:** opening `features/discover/` shows you everything about the swipe experience. A feature that gets cut can be deleted in one motion. `domain/` prevents business logic from leaking into UI.

## 4. Design system

Locked in from user-provided mockups:

| Token | Value |
|---|---|
| Typography | **Plus Jakarta Sans** (weights 400, 500, 600, 700, 800) |
| Primary color | `#f27f0d` (warm orange) |
| Background (light) | `#f8f7f5` (warm off-white) |
| Background (dark) | `#221910` (dark warm brown) |
| Icons | **Material Symbols Outlined** (FILL variable for active-tab state) |
| Border radii | `xl` 0.75rem, `2xl` 1rem, `3xl` 1.5rem, `full` pill |
| Shadows | Soft, often tinted with primary color |
| Signature element | **Glass panels** — `backdrop-filter: blur(12px)` — used for card-bottom info overlays and tag pills |

Visual character: dramatic full-bleed dish imagery with dark gradient-overlaid glass-panel info at the bottom, inherited from the "Food Cinema" direction, executed with the modern typography and warm orange accent from the user's supplied mockups.

## 5. Data model

### 5.1 Static dish data (bundled as `src/data/foods.json`)

```ts
type Dish = {
  id: string;                          // "mango_sticky_rice"
  name: string;
  description: string;

  country: CountryCode;                // "TH"
  cuisine_region: CuisineRegion;       // "southeast_asian"

  flavor: {
    sweet: number;    // 0-5 continuous
    sour: number;
    salty: number;
    bitter: number;
    umami: number;
    heat: number;     // replaces boolean "spice" from v1 — 0-5 continuous
    richness: number; // new — creamy/buttery/fatty dimension
  };

  textures: Texture[];        // 1-2 of: crunchy | crispy | creamy | chewy | soft | juicy | flaky
  meal_types: MealType[];     // breakfast | lunch | dinner | snack | dessert
  temperature: 'hot' | 'cold' | 'room';
  typical_time: 'morning' | 'afternoon' | 'evening' | 'late_night' | 'any';

  contains: {
    gluten: boolean; dairy: boolean; seafood: boolean;
    nuts: boolean;   eggs: boolean;  pork: boolean;
    beef: boolean;   alcohol: boolean;
  };
  diet_compatible: Diet[];    // vegan | vegetarian | pescatarian | halal | kosher

  price_tier: 1 | 2 | 3 | 4;
  prep_complexity: 'low' | 'medium' | 'high';
  popularity: 1 | 2 | 3 | 4 | 5;

  image_url: string;          // CDN-hosted
  image_blurhash: string;     // 20-30 byte placeholder while CDN image loads

  tags: string[];             // Free-form, enables future search
};
```

**Cuisine regions (~12):** `east_asian`, `southeast_asian`, `south_asian`, `middle_eastern`, `african`, `mediterranean`, `western_european`, `eastern_european`, `nordic`, `north_american`, `latin_american`, `oceanic`. Country → region mapping lives in `data/cuisineRegions.ts`.

**Nutrition data is deliberately omitted** — sourcing it accurately is costly, and dish-discovery use cases don't need it.

### 5.2 User data (AsyncStorage-persisted)

Three separate stored shapes, each with a `schemaVersion` field for forward-compatible migrations:

```ts
// Key: munch:preferences
type Preferences = {
  allergens: AllergenKey[];
  diet: Diet | null;
  priceRange: [1 | 2 | 3 | 4, 1 | 2 | 3 | 4];
  onboardingCompleted: boolean;
  schemaVersion: 1;
};

// Key: munch:session (current in-progress swipe session)
type SwipeSession = {
  id: string;                          // uuid, new per session
  startedAt: number;
  likes: LikeEvent[];                  // { dishId, timestamp }
  dislikes: LikeEvent[];
  seenDishIds: string[];               // prevents mid-session re-show
  tasteVector: FlavorVector;           // running sum, normalized on read
  categoricalCounts: {
    cuisine_region: Record<CuisineRegion, { liked: number; seen: number }>;
    meal_types: Record<MealType, { liked: number; seen: number }>;
    textures: Record<Texture, { liked: number; seen: number }>;
  };
  status: 'active' | 'completed';
  completedMatch?: MatchResult;        // Top-3 when status === 'completed'
  likesTargetForNextMatch: number;     // Starts at 10; +10 per "Keep Swiping" cycle
  swipeCapForNextMatch: number;        // Starts at 40; +30 per "Keep Swiping" cycle
  matchRevealsShown: number;           // Count of times MatchRevealScreen has fired in this session
  schemaVersion: 1;
};

// Key: munch:likedHistory (persistent across sessions)
// Source of truth for Matches gallery; data foundation for v1.1 radar chart
type LikedHistory = {
  events: Array<{ dishId: string; sessionId: string; likedAt: number }>;
  schemaVersion: 1;
};
```

**Why `session.likes` and `likedHistory` are separate:**

- `session.likes` drives *the current recommendation* — it's ephemeral to one swipe session
- `likedHistory` is the append-only record of every dish ever liked, drives the Matches gallery and the future lifetime-taste radar chart in v1.1

This split means the radar-chart upgrade is a visualization problem, not a data-migration problem.

## 6. Recommendation engine

Three layers: pure vector math → pluggable scorers → orchestrating engine.

### 6.1 Vector math (`shared/utils/vector.ts`)

Pure, stateless, 100% unit-testable. No food-domain knowledge.

```ts
const FLAVOR_KEYS = ['sweet','sour','salty','bitter','umami','heat','richness'] as const;
type FlavorVector = number[]; // length 7, fixed order

cosineSimilarity(a: FlavorVector, b: FlavorVector): number;  // normalized to [0,1] for scoring
addVectors(a: FlavorVector, b: FlavorVector): FlavorVector;
scaleVector(v: FlavorVector, s: number): FlavorVector;
normalize(v: FlavorVector): FlavorVector;
dishToVector(dish: Dish): FlavorVector;
```

### 6.2 Scorer interface (`domain/recommendation/scorer.ts`)

```ts
interface Scorer {
  readonly id: string;
  readonly weight: number;
  score(ctx: ScoringContext): number; // Must return [0, 1]
}

type ScoringContext = {
  user: {
    tasteVector: FlavorVector;
    categoricalCounts: SwipeSession['categoricalCounts'];
  };
  dish: Dish;
  session: SwipeSession;        // For future scorers (novelty, etc.)
  now: Date;                    // For future TimeOfDayScorer
  location?: GeoPoint;          // For future LocationProximityScorer (undefined in MVP)
};
```

**Combination rule:** `finalScore = Σ(scorer.score(ctx) × scorer.weight) / Σ(weights)`.

### 6.3 MVP scorers (three)

| Scorer | Weight | Description |
|---|---|---|
| `FlavorSimilarityScorer` | 0.70 | `cosineSimilarity(user.tasteVector, dishToVector(dish))`. Cold-start fallback: `dish.popularity / 5` when user has 0 likes. |
| `CategoricalAffinityScorer` | 0.30 | Average of three sub-scores (`likedCount / seenCount`, default 0.5 if unseen) over cuisine_region, meal_type, and textures. |
| `PopularityTieBreakerScorer` | 0.05 | `dish.popularity / 5`. Tiny weight — only affects dishes that otherwise tie. |

### 6.4 Future scorers (plug in without touching existing code)

- `LocationProximityScorer` — when Google Places integration lands
- `TimeOfDayScorer` — breakfast dishes at 9am, dinner at 7pm
- `NoveltyScorer` — penalize dishes similar to recent likes to encourage discovery
- `SocialAlignmentScorer` — group recommendations (Phase 3)
- `DietaryContextScorer` — "I had something heavy for lunch"

### 6.5 Engine (`domain/recommendation/engine.ts`)

```ts
class RecommendationEngine {
  constructor(private scorers: Scorer[]) {}

  rankDishes(candidates: Dish[], ctx: Omit<ScoringContext,'dish'>): Ranking[];
  nextDish(candidates: Dish[], ctx: ScoringContext): Dish;
  matchTop3(candidates: Dish[], ctx: ScoringContext): MatchResult;
}

type MatchResult = {
  top3: Array<{ dish: Dish; matchPercent: number }>;
  spread: number;  // rank1.score - rank3.score — how decisive the match is
};
```

**Important subtlety: `nextDish` is non-deterministic.** Rather than always showing the #1 ranked dish, it picks from the top ~20% of candidates with weighted randomness. This prevents the app from feeling robotic or showing the same dish on every session restart. The **final match reveal** uses strict ranking because precision matters at the moment of reveal.

**Dislike handling:** dislikes subtract the dish's vector from the user's taste vector, at 30% weight. Rationale: a user disliking a spicy curry may be rejecting the heat, the cilantro, or the dairy — dislike signals are ambiguous. Likes are specific ("I want more like this"); dislikes are vague.

## 7. Match confidence ("match potential" bar)

The live bar on the Discover screen is the engine's confidence in the *future* top-3 match, not a score for the *current* card.

Computed as: `1 − normalizedEntropy(scores of top 10 ranked dishes)`. When the top 10 cluster tightly → low confidence (many plausible matches, more swipes needed). When the top 3 pull away from the pack → high confidence.

Recomputed after every swipe. Displayed as a 0–100% value in the Discover screen header.

## 8. Swipe-loop state machine

Stop condition for the first match reveal: **10 likes OR 40 total swipes**, whichever comes first.

```
[not_started]
    → (user taps Start on Welcome or resumes active session) →
[active]
    → (swipe right, likes < likesTargetForNextMatch) → stay [active]
    → (swipe left, total < swipeCapForNextMatch)    → stay [active]
    → (swipe right, likes === likesTargetForNextMatch) → [revealing_match]
    → (swipe, total === swipeCapForNextMatch)         → [revealing_match] (copy: "Here's what we've got so far")
[revealing_match]
    → (user taps "Keep Swiping")  → [active], advance target: likesTargetForNextMatch += 10, swipeCapForNextMatch += 30
    → (user taps "Start Over")    → [not_started], session reset, likedHistory preserved
```

**First match:** 10 likes or 40 swipes. **Each subsequent "Keep Swiping" cycle:** +10 more likes or +30 more swipes. The cap scales because keeping swiping after a reveal means the user is enjoying the loop, not grinding.

Sessions auto-resume on app relaunch — if `status === 'active'`, the user re-enters the Discover screen exactly where they left off. No "continue or start over" prompt at launch; resuming is the default, explicit reset lives in Settings.

## 9. Screens and navigation

```
RootNavigator (Stack)
├─ OnboardingStack (shown if !preferences.onboardingCompleted)
│   ├─ WelcomeScreen
│   ├─ AllergenPickerScreen       (required — "no allergies" is explicit choice)
│   ├─ DietPickerScreen           (skippable)
│   └─ PriceRangeScreen           (skippable)
└─ MainTabs (Bottom Tabs)
    ├─ Discover (Stack)
    │   ├─ SwipeScreen
    │   ├─ DetailsSheet           (native modal sheet)
    │   └─ MatchRevealScreen      (full-screen modal)
    ├─ Matches (Stack)
    │   └─ LikedGalleryScreen     (2-column grid, all-time likes)
    ├─ Profile (Stack)
    │   └─ ProfileScreen          (swipe count, like count, top cuisine)
    └─ Settings (Stack)
        ├─ SettingsScreen
        ├─ FiltersScreen          (re-uses onboarding components)
        └─ DataScreen             (reset session, reset all data)
```

### 9.1 SwipeScreen (the core loop)

1. **On mount:** hydrate `SwipeSession` from storage (resume if active, else start new). Filter candidates by hard filters (allergens + diet + price) into the session's candidate pool. Call `engine.nextDish` for the initial card.
2. **Render:** card stack — 3 cards rendered at a time (current + next 2 for smooth transitions); remainder lazy. Top area shows match-potential bar + swipe counter. Card bottom uses glass-panel with dish name, country flag, price, dietary chips.
3. **On drag:** show `NOPE` (red, left) / `YUM` (green, right) overlays at opacity proportional to drag distance. Reanimated runs on the UI thread so this stays 60fps.
4. **On release past threshold:** haptic tap → animate card off-screen → update `SwipeSession` (append to likes or dislikes, update `tasteVector` via add/subtract, update `categoricalCounts`, append to `seenDishIds`) → persist to AsyncStorage → re-run `engine.rankDishes` over remaining candidates with the updated context → call `engine.nextDish` to pick the next card → advance. Re-ranking on every swipe is cheap (~300 dishes × 3 scorers = sub-millisecond) and necessary because the taste vector changes with each swipe.
5. **On match-trigger threshold hit** (see section 8): transition to `MatchRevealScreen`.

### 9.2 DetailsSheet

Native iOS bottom sheet (drag-to-dismiss). Shows full description, all tags, flavor axes as small bars, allergen/diet info. **Does NOT affect swipe count** — informational only, prevents "I want to know what this is before committing" frustration.

### 9.3 MatchRevealScreen

Hero card displays the #1 dish with large match %, dish image, country, flavor tags, description. Three action buttons:

- **"Order Now"** — rendered as a disabled "Coming Soon" teaser (delivery is Phase 2+; included so the UI is complete and upgrade path is obvious)
- **"Find Restaurants"** — same disabled teaser (Google Places is Phase 2)
- **"Keep Swiping"** — returns the session to `active`; +10 more likes triggers another match reveal
- **"Start Over"** — resets the session (but `likedHistory` persists)

Stacked below: #2 and #3 matches as smaller cards. Confetti animation on mount; haptic on reveal.

### 9.4 Mid-session filter changes

If the user toggles a filter mid-session (via Settings → Filters), the remaining pool is re-filtered immediately. The taste vector is preserved. If the remaining pool is empty, an empty-state screen offers "Loosen filters" or "Start new session."

## 10. Shared components

All styled to the design system in section 4.

```
<Button variant="primary|secondary|ghost" size="sm|md|lg" disabled />
<GlassPanel blur={12}>…</GlassPanel>
<Chip icon={...} label={...} variant="flavor|dietary|filter" />
<Toggle checked onChange />
<ProgressBar value={0..1} variant="primary|subtle" />
<SwipeCard dish={...} onSwipe={dir => ...} />
<DishImage uri blurhash />
<TabBarIcon name={materialSymbol} fill={boolean} />
```

## 11. Error handling

Only at real system boundaries. Internal code and framework guarantees are trusted.

| Boundary | Failure mode | Handling |
|---|---|---|
| CDN image load | Network error / 404 | Blurhash placeholder stays visible; card is still swipeable. No retry logic — React Native's `Image` handles it; our job is the placeholder. |
| AsyncStorage read on app start | Corrupt data / schema mismatch beyond migrator's reach | Attempt migration; if it fails, log + reset *that specific* store (preferences OR session), never brick the app. |
| AsyncStorage write | Quota exceeded / device error | Silent retry once, then log. UI stays responsive — swipes never block on persistence. |
| Invalid `foods.json` at build | Malformed JSON / schema drift | Build-time validator script (ts-node) fails the build. Dev-time problem, not runtime. |
| Empty candidate pool mid-session | All remaining dishes filtered out | Empty-state screen with "Loosen filters" and "Start new session" CTAs. |

Offline is graceful by accident: `foods.json` is bundled, so swipes work without network; only CDN images need connectivity, and blurhash makes image failure non-blocking.

## 12. Testing strategy

| Layer | Tool | Coverage |
|---|---|---|
| Vector math | Jest + fast-check | Property-based: cosine-sim bounds, normalize idempotence |
| Scorers | Jest | Each scorer with synthetic `ScoringContext`s — scores in `[0,1]`, ordering correctness |
| Engine | Jest | Golden fixtures — "given this session, top-3 must contain X"; "after 5 spicy likes, spicy dishes rank higher" |
| Zustand stores | Jest | Action → state transitions |
| Repositories | Jest + mocked AsyncStorage | Serialization round-trip, schema migration |
| Screens | React Native Testing Library | Smoke tests — renders without crashing, correct CTAs present, filter change updates pool |
| Swipe gesture | Detox (E2E) | **Deferred to post-MVP** — manual device testing sufficient for MVP |

Target: **80%+ coverage on `domain/`** (recommendation engine, repositories, stores). UI layer: smoke tests only.

### Manual MVP shipping checklist

1. Fresh install → onboarding completes → first swipe works
2. 10 likes → match reveal fires → top-3 shows correct match %s
3. Kill app mid-session → reopen → resumes exactly where left off
4. Toggle an allergen → containing dishes disappear from remaining pool
5. Swipe 40 times without 10 likes → match reveal still fires
6. Test on iPhone 15 (primary), iPhone SE (small screen), iPad (must not break)

## 13. Migration notes

The existing `munchmatch-v3/` web prototype (in the separate `munchmatch-prototype` repo): **archive, do not port**. The existing `foods` array in `munchmatch-prototype/munchmatch-v3/script.js` has ~hundreds of dishes with blog-hosted images and the v1 flavor schema (boolean spice). These will be *re-curated* into the new schema (continuous heat, added richness/textures/meal_types/etc.) and moved to CDN-hosted images. Curating 300 high-quality dishes is part of the MVP build.

## 14. Open questions (for the implementation planner)

- **Dish curation workflow** — hand-authored JSON vs. a small internal tool? Probably JSON for 300 dishes; revisit if the curator (likely Bryan) finds it painful.
- **CDN choice** — Cloudinary, Bunny.net, or a Supabase Storage bucket. All work; decide at image-pipeline time.
- **Expo Router vs. React Navigation standalone** — Expo Router is the modern default and integrates with the managed workflow; pick during scaffolding unless there's a reason not to.
- **Image format pipeline** — original JPEGs vs. WebP vs. AVIF on the CDN. Affects perceived load times on slow connections.
