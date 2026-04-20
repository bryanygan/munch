# Munch Roadmap — MVP → Production

**Last updated:** 2026-04-19
**Current state:** MVP complete (`feature/mobile-mvp` branch, PR #1). Runs on iPhone via Expo Go. Local-only (AsyncStorage). 22 seed dishes. No auth, no restaurants, no delivery, no social.
**Target:** Public launch on App Store (iOS) + Play Store (Android) with cloud accounts, real restaurant data, and essential ops infrastructure.

This document is a living roadmap. Phase estimates are for a solo developer working evenings/weekends — scale accordingly if the team grows. Each phase has an exit criterion that must be met before starting the next.

---

## Phase 1 — Foundation Hardening (2–3 weeks)

**Theme:** Close the gaps between "works on my phone in Expo Go" and "runs reliably for 50 beta users."

### 1.1 Content expansion — curate 300 dishes

Replace the 22-dish seed with a real catalog.

- Author ~300 dishes in the existing `foods.json` schema. Prioritize global variety (all 12 cuisine regions represented, 15+ countries).
- Write a small Node script (`scripts/validate-foods.ts`) that loads `foods.json` and runs the existing `foods.test.ts` rules plus: image URL reachability check, duplicate-name detection, flavor-axis sanity (e.g., dessert shouldn't have heat=5).
- Add a script to compute real `image_blurhash` values from each image URL (use `blurhash` npm package in Node — it's pure JS, not the native module).
- Wire the validator into CI (Phase 1.5).

**Why now:** The pipeline works end-to-end. Content is now the visible bottleneck — users exhaust 22 dishes in one session.

### 1.2 Images — dedicated CDN + thumbhash fallback

- Move from ad-hoc Unsplash URLs to a controlled CDN. Options: **Cloudinary** (free tier: 25GB/25k transformations), **Bunny.net** (pay-as-you-go, ~$0.01/GB), or **Supabase Storage** (free tier + pairs well with Phase 2 auth).
- Replace stripped `react-native-blurhash` with **thumbhash** (pure JS, no native module — works in Expo Go). Or accept the current solid-color placeholder as acceptable fallback.
- Serve images at two sizes: 800w for swipe cards, 200w for Matches grid. Build URL helper: `dishImageUrl(dish, 'card' | 'thumb')`.

### 1.3 Dev build via EAS

Expo Go can't load native modules (this is why we had to drop `react-native-blurhash`). For production, you need an **EAS development build**.

- Run `eas build:configure` from `mobile/`.
- Create a free Expo account if not already done; enroll in Apple Developer Program ($99/year — required for any iOS distribution).
- Build the dev client: `eas build --profile development --platform ios`.
- Install the dev client on your phone via Expo's TestFlight-style flow.
- From that point, the app can use any native module without Expo Go limitations.

**Exit criterion:** App runs on your phone from a dev client build, no longer dependent on Expo Go.

### 1.4 Error monitoring — Sentry

- `npx expo install sentry-expo`
- Initialize with a Sentry DSN in `App.tsx`.
- Test by throwing a deliberate error in a dev build; verify it lands in Sentry.
- Wire Sentry into the Expo build pipeline for source-map symbolication.

**Cost:** Sentry free tier covers 5k errors/month — plenty for beta.

### 1.5 Analytics — PostHog

- `npm install posthog-react-native`
- Track 4 events: `onboarding_completed`, `swipe` (with `direction`, `dish_id`), `match_revealed` (with `match_percent`), `session_reset`.
- Use these to answer: how many users complete onboarding? Average likes per session? Most-liked dishes?
- PostHog free tier: 1M events/month.

### 1.6 CI pipeline — GitHub Actions

Create `.github/workflows/ci.yml`:
- On PR: `npm ci` → `npm test` → `npx tsc --noEmit` in `mobile/`. Block merge on failure.
- On push to main: same, plus run the foods.json validator.
- (No EAS builds on CI yet — those cost EAS credits and are manual during beta.)

**Phase 1 exit criterion:** App runs from an EAS dev build on a real device, shows 300 real dishes, crashes are monitored in Sentry, CI blocks broken merges.

---

## Phase 2 — Cloud & Accounts (3–4 weeks)

**Theme:** Users identify themselves. Their data persists across devices. You can update dish content without shipping the app.

### 2.1 Pick a backend

**Recommendation: Supabase.** Postgres + auth + storage + row-level security, single dashboard, generous free tier (500MB database, 50k monthly active users, 5GB bandwidth). Alternative: Firebase (mature but vendor-lock-in-heavy, NoSQL). For this project, Supabase is the better fit — the dish catalog is inherently relational.

### 2.2 Schema

Two tables to start:

```sql
-- users: anon or email-authenticated
create table users (
  id uuid primary key references auth.users(id),
  created_at timestamptz default now(),
  email text unique,
  display_name text,
  preferences jsonb,         -- the Preferences object
  liked_history jsonb        -- the LikedHistory.events array
);

-- dishes: replaces bundled foods.json
create table dishes (
  id text primary key,
  data jsonb not null,       -- the full Dish object
  updated_at timestamptz default now()
);
```

Seed `dishes` from the Phase 1 curated `foods.json` — this becomes the source of truth.

### 2.3 Auth flow

Add an Auth screen between Welcome and AllergenPicker:
- **"Continue as guest"** → anonymous auth (Supabase supports this). Creates a user row with `email = null`.
- **"Sign in with email"** → magic link auth.
- **"Sign in with Apple"** → required by App Store if you offer any third-party sign-in.

Anonymous users can upgrade to email/Apple later without losing data (preserve the user ID).

### 2.4 Sync layer

Wrap the existing `Storage` utility with a `RemoteStorage` adapter that reads/writes through Supabase. Keep AsyncStorage as a write-through cache — the app still works offline, and syncs when reconnected.

Migration: on first launch of an update, detect local-only data and push to the backend. Never destroy local data until server confirms.

### 2.5 Dish catalog from backend

Replace `dishRepository` (currently reads bundled `foods.json`) with a version that fetches from Supabase, caches locally, and refreshes on a schedule (e.g., once per session). This means you can add/edit dishes on the backend without shipping a new app build.

**Phase 2 exit criterion:** A user signs in on one device, swipes through dishes, signs in on a second device, and sees their likes.

---

## Phase 3 — Restaurants & Location (3–4 weeks)

**Theme:** The original vision — turn a dish match into "where can I actually eat this tonight?"

### 3.1 Google Places API integration

- Enable Places API in Google Cloud Console.
- Budget: Google's free tier gives $200/month credit. Text Search is $0.032/call, Place Details $0.017/call. A user looking up 5 restaurants per match = ~$0.25/session. Free tier covers ~800 sessions/month before you pay.
- Install `@googlemaps/places` or use REST directly.

### 3.2 Location permission flow

- Add an optional "Enable location" step at onboarding (skip-able).
- Use `expo-location` for permission handling.
- Fallback: let users type a city/ZIP manually if they decline.

### 3.3 Restaurant-dish association

Two approaches, in increasing sophistication:

- **Level 1 (ship first):** Search Google Places for the dish name near the user's location. "Find restaurants for Thai Green Curry near 19104" → list of places selling Thai food.
- **Level 2 (later):** Curated dish-restaurant mapping. Maintain a `dish_restaurants` table mapping dish IDs to specific restaurant place IDs. More accurate but requires ongoing curation.

Ship Level 1 for now. The "Find Restaurants" button on MatchReveal becomes real.

### 3.4 Restaurant details screen

Tap a restaurant → sheet with: name, rating, price level, distance, hours, phone, website, photos, reviews. All from Google Places.

### 3.5 `LocationProximityScorer`

Plug a new scorer into the `createDefaultEngine` factory. Weight it modestly (0.2?). Use it to bias recommendations slightly toward dishes likely to be available nearby. (Requires location context — gated on the Phase 3.2 permission.)

**Phase 3 exit criterion:** After a match reveal, user can tap "Find Restaurants" and see a real list of places serving that dish near them.

---

## Phase 4 — Beta & Public Launch (2–3 weeks)

**Theme:** Get it into real hands, then ship it.

### 4.1 Private beta via TestFlight

- Invite 10–20 people (friends, r/foodie, etc.).
- Give them a Google Form to report issues + send Sentry.
- Focus areas: onboarding drop-off, swipe fatigue, match quality, restaurant discovery utility.
- Iterate 1–2 weeks based on feedback.

### 4.2 Android parity via EAS

Expo makes this essentially free — run `eas build --platform android`. Test on at least one Android device (Pixel or Samsung). Fix platform-specific bugs (usually keyboard/safe-area issues).

### 4.3 Legal + compliance

Non-negotiable before store submission:
- **Privacy policy** — hosted publicly. Covers: location data, likes/preferences, crash data, analytics. Use a generator (PrivacyTerms, Termly) or write from scratch.
- **Terms of service** — same.
- **COPPA compliance** — if under-13 users are a risk, require age gate. Food app: probably safe to target 12+.
- **Data handling disclosures** — App Store's privacy nutrition label. Declare: location (coarse), user content (preferences), identifiers (user ID).

### 4.4 App Store submission

- App icon, launch screen, screenshots (5 per device size — iPhone 6.7", 6.1", iPad Pro if supporting).
- Descriptions, keywords, support URL, marketing URL.
- First submission typically rejects once — common reasons: missing "Sign in with Apple" if you have third-party auth, unclear purpose of allergen data, broken support email.
- Budget 2 weeks for the review cycle.

### 4.5 Play Store submission

- Similar process. Google's review is usually faster (2–3 days).
- Android has more size variation — verify screenshots on phone + tablet.

**Phase 4 exit criterion:** App is publicly downloadable on both stores.

---

## Phase 5 — Growth Features (post-launch, ongoing)

**Theme:** The features from the original brainstorm that were deferred. Each is its own sub-project.

### 5.1 Delivery integration (4–6 weeks)

- Pick a provider: **DoorDash Drive API** (developer-friendly), **Uber Eats** (requires approved developer account), or **Rappi** (regional). Starting with DoorDash Drive is probably lowest-friction.
- "Order Now" button on MatchReveal becomes real — opens DoorDash checkout prefilled with the matched dish.
- Affiliate/partner revenue share becomes a possible monetization path here.

### 5.2 Social features (6–8 weeks)

From the original vision: friend matching, group recommendations.

- Friend graph: follow/unfollow relationships in Supabase.
- Group session: "invite 3 friends, we all swipe, get one dish everyone likes." Uses `SocialAlignmentScorer` — a new scorer that combines group taste vectors.
- Shared match history: see what your friends liked.

### 5.3 Context-aware recommendations (2–3 weeks)

Two new scorers plug into `createDefaultEngine`:
- `TimeOfDayScorer` — breakfast dishes at 9am, dinner at 7pm.
- `WeatherContextScorer` — soup when it's cold, salad when it's hot. Requires a weather API (OpenWeatherMap free tier).

### 5.4 Lifetime flavor profile (2 weeks)

Build the radar chart visualization that was in the user's mockup but deferred from MVP. Data is already collected (`likedHistory` + `preferences` from Supabase). `react-native-svg` can render the radar. Brief design effort.

### 5.5 Advanced recommendation: collaborative filtering (4+ weeks)

Once you have 1000+ active users, collaborative filtering becomes viable: "users who liked X also liked Y." Can be self-hosted (matrix factorization on Python worker) or outsourced (Algolia Recommend, Recombee).

### 5.6 Monetization (when ready)

Options, roughly in order of reversibility:
- **Affiliate commission** from delivery partners (5.1). Invisible to user.
- **Munch Pro subscription** ($2.99/mo) — unlocks unlimited matches per day, group features, export liked history.
- **Ads** — high risk for a "discovery / lifestyle" app. Only consider if scale is there.

Revenue expectation for a niche food app: honest ballpark is $0.50–2 ARPU/month if you execute Pro well. Aim for 5% conversion to paid.

---

## Cross-cutting concerns (run throughout, not a phase)

These don't fit a single phase but need ongoing attention:

### Accessibility

- VoiceOver support — audit every screen. The swipe gesture needs an alternative (Yum/Nope buttons are the fallback — keep them visible).
- Dynamic type — already using theme tokens; verify sizes scale when the user sets large text in iOS settings.
- Color contrast — current primary orange on white meets WCAG AA for large text only. Audit before launch.

### Internationalization

- Defer until you have a reason (explicit international beta interest). When ready: `react-intl` or `i18next`. Currently English-only.
- Dish names/descriptions are the harder part — content translation, not code.

### Performance

- The current 22-dish pool makes every operation instant. At 300+ dishes + growing liked history, profile. Especially watch `engine.rankDishes` (runs on every swipe — O(n × scorers)).
- Add `react-native-fast-image` if CDN images feel slow on device.
- Use `FlatList` `getItemLayout` + `removeClippedSubviews` on Matches gallery once it has hundreds of items.

### Operations

- On-call burden: just you, for now. Sentry + a Slack webhook is enough.
- Cost monitoring: set Supabase + Google Cloud billing alerts. Expect Supabase free tier to last until 50k MAU.

### Content pipeline

- Dishes need ongoing curation — new cuisines, seasonal, user-suggested. Build a simple admin panel (Supabase's built-in table editor is enough for now; graduate to Retool or similar if someone else helps curate).

---

## Risks and tradeoffs

**Dish content quality is the bottleneck, not code.** Once the MVP pipeline is solid, the differentiator is whether the 300-1000 dishes feel curated and interesting vs. generic. This is a taste/authorship problem, not an engineering one. Budget real time for it — a weekend won't cut it for 300 quality dishes with flavor profiles, images, descriptions.

**Expo ecosystem lock-in.** Expo makes development fast but adds a layer — if you need custom native code that Expo doesn't support, you have to `prebuild` (migrate to bare workflow), which is a one-way door. For a food discovery app, this is unlikely to bite you; for an app that needs, say, custom Bluetooth integrations, it could. Current stack: bare workflow escape hatch is available if needed.

**Supabase single-vendor risk.** Supabase is open source and can be self-hosted, which is mitigating — but if they raise prices or shut down, migration is non-trivial. Firebase has the same risk (worse actually — not self-hostable). Weigh this vs. speed of development.

**App Store rejection on first submission.** Plan for it. Common causes for food discovery apps: unclear data usage (location, health data if you extend to nutrition), broken "Order Now" links (if they lead to dead ends), missing "Sign in with Apple" if you have any third-party auth.

**Legal exposure for allergen filtering.** If a user with a nut allergy relies on the app and is served a dish with nuts (bug in the data), there's real liability. Before launch, add prominent disclaimers: "Allergen filtering is a convenience feature, not medical advice. Always verify with the restaurant." Have a lawyer review the privacy policy and ToS.

---

## Suggested order of attack (solo dev, evenings + weekends)

| Week(s) | Focus | Outcome |
|---|---|---|
| 1–2 | Phase 1.1 + 1.2 (content + CDN) | 300 dishes on CDN |
| 2–3 | Phase 1.3 (EAS dev build) | App runs outside Expo Go |
| 3 | Phase 1.4 + 1.5 + 1.6 (Sentry, PostHog, CI) | Observability + guardrails |
| 4–6 | Phase 2 (Supabase, auth, sync) | Cross-device persistence |
| 7–9 | Phase 3 (Google Places) | "Find Restaurants" works |
| 10 | Phase 4.1 (private beta) | 10 beta users, feedback loop |
| 11 | Phase 4.2 (Android parity) | Works on Pixel |
| 12 | Phase 4.3–4.5 (legal + store submission) | Under App Store review |
| 13 | Review-cycle buffer | — |
| 14+ | Live on stores; start Phase 5 features based on usage data | — |

**That's ~14 weeks of solid evening/weekend effort to public launch.** Compressible to 8–10 if it's full-time. Expandable if content curation takes longer than estimated (which it often does).

The first releasable version is the one that's *good enough to delete Expo Go*. That's Phase 1.3. Everything after is scale, not existence.
