# Phase 1 Setup Guide — Tasks That Need You

**Context:** Companion to `docs/roadmap.md`. These are the Phase 1 items that can't be completed without your accounts, credentials, or judgment — step-by-step walk-throughs with what to hand back.

Do them in the order listed. Each builds on the previous.

---

## 1. Run the thumbhash compute script

**Time:** 5 min · **Cost:** Free

**Why:** The MVP's `image_thumbhash` values are placeholder strings. Real thumbhashes give pretty blurred previews while CDN images load.

**Prerequisites:** Node 20 installed, network access.

**Steps:**

```bash
cd C:/Users/prinp/Documents/GitHub/munch
npm install
```

Installs `sharp` (image processing) + `thumbhash` at the repo root. **`sharp` builds a native binary** — if it fails on Windows, you'll likely need Python 3 + Visual Studio Build Tools installed. If that's painful, flag it and we'll swap in a WASM alternative.

Then:

```bash
node scripts/compute-thumbhashes.mjs
```

Fetches every image URL in `foods.json`, resizes to 100px, computes the thumbhash, writes back. ~1–2 seconds per dish → ~1 minute total for 22 dishes.

**Hand back:** Nothing. Commit and push:

```bash
git diff mobile/src/data/foods.json   # only image_thumbhash values should change
git add mobile/src/data/foods.json
git commit -m "content: compute real thumbhashes for seed dishes"
git push
```

**Gotcha:** If `sharp` install fails on Windows, say the word and we'll switch to a WASM-based pipeline.

---

## 2. Content expansion to ~100 dishes

**Time:** Varies (4–8 hrs DIY, 30 min if you ask me, 2–3 weeks if hired out) · **Cost:** Free (DIY or me); $200–500 (hired)

**Why:** 22 dishes means users exhaust the pool in a single session. Variety is what makes the app feel alive and the recommendation engine earn its keep.

### Option A — You curate manually (best quality, ~8 hours)

Use the existing `foods.json` as a template. For each new dish:

- Know the dish well enough to estimate flavor axes (0–5 each for sweet/sour/salty/bitter/umami/heat/richness).
- Find a good Unsplash photo (search "dish-name food"). Copy the URL with `?w=800&q=80`.
- Decide textures, meal types, allergens, price tier, diet compatibility.

Target **78 new dishes** (22 → 100). Rough distribution:

| Region | Add |
|---|---|
| east_asian | 15 more (underweight currently) |
| southeast_asian | 10 more |
| south_asian | 10 more |
| middle_eastern / african / mediterranean | 10 total |
| western_european / eastern_european / nordic | 15 total |
| north_american / latin_american | 10 total |
| dessert/snack (cross-region) | 8 more |

After adding, run the validator:

```bash
node scripts/validate-foods.mjs
```

Fix anything it complains about.

### Option B — I generate a first-pass draft (~30 minutes of my time)

Tell me "draft the expansion" and I'll dispatch a subagent to author ~78 new dishes in the schema. You review/edit before merging — expect to tweak 30–40% of flavor axes and maybe swap some images. **Quality is credible but not hand-curated.** Good enough for beta testing; polish before public launch.

### Option C — Hire it out (2–3 weeks, ~$200–500)

Find a food writer on Upwork/Contra. Give them the schema + a sample dish. Quality ceiling is high if you pick well. Slowest option.

**Recommendation:** B now to unblock testing, then A (you personally curating your favorites) as ongoing polish.

**Hand back:** Commit and push the expanded `foods.json`.

---

## 3. Pick & set up a CDN

**Time:** 30–60 min · **Cost:** Free tier covers MVP

**Why:** Unsplash URLs are fragile (they rate-limit, images can disappear). A controlled CDN = reliability + on-the-fly resizing.

### Recommended: Cloudinary

- Free tier: 25 GB storage + 25,000 transformations/month
- On-the-fly resize via URL params (no manual resizing): `/w_800,q_80,f_auto/dish-name.jpg`
- Automatic format optimization (serves WebP to compatible clients)
- No credit card required for free tier

### Steps

1. Go to https://cloudinary.com → Sign up (free, email only).
2. On the dashboard, note your **Cloud name** (e.g., `drx7kfaps` — visible in the top bar).
3. **Upload the seed images** (22 now, or all 100 after content expansion):
   - Dashboard → Media Library → Upload
   - For each dish, upload with a clean public ID matching the dish slug (e.g., `mango_sticky_rice`)
   - Organize in a folder called `munch/dishes/`
4. A Cloudinary URL looks like:
   ```
   https://res.cloudinary.com/<cloud-name>/image/upload/w_800,q_80,f_auto/munch/dishes/mango_sticky_rice.jpg
   ```

### Hand back

- Your **Cloud name**
- Confirmation that images are uploaded with filenames matching dish IDs

Then I'll add a helper `dishImageUrl(dish, 'card' | 'thumb')` that constructs these URLs, migrate `foods.json`, and re-run the thumbhash compute.

### Alternatives

- **Bunny.net** — ~$0.01/GB bandwidth (pennies at MVP scale, but requires credit card upfront)
- **Supabase Storage** — free tier 1 GB, pairs cleanly with Phase 2 auth. If you already know you want Supabase later, skip Cloudinary and go straight here.

---

## 4. EAS Dev Build (biggest unlock)

**Time:** 60–90 min first time + Apple approval wait; ~20 min per recurring build · **Cost:** $99/year Apple fee, EAS free tier for builds

**Why:** This is the biggest unlock in Phase 1. Lets you test native modules, run outside Expo Go, and later submit to TestFlight and the App Store.

### Prerequisites (do these first)

1. **Apple Developer Program enrollment — $99/year.** Non-negotiable for iOS distribution. Sign up at https://developer.apple.com/programs/enroll/ using your Apple ID. Approval takes a few hours to 2 days. **Start this first — everything else waits.**
2. **Expo account — free.** Sign up at https://expo.dev.
3. **`eas-cli` globally installed:**
   ```bash
   npm install -g eas-cli
   ```

### Steps

1. **Log in to Expo CLI:**
   ```bash
   cd C:/Users/prinp/Documents/GitHub/munch/mobile
   eas login
   ```

2. **Initialize EAS for this project:**
   ```bash
   eas build:configure
   ```
   Pick **iOS** when prompted. It creates `mobile/eas.json` with default build profiles.

3. **Commit `eas.json`:**
   ```bash
   cd ..
   git add mobile/eas.json
   git commit -m "build: configure EAS"
   ```

4. **Start a dev client build:**
   ```bash
   cd mobile
   eas build --profile development --platform ios
   ```
   Prompts you'll see:
   - "Generate a new Apple Distribution Certificate?" → **Yes**
   - "Register device?" → **Yes**. EAS gives you a URL. Open in Safari on your iPhone → install the config profile → device registered.
   - "Generate new Provisioning Profile?" → **Yes**

   One-time setup. Subsequent builds are fully automated.

5. **Wait ~15 minutes** for the cloud build. You'll get a URL.

6. **Install the dev client** by visiting the URL in Safari on your phone → Install.

7. **Start Metro pointed at the dev client:**
   ```bash
   npx expo start --dev-client
   ```
   Open the Munch dev-client app on your phone (new icon, not Expo Go). Scan QR or enter the Metro URL.

### What changes after this

- Any native module works.
- You no longer need Expo Go — the dev client IS your dev-mode app.
- **Rule of thumb:** Install a new native dependency → run `eas build` again. Pure-JS deps don't require rebuild.

### Hand back

- Confirmation the dev client installed and Metro connects
- Your Expo username + project slug (visible at https://expo.dev)

I don't need your Apple credentials — EAS handles that.

### Cost reality check

- Apple: $99/year mandatory
- EAS: free tier = 30 builds/month (plenty for MVP). If you exceed: $1/build or $19/month unlimited. You won't exceed during Phase 1.

---

## 5. Sentry setup

**Time:** 15 min · **Cost:** Free tier covers MVP

**Why:** When something crashes in production, you need to know about it. Sentry is the industry default.

### Steps

1. Go to https://sentry.io → Sign up (free; GitHub OAuth is fine).
2. Create a new project:
   - Platform: **React Native**
   - Alert frequency: "Alert me on every new issue"
   - Project name: `munch-mobile`
3. Sentry shows an installation page with your **DSN** — looks like:
   ```
   https://abc123def456@o1234567.ingest.us.sentry.io/4509876543210
   ```
   **Copy this.**
4. (Optional, needed later for release tracking) Create an **Auth Token**:
   - Settings → Auth Tokens → Create Token
   - Scopes: `project:releases` + `project:read`
   - Save the token somewhere safe.

### Hand back

- **Sentry DSN** (safe to paste in chat — DSNs are write-only ingestion endpoints)
- **Organization slug** and **project slug** (from the project settings URL)

Then I'll:

- `npx expo install @sentry/react-native`
- Initialize Sentry in `App.tsx` with your DSN
- Add a test error trigger (removed before launch)
- Configure source-map uploading in `eas.json`

### Cost

Free tier: 5,000 errors/month, 7-day retention. Team plan ($26/mo) available later if needed.

---

## 6. PostHog setup

**Time:** 15 min · **Cost:** Free tier is effectively infinite for MVP

**Why:** Answer "how many users finish onboarding?" and "do users actually use the Matches tab?" — questions logs alone can't answer.

### Steps

1. Go to https://posthog.com → Sign up (free; email or GitHub).
2. Hosting: choose **US Cloud** (faster for US users) or **EU Cloud** (GDPR-stricter regions). Either is fine.
3. Create a new project: `Munch Mobile`.
4. When prompted for SDK, pick **React Native**.
5. Copy the **Project API Key** (starts with `phc_...`) and the **Host URL** (e.g., `https://us.i.posthog.com`).

### Hand back

- **Project API Key**
- **Host URL**

Then I'll:

- `npm install posthog-react-native`
- Initialize PostHog in `App.tsx`
- Wire events: `onboarding_completed`, `swipe`, `match_revealed`, `session_reset`
- Add a `useAnalytics()` hook for feature-level tracking

### Cost

Free tier: 1 million events/month, 1 year retention. Effectively infinite for MVP/beta.

---

## Recommended order + time budget

| # | Task | Blocking? | Time | Cost |
|---|---|---|---|---|
| 1 | Run thumbhash compute | No | 5 min | Free |
| 2 | Content expansion (option B — me drafting) | No, but unblocks real testing | 30 min of my time | Free |
| 3 | Cloudinary CDN | No | 30–60 min | Free |
| 4 | EAS dev build | **Yes — gate for Phase 4 launch** | 60–90 min + Apple approval | $99/year |
| 5 | Sentry | Recommended before beta | 15 min | Free |
| 6 | PostHog | Recommended before beta | 15 min | Free |

### Minimum path to unblock me

1. Do **#1** now (5 min — unblocks image polish).
2. Tell me to do **#2 option B** (unblocks real beta testing).
3. Start **#4 today** — Apple enrollment takes 1–2 days to approve, so kick it off while you do everything else.

While Apple is approving: knock out **#3**, **#5**, **#6** in parallel. By the time Apple greenlights, you can come back with: Cloudinary cloud name, Sentry DSN, PostHog key — and I'll wire everything up in one commit pass.

---

## When your keys arrive

The app is pre-wired with no-op adapters. To connect real services:

### Sentry
1. `npx expo install @sentry/react-native`
2. In `App.tsx`, before `export default`:
   ```ts
   import * as Sentry from '@sentry/react-native';
   import { setErrorAdapter } from '@/shared/errorMonitoring';

   Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN });
   setErrorAdapter({
     captureException: (error, ctx) => Sentry.captureException(error, { tags: ctx?.tags, extra: ctx?.extra }),
     captureMessage: (msg, level) => Sentry.captureMessage(msg, level),
     setUser: (user) => Sentry.setUser(user),
     addBreadcrumb: (crumb) => Sentry.addBreadcrumb(crumb),
   });
   ```
3. Add `EXPO_PUBLIC_SENTRY_DSN=<your-dsn>` to `.env` (and `.env.example`).

### PostHog
1. `npm install posthog-react-native`
2. In `App.tsx`:
   ```ts
   import PostHog from 'posthog-react-native';
   import { setAnalyticsAdapter } from '@/shared/analytics';

   const posthog = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_KEY!, {
     host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
   });
   setAnalyticsAdapter({
     identify: (id, traits) => posthog.identify(id, traits),
     track: (event) => posthog.capture(event.name, event),
     reset: () => posthog.reset(),
   });
   ```
3. Add `EXPO_PUBLIC_POSTHOG_KEY` + `EXPO_PUBLIC_POSTHOG_HOST` to `.env`.

No other code changes required — every event is already firing.
