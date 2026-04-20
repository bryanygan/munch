# Munch

A swipe-to-decide food discovery app. Browse dishes like you're swiping on a dating app — YUM to like, NOPE to skip — and Munch learns your taste, eventually revealing a top-3 match it thinks you'll love.

Built with Expo + React Native (New Architecture), TypeScript, Zustand, and Reanimated.

## Features

- **Swipe to discover** — Card stack with gestures, YUM/NOPE badges, and haptics.
- **Match reveal** — After enough likes, Munch scores your session and reveals a top-3 match.
- **Taste learning** — Per-session taste vector + categorical counters drive the recommendation engine.
- **Onboarding** — Diet, allergens, and price range collected up front.
- **Filters & preferences** — Tweak cuisine, price, and dietary rules any time.
- **Liked history** — Revisit every dish you've said YUM to.
- **Offline-first** — Preferences, session, and history persist locally via AsyncStorage.

## Project layout

```
munch/
├── docs/                     # Internal docs (superpowers, etc.)
└── mobile/                   # Expo app
    ├── App.tsx               # Root: fonts, hydration, providers
    ├── app.json              # Expo config
    └── src/
        ├── app/              # Navigation (root, tabs, onboarding stack)
        ├── data/             # Seed data (foods.json, cuisineRegions)
        ├── domain/           # Business logic
        │   ├── dish/         #   Dish repository + types
        │   ├── preferences/  #   User preferences store
        │   ├── recommendation/ # Scoring engine + confidence
        │   └── session/      #   Swipe session, mutations, liked history
        ├── features/         # Screens grouped by feature
        │   ├── discover/     #   Swipe stack, match-potential bar, details
        │   ├── match/        #   Match reveal screen
        │   ├── matches/      #   Liked gallery
        │   ├── onboarding/   #   Welcome, diet, allergens, price
        │   ├── profile/
        │   └── settings/     #   Filters, data management
        ├── shared/           # Theme, components, hooks
        └── __tests__/        # Jest + property-based tests (fast-check)
```

Domain logic is deliberately isolated from UI — the recommendation engine, dish repository, and session mutations are all pure and independently testable.

## Getting started

Requires Node 20+ and the Expo toolchain.

```bash
cd mobile
npm install
npm start          # Expo dev server
npm run ios        # or
npm run android    # or
npm run web
```

## Development

```bash
npm run typecheck      # tsc --noEmit
npm test               # jest
npm run test:watch
npm run test:coverage
```

Path alias `@/*` maps to `mobile/src/*` (see `tsconfig.json`).

## Tech stack

- **Expo SDK 54** with the New Architecture enabled
- **React 19** / **React Native 0.81**
- **React Navigation** (native-stack + bottom-tabs)
- **Zustand** for state, **AsyncStorage** for persistence
- **Reanimated 4** + **Gesture Handler** for swipe interactions
- **expo-haptics**, **expo-blur**, **expo-image**
- **Plus Jakarta Sans** via `@expo-google-fonts`
- **Jest** + **@testing-library/react-native** + **fast-check**
