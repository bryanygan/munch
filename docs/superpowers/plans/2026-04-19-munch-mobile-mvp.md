# Munch Mobile MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an iOS-first (Android-compatible) React Native mobile app that lets users discover dishes by swiping, then reveals a Top-3 match based on a pluggable recommendation engine.

**Architecture:** Feature-sliced structure (`features/`, `domain/`, `shared/`, `data/`). Pure domain layer (vector math, scorers, engine) built TDD-first and independent of UI. Zustand stores wrap the domain layer; features consume stores. Persistence is repository-pattern over AsyncStorage, ready to swap for cloud sync later.

**Tech Stack:** Expo (SDK 52+), React Native 0.76+ (New Architecture), TypeScript strict, React Navigation v7 (native stack + bottom tabs), Zustand, Reanimated 3 + Gesture Handler, expo-haptics, AsyncStorage, Jest + React Native Testing Library + fast-check.

**Reference spec:** `docs/superpowers/specs/2026-04-19-munch-mobile-mvp-design.md`.

**Target location:** The mobile app lives in a `mobile/` subfolder of the `munch` repo (this repo). The original web prototype lives in a separate `munchmatch-prototype` repo and is referenced only as source material — it is not modified by this build.

**Working-directory convention:** `npm`/`npx`/`expo` commands run from `mobile/` (after `cd mobile`). All `git` commands in this plan assume the repo root (`C:/Users/prinp/Documents/GitHub/munch`) — if a task `cd mobile`d into the subdirectory, return to the repo root (`cd ..`) before running `git add`/`git commit`. Paths in `git add` are always repo-root-relative (e.g., `git add mobile/src/...`).

---

## Phase 1: Scaffolding

### Task 1: Create Expo project with TypeScript strict

**Files:**
- Create: `mobile/` (entire Expo project)
- Create: `mobile/tsconfig.json`
- Create: `mobile/package.json` (via Expo init)
- Create: `mobile/app.json` (via Expo init)

- [ ] **Step 1: Scaffold the Expo app**

From the repo root (`C:/Users/prinp/Documents/GitHub/munch`):

```bash
npx create-expo-app@latest mobile --template blank-typescript
```

When prompted, confirm the project name is `mobile`.

- [ ] **Step 2: Verify the app boots**

```bash
cd mobile
npx expo start
```

Expected: Metro bundler starts, QR code displays. Press `q` to quit. (Do not test on device yet — we're just verifying the scaffold.)

- [ ] **Step 3: Enable TypeScript strict mode**

Replace `mobile/tsconfig.json` with:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd mobile
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
cd mobile
git add .
cd ..
git add mobile/
git commit -m "feat(mobile): scaffold Expo TypeScript project"
```

---

### Task 2: Install core dependencies

**Files:**
- Modify: `mobile/package.json`

- [ ] **Step 1: Install navigation stack**

```bash
cd mobile
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context
```

- [ ] **Step 2: Install animation and gesture libraries**

```bash
npx expo install react-native-reanimated react-native-gesture-handler
```

- [ ] **Step 3: Install state management and persistence**

```bash
npx expo install @react-native-async-storage/async-storage
npm install zustand
```

- [ ] **Step 4: Install iOS-native feature libs**

```bash
npx expo install expo-haptics expo-blur expo-image
```

`expo-image` gives us a React Native `Image` component with better caching than the stock one. `expo-blur` is for the glass-panel backdrop-blur on iOS (works on Android but renders differently — acceptable).

- [ ] **Step 5: Install utilities**

```bash
npm install uuid
npm install --save-dev @types/uuid
```

- [ ] **Step 6: Enable Reanimated in babel.config.js**

Replace `mobile/babel.config.js` with:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

Reanimated requires its Babel plugin to be last.

- [ ] **Step 7: Verify boot**

```bash
cd mobile
npx expo start
```

Expected: Bundler starts with no errors. Press `q` to quit.

- [ ] **Step 8: Commit**

```bash
git add mobile/package.json mobile/package-lock.json mobile/babel.config.js
git commit -m "feat(mobile): install core dependencies"
```

---

### Task 3: Set up Jest + React Native Testing Library + fast-check

**Files:**
- Modify: `mobile/package.json`
- Create: `mobile/jest.config.js`
- Create: `mobile/jest.setup.js`

- [ ] **Step 1: Install test dependencies**

```bash
cd mobile
npm install --save-dev jest @types/jest jest-expo @testing-library/react-native @testing-library/jest-native fast-check
```

- [ ] **Step 2: Create Jest config**

Create `mobile/jest.config.js`:

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEach: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|zustand))',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

- [ ] **Step 3: Create Jest setup**

Create `mobile/jest.setup.js`:

```js
import '@testing-library/jest-native/extend-expect';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
```

- [ ] **Step 4: Add test scripts to package.json**

Edit `mobile/package.json`, add to `"scripts"`:

```json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage",
"typecheck": "tsc --noEmit"
```

- [ ] **Step 5: Write a smoke test to verify Jest works**

Create `mobile/src/__tests__/smoke.test.ts`:

```ts
describe('Jest setup', () => {
  it('runs tests', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run tests to verify**

```bash
cd mobile
npm test
```

Expected: 1 test passes.

- [ ] **Step 7: Commit**

```bash
git add mobile/jest.config.js mobile/jest.setup.js mobile/package.json mobile/package-lock.json mobile/src/__tests__/smoke.test.ts
git commit -m "feat(mobile): set up Jest + RNTL + fast-check"
```

---

### Task 4: Create folder structure

**Files:**
- Create: `mobile/src/app/.gitkeep`
- Create: `mobile/src/features/{onboarding,discover,match,matches,profile,settings}/.gitkeep`
- Create: `mobile/src/domain/{dish,preferences,session,recommendation}/.gitkeep`
- Create: `mobile/src/shared/{components,theme,hooks,utils}/.gitkeep`
- Create: `mobile/src/data/.gitkeep`

- [ ] **Step 1: Create directories with placeholder files**

```bash
cd mobile
mkdir -p src/app
mkdir -p src/features/onboarding src/features/discover src/features/match src/features/matches src/features/profile src/features/settings
mkdir -p src/domain/dish src/domain/preferences src/domain/session src/domain/recommendation src/domain/recommendation/scorers
mkdir -p src/shared/components src/shared/theme src/shared/hooks src/shared/utils
mkdir -p src/data
```

Add `.gitkeep` files so empty dirs are tracked:

```bash
find src -type d -empty -exec touch {}/.gitkeep \;
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/
git commit -m "chore(mobile): create feature-sliced folder structure"
```

---

## Phase 2: Domain layer (TDD — no UI yet)

### Task 5: Define core TypeScript types

**Files:**
- Create: `mobile/src/domain/dish/types.ts`
- Create: `mobile/src/domain/preferences/types.ts`
- Create: `mobile/src/domain/session/types.ts`
- Create: `mobile/src/domain/recommendation/types.ts`

- [ ] **Step 1: Create dish types**

Create `mobile/src/domain/dish/types.ts`:

```ts
export type CountryCode = string; // ISO 3166-1 alpha-2, e.g., "TH", "JP"

export type CuisineRegion =
  | 'east_asian' | 'southeast_asian' | 'south_asian'
  | 'middle_eastern' | 'african' | 'mediterranean'
  | 'western_european' | 'eastern_european' | 'nordic'
  | 'north_american' | 'latin_american' | 'oceanic';

export type Texture =
  | 'crunchy' | 'crispy' | 'creamy' | 'chewy' | 'soft' | 'juicy' | 'flaky';

export type MealType =
  | 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';

export type Diet =
  | 'vegan' | 'vegetarian' | 'pescatarian' | 'halal' | 'kosher';

export type AllergenKey =
  | 'gluten' | 'dairy' | 'seafood' | 'nuts'
  | 'eggs' | 'pork' | 'beef' | 'alcohol';

export type PriceTier = 1 | 2 | 3 | 4;

export type FlavorProfile = {
  sweet: number;   // 0-5 continuous
  sour: number;
  salty: number;
  bitter: number;
  umami: number;
  heat: number;
  richness: number;
};

export type Dish = {
  id: string;
  name: string;
  description: string;
  country: CountryCode;
  cuisine_region: CuisineRegion;
  flavor: FlavorProfile;
  textures: Texture[];
  meal_types: MealType[];
  temperature: 'hot' | 'cold' | 'room';
  typical_time: 'morning' | 'afternoon' | 'evening' | 'late_night' | 'any';
  contains: Record<AllergenKey, boolean>;
  diet_compatible: Diet[];
  price_tier: PriceTier;
  prep_complexity: 'low' | 'medium' | 'high';
  popularity: 1 | 2 | 3 | 4 | 5;
  image_url: string;
  image_blurhash: string;
  tags: string[];
};

export const FLAVOR_KEYS = [
  'sweet', 'sour', 'salty', 'bitter', 'umami', 'heat', 'richness',
] as const satisfies readonly (keyof FlavorProfile)[];

export type FlavorVector = number[]; // length 7, in FLAVOR_KEYS order
```

- [ ] **Step 2: Create preferences types**

Create `mobile/src/domain/preferences/types.ts`:

```ts
import type { AllergenKey, Diet, PriceTier } from '@/domain/dish/types';

export type Preferences = {
  allergens: AllergenKey[];
  diet: Diet | null;
  priceRange: [PriceTier, PriceTier];
  onboardingCompleted: boolean;
  schemaVersion: 1;
};

export const DEFAULT_PREFERENCES: Preferences = {
  allergens: [],
  diet: null,
  priceRange: [1, 4],
  onboardingCompleted: false,
  schemaVersion: 1,
};
```

- [ ] **Step 3: Create session types**

Create `mobile/src/domain/session/types.ts`:

```ts
import type {
  CuisineRegion, MealType, Texture, FlavorVector, Dish,
} from '@/domain/dish/types';

export type LikeEvent = {
  dishId: string;
  timestamp: number;
};

export type CategoricalCounts = {
  cuisine_region: Record<CuisineRegion, { liked: number; seen: number }>;
  meal_types: Record<MealType, { liked: number; seen: number }>;
  textures: Record<Texture, { liked: number; seen: number }>;
};

export type MatchEntry = {
  dish: Dish;
  matchPercent: number;
};

export type MatchResult = {
  top3: MatchEntry[];
  spread: number;
};

export type SwipeSession = {
  id: string;
  startedAt: number;
  likes: LikeEvent[];
  dislikes: LikeEvent[];
  seenDishIds: string[];
  tasteVector: FlavorVector;
  categoricalCounts: CategoricalCounts;
  status: 'active' | 'completed';
  completedMatch?: MatchResult;
  likesTargetForNextMatch: number;
  swipeCapForNextMatch: number;
  matchRevealsShown: number;
  schemaVersion: 1;
};

export type LikedHistory = {
  events: Array<{ dishId: string; sessionId: string; likedAt: number }>;
  schemaVersion: 1;
};
```

- [ ] **Step 4: Create recommendation types**

Create `mobile/src/domain/recommendation/types.ts`:

```ts
import type { Dish, FlavorVector } from '@/domain/dish/types';
import type { SwipeSession, CategoricalCounts, MatchResult } from '@/domain/session/types';

export type GeoPoint = { latitude: number; longitude: number };

export type ScoringContext = {
  user: {
    tasteVector: FlavorVector;
    categoricalCounts: CategoricalCounts;
  };
  dish: Dish;
  session: SwipeSession;
  now: Date;
  location?: GeoPoint;
};

export interface Scorer {
  readonly id: string;
  readonly weight: number;
  score(ctx: ScoringContext): number; // Must return [0, 1]
}

export type Ranking = {
  dish: Dish;
  score: number;
};

export type { MatchResult };
```

- [ ] **Step 5: Verify typecheck**

```bash
cd mobile
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add mobile/src/domain/
git commit -m "feat(mobile): define core domain types"
```

---

### Task 6: Vector math utilities (TDD)

**Files:**
- Create: `mobile/src/shared/utils/vector.ts`
- Create: `mobile/src/shared/utils/__tests__/vector.test.ts`

- [ ] **Step 1: Write failing tests for vector utilities**

Create `mobile/src/shared/utils/__tests__/vector.test.ts`:

```ts
import fc from 'fast-check';
import {
  addVectors, scaleVector, normalize, cosineSimilarity, dishToVector, zeroVector,
} from '@/shared/utils/vector';
import type { Dish } from '@/domain/dish/types';

const makeDish = (flavor: Partial<Dish['flavor']> = {}): Dish => ({
  id: 'test', name: 'Test', description: '',
  country: 'US', cuisine_region: 'north_american',
  flavor: {
    sweet: 0, sour: 0, salty: 0, bitter: 0, umami: 0, heat: 0, richness: 0,
    ...flavor,
  },
  textures: [], meal_types: [], temperature: 'room', typical_time: 'any',
  contains: {
    gluten: false, dairy: false, seafood: false, nuts: false,
    eggs: false, pork: false, beef: false, alcohol: false,
  },
  diet_compatible: [], price_tier: 1, prep_complexity: 'low',
  popularity: 3, image_url: '', image_blurhash: '', tags: [],
});

describe('zeroVector', () => {
  it('returns 7 zeros', () => {
    expect(zeroVector()).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });
});

describe('addVectors', () => {
  it('adds elementwise', () => {
    expect(addVectors([1, 2, 3, 0, 0, 0, 0], [4, 5, 6, 0, 0, 0, 0]))
      .toEqual([5, 7, 9, 0, 0, 0, 0]);
  });
});

describe('scaleVector', () => {
  it('multiplies each element by scalar', () => {
    expect(scaleVector([1, 2, 3, 0, 0, 0, 0], 2)).toEqual([2, 4, 6, 0, 0, 0, 0]);
  });
});

describe('normalize', () => {
  it('returns unit vector', () => {
    const n = normalize([3, 4, 0, 0, 0, 0, 0]);
    const mag = Math.sqrt(n.reduce((s, x) => s + x * x, 0));
    expect(mag).toBeCloseTo(1, 10);
  });

  it('returns zero vector when input is zero', () => {
    expect(normalize([0, 0, 0, 0, 0, 0, 0])).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it('is idempotent for non-zero vectors', () => {
    fc.assert(fc.property(
      fc.array(fc.float({ min: -10, max: 10, noNaN: true }), { minLength: 7, maxLength: 7 }),
      (v) => {
        const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
        if (mag === 0) return;
        const once = normalize(v);
        const twice = normalize(once);
        once.forEach((val, i) => expect(twice[i]).toBeCloseTo(val, 10));
      },
    ));
  });
});

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3, 0, 0, 0, 0], [1, 2, 3, 0, 0, 0, 0])).toBeCloseTo(1, 10);
  });

  it('returns 0.5 for orthogonal vectors (mapped from 0)', () => {
    // Raw cosine 0 → mapped to 0.5 to keep range [0,1]
    expect(cosineSimilarity([1, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0])).toBeCloseTo(0.5, 10);
  });

  it('returns 0 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0, 0, 0, 0, 0, 0], [-1, 0, 0, 0, 0, 0, 0])).toBeCloseTo(0, 10);
  });

  it('returns 0.5 when either vector is zero (no information)', () => {
    expect(cosineSimilarity([0, 0, 0, 0, 0, 0, 0], [1, 2, 3, 0, 0, 0, 0])).toBe(0.5);
  });

  it('stays in [0, 1]', () => {
    fc.assert(fc.property(
      fc.array(fc.float({ min: -5, max: 5, noNaN: true }), { minLength: 7, maxLength: 7 }),
      fc.array(fc.float({ min: -5, max: 5, noNaN: true }), { minLength: 7, maxLength: 7 }),
      (a, b) => {
        const s = cosineSimilarity(a, b);
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(1);
      },
    ));
  });
});

describe('dishToVector', () => {
  it('extracts flavor in FLAVOR_KEYS order', () => {
    const d = makeDish({ sweet: 4, sour: 1, salty: 2, bitter: 0, umami: 3, heat: 1, richness: 2 });
    expect(dishToVector(d)).toEqual([4, 1, 2, 0, 3, 1, 2]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd mobile
npm test -- vector.test.ts
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement vector utilities**

Create `mobile/src/shared/utils/vector.ts`:

```ts
import { FLAVOR_KEYS, type FlavorVector, type Dish } from '@/domain/dish/types';

export const zeroVector = (): FlavorVector => [0, 0, 0, 0, 0, 0, 0];

export const addVectors = (a: FlavorVector, b: FlavorVector): FlavorVector =>
  a.map((v, i) => v + (b[i] ?? 0));

export const scaleVector = (v: FlavorVector, s: number): FlavorVector =>
  v.map(x => x * s);

const magnitude = (v: FlavorVector): number =>
  Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));

export const normalize = (v: FlavorVector): FlavorVector => {
  const mag = magnitude(v);
  return mag === 0 ? zeroVector() : v.map(x => x / mag);
};

/**
 * Returns cosine similarity mapped to [0, 1] (raw [-1,1] shifted and scaled).
 * Zero vectors return 0.5 (no information).
 */
export const cosineSimilarity = (a: FlavorVector, b: FlavorVector): number => {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0.5;
  const dot = a.reduce((sum, x, i) => sum + x * (b[i] ?? 0), 0);
  const raw = dot / (magA * magB);
  return (raw + 1) / 2;
};

export const dishToVector = (dish: Dish): FlavorVector =>
  FLAVOR_KEYS.map(k => dish.flavor[k]);
```

- [ ] **Step 4: Run tests**

```bash
cd mobile
npm test -- vector.test.ts
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/shared/utils/
git commit -m "feat(mobile): vector math utilities with property tests"
```

---

### Task 7: Cuisine regions mapping

**Files:**
- Create: `mobile/src/data/cuisineRegions.ts`
- Create: `mobile/src/data/__tests__/cuisineRegions.test.ts`

- [ ] **Step 1: Write test**

Create `mobile/src/data/__tests__/cuisineRegions.test.ts`:

```ts
import { countryToRegion, COUNTRY_TO_REGION } from '@/data/cuisineRegions';

describe('countryToRegion', () => {
  it('maps known countries', () => {
    expect(countryToRegion('TH')).toBe('southeast_asian');
    expect(countryToRegion('JP')).toBe('east_asian');
    expect(countryToRegion('IT')).toBe('mediterranean');
    expect(countryToRegion('US')).toBe('north_american');
  });

  it('returns undefined for unknown country', () => {
    expect(countryToRegion('ZZ')).toBeUndefined();
  });

  it('is case-insensitive', () => {
    expect(countryToRegion('th')).toBe('southeast_asian');
  });

  it('contains all countries from the mapping', () => {
    expect(Object.keys(COUNTRY_TO_REGION).length).toBeGreaterThan(30);
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd mobile
npm test -- cuisineRegions.test.ts
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement the mapping**

Create `mobile/src/data/cuisineRegions.ts`:

```ts
import type { CountryCode, CuisineRegion } from '@/domain/dish/types';

export const COUNTRY_TO_REGION: Record<string, CuisineRegion> = {
  // East Asian
  JP: 'east_asian', KR: 'east_asian', CN: 'east_asian', TW: 'east_asian',
  HK: 'east_asian', MN: 'east_asian',
  // Southeast Asian
  TH: 'southeast_asian', VN: 'southeast_asian', ID: 'southeast_asian',
  PH: 'southeast_asian', MY: 'southeast_asian', SG: 'southeast_asian',
  KH: 'southeast_asian', LA: 'southeast_asian', MM: 'southeast_asian',
  // South Asian
  IN: 'south_asian', PK: 'south_asian', BD: 'south_asian',
  LK: 'south_asian', NP: 'south_asian',
  // Middle Eastern
  LB: 'middle_eastern', IL: 'middle_eastern', IR: 'middle_eastern',
  TR: 'middle_eastern', SY: 'middle_eastern', JO: 'middle_eastern',
  AE: 'middle_eastern', SA: 'middle_eastern', IQ: 'middle_eastern',
  // African
  NG: 'african', ET: 'african', EG: 'african', MA: 'african',
  ZA: 'african', KE: 'african', GH: 'african', SN: 'african',
  // Mediterranean
  GR: 'mediterranean', IT: 'mediterranean', ES: 'mediterranean',
  // Western European
  FR: 'western_european', DE: 'western_european', GB: 'western_european',
  NL: 'western_european', BE: 'western_european', IE: 'western_european',
  PT: 'western_european', CH: 'western_european', AT: 'western_european',
  // Eastern European
  RU: 'eastern_european', PL: 'eastern_european', HU: 'eastern_european',
  RO: 'eastern_european', CZ: 'eastern_european', UA: 'eastern_european',
  // Nordic
  SE: 'nordic', NO: 'nordic', FI: 'nordic', DK: 'nordic', IS: 'nordic',
  // North American
  US: 'north_american', CA: 'north_american', MX: 'north_american',
  // Latin American
  BR: 'latin_american', AR: 'latin_american', PE: 'latin_american',
  CO: 'latin_american', CL: 'latin_american', CU: 'latin_american',
  DO: 'latin_american', VE: 'latin_american',
  // Oceanic
  AU: 'oceanic', NZ: 'oceanic', FJ: 'oceanic',
};

export const countryToRegion = (country: CountryCode): CuisineRegion | undefined =>
  COUNTRY_TO_REGION[country.toUpperCase()];
```

- [ ] **Step 4: Run tests**

```bash
cd mobile
npm test -- cuisineRegions.test.ts
```

Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/data/
git commit -m "feat(mobile): cuisine region mapping"
```

---

### Task 8: Seed foods.json with minimal dataset

**Files:**
- Create: `mobile/src/data/foods.json`
- Create: `mobile/src/data/__tests__/foods.test.ts`

We seed a small initial dataset (20 dishes) so the pipeline works end-to-end. Full curation of ~300 dishes is a separate content task that can happen after the shell is working.

- [ ] **Step 1: Write validation test**

Create `mobile/src/data/__tests__/foods.test.ts`:

```ts
import foods from '@/data/foods.json';
import type { Dish } from '@/domain/dish/types';
import { countryToRegion } from '@/data/cuisineRegions';

describe('foods.json', () => {
  it('has at least 20 dishes (MVP seed)', () => {
    expect(Array.isArray(foods)).toBe(true);
    expect(foods.length).toBeGreaterThanOrEqual(20);
  });

  it('every dish has a unique id', () => {
    const ids = (foods as Dish[]).map(d => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every dish has all required fields', () => {
    const required = [
      'id', 'name', 'description', 'country', 'cuisine_region', 'flavor',
      'textures', 'meal_types', 'temperature', 'typical_time', 'contains',
      'diet_compatible', 'price_tier', 'prep_complexity', 'popularity',
      'image_url', 'image_blurhash', 'tags',
    ];
    for (const dish of foods as Dish[]) {
      for (const field of required) {
        expect(dish).toHaveProperty(field);
      }
    }
  });

  it('every dish has flavor axes in range [0, 5]', () => {
    for (const dish of foods as Dish[]) {
      for (const axis of Object.values(dish.flavor)) {
        expect(axis).toBeGreaterThanOrEqual(0);
        expect(axis).toBeLessThanOrEqual(5);
      }
    }
  });

  it('every dish has cuisine_region matching its country', () => {
    for (const dish of foods as Dish[]) {
      const expected = countryToRegion(dish.country);
      if (expected) expect(dish.cuisine_region).toBe(expected);
    }
  });
});
```

- [ ] **Step 2: Create the seed data file**

Create `mobile/src/data/foods.json` with 20 dishes. Start with dishes from the existing v3 prototype (`munchmatch-prototype/munchmatch-v3/script.js`), rewritten to the new schema. A subagent should generate this file programmatically — see below.

Template for one dish:

```json
{
  "id": "mango_sticky_rice",
  "name": "Mango Sticky Rice",
  "description": "Sweet coconut-infused sticky rice topped with ripe mango.",
  "country": "TH",
  "cuisine_region": "southeast_asian",
  "flavor": {
    "sweet": 4.5, "sour": 1, "salty": 0.5, "bitter": 0, "umami": 0, "heat": 0, "richness": 3
  },
  "textures": ["chewy", "creamy"],
  "meal_types": ["dessert"],
  "temperature": "cold",
  "typical_time": "any",
  "contains": {
    "gluten": false, "dairy": false, "seafood": false, "nuts": false,
    "eggs": false, "pork": false, "beef": false, "alcohol": false
  },
  "diet_compatible": ["vegan", "vegetarian"],
  "price_tier": 2,
  "prep_complexity": "medium",
  "popularity": 4,
  "image_url": "https://images.unsplash.com/photo-1711161554195-4a36ad4a3a5f?w=800&q=80",
  "image_blurhash": "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
  "tags": ["coconut", "rice", "fruit", "tropical"]
}
```

Generate 20 such dishes spanning at least 8 different countries and at least 4 cuisine regions. Use Unsplash food images (search for the dish name) — these are free to use.

**For the image_blurhash value**, any placeholder string of length 20-30 works for development. Proper blurhashes come from running each image through a blurhash encoder later.

- [ ] **Step 3: Run tests to verify**

```bash
cd mobile
npm test -- foods.test.ts
```

Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/data/foods.json mobile/src/data/__tests__/foods.test.ts
git commit -m "feat(mobile): seed foods.json with 20 dishes"
```

---

### Task 9: Dish repository with hard-filter logic

**Files:**
- Create: `mobile/src/domain/dish/repository.ts`
- Create: `mobile/src/domain/dish/__tests__/repository.test.ts`

- [ ] **Step 1: Write failing tests**

Create `mobile/src/domain/dish/__tests__/repository.test.ts`:

```ts
import { DishRepository } from '@/domain/dish/repository';
import type { Dish } from '@/domain/dish/types';
import type { Preferences } from '@/domain/preferences/types';

const makeDish = (overrides: Partial<Dish> = {}): Dish => ({
  id: overrides.id ?? 'd1', name: 'Test', description: '',
  country: 'US', cuisine_region: 'north_american',
  flavor: { sweet: 0, sour: 0, salty: 0, bitter: 0, umami: 0, heat: 0, richness: 0 },
  textures: [], meal_types: [], temperature: 'room', typical_time: 'any',
  contains: {
    gluten: false, dairy: false, seafood: false, nuts: false,
    eggs: false, pork: false, beef: false, alcohol: false,
  },
  diet_compatible: [], price_tier: 2, prep_complexity: 'low',
  popularity: 3, image_url: '', image_blurhash: '', tags: [],
  ...overrides,
});

const prefs = (p: Partial<Preferences> = {}): Preferences => ({
  allergens: [], diet: null, priceRange: [1, 4],
  onboardingCompleted: true, schemaVersion: 1,
  ...p,
});

describe('DishRepository', () => {
  it('loads all dishes', () => {
    const dishes = [makeDish({ id: 'a' }), makeDish({ id: 'b' })];
    const repo = new DishRepository(dishes);
    expect(repo.getAll()).toHaveLength(2);
  });

  it('filters out dishes containing declared allergens', () => {
    const dishes = [
      makeDish({ id: 'has-gluten', contains: { gluten: true, dairy: false, seafood: false, nuts: false, eggs: false, pork: false, beef: false, alcohol: false } }),
      makeDish({ id: 'no-gluten' }),
    ];
    const repo = new DishRepository(dishes);
    const result = repo.filterByPreferences(prefs({ allergens: ['gluten'] }));
    expect(result.map(d => d.id)).toEqual(['no-gluten']);
  });

  it('filters out dishes incompatible with diet', () => {
    const dishes = [
      makeDish({ id: 'non-vegan', diet_compatible: [] }),
      makeDish({ id: 'vegan', diet_compatible: ['vegan', 'vegetarian'] }),
    ];
    const repo = new DishRepository(dishes);
    const result = repo.filterByPreferences(prefs({ diet: 'vegan' }));
    expect(result.map(d => d.id)).toEqual(['vegan']);
  });

  it('filters by price range inclusive', () => {
    const dishes = [
      makeDish({ id: 'cheap', price_tier: 1 }),
      makeDish({ id: 'mid', price_tier: 2 }),
      makeDish({ id: 'pricey', price_tier: 4 }),
    ];
    const repo = new DishRepository(dishes);
    const result = repo.filterByPreferences(prefs({ priceRange: [1, 2] }));
    expect(result.map(d => d.id).sort()).toEqual(['cheap', 'mid']);
  });

  it('applies multiple filters together', () => {
    const dishes = [
      makeDish({ id: 'keep', price_tier: 2, diet_compatible: ['vegetarian'] }),
      makeDish({ id: 'wrong-price', price_tier: 4, diet_compatible: ['vegetarian'] }),
      makeDish({ id: 'wrong-diet', price_tier: 2, diet_compatible: [] }),
    ];
    const repo = new DishRepository(dishes);
    const result = repo.filterByPreferences(prefs({
      diet: 'vegetarian',
      priceRange: [1, 3],
    }));
    expect(result.map(d => d.id)).toEqual(['keep']);
  });

  it('findById returns the dish or undefined', () => {
    const dishes = [makeDish({ id: 'a' })];
    const repo = new DishRepository(dishes);
    expect(repo.findById('a')?.id).toBe('a');
    expect(repo.findById('missing')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd mobile
npm test -- repository.test.ts
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement the repository**

Create `mobile/src/domain/dish/repository.ts`:

```ts
import type { Dish } from './types';
import type { Preferences } from '@/domain/preferences/types';

export class DishRepository {
  constructor(private readonly dishes: Dish[]) {}

  getAll(): Dish[] {
    return this.dishes;
  }

  findById(id: string): Dish | undefined {
    return this.dishes.find(d => d.id === id);
  }

  filterByPreferences(prefs: Preferences): Dish[] {
    const [minPrice, maxPrice] = prefs.priceRange;
    return this.dishes.filter(dish => {
      if (dish.price_tier < minPrice || dish.price_tier > maxPrice) return false;
      if (prefs.diet && !dish.diet_compatible.includes(prefs.diet)) return false;
      for (const allergen of prefs.allergens) {
        if (dish.contains[allergen]) return false;
      }
      return true;
    });
  }
}
```

- [ ] **Step 4: Run tests**

```bash
cd mobile
npm test -- repository.test.ts
```

Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/domain/dish/
git commit -m "feat(mobile): DishRepository with preference-based filtering"
```

---

### Task 10: Storage wrapper (AsyncStorage adapter with schema migration)

**Files:**
- Create: `mobile/src/shared/utils/storage.ts`
- Create: `mobile/src/shared/utils/__tests__/storage.test.ts`

- [ ] **Step 1: Write failing tests**

Create `mobile/src/shared/utils/__tests__/storage.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Storage, StorageError } from '@/shared/utils/storage';

type V1 = { value: number; schemaVersion: 1 };

describe('Storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('writes and reads a typed value', async () => {
    const storage = new Storage<V1>({
      key: 'test:v1',
      currentVersion: 1,
      defaultValue: { value: 0, schemaVersion: 1 },
      migrate: (raw) => raw as V1,
    });
    await storage.write({ value: 42, schemaVersion: 1 });
    expect(await storage.read()).toEqual({ value: 42, schemaVersion: 1 });
  });

  it('returns defaultValue when nothing is stored', async () => {
    const storage = new Storage<V1>({
      key: 'test:v1',
      currentVersion: 1,
      defaultValue: { value: 99, schemaVersion: 1 },
      migrate: (raw) => raw as V1,
    });
    expect(await storage.read()).toEqual({ value: 99, schemaVersion: 1 });
  });

  it('runs migrate when schemaVersion mismatches', async () => {
    await AsyncStorage.setItem('test:v1', JSON.stringify({ value: 7, schemaVersion: 0 }));
    const migrateSpy = jest.fn().mockReturnValue({ value: 7, schemaVersion: 1 });
    const storage = new Storage<V1>({
      key: 'test:v1', currentVersion: 1,
      defaultValue: { value: 0, schemaVersion: 1 },
      migrate: migrateSpy,
    });
    const result = await storage.read();
    expect(migrateSpy).toHaveBeenCalled();
    expect(result.schemaVersion).toBe(1);
  });

  it('resets to default when migrate throws', async () => {
    await AsyncStorage.setItem('test:v1', '{"corrupt":true}');
    const storage = new Storage<V1>({
      key: 'test:v1', currentVersion: 1,
      defaultValue: { value: -1, schemaVersion: 1 },
      migrate: () => { throw new Error('cannot migrate'); },
    });
    expect(await storage.read()).toEqual({ value: -1, schemaVersion: 1 });
  });

  it('clear removes the key', async () => {
    const storage = new Storage<V1>({
      key: 'test:v1', currentVersion: 1,
      defaultValue: { value: 0, schemaVersion: 1 },
      migrate: (raw) => raw as V1,
    });
    await storage.write({ value: 1, schemaVersion: 1 });
    await storage.clear();
    expect(await storage.read()).toEqual({ value: 0, schemaVersion: 1 });
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd mobile
npm test -- storage.test.ts
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement Storage wrapper**

Create `mobile/src/shared/utils/storage.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export class StorageError extends Error {}

export type StorageConfig<T extends { schemaVersion: number }> = {
  key: string;
  currentVersion: T['schemaVersion'];
  defaultValue: T;
  /** Transform arbitrary stored data into the current schema. Throw to reset. */
  migrate: (raw: unknown) => T;
};

export class Storage<T extends { schemaVersion: number }> {
  constructor(private readonly config: StorageConfig<T>) {}

  async read(): Promise<T> {
    const { key, currentVersion, defaultValue, migrate } = this.config;
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return defaultValue;
    try {
      const parsed = JSON.parse(raw) as { schemaVersion?: number };
      if (parsed?.schemaVersion === currentVersion) return parsed as T;
      const migrated = migrate(parsed);
      await AsyncStorage.setItem(key, JSON.stringify(migrated));
      return migrated;
    } catch {
      // Corrupt data or migration failed — reset to default
      await AsyncStorage.removeItem(key);
      return defaultValue;
    }
  }

  async write(value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(this.config.key, JSON.stringify(value));
    } catch (err) {
      // Retry once then give up silently (UI should not block on persistence)
      try {
        await AsyncStorage.setItem(this.config.key, JSON.stringify(value));
      } catch {
        console.warn(`[Storage] write failed for key ${this.config.key}`);
      }
    }
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(this.config.key);
  }
}
```

- [ ] **Step 4: Run tests**

```bash
cd mobile
npm test -- storage.test.ts
```

Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/shared/utils/storage.ts mobile/src/shared/utils/__tests__/storage.test.ts
git commit -m "feat(mobile): Storage wrapper with schema migration"
```

---

### Task 11: Preferences repository + Zustand store

**Files:**
- Create: `mobile/src/domain/preferences/store.ts`
- Create: `mobile/src/domain/preferences/__tests__/store.test.ts`

- [ ] **Step 1: Write failing tests**

Create `mobile/src/domain/preferences/__tests__/store.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePreferencesStore } from '@/domain/preferences/store';

describe('usePreferencesStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    usePreferencesStore.setState(usePreferencesStore.getInitialState());
  });

  it('starts with default preferences', () => {
    const s = usePreferencesStore.getState();
    expect(s.preferences.onboardingCompleted).toBe(false);
    expect(s.preferences.allergens).toEqual([]);
    expect(s.preferences.priceRange).toEqual([1, 4]);
  });

  it('hydrates from storage', async () => {
    await AsyncStorage.setItem('munch:preferences', JSON.stringify({
      allergens: ['gluten'], diet: 'vegan', priceRange: [1, 2],
      onboardingCompleted: true, schemaVersion: 1,
    }));
    await usePreferencesStore.getState().hydrate();
    expect(usePreferencesStore.getState().preferences.allergens).toEqual(['gluten']);
    expect(usePreferencesStore.getState().preferences.diet).toBe('vegan');
  });

  it('setAllergens updates and persists', async () => {
    await usePreferencesStore.getState().setAllergens(['nuts', 'dairy']);
    expect(usePreferencesStore.getState().preferences.allergens).toEqual(['nuts', 'dairy']);
    const stored = JSON.parse((await AsyncStorage.getItem('munch:preferences'))!);
    expect(stored.allergens).toEqual(['nuts', 'dairy']);
  });

  it('completeOnboarding sets the flag', async () => {
    await usePreferencesStore.getState().completeOnboarding();
    expect(usePreferencesStore.getState().preferences.onboardingCompleted).toBe(true);
  });

  it('reset clears back to defaults', async () => {
    await usePreferencesStore.getState().setAllergens(['nuts']);
    await usePreferencesStore.getState().reset();
    expect(usePreferencesStore.getState().preferences.allergens).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd mobile
npm test -- preferences/__tests__/store.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement store**

Create `mobile/src/domain/preferences/store.ts`:

```ts
import { create } from 'zustand';
import { Storage } from '@/shared/utils/storage';
import type { AllergenKey, Diet, PriceTier } from '@/domain/dish/types';
import { DEFAULT_PREFERENCES, type Preferences } from './types';

const storage = new Storage<Preferences>({
  key: 'munch:preferences',
  currentVersion: 1,
  defaultValue: DEFAULT_PREFERENCES,
  migrate: (raw) => {
    // Single version today. When schema changes, handle older shapes here.
    if (raw && typeof raw === 'object' && 'schemaVersion' in raw) {
      return raw as Preferences;
    }
    throw new Error('unrecognized preferences shape');
  },
});

type PreferencesState = {
  preferences: Preferences;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setAllergens: (allergens: AllergenKey[]) => Promise<void>;
  setDiet: (diet: Diet | null) => Promise<void>;
  setPriceRange: (range: [PriceTier, PriceTier]) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  reset: () => Promise<void>;
};

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  preferences: DEFAULT_PREFERENCES,
  hydrated: false,
  hydrate: async () => {
    const preferences = await storage.read();
    set({ preferences, hydrated: true });
  },
  setAllergens: async (allergens) => {
    const next = { ...get().preferences, allergens };
    await storage.write(next);
    set({ preferences: next });
  },
  setDiet: async (diet) => {
    const next = { ...get().preferences, diet };
    await storage.write(next);
    set({ preferences: next });
  },
  setPriceRange: async (priceRange) => {
    const next = { ...get().preferences, priceRange };
    await storage.write(next);
    set({ preferences: next });
  },
  completeOnboarding: async () => {
    const next = { ...get().preferences, onboardingCompleted: true };
    await storage.write(next);
    set({ preferences: next });
  },
  reset: async () => {
    await storage.clear();
    set({ preferences: DEFAULT_PREFERENCES });
  },
}));
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd mobile
npm test -- preferences/__tests__/store.test.ts
```

Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/domain/preferences/
git commit -m "feat(mobile): preferences store with AsyncStorage persistence"
```

---

### Task 12: Session store — helpers for new session + categorical init

**Files:**
- Create: `mobile/src/domain/session/factory.ts`
- Create: `mobile/src/domain/session/__tests__/factory.test.ts`

- [ ] **Step 1: Write failing tests**

Create `mobile/src/domain/session/__tests__/factory.test.ts`:

```ts
import { createSwipeSession, emptyCategoricalCounts } from '@/domain/session/factory';
import { zeroVector } from '@/shared/utils/vector';

describe('createSwipeSession', () => {
  it('returns a fresh session with zero taste vector', () => {
    const s = createSwipeSession();
    expect(s.status).toBe('active');
    expect(s.likes).toEqual([]);
    expect(s.dislikes).toEqual([]);
    expect(s.seenDishIds).toEqual([]);
    expect(s.tasteVector).toEqual(zeroVector());
    expect(s.likesTargetForNextMatch).toBe(10);
    expect(s.swipeCapForNextMatch).toBe(40);
    expect(s.matchRevealsShown).toBe(0);
  });

  it('assigns a unique id per session', () => {
    const a = createSwipeSession();
    const b = createSwipeSession();
    expect(a.id).not.toBe(b.id);
  });
});

describe('emptyCategoricalCounts', () => {
  it('has all regions zeroed', () => {
    const c = emptyCategoricalCounts();
    expect(c.cuisine_region.east_asian).toEqual({ liked: 0, seen: 0 });
    expect(c.cuisine_region.southeast_asian).toEqual({ liked: 0, seen: 0 });
  });

  it('has all meal_types zeroed', () => {
    const c = emptyCategoricalCounts();
    expect(c.meal_types.breakfast).toEqual({ liked: 0, seen: 0 });
    expect(c.meal_types.dessert).toEqual({ liked: 0, seen: 0 });
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd mobile
npm test -- session/__tests__/factory.test.ts
```

- [ ] **Step 3: Implement factory**

Create `mobile/src/domain/session/factory.ts`:

```ts
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';
import { zeroVector } from '@/shared/utils/vector';
import type { CuisineRegion, MealType, Texture } from '@/domain/dish/types';
import type { CategoricalCounts, SwipeSession } from './types';

const CUISINE_REGIONS: CuisineRegion[] = [
  'east_asian', 'southeast_asian', 'south_asian', 'middle_eastern',
  'african', 'mediterranean', 'western_european', 'eastern_european',
  'nordic', 'north_american', 'latin_american', 'oceanic',
];

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
const TEXTURES: Texture[] = ['crunchy', 'crispy', 'creamy', 'chewy', 'soft', 'juicy', 'flaky'];

export const emptyCategoricalCounts = (): CategoricalCounts => ({
  cuisine_region: Object.fromEntries(
    CUISINE_REGIONS.map(r => [r, { liked: 0, seen: 0 }]),
  ) as CategoricalCounts['cuisine_region'],
  meal_types: Object.fromEntries(
    MEAL_TYPES.map(m => [m, { liked: 0, seen: 0 }]),
  ) as CategoricalCounts['meal_types'],
  textures: Object.fromEntries(
    TEXTURES.map(t => [t, { liked: 0, seen: 0 }]),
  ) as CategoricalCounts['textures'],
});

export const createSwipeSession = (): SwipeSession => ({
  id: uuid(),
  startedAt: Date.now(),
  likes: [],
  dislikes: [],
  seenDishIds: [],
  tasteVector: zeroVector(),
  categoricalCounts: emptyCategoricalCounts(),
  status: 'active',
  likesTargetForNextMatch: 10,
  swipeCapForNextMatch: 40,
  matchRevealsShown: 0,
  schemaVersion: 1,
});
```

- [ ] **Step 4: Install uuid polyfill for React Native**

```bash
cd mobile
npx expo install react-native-get-random-values
```

- [ ] **Step 5: Run tests — expect pass**

```bash
cd mobile
npm test -- session/__tests__/factory.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add mobile/src/domain/session/ mobile/package.json mobile/package-lock.json
git commit -m "feat(mobile): session factory with zeroed taste vector"
```

---

### Task 13: Session mutations — applySwipe (pure function)

**Files:**
- Create: `mobile/src/domain/session/mutations.ts`
- Create: `mobile/src/domain/session/__tests__/mutations.test.ts`

- [ ] **Step 1: Write failing tests**

Create `mobile/src/domain/session/__tests__/mutations.test.ts`:

```ts
import { applySwipe } from '@/domain/session/mutations';
import { createSwipeSession } from '@/domain/session/factory';
import type { Dish } from '@/domain/dish/types';

const d = (overrides: Partial<Dish> = {}): Dish => ({
  id: overrides.id ?? 'd1', name: 'D', description: '',
  country: 'TH', cuisine_region: 'southeast_asian',
  flavor: { sweet: 4, sour: 1, salty: 1, bitter: 0, umami: 0, heat: 0, richness: 2 },
  textures: ['creamy'], meal_types: ['dessert'],
  temperature: 'cold', typical_time: 'any',
  contains: {
    gluten: false, dairy: false, seafood: false, nuts: false,
    eggs: false, pork: false, beef: false, alcohol: false,
  },
  diet_compatible: ['vegetarian'], price_tier: 2, prep_complexity: 'low',
  popularity: 3, image_url: '', image_blurhash: '', tags: [],
  ...overrides,
});

describe('applySwipe', () => {
  it('appends to likes on right swipe', () => {
    const s = createSwipeSession();
    const next = applySwipe(s, d(), 'like');
    expect(next.likes).toHaveLength(1);
    expect(next.dislikes).toHaveLength(0);
    expect(next.likes[0].dishId).toBe('d1');
  });

  it('appends to dislikes on left swipe', () => {
    const s = createSwipeSession();
    const next = applySwipe(s, d(), 'dislike');
    expect(next.dislikes).toHaveLength(1);
    expect(next.likes).toHaveLength(0);
  });

  it('adds dish vector fully on like', () => {
    const s = createSwipeSession();
    const next = applySwipe(s, d({ flavor: { sweet: 4, sour: 1, salty: 1, bitter: 0, umami: 0, heat: 0, richness: 2 } }), 'like');
    expect(next.tasteVector).toEqual([4, 1, 1, 0, 0, 0, 2]);
  });

  it('subtracts dish vector at 30% weight on dislike', () => {
    const s = createSwipeSession();
    const next = applySwipe(s, d({ flavor: { sweet: 10, sour: 0, salty: 0, bitter: 0, umami: 0, heat: 0, richness: 0 } }), 'dislike');
    expect(next.tasteVector[0]).toBeCloseTo(-3, 10);
  });

  it('adds dish id to seenDishIds', () => {
    const s = createSwipeSession();
    const next = applySwipe(s, d({ id: 'abc' }), 'like');
    expect(next.seenDishIds).toEqual(['abc']);
  });

  it('increments categorical seen counter on any swipe', () => {
    const s = createSwipeSession();
    const next = applySwipe(s, d(), 'dislike');
    expect(next.categoricalCounts.cuisine_region.southeast_asian.seen).toBe(1);
    expect(next.categoricalCounts.cuisine_region.southeast_asian.liked).toBe(0);
    expect(next.categoricalCounts.meal_types.dessert.seen).toBe(1);
    expect(next.categoricalCounts.textures.creamy.seen).toBe(1);
  });

  it('increments categorical liked counter on like', () => {
    const s = createSwipeSession();
    const next = applySwipe(s, d(), 'like');
    expect(next.categoricalCounts.cuisine_region.southeast_asian.liked).toBe(1);
    expect(next.categoricalCounts.meal_types.dessert.liked).toBe(1);
  });

  it('does not mutate the input session', () => {
    const s = createSwipeSession();
    const originalLikes = s.likes;
    applySwipe(s, d(), 'like');
    expect(s.likes).toBe(originalLikes);
    expect(s.likes).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd mobile
npm test -- session/__tests__/mutations.test.ts
```

- [ ] **Step 3: Implement mutations**

Create `mobile/src/domain/session/mutations.ts`:

```ts
import { addVectors, dishToVector, scaleVector } from '@/shared/utils/vector';
import type { Dish } from '@/domain/dish/types';
import type { SwipeSession, CategoricalCounts } from './types';

export type SwipeDirection = 'like' | 'dislike';

const DISLIKE_WEIGHT = 0.3;

const updateCategoricalCounts = (
  counts: CategoricalCounts,
  dish: Dish,
  liked: boolean,
): CategoricalCounts => {
  const bump = (prev: { liked: number; seen: number }) => ({
    liked: prev.liked + (liked ? 1 : 0),
    seen: prev.seen + 1,
  });
  return {
    cuisine_region: {
      ...counts.cuisine_region,
      [dish.cuisine_region]: bump(counts.cuisine_region[dish.cuisine_region]),
    },
    meal_types: dish.meal_types.reduce(
      (acc, m) => ({ ...acc, [m]: bump(acc[m]) }),
      { ...counts.meal_types },
    ),
    textures: dish.textures.reduce(
      (acc, t) => ({ ...acc, [t]: bump(acc[t]) }),
      { ...counts.textures },
    ),
  };
};

export const applySwipe = (
  session: SwipeSession,
  dish: Dish,
  direction: SwipeDirection,
): SwipeSession => {
  const event = { dishId: dish.id, timestamp: Date.now() };
  const dishVec = dishToVector(dish);
  const delta = direction === 'like' ? dishVec : scaleVector(dishVec, -DISLIKE_WEIGHT);
  return {
    ...session,
    likes: direction === 'like' ? [...session.likes, event] : session.likes,
    dislikes: direction === 'dislike' ? [...session.dislikes, event] : session.dislikes,
    seenDishIds: [...session.seenDishIds, dish.id],
    tasteVector: addVectors(session.tasteVector, delta),
    categoricalCounts: updateCategoricalCounts(
      session.categoricalCounts,
      dish,
      direction === 'like',
    ),
  };
};
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd mobile
npm test -- session/__tests__/mutations.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add mobile/src/domain/session/mutations.ts mobile/src/domain/session/__tests__/mutations.test.ts
git commit -m "feat(mobile): pure applySwipe session mutation"
```

---

### Task 14: Session store (Zustand with persistence)

**Files:**
- Create: `mobile/src/domain/session/store.ts`
- Create: `mobile/src/domain/session/__tests__/store.test.ts`

- [ ] **Step 1: Write failing tests**

Create `mobile/src/domain/session/__tests__/store.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSessionStore } from '@/domain/session/store';
import type { Dish } from '@/domain/dish/types';

const testDish: Dish = {
  id: 'd1', name: 'Test', description: '', country: 'TH',
  cuisine_region: 'southeast_asian',
  flavor: { sweet: 3, sour: 1, salty: 1, bitter: 0, umami: 0, heat: 0, richness: 0 },
  textures: ['chewy'], meal_types: ['dessert'],
  temperature: 'cold', typical_time: 'any',
  contains: {
    gluten: false, dairy: false, seafood: false, nuts: false,
    eggs: false, pork: false, beef: false, alcohol: false,
  },
  diet_compatible: ['vegetarian'], price_tier: 2, prep_complexity: 'low',
  popularity: 3, image_url: '', image_blurhash: '', tags: [],
};

describe('useSessionStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useSessionStore.setState(useSessionStore.getInitialState());
  });

  it('starts with no session', () => {
    expect(useSessionStore.getState().session).toBeNull();
  });

  it('startNewSession creates one', async () => {
    await useSessionStore.getState().startNewSession();
    expect(useSessionStore.getState().session?.status).toBe('active');
  });

  it('recordSwipe updates likes and persists', async () => {
    await useSessionStore.getState().startNewSession();
    await useSessionStore.getState().recordSwipe(testDish, 'like');
    expect(useSessionStore.getState().session?.likes).toHaveLength(1);
    const stored = JSON.parse((await AsyncStorage.getItem('munch:session'))!);
    expect(stored.likes).toHaveLength(1);
  });

  it('completeWithMatch marks session completed', async () => {
    await useSessionStore.getState().startNewSession();
    await useSessionStore.getState().completeWithMatch({
      top3: [], spread: 0,
    });
    expect(useSessionStore.getState().session?.status).toBe('completed');
    expect(useSessionStore.getState().session?.matchRevealsShown).toBe(1);
  });

  it('continueSwiping advances targets', async () => {
    await useSessionStore.getState().startNewSession();
    await useSessionStore.getState().completeWithMatch({ top3: [], spread: 0 });
    await useSessionStore.getState().continueSwiping();
    const s = useSessionStore.getState().session!;
    expect(s.status).toBe('active');
    expect(s.likesTargetForNextMatch).toBe(20);
    expect(s.swipeCapForNextMatch).toBe(70);
  });

  it('resetSession clears it', async () => {
    await useSessionStore.getState().startNewSession();
    await useSessionStore.getState().resetSession();
    expect(useSessionStore.getState().session).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd mobile
npm test -- session/__tests__/store.test.ts
```

- [ ] **Step 3: Implement the store**

Create `mobile/src/domain/session/store.ts`:

```ts
import { create } from 'zustand';
import { Storage } from '@/shared/utils/storage';
import type { Dish } from '@/domain/dish/types';
import { createSwipeSession } from './factory';
import { applySwipe, type SwipeDirection } from './mutations';
import type { MatchResult, SwipeSession } from './types';

const storage = new Storage<SwipeSession>({
  key: 'munch:session',
  currentVersion: 1,
  defaultValue: createSwipeSession(),
  migrate: (raw) => {
    if (raw && typeof raw === 'object' && 'schemaVersion' in raw) {
      return raw as SwipeSession;
    }
    throw new Error('unrecognized session shape');
  },
});

type SessionState = {
  session: SwipeSession | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  startNewSession: () => Promise<void>;
  recordSwipe: (dish: Dish, direction: SwipeDirection) => Promise<void>;
  completeWithMatch: (match: MatchResult) => Promise<void>;
  continueSwiping: () => Promise<void>;
  resetSession: () => Promise<void>;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  hydrated: false,
  hydrate: async () => {
    const stored = await storage.read();
    // Only keep the stored session if it looks real (has been interacted with)
    const session = stored.seenDishIds.length === 0 && stored.likes.length === 0
      ? null
      : stored;
    set({ session, hydrated: true });
  },
  startNewSession: async () => {
    const session = createSwipeSession();
    await storage.write(session);
    set({ session });
  },
  recordSwipe: async (dish, direction) => {
    const current = get().session;
    if (!current) return;
    const next = applySwipe(current, dish, direction);
    await storage.write(next);
    set({ session: next });
  },
  completeWithMatch: async (match) => {
    const current = get().session;
    if (!current) return;
    const next: SwipeSession = {
      ...current,
      status: 'completed',
      completedMatch: match,
      matchRevealsShown: current.matchRevealsShown + 1,
    };
    await storage.write(next);
    set({ session: next });
  },
  continueSwiping: async () => {
    const current = get().session;
    if (!current) return;
    const next: SwipeSession = {
      ...current,
      status: 'active',
      likesTargetForNextMatch: current.likesTargetForNextMatch + 10,
      swipeCapForNextMatch: current.swipeCapForNextMatch + 30,
      completedMatch: undefined,
    };
    await storage.write(next);
    set({ session: next });
  },
  resetSession: async () => {
    await storage.clear();
    set({ session: null });
  },
}));
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd mobile
npm test -- session/__tests__/store.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add mobile/src/domain/session/store.ts mobile/src/domain/session/__tests__/store.test.ts
git commit -m "feat(mobile): session store with persistence and Keep-Swiping scaling"
```

---

### Task 15: LikedHistory store

**Files:**
- Create: `mobile/src/domain/session/history.ts`
- Create: `mobile/src/domain/session/__tests__/history.test.ts`

- [ ] **Step 1: Write failing tests**

Create `mobile/src/domain/session/__tests__/history.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLikedHistoryStore } from '@/domain/session/history';

describe('useLikedHistoryStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useLikedHistoryStore.setState(useLikedHistoryStore.getInitialState());
  });

  it('starts empty', () => {
    expect(useLikedHistoryStore.getState().history.events).toEqual([]);
  });

  it('recordLike appends event and persists', async () => {
    await useLikedHistoryStore.getState().recordLike('dish1', 'session1');
    expect(useLikedHistoryStore.getState().history.events).toHaveLength(1);
    const stored = JSON.parse((await AsyncStorage.getItem('munch:likedHistory'))!);
    expect(stored.events).toHaveLength(1);
    expect(stored.events[0].dishId).toBe('dish1');
  });

  it('reset clears history', async () => {
    await useLikedHistoryStore.getState().recordLike('dish1', 's1');
    await useLikedHistoryStore.getState().reset();
    expect(useLikedHistoryStore.getState().history.events).toEqual([]);
  });

  it('hydrate restores from storage', async () => {
    await AsyncStorage.setItem('munch:likedHistory', JSON.stringify({
      events: [{ dishId: 'x', sessionId: 's', likedAt: 1 }],
      schemaVersion: 1,
    }));
    await useLikedHistoryStore.getState().hydrate();
    expect(useLikedHistoryStore.getState().history.events).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd mobile
npm test -- session/__tests__/history.test.ts
```

- [ ] **Step 3: Implement the store**

Create `mobile/src/domain/session/history.ts`:

```ts
import { create } from 'zustand';
import { Storage } from '@/shared/utils/storage';
import type { LikedHistory } from './types';

const DEFAULT_HISTORY: LikedHistory = { events: [], schemaVersion: 1 };

const storage = new Storage<LikedHistory>({
  key: 'munch:likedHistory',
  currentVersion: 1,
  defaultValue: DEFAULT_HISTORY,
  migrate: (raw) => {
    if (raw && typeof raw === 'object' && 'schemaVersion' in raw) {
      return raw as LikedHistory;
    }
    throw new Error('unrecognized history shape');
  },
});

type HistoryState = {
  history: LikedHistory;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  recordLike: (dishId: string, sessionId: string) => Promise<void>;
  reset: () => Promise<void>;
};

export const useLikedHistoryStore = create<HistoryState>((set, get) => ({
  history: DEFAULT_HISTORY,
  hydrated: false,
  hydrate: async () => {
    const history = await storage.read();
    set({ history, hydrated: true });
  },
  recordLike: async (dishId, sessionId) => {
    const next: LikedHistory = {
      ...get().history,
      events: [...get().history.events, { dishId, sessionId, likedAt: Date.now() }],
    };
    await storage.write(next);
    set({ history: next });
  },
  reset: async () => {
    await storage.clear();
    set({ history: DEFAULT_HISTORY });
  },
}));
```

- [ ] **Step 4: Run tests**

```bash
cd mobile
npm test -- session/__tests__/history.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add mobile/src/domain/session/history.ts mobile/src/domain/session/__tests__/history.test.ts
git commit -m "feat(mobile): liked history store (all-time)"
```

---

## Phase 3: Recommendation engine

### Task 16: FlavorSimilarityScorer

**Files:**
- Create: `mobile/src/domain/recommendation/scorers/flavorSimilarity.ts`
- Create: `mobile/src/domain/recommendation/scorers/__tests__/flavorSimilarity.test.ts`

- [ ] **Step 1: Write failing tests**

Create `mobile/src/domain/recommendation/scorers/__tests__/flavorSimilarity.test.ts`:

```ts
import { FlavorSimilarityScorer } from '@/domain/recommendation/scorers/flavorSimilarity';
import { createSwipeSession } from '@/domain/session/factory';
import { zeroVector } from '@/shared/utils/vector';
import type { ScoringContext } from '@/domain/recommendation/types';
import type { Dish } from '@/domain/dish/types';

const dish = (flavor: Dish['flavor'], overrides: Partial<Dish> = {}): Dish => ({
  id: 'd', name: '', description: '', country: 'US', cuisine_region: 'north_american',
  flavor,
  textures: [], meal_types: [], temperature: 'room', typical_time: 'any',
  contains: {
    gluten: false, dairy: false, seafood: false, nuts: false,
    eggs: false, pork: false, beef: false, alcohol: false,
  },
  diet_compatible: [], price_tier: 2, prep_complexity: 'low',
  popularity: 3, image_url: '', image_blurhash: '', tags: [],
  ...overrides,
});

const ctx = (tasteVector: number[], d: Dish): ScoringContext => ({
  user: { tasteVector, categoricalCounts: createSwipeSession().categoricalCounts },
  dish: d,
  session: createSwipeSession(),
  now: new Date(),
});

describe('FlavorSimilarityScorer', () => {
  it('has id "flavor_similarity" and weight 0.7', () => {
    const s = new FlavorSimilarityScorer();
    expect(s.id).toBe('flavor_similarity');
    expect(s.weight).toBe(0.7);
  });

  it('returns popularity-based cold-start score when user has zero taste vector', () => {
    const s = new FlavorSimilarityScorer();
    const d = dish({ sweet: 3, sour: 1, salty: 1, bitter: 0, umami: 0, heat: 0, richness: 0 }, { popularity: 5 });
    const score = s.score(ctx(zeroVector(), d));
    expect(score).toBe(1);
  });

  it('returns cosine similarity when taste vector is non-zero', () => {
    const s = new FlavorSimilarityScorer();
    const d = dish({ sweet: 4, sour: 0, salty: 0, bitter: 0, umami: 0, heat: 0, richness: 0 });
    const score = s.score(ctx([4, 0, 0, 0, 0, 0, 0], d));
    expect(score).toBeCloseTo(1, 10);
  });

  it('returns within [0, 1]', () => {
    const s = new FlavorSimilarityScorer();
    const d = dish({ sweet: -10, sour: 0, salty: 0, bitter: 0, umami: 0, heat: 0, richness: 0 } as any);
    const score = s.score(ctx([5, 5, 5, 5, 5, 5, 5], d));
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd mobile
npm test -- flavorSimilarity.test.ts
```

- [ ] **Step 3: Implement the scorer**

Create `mobile/src/domain/recommendation/scorers/flavorSimilarity.ts`:

```ts
import { cosineSimilarity, dishToVector } from '@/shared/utils/vector';
import type { Scorer, ScoringContext } from '@/domain/recommendation/types';

export class FlavorSimilarityScorer implements Scorer {
  readonly id = 'flavor_similarity';
  readonly weight = 0.7;

  score(ctx: ScoringContext): number {
    const hasTaste = ctx.user.tasteVector.some(v => v !== 0);
    if (!hasTaste) {
      // Cold-start: use popularity as proxy
      return ctx.dish.popularity / 5;
    }
    return cosineSimilarity(ctx.user.tasteVector, dishToVector(ctx.dish));
  }
}
```

- [ ] **Step 4: Run tests**

```bash
cd mobile
npm test -- flavorSimilarity.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add mobile/src/domain/recommendation/scorers/flavorSimilarity.ts mobile/src/domain/recommendation/scorers/__tests__/flavorSimilarity.test.ts
git commit -m "feat(mobile): FlavorSimilarityScorer with cold-start fallback"
```

---

### Task 17: CategoricalAffinityScorer

**Files:**
- Create: `mobile/src/domain/recommendation/scorers/categoricalAffinity.ts`
- Create: `mobile/src/domain/recommendation/scorers/__tests__/categoricalAffinity.test.ts`

- [ ] **Step 1: Write failing tests**

Create `mobile/src/domain/recommendation/scorers/__tests__/categoricalAffinity.test.ts`:

```ts
import { CategoricalAffinityScorer } from '@/domain/recommendation/scorers/categoricalAffinity';
import { createSwipeSession } from '@/domain/session/factory';
import type { ScoringContext } from '@/domain/recommendation/types';
import type { Dish } from '@/domain/dish/types';

const dish = (overrides: Partial<Dish> = {}): Dish => ({
  id: 'd', name: '', description: '',
  country: 'TH', cuisine_region: 'southeast_asian',
  flavor: { sweet: 0, sour: 0, salty: 0, bitter: 0, umami: 0, heat: 0, richness: 0 },
  textures: ['creamy'], meal_types: ['dessert'],
  temperature: 'room', typical_time: 'any',
  contains: {
    gluten: false, dairy: false, seafood: false, nuts: false,
    eggs: false, pork: false, beef: false, alcohol: false,
  },
  diet_compatible: [], price_tier: 2, prep_complexity: 'low',
  popularity: 3, image_url: '', image_blurhash: '', tags: [],
  ...overrides,
});

describe('CategoricalAffinityScorer', () => {
  it('has id "categorical_affinity" and weight 0.3', () => {
    const s = new CategoricalAffinityScorer();
    expect(s.id).toBe('categorical_affinity');
    expect(s.weight).toBe(0.3);
  });

  it('returns 0.5 when nothing has been seen (neutral)', () => {
    const s = new CategoricalAffinityScorer();
    const session = createSwipeSession();
    const d = dish();
    const ctx: ScoringContext = {
      user: { tasteVector: [0,0,0,0,0,0,0], categoricalCounts: session.categoricalCounts },
      dish: d, session, now: new Date(),
    };
    expect(s.score(ctx)).toBeCloseTo(0.5, 10);
  });

  it('scores higher when liked region ratio is high', () => {
    const s = new CategoricalAffinityScorer();
    const session = createSwipeSession();
    session.categoricalCounts.cuisine_region.southeast_asian = { liked: 4, seen: 5 };
    const d = dish();
    const ctx: ScoringContext = {
      user: { tasteVector: [0,0,0,0,0,0,0], categoricalCounts: session.categoricalCounts },
      dish: d, session, now: new Date(),
    };
    expect(s.score(ctx)).toBeGreaterThan(0.5);
  });

  it('averages region, meal_type, and texture scores', () => {
    const s = new CategoricalAffinityScorer();
    const session = createSwipeSession();
    // region: 1.0, meal_type dessert: 0.5 (unseen), texture creamy: 0.0 → avg = 0.5
    session.categoricalCounts.cuisine_region.southeast_asian = { liked: 2, seen: 2 };
    session.categoricalCounts.textures.creamy = { liked: 0, seen: 5 };
    const d = dish();
    const ctx: ScoringContext = {
      user: { tasteVector: [0,0,0,0,0,0,0], categoricalCounts: session.categoricalCounts },
      dish: d, session, now: new Date(),
    };
    expect(s.score(ctx)).toBeCloseTo(0.5, 10);
  });

  it('stays in [0, 1]', () => {
    const s = new CategoricalAffinityScorer();
    const session = createSwipeSession();
    session.categoricalCounts.cuisine_region.southeast_asian = { liked: 100, seen: 100 };
    const d = dish();
    const ctx: ScoringContext = {
      user: { tasteVector: [0,0,0,0,0,0,0], categoricalCounts: session.categoricalCounts },
      dish: d, session, now: new Date(),
    };
    const result = s.score(ctx);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd mobile
npm test -- categoricalAffinity.test.ts
```

- [ ] **Step 3: Implement the scorer**

Create `mobile/src/domain/recommendation/scorers/categoricalAffinity.ts`:

```ts
import type { Scorer, ScoringContext } from '@/domain/recommendation/types';

const DEFAULT_UNSEEN = 0.5;

const ratio = (counts: { liked: number; seen: number }): number =>
  counts.seen === 0 ? DEFAULT_UNSEEN : counts.liked / counts.seen;

const avg = (values: number[]): number =>
  values.length === 0 ? DEFAULT_UNSEEN : values.reduce((a, b) => a + b, 0) / values.length;

export class CategoricalAffinityScorer implements Scorer {
  readonly id = 'categorical_affinity';
  readonly weight = 0.3;

  score(ctx: ScoringContext): number {
    const { dish, user } = ctx;
    const regionScore = ratio(user.categoricalCounts.cuisine_region[dish.cuisine_region]);
    const mealScores = dish.meal_types.map(m => ratio(user.categoricalCounts.meal_types[m]));
    const textureScores = dish.textures.map(t => ratio(user.categoricalCounts.textures[t]));
    return avg([regionScore, avg(mealScores), avg(textureScores)]);
  }
}
```

- [ ] **Step 4: Run tests**

```bash
cd mobile
npm test -- categoricalAffinity.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add mobile/src/domain/recommendation/scorers/categoricalAffinity.ts mobile/src/domain/recommendation/scorers/__tests__/categoricalAffinity.test.ts
git commit -m "feat(mobile): CategoricalAffinityScorer"
```

---

### Task 18: PopularityTieBreakerScorer

**Files:**
- Create: `mobile/src/domain/recommendation/scorers/popularityTieBreaker.ts`
- Create: `mobile/src/domain/recommendation/scorers/__tests__/popularityTieBreaker.test.ts`

- [ ] **Step 1: Write failing tests**

Create `mobile/src/domain/recommendation/scorers/__tests__/popularityTieBreaker.test.ts`:

```ts
import { PopularityTieBreakerScorer } from '@/domain/recommendation/scorers/popularityTieBreaker';
import { createSwipeSession } from '@/domain/session/factory';
import type { ScoringContext } from '@/domain/recommendation/types';
import type { Dish } from '@/domain/dish/types';

const dish = (pop: 1|2|3|4|5): Dish => ({
  id: 'd', name: '', description: '', country: 'US', cuisine_region: 'north_american',
  flavor: { sweet: 0, sour: 0, salty: 0, bitter: 0, umami: 0, heat: 0, richness: 0 },
  textures: [], meal_types: [], temperature: 'room', typical_time: 'any',
  contains: {
    gluten: false, dairy: false, seafood: false, nuts: false,
    eggs: false, pork: false, beef: false, alcohol: false,
  },
  diet_compatible: [], price_tier: 2, prep_complexity: 'low',
  popularity: pop, image_url: '', image_blurhash: '', tags: [],
});

describe('PopularityTieBreakerScorer', () => {
  it('has id and small weight 0.05', () => {
    const s = new PopularityTieBreakerScorer();
    expect(s.id).toBe('popularity_tie_breaker');
    expect(s.weight).toBe(0.05);
  });

  it('returns popularity / 5', () => {
    const s = new PopularityTieBreakerScorer();
    const session = createSwipeSession();
    const ctx = (d: Dish): ScoringContext => ({
      user: { tasteVector: [0,0,0,0,0,0,0], categoricalCounts: session.categoricalCounts },
      dish: d, session, now: new Date(),
    });
    expect(s.score(ctx(dish(1)))).toBe(0.2);
    expect(s.score(ctx(dish(5)))).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd mobile
npm test -- popularityTieBreaker.test.ts
```

- [ ] **Step 3: Implement the scorer**

Create `mobile/src/domain/recommendation/scorers/popularityTieBreaker.ts`:

```ts
import type { Scorer, ScoringContext } from '@/domain/recommendation/types';

export class PopularityTieBreakerScorer implements Scorer {
  readonly id = 'popularity_tie_breaker';
  readonly weight = 0.05;

  score(ctx: ScoringContext): number {
    return ctx.dish.popularity / 5;
  }
}
```

- [ ] **Step 4: Run tests**

```bash
cd mobile
npm test -- popularityTieBreaker.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add mobile/src/domain/recommendation/scorers/popularityTieBreaker.ts mobile/src/domain/recommendation/scorers/__tests__/popularityTieBreaker.test.ts
git commit -m "feat(mobile): PopularityTieBreakerScorer"
```

---

### Task 19: RecommendationEngine (ranking, nextDish, matchTop3)

**Files:**
- Create: `mobile/src/domain/recommendation/engine.ts`
- Create: `mobile/src/domain/recommendation/__tests__/engine.test.ts`

- [ ] **Step 1: Write failing tests**

Create `mobile/src/domain/recommendation/__tests__/engine.test.ts`:

```ts
import { RecommendationEngine } from '@/domain/recommendation/engine';
import { FlavorSimilarityScorer } from '@/domain/recommendation/scorers/flavorSimilarity';
import { CategoricalAffinityScorer } from '@/domain/recommendation/scorers/categoricalAffinity';
import { PopularityTieBreakerScorer } from '@/domain/recommendation/scorers/popularityTieBreaker';
import { createSwipeSession } from '@/domain/session/factory';
import type { Dish, CuisineRegion } from '@/domain/dish/types';
import type { Scorer } from '@/domain/recommendation/types';

const dish = (id: string, popularity: 1|2|3|4|5 = 3, region: CuisineRegion = 'north_american'): Dish => ({
  id, name: id, description: '',
  country: 'US', cuisine_region: region,
  flavor: { sweet: 0, sour: 0, salty: 0, bitter: 0, umami: 0, heat: 0, richness: 0 },
  textures: [], meal_types: [], temperature: 'room', typical_time: 'any',
  contains: {
    gluten: false, dairy: false, seafood: false, nuts: false,
    eggs: false, pork: false, beef: false, alcohol: false,
  },
  diet_compatible: [], price_tier: 2, prep_complexity: 'low',
  popularity, image_url: '', image_blurhash: '', tags: [],
});

const session = createSwipeSession();
const baseCtx = { user: { tasteVector: session.tasteVector, categoricalCounts: session.categoricalCounts }, session, now: new Date() };

describe('RecommendationEngine', () => {
  it('ranks dishes by combined score (popularity breaks ties at cold start)', () => {
    const engine = new RecommendationEngine([
      new FlavorSimilarityScorer(),
      new CategoricalAffinityScorer(),
      new PopularityTieBreakerScorer(),
    ]);
    const dishes = [dish('low', 1), dish('high', 5), dish('mid', 3)];
    const ranked = engine.rankDishes(dishes, baseCtx);
    expect(ranked[0].dish.id).toBe('high');
    expect(ranked[2].dish.id).toBe('low');
  });

  it('matchTop3 returns top 3 by score with percents', () => {
    const engine = new RecommendationEngine([
      new FlavorSimilarityScorer(),
    ]);
    const dishes = [dish('a', 5), dish('b', 4), dish('c', 3), dish('d', 2)];
    const match = engine.matchTop3(dishes, baseCtx);
    expect(match.top3).toHaveLength(3);
    expect(match.top3[0].dish.id).toBe('a');
    expect(match.top3[0].matchPercent).toBe(100);
    expect(match.top3[2].dish.id).toBe('c');
    expect(match.spread).toBeCloseTo(0.4, 10);
  });

  it('handles empty candidate list in matchTop3 gracefully', () => {
    const engine = new RecommendationEngine([new FlavorSimilarityScorer()]);
    expect(engine.matchTop3([], baseCtx).top3).toEqual([]);
  });

  it('nextDish picks from top 20% (deterministic with rng injection)', () => {
    const engine = new RecommendationEngine([new FlavorSimilarityScorer()]);
    const dishes = Array.from({ length: 10 }, (_, i) => dish(`d${i}`, (5 - Math.floor(i / 2)) as any));
    // Inject rng that always picks index 0 of the shuffled top slice
    const next = engine.nextDish(dishes, baseCtx, () => 0);
    expect(dishes.slice(0, 2).map(d => d.id)).toContain(next.id);
  });

  it('nextDish throws when candidate list is empty', () => {
    const engine = new RecommendationEngine([new FlavorSimilarityScorer()]);
    expect(() => engine.nextDish([], baseCtx)).toThrow();
  });

  it('combines scores by weight', () => {
    const s1: Scorer = { id: 'a', weight: 0.5, score: () => 1 };
    const s2: Scorer = { id: 'b', weight: 0.5, score: () => 0 };
    const engine = new RecommendationEngine([s1, s2]);
    const ranked = engine.rankDishes([dish('x')], baseCtx);
    expect(ranked[0].score).toBeCloseTo(0.5, 10);
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd mobile
npm test -- recommendation/__tests__/engine.test.ts
```

- [ ] **Step 3: Implement the engine**

Create `mobile/src/domain/recommendation/engine.ts`:

```ts
import type { Dish } from '@/domain/dish/types';
import type { MatchResult, Ranking, Scorer, ScoringContext } from './types';

export class RecommendationEngine {
  constructor(private readonly scorers: Scorer[]) {
    if (scorers.length === 0) throw new Error('RecommendationEngine requires at least one scorer');
  }

  private computeScore(ctx: ScoringContext): number {
    let totalWeight = 0;
    let weighted = 0;
    for (const scorer of this.scorers) {
      weighted += scorer.score(ctx) * scorer.weight;
      totalWeight += scorer.weight;
    }
    return totalWeight === 0 ? 0 : weighted / totalWeight;
  }

  rankDishes(
    candidates: Dish[],
    ctx: Omit<ScoringContext, 'dish'>,
  ): Ranking[] {
    return candidates
      .map(dish => ({ dish, score: this.computeScore({ ...ctx, dish }) }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Picks from the top 20% with weighted randomness. Pass a custom rng
   * (function returning [0,1)) for testing; defaults to Math.random.
   */
  nextDish(
    candidates: Dish[],
    ctx: Omit<ScoringContext, 'dish'>,
    rng: () => number = Math.random,
  ): Dish {
    if (candidates.length === 0) throw new Error('nextDish: no candidates');
    const ranked = this.rankDishes(candidates, ctx);
    const sliceSize = Math.max(3, Math.floor(ranked.length * 0.2));
    const topSlice = ranked.slice(0, Math.min(sliceSize, ranked.length));
    const idx = Math.floor(rng() * topSlice.length);
    return topSlice[idx].dish;
  }

  matchTop3(
    candidates: Dish[],
    ctx: Omit<ScoringContext, 'dish'>,
  ): MatchResult {
    const ranked = this.rankDishes(candidates, ctx);
    const top3 = ranked.slice(0, 3).map(r => ({
      dish: r.dish,
      matchPercent: Math.round(r.score * 100),
    }));
    const spread = ranked.length >= 3 ? ranked[0].score - ranked[2].score : 0;
    return { top3, spread };
  }
}
```

- [ ] **Step 4: Run tests**

```bash
cd mobile
npm test -- recommendation/__tests__/engine.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add mobile/src/domain/recommendation/engine.ts mobile/src/domain/recommendation/__tests__/engine.test.ts
git commit -m "feat(mobile): RecommendationEngine with pluggable scorers"
```

---

### Task 20: Match confidence utility

**Files:**
- Create: `mobile/src/domain/recommendation/confidence.ts`
- Create: `mobile/src/domain/recommendation/__tests__/confidence.test.ts`

- [ ] **Step 1: Write failing tests**

Create `mobile/src/domain/recommendation/__tests__/confidence.test.ts`:

```ts
import { computeMatchConfidence } from '@/domain/recommendation/confidence';

describe('computeMatchConfidence', () => {
  it('returns 0 when all scores are identical (maximum entropy)', () => {
    const scores = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    expect(computeMatchConfidence(scores)).toBeCloseTo(0, 2);
  });

  it('returns close to 1 when one score dominates', () => {
    const scores = [0.99, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01];
    expect(computeMatchConfidence(scores)).toBeGreaterThan(0.7);
  });

  it('stays in [0, 1]', () => {
    expect(computeMatchConfidence([0.3, 0.2, 0.1])).toBeGreaterThanOrEqual(0);
    expect(computeMatchConfidence([0.3, 0.2, 0.1])).toBeLessThanOrEqual(1);
  });

  it('returns 0 for empty input', () => {
    expect(computeMatchConfidence([])).toBe(0);
  });

  it('returns 1 for single-score input', () => {
    expect(computeMatchConfidence([0.8])).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd mobile
npm test -- confidence.test.ts
```

- [ ] **Step 3: Implement the utility**

Create `mobile/src/domain/recommendation/confidence.ts`:

```ts
/**
 * Compute match confidence from the top-N dish scores.
 * Returns 1 - normalized entropy. When scores are spread evenly,
 * entropy is max and confidence is low. When one score dominates,
 * entropy is low and confidence is high.
 */
export const computeMatchConfidence = (scores: number[]): number => {
  if (scores.length === 0) return 0;
  if (scores.length === 1) return 1;
  const sum = scores.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;
  const probs = scores.map(s => s / sum);
  const entropy = -probs.reduce((acc, p) => acc + (p > 0 ? p * Math.log(p) : 0), 0);
  const maxEntropy = Math.log(scores.length);
  return 1 - entropy / maxEntropy;
};
```

- [ ] **Step 4: Run tests**

```bash
cd mobile
npm test -- confidence.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add mobile/src/domain/recommendation/confidence.ts mobile/src/domain/recommendation/__tests__/confidence.test.ts
git commit -m "feat(mobile): match confidence (entropy-based)"
```

---

### Task 21: Engine factory — wire default scorers

**Files:**
- Create: `mobile/src/domain/recommendation/defaultEngine.ts`

- [ ] **Step 1: Create factory**

Create `mobile/src/domain/recommendation/defaultEngine.ts`:

```ts
import { RecommendationEngine } from './engine';
import { FlavorSimilarityScorer } from './scorers/flavorSimilarity';
import { CategoricalAffinityScorer } from './scorers/categoricalAffinity';
import { PopularityTieBreakerScorer } from './scorers/popularityTieBreaker';

export const createDefaultEngine = (): RecommendationEngine =>
  new RecommendationEngine([
    new FlavorSimilarityScorer(),
    new CategoricalAffinityScorer(),
    new PopularityTieBreakerScorer(),
  ]);
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/domain/recommendation/defaultEngine.ts
git commit -m "feat(mobile): default engine factory"
```

---

## Phase 4: Design tokens and shared UI primitives

### Task 22: Theme tokens

**Files:**
- Create: `mobile/src/shared/theme/colors.ts`
- Create: `mobile/src/shared/theme/typography.ts`
- Create: `mobile/src/shared/theme/spacing.ts`
- Create: `mobile/src/shared/theme/index.ts`

- [ ] **Step 1: Create color tokens**

Create `mobile/src/shared/theme/colors.ts`:

```ts
export const colors = {
  primary: '#f27f0d',
  primaryDim: 'rgba(242, 127, 13, 0.1)',
  backgroundLight: '#f8f7f5',
  backgroundDark: '#221910',
  textPrimary: '#1a1a1a',
  textSecondary: '#666666',
  textMuted: '#8e8e93',
  surfaceLight: '#ffffff',
  surfaceDark: 'rgba(34, 25, 16, 0.5)',
  divider: 'rgba(242, 127, 13, 0.1)',
  success: '#10b981',
  danger: '#ef4444',
  cinemaGold: '#f8e7c9',
} as const;

export type ColorKey = keyof typeof colors;
```

- [ ] **Step 2: Create typography tokens**

Create `mobile/src/shared/theme/typography.ts`:

```ts
export const typography = {
  fontFamily: {
    display: 'PlusJakartaSans_700Bold',
    body: 'PlusJakartaSans_500Medium',
    regular: 'PlusJakartaSans_400Regular',
    bold: 'PlusJakartaSans_700Bold',
    extraBold: 'PlusJakartaSans_800ExtraBold',
  },
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 22,
    '2xl': 28,
    '3xl': 36,
    '4xl': 44,
  },
  lineHeight: {
    tight: 1.15,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;
```

- [ ] **Step 3: Create spacing + radius tokens**

Create `mobile/src/shared/theme/spacing.ts`:

```ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const shadow = {
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  primary: {
    shadowColor: '#f27f0d',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
```

- [ ] **Step 4: Create theme barrel**

Create `mobile/src/shared/theme/index.ts`:

```ts
export { colors } from './colors';
export { typography } from './typography';
export { spacing, radius, shadow } from './spacing';
```

- [ ] **Step 5: Install Plus Jakarta Sans font**

```bash
cd mobile
npx expo install expo-font @expo-google-fonts/plus-jakarta-sans
```

- [ ] **Step 6: Commit**

```bash
git add mobile/src/shared/theme/ mobile/package.json mobile/package-lock.json
git commit -m "feat(mobile): theme tokens and Plus Jakarta Sans font"
```

---

### Task 23: Button component

**Files:**
- Create: `mobile/src/shared/components/Button.tsx`
- Create: `mobile/src/shared/components/__tests__/Button.test.tsx`

- [ ] **Step 1: Write test**

Create `mobile/src/shared/components/__tests__/Button.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/shared/components/Button';

describe('Button', () => {
  it('renders label and fires onPress', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Tap" onPress={onPress} />);
    fireEvent.press(getByText('Tap'));
    expect(onPress).toHaveBeenCalled();
  });

  it('does not fire onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Tap" onPress={onPress} disabled />);
    fireEvent.press(getByText('Tap'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd mobile
npm test -- Button.test.tsx
```

- [ ] **Step 3: Implement component**

Create `mobile/src/shared/components/Button.tsx`:

```tsx
import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { colors, radius, spacing, typography } from '@/shared/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
};

export const Button: React.FC<Props> = ({
  label, onPress, variant = 'primary', size = 'md',
  disabled, loading, leftIcon, rightIcon, style,
}) => {
  const containerStyle = [
    styles.base,
    styles[`${size}Size`],
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'ghost' && styles.ghost,
    disabled && styles.disabled,
    style,
  ];
  const textStyle: TextStyle[] = [
    styles.labelBase,
    styles[`${size}Label`],
    variant === 'primary' && styles.primaryLabel,
    variant === 'secondary' && styles.secondaryLabel,
    variant === 'ghost' && styles.ghostLabel,
  ];
  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.primary} />
        : <>
            {leftIcon}
            <Text style={textStyle}>{label}</Text>
            {rightIcon}
          </>
      }
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, borderRadius: radius.lg,
  },
  smSize: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  mdSize: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  lgSize: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.divider },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  labelBase: { fontFamily: typography.fontFamily.bold },
  smLabel: { fontSize: typography.sizes.sm },
  mdLabel: { fontSize: typography.sizes.md },
  lgLabel: { fontSize: typography.sizes.lg },
  primaryLabel: { color: '#fff' },
  secondaryLabel: { color: colors.textPrimary },
  ghostLabel: { color: colors.primary },
});
```

- [ ] **Step 4: Run tests**

```bash
cd mobile
npm test -- Button.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add mobile/src/shared/components/Button.tsx mobile/src/shared/components/__tests__/Button.test.tsx
git commit -m "feat(mobile): Button component with variants"
```

---

### Task 24: GlassPanel, Chip, Toggle, ProgressBar components

**Files:**
- Create: `mobile/src/shared/components/GlassPanel.tsx`
- Create: `mobile/src/shared/components/Chip.tsx`
- Create: `mobile/src/shared/components/Toggle.tsx`
- Create: `mobile/src/shared/components/ProgressBar.tsx`

These are presentational; a single commit with RNTL smoke tests.

- [ ] **Step 1: Implement GlassPanel**

Create `mobile/src/shared/components/GlassPanel.tsx`:

```tsx
import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { radius } from '@/shared/theme';

type Props = {
  intensity?: number;
  tint?: 'light' | 'dark';
  style?: ViewStyle;
  children?: React.ReactNode;
  radius?: number;
};

export const GlassPanel: React.FC<Props> = ({
  intensity = 40, tint = 'dark', style, children, radius: r = radius.xl,
}) => {
  // On Android, BlurView falls back to semi-transparent fill — still readable.
  return (
    <View style={[{ borderRadius: r, overflow: 'hidden' }, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tint === 'dark' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.6)' }]} />
      )}
      {children}
    </View>
  );
};
```

- [ ] **Step 2: Implement Chip**

Create `mobile/src/shared/components/Chip.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '@/shared/theme';

type Props = {
  label: string;
  icon?: React.ReactNode;
  variant?: 'flavor' | 'dietary' | 'filter';
  style?: ViewStyle;
};

export const Chip: React.FC<Props> = ({ label, icon, variant = 'flavor', style }) => (
  <View style={[styles.base, styles[variant], style]}>
    {icon}
    <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: 4,
    borderRadius: radius.full,
  },
  flavor: { backgroundColor: colors.primaryDim },
  dietary: { backgroundColor: 'rgba(255,255,255,0.2)' },
  filter: { backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.divider },
  label: { fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.xs },
  flavorLabel: { color: colors.primary },
  dietaryLabel: { color: '#fff' },
  filterLabel: { color: colors.textPrimary },
});
```

- [ ] **Step 3: Implement Toggle**

Create `mobile/src/shared/components/Toggle.tsx`:

```tsx
import React from 'react';
import { Pressable, View, StyleSheet, Animated } from 'react-native';
import { colors, radius } from '@/shared/theme';

type Props = {
  value: boolean;
  onValueChange: (v: boolean) => void;
};

export const Toggle: React.FC<Props> = ({ value, onValueChange }) => {
  const anim = React.useRef(new Animated.Value(value ? 1 : 0)).current;
  React.useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [value]);
  const translate = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });
  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: ['#cbd5e1', colors.primary] });
  return (
    <Pressable onPress={() => onValueChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: value }}>
      <Animated.View style={[styles.track, { backgroundColor: bg }]}>
        <Animated.View style={[styles.thumb, { transform: [{ translateX: translate }] }]} />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  track: { width: 44, height: 26, borderRadius: radius.full, justifyContent: 'center' },
  thumb: {
    width: 22, height: 22, borderRadius: radius.full,
    backgroundColor: '#fff', position: 'absolute',
    shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2,
  },
});
```

- [ ] **Step 4: Implement ProgressBar**

Create `mobile/src/shared/components/ProgressBar.tsx`:

```tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius } from '@/shared/theme';

type Props = {
  value: number; // 0..1
  variant?: 'primary' | 'subtle';
  height?: number;
  style?: ViewStyle;
};

export const ProgressBar: React.FC<Props> = ({ value, variant = 'primary', height = 8, style }) => {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View style={[{ height, borderRadius: radius.full, backgroundColor: variant === 'primary' ? colors.primaryDim : '#e5e7eb' }, style]}>
      <View style={{
        height: '100%', width: `${clamped * 100}%`, borderRadius: radius.full,
        backgroundColor: variant === 'primary' ? colors.primary : colors.textSecondary,
      }} />
    </View>
  );
};
```

- [ ] **Step 5: Smoke test**

Create `mobile/src/shared/components/__tests__/primitives.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Chip } from '@/shared/components/Chip';
import { Toggle } from '@/shared/components/Toggle';
import { ProgressBar } from '@/shared/components/ProgressBar';

describe('Chip', () => {
  it('renders label', () => {
    const { getByText } = render(<Chip label="spicy" />);
    expect(getByText('spicy')).toBeTruthy();
  });
});

describe('Toggle', () => {
  it('calls onValueChange when pressed', () => {
    const onChange = jest.fn();
    const { getByRole } = render(<Toggle value={false} onValueChange={onChange} />);
    fireEvent.press(getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('ProgressBar', () => {
  it('renders', () => {
    const { toJSON } = render(<ProgressBar value={0.5} />);
    expect(toJSON()).toBeTruthy();
  });
});
```

- [ ] **Step 6: Run tests**

```bash
cd mobile
npm test -- primitives.test.tsx
```

- [ ] **Step 7: Commit**

```bash
git add mobile/src/shared/components/
git commit -m "feat(mobile): GlassPanel, Chip, Toggle, ProgressBar"
```

---

### Task 25: DishImage component (with blurhash)

**Files:**
- Create: `mobile/src/shared/components/DishImage.tsx`

- [ ] **Step 1: Install blurhash dependency**

```bash
cd mobile
npx expo install react-native-blurhash
```

- [ ] **Step 2: Implement component**

Create `mobile/src/shared/components/DishImage.tsx`:

```tsx
import React from 'react';
import { StyleSheet, View, ImageStyle, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Blurhash } from 'react-native-blurhash';

type Props = {
  uri: string;
  blurhash?: string;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  contentFit?: 'cover' | 'contain';
};

export const DishImage: React.FC<Props> = ({
  uri, blurhash, style, imageStyle, contentFit = 'cover',
}) => (
  <View style={[styles.root, style]}>
    {blurhash ? (
      <Blurhash blurhash={blurhash} style={StyleSheet.absoluteFill} />
    ) : null}
    <Image
      source={{ uri }}
      style={[StyleSheet.absoluteFill, imageStyle]}
      contentFit={contentFit}
      transition={200}
    />
  </View>
);

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
});
```

- [ ] **Step 3: Commit**

```bash
git add mobile/src/shared/components/DishImage.tsx mobile/package.json mobile/package-lock.json
git commit -m "feat(mobile): DishImage with blurhash placeholder"
```

---

### Task 26: Haptic hook

**Files:**
- Create: `mobile/src/shared/hooks/useHaptic.ts`

- [ ] **Step 1: Implement the hook**

Create `mobile/src/shared/hooks/useHaptic.ts`:

```ts
import * as Haptics from 'expo-haptics';

export const useHaptic = () => ({
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  bump: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  thud: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warn: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  select: () => Haptics.selectionAsync(),
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/shared/hooks/useHaptic.ts
git commit -m "feat(mobile): useHaptic hook"
```

---

## Phase 5: App bootstrap and navigation shell

### Task 27: Root entry with font loading + providers

**Files:**
- Modify: `mobile/App.tsx`
- Create: `mobile/src/app/Providers.tsx`

- [ ] **Step 1: Create providers wrapper**

Create `mobile/src/app/Providers.tsx`:

```tsx
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <StatusBar style="auto" />
      {children}
    </SafeAreaProvider>
  </GestureHandlerRootView>
);
```

- [ ] **Step 2: Replace App.tsx with bootstrap**

Replace `mobile/App.tsx`:

```tsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Providers } from '@/app/Providers';
import { RootNavigator } from '@/app/RootNavigator';
import { usePreferencesStore } from '@/domain/preferences/store';
import { useSessionStore } from '@/domain/session/store';
import { useLikedHistoryStore } from '@/domain/session/history';
import { colors } from '@/shared/theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const prefsHydrated = usePreferencesStore(s => s.hydrated);
  const sessionHydrated = useSessionStore(s => s.hydrated);
  const historyHydrated = useLikedHistoryStore(s => s.hydrated);

  useEffect(() => {
    usePreferencesStore.getState().hydrate();
    useSessionStore.getState().hydrate();
    useLikedHistoryStore.getState().hydrate();
  }, []);

  const ready = fontsLoaded && prefsHydrated && sessionHydrated && historyHydrated;

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundLight }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return (
    <Providers>
      <RootNavigator />
    </Providers>
  );
}
```

- [ ] **Step 3: Commit (RootNavigator will be stubbed next)**

Stub `mobile/src/app/RootNavigator.tsx` temporarily so the app builds:

```tsx
import React from 'react';
import { View, Text } from 'react-native';
export const RootNavigator = () => (
  <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
    <Text>Loading navigator…</Text>
  </View>
);
```

```bash
cd mobile
npx expo start
```

Verify app boots to the placeholder text (no crash). Press `q` to quit.

```bash
git add mobile/App.tsx mobile/src/app/
git commit -m "feat(mobile): app bootstrap with font loading + store hydration"
```

---

### Task 28: RootNavigator with onboarding gate

**Files:**
- Create: `mobile/src/app/RootNavigator.tsx` (replace stub)
- Create: `mobile/src/app/MainTabs.tsx`
- Create: `mobile/src/app/OnboardingStack.tsx`

- [ ] **Step 1: Create placeholder screens** (actual screens come in later tasks)

Create `mobile/src/features/onboarding/WelcomeScreen.tsx`:

```tsx
import React from 'react';
import { View, Text } from 'react-native';
export const WelcomeScreen = () => (
  <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
    <Text>Welcome (coming soon)</Text>
  </View>
);
```

Repeat the same pattern for placeholder files:
- `mobile/src/features/onboarding/AllergenPickerScreen.tsx` → `AllergenPickerScreen`
- `mobile/src/features/onboarding/DietPickerScreen.tsx` → `DietPickerScreen`
- `mobile/src/features/onboarding/PriceRangeScreen.tsx` → `PriceRangeScreen`
- `mobile/src/features/discover/SwipeScreen.tsx` → `SwipeScreen`
- `mobile/src/features/matches/LikedGalleryScreen.tsx` → `LikedGalleryScreen`
- `mobile/src/features/profile/ProfileScreen.tsx` → `ProfileScreen`
- `mobile/src/features/settings/SettingsScreen.tsx` → `SettingsScreen`

Each is a single-line export that renders a placeholder label so navigation can mount.

- [ ] **Step 2: Implement OnboardingStack**

Create `mobile/src/app/OnboardingStack.tsx`:

```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '@/features/onboarding/WelcomeScreen';
import { AllergenPickerScreen } from '@/features/onboarding/AllergenPickerScreen';
import { DietPickerScreen } from '@/features/onboarding/DietPickerScreen';
import { PriceRangeScreen } from '@/features/onboarding/PriceRangeScreen';

export type OnboardingParamList = {
  Welcome: undefined;
  AllergenPicker: undefined;
  DietPicker: undefined;
  PriceRange: undefined;
};

const Stack = createNativeStackNavigator<OnboardingParamList>();

export const OnboardingStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="AllergenPicker" component={AllergenPickerScreen} />
    <Stack.Screen name="DietPicker" component={DietPickerScreen} />
    <Stack.Screen name="PriceRange" component={PriceRangeScreen} />
  </Stack.Navigator>
);
```

- [ ] **Step 3: Implement MainTabs**

Create `mobile/src/app/MainTabs.tsx`:

```tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { SwipeScreen } from '@/features/discover/SwipeScreen';
import { LikedGalleryScreen } from '@/features/matches/LikedGalleryScreen';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { colors } from '@/shared/theme';

const Tab = createBottomTabNavigator();
const DiscoverStack = createNativeStackNavigator();
const MatchesStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

const DiscoverNav = () => (
  <DiscoverStack.Navigator screenOptions={{ headerShown: false }}>
    <DiscoverStack.Screen name="Swipe" component={SwipeScreen} />
  </DiscoverStack.Navigator>
);
const MatchesNav = () => (
  <MatchesStack.Navigator>
    <MatchesStack.Screen name="Liked" component={LikedGalleryScreen} options={{ title: 'Liked Foods' }} />
  </MatchesStack.Navigator>
);
const ProfileNav = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen name="Profile" component={ProfileScreen} />
  </ProfileStack.Navigator>
);
const SettingsNav = () => (
  <SettingsStack.Navigator>
    <SettingsStack.Screen name="Settings" component={SettingsScreen} />
  </SettingsStack.Navigator>
);

export const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    }}
  >
    <Tab.Screen
      name="Discover"
      component={DiscoverNav}
      options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>🔥</Text> }}
    />
    <Tab.Screen
      name="Matches"
      component={MatchesNav}
      options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>♥</Text> }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileNav}
      options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>👤</Text> }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsNav}
      options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>⚙</Text> }}
    />
  </Tab.Navigator>
);
```

> Emoji icons are placeholder. The final UI will use Material Symbols Outlined (Task 32 upgrades tab icons).

- [ ] **Step 4: Implement RootNavigator**

Replace `mobile/src/app/RootNavigator.tsx`:

```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { usePreferencesStore } from '@/domain/preferences/store';
import { OnboardingStack } from './OnboardingStack';
import { MainTabs } from './MainTabs';

export const RootNavigator = () => {
  const onboardingCompleted = usePreferencesStore(s => s.preferences.onboardingCompleted);
  return (
    <NavigationContainer>
      {onboardingCompleted ? <MainTabs /> : <OnboardingStack />}
    </NavigationContainer>
  );
};
```

- [ ] **Step 5: Boot test**

```bash
cd mobile
npx expo start
```

Expected: App loads, shows the Welcome placeholder (since onboarding hasn't been completed). Press `q` to quit.

- [ ] **Step 6: Commit**

```bash
git add mobile/src/app/ mobile/src/features/
git commit -m "feat(mobile): RootNavigator with onboarding/main-tabs gate + screen placeholders"
```

---

## Phase 6: Onboarding screens

### Task 29: WelcomeScreen

**Files:**
- Modify: `mobile/src/features/onboarding/WelcomeScreen.tsx`

- [ ] **Step 1: Implement the screen**

Replace `mobile/src/features/onboarding/WelcomeScreen.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/shared/components/Button';
import { colors, spacing, typography } from '@/shared/theme';
import type { OnboardingParamList } from '@/app/OnboardingStack';

export const WelcomeScreen: React.FC = () => {
  const nav = useNavigation<NativeStackNavigationProp<OnboardingParamList>>();
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Munch</Text>
        <Text style={styles.title}>
          Discover your{'\n'}
          <Text style={styles.titleAccent}>perfect dish.</Text>
        </Text>
        <Text style={styles.body}>
          Swipe through dishes from around the world. We'll learn your taste and match you with three dishes you'll love.
        </Text>
      </View>
      <View style={styles.footer}>
        <Button label="Get started" onPress={() => nav.navigate('AllergenPicker')} size="lg" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundLight, padding: spacing.xl },
  content: { flex: 1, justifyContent: 'center' },
  eyebrow: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.sm,
    color: colors.primary,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.sizes['3xl'],
    color: colors.textPrimary,
    lineHeight: typography.sizes['3xl'] * 1.15,
  },
  titleAccent: { color: colors.primary },
  body: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginTop: spacing.xl,
    lineHeight: typography.sizes.md * 1.5,
  },
  footer: { paddingBottom: spacing.xl },
});
```

- [ ] **Step 2: Verify on device**

```bash
cd mobile
npx expo start
```

Scan QR in Expo Go. Welcome screen should appear with "Get started" button. Press it → navigates to placeholder AllergenPicker. Press `q` to quit.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/features/onboarding/WelcomeScreen.tsx
git commit -m "feat(mobile): WelcomeScreen"
```

---

### Task 30: AllergenPickerScreen

**Files:**
- Modify: `mobile/src/features/onboarding/AllergenPickerScreen.tsx`

- [ ] **Step 1: Implement**

Replace `mobile/src/features/onboarding/AllergenPickerScreen.tsx`:

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@/shared/components/Button';
import { Toggle } from '@/shared/components/Toggle';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { usePreferencesStore } from '@/domain/preferences/store';
import type { AllergenKey } from '@/domain/dish/types';
import type { OnboardingParamList } from '@/app/OnboardingStack';

const ALLERGENS: Array<{ key: AllergenKey; label: string }> = [
  { key: 'gluten', label: 'Gluten' },
  { key: 'dairy', label: 'Dairy' },
  { key: 'seafood', label: 'Seafood' },
  { key: 'nuts', label: 'Nuts' },
  { key: 'eggs', label: 'Eggs' },
  { key: 'pork', label: 'Pork' },
  { key: 'beef', label: 'Beef' },
  { key: 'alcohol', label: 'Alcohol' },
];

export const AllergenPickerScreen: React.FC = () => {
  const nav = useNavigation<NativeStackNavigationProp<OnboardingParamList>>();
  const existing = usePreferencesStore(s => s.preferences.allergens);
  const setAllergens = usePreferencesStore(s => s.setAllergens);
  const [selected, setSelected] = useState<AllergenKey[]>(existing);
  const [noneSelected, setNoneSelected] = useState(existing.length === 0);

  const toggle = (k: AllergenKey) => {
    setNoneSelected(false);
    setSelected(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]);
  };

  const onNoneToggle = (v: boolean) => {
    setNoneSelected(v);
    if (v) setSelected([]);
  };

  const canContinue = noneSelected || selected.length > 0;

  const onNext = async () => {
    await setAllergens(noneSelected ? [] : selected);
    nav.navigate('DietPicker');
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Step 1 of 3</Text>
        <Text style={styles.title}>Anything we should leave off the plate?</Text>
        <Text style={styles.body}>Dishes containing these will never appear.</Text>

        <View style={styles.list}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>No allergies or restrictions</Text>
            <Toggle value={noneSelected} onValueChange={onNoneToggle} />
          </View>
          {ALLERGENS.map(({ key, label }) => (
            <View key={key} style={styles.row}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Toggle
                value={!noneSelected && selected.includes(key)}
                onValueChange={() => toggle(key)}
              />
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button label="Continue" onPress={onNext} disabled={!canContinue} size="lg" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundLight },
  content: { padding: spacing.xl, gap: spacing.lg },
  eyebrow: { fontFamily: typography.fontFamily.bold, color: colors.primary, fontSize: typography.sizes.xs, letterSpacing: 2, textTransform: 'uppercase' },
  title: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes['2xl'], color: colors.textPrimary },
  body: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, fontSize: typography.sizes.md },
  list: { gap: spacing.sm, marginTop: spacing.md },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.divider,
  },
  rowLabel: { fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.md, color: colors.textPrimary },
  footer: { padding: spacing.xl },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/features/onboarding/AllergenPickerScreen.tsx
git commit -m "feat(mobile): AllergenPickerScreen"
```

---

### Task 31: DietPickerScreen and PriceRangeScreen

**Files:**
- Modify: `mobile/src/features/onboarding/DietPickerScreen.tsx`
- Modify: `mobile/src/features/onboarding/PriceRangeScreen.tsx`

- [ ] **Step 1: Implement DietPickerScreen**

Replace `mobile/src/features/onboarding/DietPickerScreen.tsx`:

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { usePreferencesStore } from '@/domain/preferences/store';
import type { Diet } from '@/domain/dish/types';
import type { OnboardingParamList } from '@/app/OnboardingStack';

const OPTIONS: Array<{ key: Diet | 'none'; label: string; desc: string }> = [
  { key: 'none', label: 'No preference', desc: 'Everything is on the table' },
  { key: 'vegetarian', label: 'Vegetarian', desc: 'No meat or seafood' },
  { key: 'vegan', label: 'Vegan', desc: 'No animal products' },
  { key: 'pescatarian', label: 'Pescatarian', desc: 'Vegetarian + seafood' },
  { key: 'halal', label: 'Halal', desc: '' },
  { key: 'kosher', label: 'Kosher', desc: '' },
];

export const DietPickerScreen: React.FC = () => {
  const nav = useNavigation<NativeStackNavigationProp<OnboardingParamList>>();
  const existing = usePreferencesStore(s => s.preferences.diet);
  const setDiet = usePreferencesStore(s => s.setDiet);
  const [selected, setSelected] = useState<Diet | 'none'>(existing ?? 'none');

  const onNext = async () => {
    await setDiet(selected === 'none' ? null : selected);
    nav.navigate('PriceRange');
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Step 2 of 3</Text>
        <Text style={styles.title}>Any dietary style?</Text>
        <Text style={styles.body}>Optional — skip if it doesn't apply.</Text>

        <View style={styles.list}>
          {OPTIONS.map(opt => {
            const active = selected === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setSelected(opt.key)}
                style={[styles.option, active && styles.optionActive]}
              >
                <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{opt.label}</Text>
                {opt.desc ? <Text style={styles.optionDesc}>{opt.desc}</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button label="Continue" onPress={onNext} size="lg" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundLight },
  content: { padding: spacing.xl, gap: spacing.lg },
  eyebrow: { fontFamily: typography.fontFamily.bold, color: colors.primary, fontSize: typography.sizes.xs, letterSpacing: 2, textTransform: 'uppercase' },
  title: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes['2xl'], color: colors.textPrimary },
  body: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, fontSize: typography.sizes.md },
  list: { gap: spacing.sm, marginTop: spacing.md },
  option: {
    backgroundColor: colors.surfaceLight, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 2, borderColor: colors.divider,
  },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  optionLabel: { fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.md, color: colors.textPrimary },
  optionLabelActive: { color: colors.primary },
  optionDesc: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, fontSize: typography.sizes.sm, marginTop: 4 },
  footer: { padding: spacing.xl },
});
```

- [ ] **Step 2: Implement PriceRangeScreen**

Replace `mobile/src/features/onboarding/PriceRangeScreen.tsx`:

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { usePreferencesStore } from '@/domain/preferences/store';
import type { PriceTier } from '@/domain/dish/types';

const TIERS: PriceTier[] = [1, 2, 3, 4];
const LABELS: Record<PriceTier, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

export const PriceRangeScreen: React.FC = () => {
  const existing = usePreferencesStore(s => s.preferences.priceRange);
  const setPriceRange = usePreferencesStore(s => s.setPriceRange);
  const completeOnboarding = usePreferencesStore(s => s.completeOnboarding);
  const [min, setMin] = useState<PriceTier>(existing[0]);
  const [max, setMax] = useState<PriceTier>(existing[1]);

  const onFinish = async () => {
    const range: [PriceTier, PriceTier] = [Math.min(min, max) as PriceTier, Math.max(min, max) as PriceTier];
    await setPriceRange(range);
    await completeOnboarding();
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Step 3 of 3</Text>
        <Text style={styles.title}>What's your price range?</Text>
        <Text style={styles.body}>Tap a tier to set the minimum and maximum.</Text>

        <View style={styles.row}>
          <PriceColumn label="From" value={min} onChange={setMin} />
          <PriceColumn label="To" value={max} onChange={setMax} />
        </View>
      </View>
      <View style={styles.footer}>
        <Button label="Start discovering" onPress={onFinish} size="lg" />
      </View>
    </SafeAreaView>
  );
};

const PriceColumn: React.FC<{ label: string; value: PriceTier; onChange: (v: PriceTier) => void }> = ({ label, value, onChange }) => (
  <View style={styles.col}>
    <Text style={styles.colLabel}>{label}</Text>
    {TIERS.map(t => {
      const active = value === t;
      return (
        <Pressable key={t} onPress={() => onChange(t)} style={[styles.tier, active && styles.tierActive]}>
          <Text style={[styles.tierLabel, active && styles.tierLabelActive]}>{LABELS[t]}</Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundLight },
  content: { flex: 1, padding: spacing.xl, gap: spacing.lg },
  eyebrow: { fontFamily: typography.fontFamily.bold, color: colors.primary, fontSize: typography.sizes.xs, letterSpacing: 2, textTransform: 'uppercase' },
  title: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes['2xl'], color: colors.textPrimary },
  body: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, fontSize: typography.sizes.md },
  row: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xl },
  col: { flex: 1, gap: spacing.sm },
  colLabel: { fontFamily: typography.fontFamily.bold, color: colors.textMuted, fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: 1 },
  tier: {
    backgroundColor: colors.surfaceLight, borderWidth: 2, borderColor: colors.divider,
    borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center',
  },
  tierActive: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  tierLabel: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes.xl, color: colors.textMuted },
  tierLabelActive: { color: colors.primary },
  footer: { padding: spacing.xl },
});
```

- [ ] **Step 3: Verify full onboarding flow**

```bash
cd mobile
npx expo start
```

In Expo Go: Welcome → Get Started → toggle an allergen → Continue → pick a diet → Continue → pick price tiers → Start discovering. Expect the Discover tab (with placeholder SwipeScreen) to appear. Press `q` to quit.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/features/onboarding/DietPickerScreen.tsx mobile/src/features/onboarding/PriceRangeScreen.tsx
git commit -m "feat(mobile): DietPickerScreen and PriceRangeScreen (onboarding complete)"
```

---

## Phase 7: Discover (core swipe loop)

### Task 32: SwipeCard — Reanimated-driven card with NOPE/YUM overlays

**Files:**
- Create: `mobile/src/features/discover/SwipeCard.tsx`

- [ ] **Step 1: Implement SwipeCard**

Create `mobile/src/features/discover/SwipeCard.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  runOnJS, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { DishImage } from '@/shared/components/DishImage';
import { GlassPanel } from '@/shared/components/GlassPanel';
import { Chip } from '@/shared/components/Chip';
import { colors, radius, spacing, typography, shadow } from '@/shared/theme';
import type { Dish } from '@/domain/dish/types';

const { width: W, height: H } = Dimensions.get('window');
const THRESHOLD = W * 0.3;

type Props = {
  dish: Dish;
  onSwipe: (direction: 'like' | 'dislike') => void;
  onPressDetails: () => void;
  interactive: boolean;
};

export const SwipeCard: React.FC<Props> = ({ dish, onSwipe, onPressDetails, interactive }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);

  const fling = (dir: 'like' | 'dislike') => {
    onSwipe(dir);
  };

  const pan = Gesture.Pan()
    .enabled(interactive)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
      rotation.value = e.translationX / 20;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > THRESHOLD) {
        const dir = e.translationX > 0 ? 'like' : 'dislike';
        translateX.value = withTiming(e.translationX > 0 ? W * 1.5 : -W * 1.5, { duration: 220 }, () => {
          runOnJS(fling)(dir);
        });
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotation.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const yumStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  const flagEmoji = dish.country
    .toUpperCase()
    .replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));

  const dietaryTags: string[] = [];
  if (dish.flavor.heat >= 3) dietaryTags.push('SPICY');
  if (dish.contains.dairy) dietaryTags.push('DAIRY');
  if (dish.contains.gluten) dietaryTags.push('GLUTEN');

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, cardStyle]}>
        <DishImage uri={dish.image_url} blurhash={dish.image_blurhash} style={StyleSheet.absoluteFill} />
        <View style={styles.darkGradient} pointerEvents="none" />

        <Animated.View style={[styles.badge, styles.badgeNope, nopeStyle]} pointerEvents="none">
          <Text style={styles.badgeText}>NOPE</Text>
        </Animated.View>
        <Animated.View style={[styles.badge, styles.badgeYum, yumStyle]} pointerEvents="none">
          <Text style={styles.badgeText}>YUM</Text>
        </Animated.View>

        <View style={styles.tagsTop}>
          {dietaryTags.map(t => <Chip key={t} label={t} variant="dietary" />)}
        </View>

        <GlassPanel intensity={40} tint="dark" style={styles.info} radius={radius.xl}>
          <View style={{ padding: spacing.lg }}>
            <View style={styles.countryRow}>
              <Text style={styles.flag}>{flagEmoji}</Text>
              <Text style={styles.country}>{dish.country}</Text>
            </View>
            <Text style={styles.name}>{dish.name}</Text>
            <View style={styles.bottomRow}>
              <Text style={styles.price}>{'$'.repeat(dish.price_tier)}</Text>
              <Pressable onPress={onPressDetails} hitSlop={12}>
                <Text style={styles.detailsLink}>View details ›</Text>
              </Pressable>
            </View>
          </View>
        </GlassPanel>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: radius.xl * 1.5, overflow: 'hidden',
    backgroundColor: '#222', ...shadow.soft,
  },
  darkGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  tagsTop: {
    position: 'absolute', top: spacing.lg, right: spacing.lg,
    gap: spacing.xs, alignItems: 'flex-end',
  },
  info: { position: 'absolute', bottom: spacing.md, left: spacing.md, right: spacing.md },
  countryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  flag: { fontSize: 22 },
  country: { color: 'rgba(255,255,255,0.85)', fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.xs, letterSpacing: 2, textTransform: 'uppercase' },
  name: { color: '#fff', fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes.xl, lineHeight: typography.sizes.xl * 1.2 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  price: { color: colors.primary, fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes.lg },
  detailsLink: { color: '#fff', fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.sm },
  badge: {
    position: 'absolute', top: 48,
    borderWidth: 4, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  badgeNope: { left: spacing.lg, borderColor: colors.danger, transform: [{ rotate: '-12deg' }] },
  badgeYum: { right: spacing.lg, borderColor: colors.success, transform: [{ rotate: '12deg' }] },
  badgeText: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes['2xl'], letterSpacing: 2 },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/features/discover/SwipeCard.tsx
git commit -m "feat(mobile): SwipeCard with Reanimated gestures + overlays"
```

---

### Task 33: DishRepository as a shared singleton

**Files:**
- Create: `mobile/src/domain/dish/repositoryInstance.ts`

- [ ] **Step 1: Create singleton**

Create `mobile/src/domain/dish/repositoryInstance.ts`:

```ts
import { DishRepository } from './repository';
import foodsData from '@/data/foods.json';
import type { Dish } from './types';

export const dishRepository = new DishRepository(foodsData as Dish[]);
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/domain/dish/repositoryInstance.ts
git commit -m "feat(mobile): shared dish repository instance"
```

---

### Task 34: SwipeScreen — orchestration

**Files:**
- Modify: `mobile/src/features/discover/SwipeScreen.tsx`
- Create: `mobile/src/features/discover/MatchPotentialBar.tsx`

- [ ] **Step 1: Implement MatchPotentialBar**

Create `mobile/src/features/discover/MatchPotentialBar.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { colors, spacing, typography } from '@/shared/theme';

type Props = {
  confidence: number;   // 0..1
  likes: number;
  totalSwipes: number;
};

export const MatchPotentialBar: React.FC<Props> = ({ confidence, likes, totalSwipes }) => (
  <View style={styles.root}>
    <View style={styles.row}>
      <Text style={styles.percent}>{Math.round(confidence * 100)}% match potential</Text>
      <Text style={styles.meta}>{likes} ♥ · {totalSwipes} swipes</Text>
    </View>
    <ProgressBar value={confidence} />
  </View>
);

const styles = StyleSheet.create({
  root: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  percent: { fontFamily: typography.fontFamily.bold, color: colors.primary, fontSize: typography.sizes.sm },
  meta: { fontFamily: typography.fontFamily.bold, color: colors.textMuted, fontSize: typography.sizes.xs },
});
```

- [ ] **Step 2: Implement SwipeScreen**

Replace `mobile/src/features/discover/SwipeScreen.tsx`:

```tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { SwipeCard } from './SwipeCard';
import { MatchPotentialBar } from './MatchPotentialBar';
import { DetailsSheet } from './DetailsSheet';
import { Button } from '@/shared/components/Button';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { colors, spacing, typography } from '@/shared/theme';
import { usePreferencesStore } from '@/domain/preferences/store';
import { useSessionStore } from '@/domain/session/store';
import { useLikedHistoryStore } from '@/domain/session/history';
import { dishRepository } from '@/domain/dish/repositoryInstance';
import { createDefaultEngine } from '@/domain/recommendation/defaultEngine';
import { computeMatchConfidence } from '@/domain/recommendation/confidence';
import type { Dish } from '@/domain/dish/types';

const engine = createDefaultEngine();

export const SwipeScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const haptic = useHaptic();
  const preferences = usePreferencesStore(s => s.preferences);
  const session = useSessionStore(s => s.session);
  const startNewSession = useSessionStore(s => s.startNewSession);
  const recordSwipe = useSessionStore(s => s.recordSwipe);
  const completeWithMatch = useSessionStore(s => s.completeWithMatch);
  const recordLike = useLikedHistoryStore(s => s.recordLike);

  const [detailsDish, setDetailsDish] = useState<Dish | null>(null);
  const [currentDish, setCurrentDish] = useState<Dish | null>(null);

  // Filter pool by hard filters
  const pool = useMemo(
    () => dishRepository.filterByPreferences(preferences),
    [preferences],
  );

  // Ensure a session exists and isn't completed
  useEffect(() => {
    if (!session || session.status === 'completed') {
      startNewSession();
    }
  }, [session?.id, session?.status]);

  // Compute remaining candidates
  const remaining = useMemo(() => {
    if (!session) return [];
    return pool.filter(d => !session.seenDishIds.includes(d.id));
  }, [pool, session]);

  // Pick next dish when it's missing or after swipe
  useEffect(() => {
    if (!session || remaining.length === 0) {
      setCurrentDish(null);
      return;
    }
    const ctx = {
      user: { tasteVector: session.tasteVector, categoricalCounts: session.categoricalCounts },
      session, now: new Date(),
    };
    setCurrentDish(engine.nextDish(remaining, ctx));
  }, [session?.seenDishIds.length, remaining.length]);

  // Confidence
  const confidence = useMemo(() => {
    if (!session || remaining.length === 0) return 0;
    const ctx = {
      user: { tasteVector: session.tasteVector, categoricalCounts: session.categoricalCounts },
      session, now: new Date(),
    };
    const ranked = engine.rankDishes(remaining, ctx);
    return computeMatchConfidence(ranked.slice(0, 10).map(r => r.score));
  }, [session?.seenDishIds.length, remaining.length]);

  const onSwipe = async (direction: 'like' | 'dislike') => {
    if (!currentDish || !session) return;
    haptic.tap();
    await recordSwipe(currentDish, direction);
    if (direction === 'like') {
      await recordLike(currentDish.id, session.id);
    }

    // Re-read state after the update
    const updated = useSessionStore.getState().session;
    if (!updated) return;
    const totalSwipes = updated.likes.length + updated.dislikes.length;
    const hitLikes = updated.likes.length >= updated.likesTargetForNextMatch;
    const hitCap = totalSwipes >= updated.swipeCapForNextMatch;
    if (hitLikes || hitCap) {
      const ctx = {
        user: { tasteVector: updated.tasteVector, categoricalCounts: updated.categoricalCounts },
        session: updated, now: new Date(),
      };
      const matchPool = pool.filter(d => !updated.seenDishIds.includes(d.id)).length > 0
        ? pool.filter(d => !updated.seenDishIds.includes(d.id))
        : pool;
      const match = engine.matchTop3(matchPool, ctx);
      await completeWithMatch(match);
      haptic.success();
      nav.navigate('MatchReveal');
    }
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={{ padding: spacing.xl }}>Starting session…</Text>
      </SafeAreaView>
    );
  }

  if (remaining.length === 0 || !currentDish) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>You've seen everything matching your filters.</Text>
          <Text style={styles.emptyBody}>Loosen filters in Settings or start a new session.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalSwipes = session.likes.length + session.dislikes.length;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <MatchPotentialBar
        confidence={confidence}
        likes={session.likes.length}
        totalSwipes={totalSwipes}
      />
      <View style={styles.cardArea}>
        <SwipeCard
          key={currentDish.id}
          dish={currentDish}
          onSwipe={onSwipe}
          onPressDetails={() => setDetailsDish(currentDish)}
          interactive
        />
      </View>
      <View style={styles.buttonsRow}>
        <Button label="Nope" variant="secondary" size="lg" onPress={() => onSwipe('dislike')} />
        <Button label="Yum" variant="primary" size="lg" onPress={() => onSwipe('like')} />
      </View>
      <DetailsSheet dish={detailsDish} onClose={() => setDetailsDish(null)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundLight },
  cardArea: { flex: 1, margin: spacing.lg, aspectRatio: 0.75, position: 'relative' },
  buttonsRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, padding: spacing.lg },
  empty: { flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyTitle: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes.xl, color: colors.textPrimary, textAlign: 'center' },
  emptyBody: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, textAlign: 'center' },
});
```

- [ ] **Step 3: Commit**

```bash
git add mobile/src/features/discover/
git commit -m "feat(mobile): SwipeScreen with match potential bar + haptic feedback"
```

---

### Task 35: DetailsSheet

**Files:**
- Create: `mobile/src/features/discover/DetailsSheet.tsx`

- [ ] **Step 1: Implement**

Create `mobile/src/features/discover/DetailsSheet.tsx`:

```tsx
import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Chip } from '@/shared/components/Chip';
import { DishImage } from '@/shared/components/DishImage';
import { colors, radius, spacing, typography } from '@/shared/theme';
import type { Dish, FlavorProfile } from '@/domain/dish/types';

type Props = {
  dish: Dish | null;
  onClose: () => void;
};

export const DetailsSheet: React.FC<Props> = ({ dish, onClose }) => {
  return (
    <Modal animationType="slide" transparent visible={!!dish} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Pressable style={styles.grabber} onPress={onClose}>
            <View style={styles.grabberBar} />
          </Pressable>
          {dish ? (
            <ScrollView contentContainerStyle={styles.content}>
              <DishImage uri={dish.image_url} blurhash={dish.image_blurhash} style={styles.image} />
              <Text style={styles.name}>{dish.name}</Text>
              <Text style={styles.country}>{dish.country} · {dish.cuisine_region.replace('_', ' ')}</Text>
              <Text style={styles.desc}>{dish.description}</Text>

              <Text style={styles.sectionLabel}>Flavor</Text>
              <FlavorBars flavor={dish.flavor} />

              <Text style={styles.sectionLabel}>Tags</Text>
              <View style={styles.chipRow}>
                {dish.meal_types.map(m => <Chip key={m} label={m} variant="flavor" />)}
                {dish.textures.map(t => <Chip key={t} label={t} variant="flavor" />)}
              </View>

              <Text style={styles.sectionLabel}>Contains</Text>
              <View style={styles.chipRow}>
                {Object.entries(dish.contains)
                  .filter(([, v]) => v)
                  .map(([k]) => <Chip key={k} label={k} variant="filter" />)}
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const FLAVOR_LABELS: Record<keyof FlavorProfile, string> = {
  sweet: 'Sweet', sour: 'Sour', salty: 'Salty', bitter: 'Bitter',
  umami: 'Umami', heat: 'Heat', richness: 'Richness',
};

const FlavorBars: React.FC<{ flavor: FlavorProfile }> = ({ flavor }) => (
  <View style={{ gap: spacing.sm }}>
    {(Object.keys(FLAVOR_LABELS) as Array<keyof FlavorProfile>).map(k => (
      <View key={k} style={styles.bar}>
        <Text style={styles.barLabel}>{FLAVOR_LABELS[k]}</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${(flavor[k] / 5) * 100}%` }]} />
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.backgroundLight,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    maxHeight: '80%', overflow: 'hidden',
  },
  grabber: { alignItems: 'center', paddingVertical: spacing.md },
  grabberBar: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.divider },
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing['3xl'] },
  image: { height: 220, borderRadius: radius.xl },
  name: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes['2xl'], color: colors.textPrimary, marginTop: spacing.md },
  country: { fontFamily: typography.fontFamily.bold, color: colors.textMuted, fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: 2 },
  desc: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, fontSize: typography.sizes.md, lineHeight: typography.sizes.md * 1.5 },
  sectionLabel: { fontFamily: typography.fontFamily.bold, color: colors.primary, fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: 2, marginTop: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  bar: { gap: 4 },
  barLabel: { fontFamily: typography.fontFamily.bold, color: colors.textSecondary, fontSize: typography.sizes.sm },
  barTrack: { height: 8, backgroundColor: colors.divider, borderRadius: radius.full },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.full },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/features/discover/DetailsSheet.tsx
git commit -m "feat(mobile): DetailsSheet modal"
```

---

## Phase 8: Match reveal

### Task 36: MatchRevealScreen

**Files:**
- Create: `mobile/src/features/match/MatchRevealScreen.tsx`
- Modify: `mobile/src/app/MainTabs.tsx` (register MatchReveal in Discover stack)

- [ ] **Step 1: Implement MatchRevealScreen**

Create `mobile/src/features/match/MatchRevealScreen.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/shared/components/Button';
import { DishImage } from '@/shared/components/DishImage';
import { colors, radius, spacing, typography, shadow } from '@/shared/theme';
import { useSessionStore } from '@/domain/session/store';
import type { MatchEntry } from '@/domain/session/types';

export const MatchRevealScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const session = useSessionStore(s => s.session);
  const continueSwiping = useSessionStore(s => s.continueSwiping);
  const resetSession = useSessionStore(s => s.resetSession);
  const match = session?.completedMatch;

  if (!match || match.top3.length === 0) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={{ padding: spacing.xl }}>No match available.</Text>
      </SafeAreaView>
    );
  }

  const [first, ...rest] = match.top3;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>It's a match!</Text>
        <Text style={styles.title}>Your top dish</Text>

        <HeroCard entry={first} />

        <Text style={styles.sectionLabel}>Also tasty</Text>
        <View style={styles.secondaryRow}>
          {rest.map(e => <SecondaryCard key={e.dish.id} entry={e} />)}
        </View>

        <View style={styles.actions}>
          <Button label="Order now (coming soon)" size="lg" disabled />
          <Button label="Find restaurants (coming soon)" size="lg" disabled />
          <Button label="Keep swiping" variant="secondary" size="lg" onPress={async () => {
            await continueSwiping();
            nav.goBack();
          }} />
          <Button label="Start over" variant="ghost" size="sm" onPress={async () => {
            await resetSession();
            nav.goBack();
          }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const HeroCard: React.FC<{ entry: MatchEntry }> = ({ entry }) => (
  <View style={styles.hero}>
    <DishImage uri={entry.dish.image_url} blurhash={entry.dish.image_blurhash} style={styles.heroImage} />
    <View style={styles.heroBody}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={styles.heroName}>{entry.dish.name}</Text>
        <Text style={styles.heroPercent}>{entry.matchPercent}%</Text>
      </View>
      <Text style={styles.heroDesc}>{entry.dish.description}</Text>
    </View>
  </View>
);

const SecondaryCard: React.FC<{ entry: MatchEntry }> = ({ entry }) => (
  <View style={styles.secondary}>
    <DishImage uri={entry.dish.image_url} blurhash={entry.dish.image_blurhash} style={styles.secondaryImage} />
    <View style={{ padding: spacing.md }}>
      <Text style={styles.secondaryName} numberOfLines={1}>{entry.dish.name}</Text>
      <Text style={styles.secondaryPercent}>{entry.matchPercent}% match</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundLight },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing['3xl'] },
  eyebrow: { fontFamily: typography.fontFamily.bold, color: colors.primary, fontSize: typography.sizes.sm, textTransform: 'uppercase', letterSpacing: 3, textAlign: 'center' },
  title: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes['3xl'], color: colors.textPrimary, textAlign: 'center' },
  hero: { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.surfaceLight, ...shadow.soft },
  heroImage: { height: 240 },
  heroBody: { padding: spacing.lg, gap: spacing.sm },
  heroName: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes.xl, flex: 1 },
  heroPercent: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes.xl, color: colors.primary },
  heroDesc: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, fontSize: typography.sizes.md, lineHeight: typography.sizes.md * 1.5 },
  sectionLabel: { fontFamily: typography.fontFamily.bold, color: colors.primary, fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: 2, marginTop: spacing.md },
  secondaryRow: { flexDirection: 'row', gap: spacing.md },
  secondary: { flex: 1, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceLight, ...shadow.soft },
  secondaryImage: { height: 120 },
  secondaryName: { fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.sm },
  secondaryPercent: { fontFamily: typography.fontFamily.regular, color: colors.primary, fontSize: typography.sizes.xs },
  actions: { gap: spacing.md, marginTop: spacing.lg },
});
```

- [ ] **Step 2: Register in Discover stack**

Edit `mobile/src/app/MainTabs.tsx` — update the `DiscoverNav` component:

```tsx
import { MatchRevealScreen } from '@/features/match/MatchRevealScreen';
// ...
const DiscoverNav = () => (
  <DiscoverStack.Navigator screenOptions={{ headerShown: false }}>
    <DiscoverStack.Screen name="Swipe" component={SwipeScreen} />
    <DiscoverStack.Screen
      name="MatchReveal"
      component={MatchRevealScreen}
      options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
    />
  </DiscoverStack.Navigator>
);
```

- [ ] **Step 3: End-to-end test on device**

```bash
cd mobile
npx expo start
```

Flow:
1. Complete onboarding
2. Swipe right 10 times in a row (or mix)
3. Match reveal should appear
4. Press "Keep swiping" → back to swipe with new target (20 likes)

Press `q` to quit.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/features/match/ mobile/src/app/MainTabs.tsx
git commit -m "feat(mobile): MatchRevealScreen with Top-3 and disabled teasers"
```

---

## Phase 9: Matches gallery, Profile, Settings

### Task 37: LikedGalleryScreen

**Files:**
- Modify: `mobile/src/features/matches/LikedGalleryScreen.tsx`

- [ ] **Step 1: Implement**

Replace `mobile/src/features/matches/LikedGalleryScreen.tsx`:

```tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DishImage } from '@/shared/components/DishImage';
import { colors, radius, spacing, typography, shadow } from '@/shared/theme';
import { useLikedHistoryStore } from '@/domain/session/history';
import { dishRepository } from '@/domain/dish/repositoryInstance';
import type { Dish } from '@/domain/dish/types';

export const LikedGalleryScreen: React.FC = () => {
  const events = useLikedHistoryStore(s => s.history.events);
  const dishes = useMemo(() => {
    const seen = new Set<string>();
    const result: Dish[] = [];
    // Newest first, unique
    for (let i = events.length - 1; i >= 0; i--) {
      const id = events[i].dishId;
      if (seen.has(id)) continue;
      seen.add(id);
      const d = dishRepository.findById(id);
      if (d) result.push(d);
    }
    return result;
  }, [events]);

  if (dishes.length === 0) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No likes yet</Text>
          <Text style={styles.emptyBody}>Swipe right on dishes you'd eat and they'll appear here.</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        data={dishes}
        keyExtractor={d => d.id}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md }}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <DishImage uri={item.image_url} blurhash={item.image_blurhash} style={styles.img} />
            <View style={styles.cardBody}>
              <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundLight },
  grid: { padding: spacing.md, gap: spacing.md },
  card: {
    flex: 1, backgroundColor: colors.surfaceLight,
    borderRadius: radius.lg, overflow: 'hidden', ...shadow.soft,
  },
  img: { height: 140 },
  cardBody: { padding: spacing.md },
  cardName: { fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.sm },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyTitle: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes.xl, color: colors.textPrimary },
  emptyBody: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, textAlign: 'center' },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/features/matches/LikedGalleryScreen.tsx
git commit -m "feat(mobile): LikedGalleryScreen (2-col grid)"
```

---

### Task 38: ProfileScreen (basic stats)

**Files:**
- Modify: `mobile/src/features/profile/ProfileScreen.tsx`

- [ ] **Step 1: Implement**

Replace `mobile/src/features/profile/ProfileScreen.tsx`:

```tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { useLikedHistoryStore } from '@/domain/session/history';
import { useSessionStore } from '@/domain/session/store';
import { dishRepository } from '@/domain/dish/repositoryInstance';
import type { CuisineRegion } from '@/domain/dish/types';

export const ProfileScreen: React.FC = () => {
  const events = useLikedHistoryStore(s => s.history.events);
  const session = useSessionStore(s => s.session);

  const stats = useMemo(() => {
    const uniqueIds = new Set(events.map(e => e.dishId));
    const totalLikes = uniqueIds.size;
    const regionTally: Record<string, number> = {};
    for (const id of uniqueIds) {
      const d = dishRepository.findById(id);
      if (!d) continue;
      regionTally[d.cuisine_region] = (regionTally[d.cuisine_region] ?? 0) + 1;
    }
    const topRegion = Object.entries(regionTally)
      .sort((a, b) => b[1] - a[1])[0]?.[0] as CuisineRegion | undefined;
    const totalSwipes = (session?.likes.length ?? 0) + (session?.dislikes.length ?? 0);
    return { totalLikes, topRegion, totalSwipes };
  }, [events, session]);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your flavor journey</Text>

        <View style={styles.statRow}>
          <Stat label="Total likes" value={String(stats.totalLikes)} />
          <Stat label="Swipes this session" value={String(stats.totalSwipes)} />
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCardLabel}>Top cuisine</Text>
          <Text style={styles.statCardValue}>
            {stats.topRegion ? stats.topRegion.replace('_', ' ') : '—'}
          </Text>
        </View>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Your lifetime flavor radar chart will appear here in a future version.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundLight },
  content: { padding: spacing.xl, gap: spacing.lg },
  title: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes['2xl'], color: colors.textPrimary },
  statRow: { flexDirection: 'row', gap: spacing.md },
  stat: {
    flex: 1, backgroundColor: colors.surfaceLight, borderRadius: radius.lg,
    padding: spacing.lg, gap: 4, borderWidth: 1, borderColor: colors.divider,
  },
  statValue: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes['2xl'], color: colors.primary },
  statLabel: { fontFamily: typography.fontFamily.bold, color: colors.textMuted, fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: 1 },
  statCard: {
    backgroundColor: colors.surfaceLight, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.divider, gap: 4,
  },
  statCardLabel: { fontFamily: typography.fontFamily.bold, color: colors.textMuted, fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: 1 },
  statCardValue: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes.xl, color: colors.textPrimary, textTransform: 'capitalize' },
  placeholder: {
    backgroundColor: colors.primaryDim, borderRadius: radius.lg,
    padding: spacing.lg, alignItems: 'center',
  },
  placeholderText: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, textAlign: 'center', fontSize: typography.sizes.sm },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/features/profile/ProfileScreen.tsx
git commit -m "feat(mobile): ProfileScreen (basic stats)"
```

---

### Task 39: SettingsScreen with Filters + Data sub-screens

**Files:**
- Modify: `mobile/src/features/settings/SettingsScreen.tsx`
- Create: `mobile/src/features/settings/FiltersScreen.tsx`
- Create: `mobile/src/features/settings/DataScreen.tsx`
- Modify: `mobile/src/app/MainTabs.tsx`

- [ ] **Step 1: Implement SettingsScreen**

Replace `mobile/src/features/settings/SettingsScreen.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing, typography } from '@/shared/theme';

export const SettingsScreen: React.FC = () => {
  const nav = useNavigation<any>();
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>
        <SettingRow label="Dietary filters" onPress={() => nav.navigate('Filters')} />
        <SettingRow label="Manage data" onPress={() => nav.navigate('Data')} />
      </ScrollView>
    </SafeAreaView>
  );
};

const SettingRow: React.FC<{ label: string; onPress: () => void }> = ({ label, onPress }) => (
  <Pressable onPress={onPress} style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.chevron}>›</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundLight },
  content: { padding: spacing.xl, gap: spacing.md },
  title: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes['2xl'], color: colors.textPrimary, marginBottom: spacing.md },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.divider,
  },
  rowLabel: { fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.md, color: colors.textPrimary },
  chevron: { fontSize: 20, color: colors.textMuted },
});
```

- [ ] **Step 2: Implement FiltersScreen (reuses onboarding components)**

Create `mobile/src/features/settings/FiltersScreen.tsx`:

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/shared/components/Button';
import { Toggle } from '@/shared/components/Toggle';
import { usePreferencesStore } from '@/domain/preferences/store';
import type { AllergenKey, Diet, PriceTier } from '@/domain/dish/types';
import { colors, radius, spacing, typography } from '@/shared/theme';

const ALLERGENS: Array<{ key: AllergenKey; label: string }> = [
  { key: 'gluten', label: 'Gluten' }, { key: 'dairy', label: 'Dairy' },
  { key: 'seafood', label: 'Seafood' }, { key: 'nuts', label: 'Nuts' },
  { key: 'eggs', label: 'Eggs' }, { key: 'pork', label: 'Pork' },
  { key: 'beef', label: 'Beef' }, { key: 'alcohol', label: 'Alcohol' },
];
const DIETS: Array<Diet | 'none'> = ['none', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'];

export const FiltersScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const prefs = usePreferencesStore(s => s.preferences);
  const setAllergens = usePreferencesStore(s => s.setAllergens);
  const setDiet = usePreferencesStore(s => s.setDiet);
  const setPriceRange = usePreferencesStore(s => s.setPriceRange);
  const [selected, setSelected] = useState<AllergenKey[]>(prefs.allergens);
  const [diet, setDietLocal] = useState<Diet | 'none'>(prefs.diet ?? 'none');
  const [priceMax, setPriceMax] = useState<PriceTier>(prefs.priceRange[1]);

  const save = async () => {
    await setAllergens(selected);
    await setDiet(diet === 'none' ? null : diet);
    await setPriceRange([prefs.priceRange[0], priceMax]);
    nav.goBack();
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Allergens</Text>
        {ALLERGENS.map(({ key, label }) => (
          <View key={key} style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Toggle
              value={selected.includes(key)}
              onValueChange={() =>
                setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
              }
            />
          </View>
        ))}

        <Text style={styles.section}>Dietary style</Text>
        <View style={styles.chipRow}>
          {DIETS.map(d => (
            <Text
              key={d}
              onPress={() => setDietLocal(d)}
              style={[styles.chip, diet === d && styles.chipActive]}
            >
              {d}
            </Text>
          ))}
        </View>
      </ScrollView>
      <View style={{ padding: spacing.xl }}>
        <Button label="Apply" onPress={save} size="lg" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundLight },
  content: { padding: spacing.xl, gap: spacing.sm },
  section: { fontFamily: typography.fontFamily.bold, color: colors.primary, fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: 2, marginTop: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceLight, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.divider },
  rowLabel: { fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.md, color: colors.textPrimary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.sm, color: colors.textSecondary, backgroundColor: colors.surfaceLight, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.divider, textTransform: 'capitalize' },
  chipActive: { backgroundColor: colors.primary, color: '#fff', borderColor: colors.primary },
});
```

- [ ] **Step 3: Implement DataScreen**

Create `mobile/src/features/settings/DataScreen.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/shared/components/Button';
import { colors, spacing, typography } from '@/shared/theme';
import { useSessionStore } from '@/domain/session/store';
import { useLikedHistoryStore } from '@/domain/session/history';
import { usePreferencesStore } from '@/domain/preferences/store';

export const DataScreen: React.FC = () => {
  const confirmReset = (title: string, body: string, fn: () => Promise<void>) => {
    Alert.alert(title, body, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => void fn() },
    ]);
  };
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.title}>Manage data</Text>
        <Text style={styles.body}>All data is stored on this device only.</Text>
        <Button
          label="Reset current session"
          variant="secondary"
          onPress={() => confirmReset(
            'Reset session?',
            'Your current swipe session will be cleared. Liked history is preserved.',
            () => useSessionStore.getState().resetSession(),
          )}
        />
        <Button
          label="Clear liked history"
          variant="secondary"
          onPress={() => confirmReset(
            'Clear liked history?',
            'All your liked dishes will be removed from the Matches gallery.',
            () => useLikedHistoryStore.getState().reset(),
          )}
        />
        <Button
          label="Reset everything"
          variant="ghost"
          onPress={() => confirmReset(
            'Reset everything?',
            'Preferences, session, and liked history will all be cleared. You will go through onboarding again.',
            async () => {
              await useSessionStore.getState().resetSession();
              await useLikedHistoryStore.getState().reset();
              await usePreferencesStore.getState().reset();
            },
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundLight },
  content: { padding: spacing.xl, gap: spacing.md },
  title: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes['2xl'], color: colors.textPrimary },
  body: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, fontSize: typography.sizes.sm, marginBottom: spacing.md },
});
```

- [ ] **Step 4: Register in SettingsNav**

Edit `mobile/src/app/MainTabs.tsx` — update `SettingsNav`:

```tsx
import { FiltersScreen } from '@/features/settings/FiltersScreen';
import { DataScreen } from '@/features/settings/DataScreen';
// ...
const SettingsNav = () => (
  <SettingsStack.Navigator>
    <SettingsStack.Screen name="Settings" component={SettingsScreen} />
    <SettingsStack.Screen name="Filters" component={FiltersScreen} options={{ title: 'Filters' }} />
    <SettingsStack.Screen name="Data" component={DataScreen} options={{ title: 'Data' }} />
  </SettingsStack.Navigator>
);
```

- [ ] **Step 5: Commit**

```bash
git add mobile/src/features/settings/ mobile/src/app/MainTabs.tsx
git commit -m "feat(mobile): SettingsScreen with Filters + Data sub-screens"
```

---

## Phase 10: Final polish and manual test

### Task 40: Integration test — end-to-end engine + session

**Files:**
- Create: `mobile/src/__tests__/integration/swipeFlow.test.ts`

- [ ] **Step 1: Write integration test**

Create `mobile/src/__tests__/integration/swipeFlow.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSessionStore } from '@/domain/session/store';
import { useLikedHistoryStore } from '@/domain/session/history';
import { usePreferencesStore } from '@/domain/preferences/store';
import { dishRepository } from '@/domain/dish/repositoryInstance';
import { createDefaultEngine } from '@/domain/recommendation/defaultEngine';

describe('swipe flow integration', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useSessionStore.setState(useSessionStore.getInitialState());
    useLikedHistoryStore.setState(useLikedHistoryStore.getInitialState());
    usePreferencesStore.setState(usePreferencesStore.getInitialState());
  });

  it('simulating 10 likes produces a non-empty Top-3 match', async () => {
    const engine = createDefaultEngine();
    const pool = dishRepository.filterByPreferences(usePreferencesStore.getState().preferences);
    expect(pool.length).toBeGreaterThanOrEqual(10);

    await useSessionStore.getState().startNewSession();
    for (let i = 0; i < 10; i++) {
      const session = useSessionStore.getState().session!;
      const remaining = pool.filter(d => !session.seenDishIds.includes(d.id));
      if (remaining.length === 0) break;
      const next = remaining[0]; // deterministic
      await useSessionStore.getState().recordSwipe(next, 'like');
      await useLikedHistoryStore.getState().recordLike(next.id, session.id);
    }

    const session = useSessionStore.getState().session!;
    const ctx = {
      user: { tasteVector: session.tasteVector, categoricalCounts: session.categoricalCounts },
      session, now: new Date(),
    };
    const match = engine.matchTop3(pool, ctx);
    expect(match.top3.length).toBeGreaterThanOrEqual(1);
    expect(match.top3[0].matchPercent).toBeGreaterThan(0);
  });

  it('preferences hard filters remove gluten-containing dishes', async () => {
    await usePreferencesStore.getState().setAllergens(['gluten']);
    const pool = dishRepository.filterByPreferences(usePreferencesStore.getState().preferences);
    for (const d of pool) {
      expect(d.contains.gluten).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run tests**

```bash
cd mobile
npm test -- swipeFlow.test.ts
```

Expected: All pass (assuming foods.json has at least 10 non-gluten dishes — fix seed data if this fails).

- [ ] **Step 3: Commit**

```bash
git add mobile/src/__tests__/integration/
git commit -m "test(mobile): integration test for swipe flow + filtering"
```

---

### Task 41: Typecheck + full test pass + coverage

**Files:**
- None (verification only)

- [ ] **Step 1: Typecheck**

```bash
cd mobile
npm run typecheck
```

Expected: No errors.

- [ ] **Step 2: Full test pass with coverage**

```bash
cd mobile
npm run test:coverage
```

Expected: All tests pass. Domain coverage (src/domain, src/shared/utils) ≥ 80%.

- [ ] **Step 3: No commit needed** unless coverage gaps require new tests. If they do, add targeted tests, commit, and re-run.

---

### Task 42: Manual MVP shipping checklist

**Files:**
- None (device walkthrough)

Walk through every item. Fix any failure, commit the fix, and re-verify before ticking the item.

- [ ] **1. Fresh install → onboarding completes → first swipe works**

Delete the app from Expo Go (swipe away from recent apps, then hold and delete) so AsyncStorage clears. Re-scan QR. Walk through: Welcome → Get started → toggle allergens → Continue → pick diet → Continue → pick price range → Start discovering. Discover tab appears with a card. Swipe right → card leaves, next card appears, match-potential bar updates.

- [ ] **2. 10 likes → match reveal fires → Top-3 shows correct match percents**

Swipe right 10 times. Match reveal appears. #1, #2, #3 all show dishes with match % values. Hero dish has the highest %.

- [ ] **3. Kill app mid-session → reopen → resumes exactly where left off**

Mid-session (say, 5 likes in), kill Expo Go (swipe up). Re-scan QR. App opens directly to Discover (not onboarding), same swipe count, same match-potential reading, taste vector preserved.

- [ ] **4. Toggle an allergen → containing dishes disappear from remaining pool**

Settings → Filters → enable Gluten allergen → Apply. Return to Discover. Continue swiping. No gluten-containing dishes should appear.

- [ ] **5. Swipe 40 times without 10 likes → match reveal still fires**

Reset session (Settings → Data → Reset current session). Swipe left 40 times straight. Match reveal fires with "here's what we've got" energy — Top-3 still populated.

- [ ] **6. Test on iPhone 15 + iPhone SE + iPad**

Expo Go on all three. Layout holds: swipe card fills appropriate space, buttons reachable on SE, iPad doesn't stretch distortedly.

- [ ] **7. Liked gallery shows all right-swipes across sessions**

Swipe right on 3 dishes. Go to Matches tab. All 3 appear. Reset session (keep liked history). Swipe right on 2 more. Go to Matches. All 5 appear.

- [ ] **8. "Reset everything" sends back to onboarding**

Settings → Data → Reset everything → confirm. App returns to Welcome screen.

- [ ] **Step 9: Final commit if any fixes were made**

```bash
cd "C:/Users/prinp/Documents/GitHub/munch"
git status
```

If there are outstanding commits, push everything:

```bash
git push origin main
```

**Do not push without explicit user approval** — the plan only authorizes local commits.

---

## Out-of-scope notes for the implementer

These appear in the spec's "non-goals" and the plan does not cover them:

- Auth / user accounts
- Cloud sync of preferences, sessions, or liked history
- Google Places / restaurant integration
- Functional "Order Now" or "Find Restaurants" buttons (they're intentionally disabled teasers)
- Friend matching, group recommendations, or any social features
- Location or time-of-day scorers (the engine interface supports them; no implementations ship)
- Radar chart or "Top Taste Attributes" on Profile (stats placeholder only)
- Masonry gallery or search (simple 2-col grid only)
- Push notifications, in-app messaging, analytics, crash reporting
- Detox E2E tests
- Full ~300-dish curation (20 dishes ship as seed; content task tracked separately)

## Known future work to feed into v1.1 planning

- **Dish content:** expand seed 20 → 300 curated dishes, compute real blurhashes from CDN images
- **Lifetime flavor radar chart on Profile:** data foundation (`likedHistory`) is in place
- **Cloud sync:** wrap `Storage` with a remote adapter; swap in `store.ts` constructors
- **Google Places integration:** add `LocationProximityScorer`, enable it in `createDefaultEngine`, wire "Find Restaurants" button
- **Delivery:** third-party API behind "Order Now" button
- **Image caching:** `react-native-fast-image` if perceived load feels slow in field testing
- **Detox E2E:** when the UI stabilizes




