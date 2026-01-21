# SwellMind – Surf Recommendation Product Spec (Android-First)

## 1. Product Overview

### 1.1 Vision

SwellMind is a personalized surf recommendation product that learns each surfer's unique preferences and tells them **when conditions will be good _for them_** – not just generically "good".

It combines:

- Public marine forecast data (swell, wind, tide-like signals) from **Open‑Meteo Marine Weather API**
- A feedback loop of user ratings after sessions
- A simple but effective ML model that learns each surfer's preferred conditions over time

…to surface recommended surf windows with clear explanations ("You usually love 3–5 ft, offshore, mid‑tide in the morning").

### 1.2 Core Product Idea

- **Input:** Open‑Meteo marine forecasts + the user's own logs of surf sessions (ratings + qualitative feedback).
- **ML:** Gradually learns what conditions correlate with high ratings for that user.
- **Output:** A ranked list of upcoming **3‑hour surf windows** with a User Suitability Score and a concise explanation.

Initial focus:

- **Platform:** Native Android app (first), with a companion backend service.
- **Region:** Start with Portugal/Europe (Lisbon/Ericeira/Peniche) but keep backend global via Open‑Meteo.

---

## 2. User Personas & Use Cases

### 2.1 Personas

## Persona 1 – Connor Mitchell

**Label:** Weekend Warrior Surfer & Urban Professional

### Demographics

- Age: 28
- Gender: Male
- Income: €65,000–€85,000
- Location: Gold Coast, Australia
- Education: Bachelor’s degree in Computer Science

### Psychographics

Connor lives 15 minutes from the beach but works long hours in tech. He values efficiency and data-driven decisions—he tracks his fitness, monitors weather patterns obsessively, and plans his weekends around optimal conditions. He's frustrated by inconsistent surf forecasts and wasted trips to mediocre breaks. Connor sees surfing as both a physical outlet and a mental reset from screen time. He's motivated by self-improvement and enjoys analyzing what works best for his skill level. He appreciates technology that solves real problems without adding complexity.

### Shopping Behavior

Connor researches thoroughly before purchasing, reading reviews and comparing features. He's willing to pay for a lifetime deal because he values long-term value and avoiding recurring subscriptions. He discovers products through tech blogs, Reddit communities, and recommendations from fellow surfers. He prefers mobile-first solutions and appreciates clean UI design. Once convinced of quality, he's loyal and becomes an advocate within his friend group.

## Persona 2 – Amara Chen

**Label:** Digital Nomad & Travel Surfer

### Demographics

- Age: 26
- Gender: Female
- Income: €40,000–€60,000 (variable)
- Location: Currently split between Bali, Portugal, and Mexico
- Education: Some college; self-taught digital skills

### Psychographics

Amara surfs as part of her lifestyle brand and travel content strategy. She's motivated by discovering new breaks, authentic experiences, and community. She gets frustrated when she arrives at famous spots only to find them crowded or unsuitable for her level. Amara values apps that help her find hidden gems and connect with local surfer communities. She's spontaneous but also strategic about her content—she wants to capture great sessions for her audience. She prioritizes experiences over possessions and sees the €49 lifetime deal as an investment in better travel experiences.

### Shopping Behavior

Amara discovers products through Instagram influencers, travel blogs, and recommendations from other digital nomads. She's price-conscious due to variable income but willing to invest in tools that enhance her content and experiences. She values apps with social sharing features and community elements. She makes quick decisions based on peer recommendations and visual appeal. She engages with brands through comments and shares products she genuinely loves with her 50K+ followers.

## Persona 3 – Craig O’Sullivan

**Label:** Semi-Professional Surfer & Coaching Mentor

### Demographics

- Age: 35
- Gender: Male
- Income: €55,000–€75,000
- Location: Cornish Coast, United Kingdom
- Education: High school diploma; professional certifications in coaching

### Psychographics

Craig coaches 8–12 students weekly and surfs competitively in regional events. He's deeply motivated by optimizing performance and helping others improve. He's frustrated by generic forecasts that don't account for individual skill progression or preferences. Craig sees Swell Mind as a tool to accelerate his students' learning by helping them understand what conditions suit their abilities. He values data, precision, and measurable progress. He's meticulous about technique and conditions, and he respects products built by people who understand surf culture. He's willing to pay for premium tools that deliver real results.

### Shopping Behavior

Craig researches extensively and values expert opinions and scientific backing. He's influenced by other coaches and athletes in his network. He prefers products that offer educational value and community features. He's likely to purchase for himself and recommend (or bulk-purchase) for his coaching business. He appreciates detailed analytics and the ability to track progress over time. He's loyal to brands that demonstrate genuine understanding of surfing and continuous improvement.

## Persona 4 – Windy Rodriguez

**Label:** Busy Parent & Recreational Surfer

### Demographics

- Age: 41
- Gender: Female
- Income: €50,000–€70,000
- Location: San Diego, California
- Education: Bachelor’s degree in Business

### Psychographics

Windy surfs 2–3 times per month as a stress relief from work and family responsibilities. She's motivated by reclaiming personal time and staying active. She gets frustrated by wasted mornings when conditions are poor—with limited free time, every session matters. Windy values apps that help her maximize her limited surf time and make smarter decisions about when to go. She appreciates simplicity and doesn't want to spend time analyzing complex data. She's motivated by consistency and small wins. She sees Swell Mind as a tool that gives her an unfair advantage, letting her make the most of her precious free time.

### Shopping Behavior

Windy is practical and values time-saving solutions. She discovers apps through word-of-mouth from other surfers at her local beach and through casual social media browsing. She appreciates straightforward pricing (the lifetime deal appeals to her) and doesn't want hidden fees or subscriptions. She prefers apps with minimal learning curve. She's loyal to products that genuinely improve her experience and will recommend them to other busy parents in her circle. She values customer support and ease of use over flashy features.

## Persona 5 – Fiona Bergström

**Label:** Health-Conscious Fitness Enthusiast & Recreational Surfer

### Demographics

- Age: 32
- Gender: Female
- Income: €45,000–€65,000
- Location: Barcelona, Spain
- Education: Bachelor’s degree in Sports Science; multiple fitness certifications

### Psychographics

Fiona surfs as a cross-training activity and part of a holistic wellness lifestyle. She's motivated by understanding how different conditions affect her performance, recovery, and overall fitness. She's frustrated by one-size-fits-all fitness advice and generic forecasts. Fiona values data, personalization, and machine learning that adapts to her preferences. She sees Swell Mind as a tool that bridges surfing and fitness optimization. She's detail-oriented, tracks her workouts meticulously, and appreciates apps that integrate with her broader wellness ecosystem. She's motivated by self-knowledge and continuous improvement.

### Shopping Behavior

Fiona researches products thoroughly and values scientific backing and user reviews. She's influenced by fitness communities, wellness blogs, and other health professionals. She appreciates apps with integration capabilities (syncing with fitness trackers, wellness apps) and detailed analytics. She's willing to invest in quality tools that support her fitness goals. She values transparency about how algorithms work and data privacy. She's loyal to brands that demonstrate expertise in both fitness and their specific domain. She actively recommends products to her clients and professional network when she believes in them.

### 2.2 Core Use Cases

1. **"When should I surf in the next few days?"**
   - Android app shows upcoming 3‑hour surf windows per favorite spot, with a user‑specific suitability score and "Recommended" tags.

2. **"Log a session I just surfed (or surfed in the last 7 days)"**
   - User logs the session; app links it to stored forecast conditions for that time window.

3. **"What conditions do I like?"**
   - "Insights" view shows the conditions the user rated highest.

4. **"I'm new, how do I use this?"**
   - Onboarding collects rough preferences; app uses generic + heuristic recommendations until enough user data exists.

---

## 3. Platform & Architecture Overview

### 3.1 Platform Choice

- **Client:** Native Android app (Kotlin + Jetpack Compose).
- **Backend:** Node.js/TypeScript service (deployed on Railway).
- **Database:** Supabase (managed PostgreSQL) for persistent data + auth.

Later, you can add:

- Web dashboard (Next.js) for admin / analytics.
- iOS app (via Kotlin Multiplatform or separate implementation).

### 3.2 High-Level Architecture

1. Android app:
   - Handles UI, authentication (via Supabase or custom JWT), local caching for offline use.
   - Talks to backend via REST/JSON (HTTPS).

2. Backend:
   - Fetches forecasts & 7‑day history from **Open‑Meteo Marine Weather API**.
   - Aggregates to 3‑hour windows.
   - Caches results in Postgres and in memory.
   - Runs per‑user ML scoring.
   - Exposes endpoints to Android app for:
     - Forecast windows + scores
     - Session logging
     - Insights

3. Database (Supabase):
   - Stores users, spots, forecast snapshots, sessions, scores, and insights.

---

## 4. Product Features

### 4.1 Onboarding (Android)

**Goals:**

- Initialize user profile + preferences.
- Bind user to 1–3 home spots.
- Support generic scoring before enough data exists.

**Flow:**

1. Sign‑up / Sign‑in:
   - Email/password or OAuth (via Supabase Auth).
2. Home region:
   - Simple selection (e.g. "Lisbon / Ericeira / Peniche / Custom").
3. Spots:
   - Pick 1–3 spots from a curated list (backed by DB).
   - Option to add a custom spot (lat/lng).
4. Preferences:
   - Ideal wave size slider (e.g. "1–3 ft, 3–5 ft, 5–8 ft, 8ft+").
   - Crowd tolerance slider.
   - Available times of day (toggle: Dawn, Morning, Midday, Afternoon, Evening).

These preferences are stored and used as priors for generic recommendations.

---

### 4.2 Forecast Dashboard (Android)

**Key requirements:**

- Show 3‑hour windows for each day, not hourly.
- Use only **Open‑Meteo Marine Weather API**.
- Support next 7–10 days and last 7 days.

**UI Layout:**

- Top:
  - Spot selector (chip row / dropdown).
  - Date selector (Today + next 6 days; swipeable).
- For selected day:
  - List of 3‑hour windows (e.g. 05:00–08:00, 08:00–11:00, …).
  - Each card includes:
    - Time window label.
    - Wave height + period + direction (e.g. "1.3 m @ 11 s, WNW").
    - Wind speed + direction + orientation (Offshore / Cross / Onshore).
    - Optional tide‑like info if derived.
    - User Suitability Score (0–100).
    - "Recommended" badge if score > 75%.
    - Short explanation (e.g. "Matches your best‑rated pattern: 3–4 ft, offshore, morning").

**Backend behavior:**

- For each spot:
  - Query Open‑Meteo with a time step of **3 hours**, both forecast and last 7 days.
  - Store each 3‑hour timepoint as a **ForecastSnapshot**.
  - When Android requests windows:
    - Return aggregated 3‑hour snapshots **as‑is** (each snapshot = one window).
    - Attach ML scores if computed.

---

### 4.3 Log Session Flow (Android)

**Entry points:**

- Bottom navigation action: "Log Session".
- From a specific window card: "Did you surf this?".

**Form fields:**

- Spot (pre‑filled from context).
- Date & time:
  - Default "Now" for immediate logging.
  - Option to choose any time in the **last 7 days** (calendar + time picker).
- Overall rating: 1–10 (stars or numeric slider).
- Perceived wind:
  - Too onshore/messy
  - Just right
  - Too weak / glassy but small
- Perceived size: 1–10 (too small → perfect → too big).
- Crowd: 1–10 (empty → extremely crowded).
- Notes: optional.

**Backend handling:**

- On submission, the backend:
  - Finds the **nearest 3‑hour ForecastSnapshot** for the same spot within ±90 minutes (within last 7 days).
  - If found, links session to `forecast_snapshot_id`.
  - Builds feature vector from that snapshot (wave, wind, etc.).
  - Stores the session with features + rating.
  - Optionally retrains the per‑user model if threshold of new sessions is reached.

This supports both:

- Real‑time logging (surf now, log now).
- Backfilling sessions for the last 7 days (user can log "Sunday's session" on Friday).

---

### 4.4 Insights / "Your Ideal Conditions" (Android)

**Content:**

- Summary card:
  - "You usually give your best ratings when…"
  - Wave height range.
  - Period range.
  - Wind regime.
  - Time‑of‑day.
  - Crowd levels.
- Visuals:
  - Simple charts (bars/line) rendered with Android charts (e.g. MPAndroidChart) or Compose‑based visualization.
  - Ratings vs wave height, period, wind orientation, time‑of‑day.
- Data requirement:
  - Show how many sessions this is based on (e.g. "Based on 15 sessions logged in the last 30 days").

**Behaviour:**

- Only show full insights after at least ~10 sessions.
- Before that, show a partial view and encourage more logging.

---

### 4.5 Settings (Android)

- Manage spots (add, remove, reorder favorites).
- Units (m vs ft, knots vs km/h).
- Notification preferences (future enhancement):
  - E.g. "Notify me when a window above 80% score appears this week".
- Data export/delete (future):
  - Export sessions as CSV.
  - Delete account.

---

## 5. Data & APIs (Open‑Meteo Only)

### 5.1 Open‑Meteo Marine Weather API

- Docs: https://open-meteo.com/en/docs/marine-weather-api
- Free, no API key, generous daily limits (~10k requests/day).
- Provides:
  - Significant wave height
  - Wave period
  - Wave direction
  - Wind speed
  - Wind direction
  - Optional: more parameters like gusts

**API Call Example (3‑hourly step):**

- Use `hourly` params with `timeformat=unixtime` and specify `hourly=wave_height,wave_direction,wave_period,wind_speed_10m,wind_direction_10m&timezone=UTC&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`.

**Strategy:**

- For each spot (lat, lon), call Open‑Meteo for:
  - **Forecast horizon:** today → +7 or +10 days.
  - **Historical horizon:** today → −7 days (Open‑Meteo supports up to ~7 days of historical for some products; confirm and adjust date windows accordingly).
- Use 3‑hour time step:
  - Reduces API calls by ~3× vs hourly.
  - Enough resolution for surf window recommendations.
  - Minimizes storage per spot/day (8 windows/day vs 24).

---

## 6. Data Model

### 6.1 Entities

**User**

- `id`
- `email`
- `home_region`
- `ideal_wave_size_min` / `max`
- `crowd_tolerance` (numeric)
- `preferred_times_of_day` (JSON array)
- `created_at`

**Spot**

- `id`
- `name`
- `region`
- `lat`, `lng`
- `orientation_degrees` (for wind orientation classification)
- `is_user_custom` (bool)

**ForecastSnapshot** (3‑hour windows only)

- `id`
- `spot_id`
- `timestamp_utc` (rounded 3‑hour UTC time)
- `wave_height` (m)
- `wave_period` (s)
- `wave_direction` (degrees)
- `wind_speed` (m/s or knots, consistent)
- `wind_direction` (degrees)
- `wind_orientation_category` (enum: offshore/cross/onshore, derived)
- `created_at`

> For each Open‑Meteo 3‑hour row, create one ForecastSnapshot.

**Session**

- `id`
- `user_id`
- `spot_id`
- `surf_timestamp_utc`
- `linked_forecast_id` (FK → ForecastSnapshot.id; nearest within ±90 minutes and within last 7 days)
- `overall_rating` (1–10)
- `perceived_wind` (enum)
- `perceived_size` (1–10)
- `perceived_crowd` (1–10)
- `notes` (text)
- `created_at`

**ForecastUserScore**

- `user_id`
- `forecast_id`
- `predicted_score` (0–100)
- `explanation` (short text)
- `created_at`
- PRIMARY KEY (`user_id`, `forecast_id`)

**UserModelStats**

- `user_id`
- `num_sessions`
- `last_trained_at`
- `model_params` (JSON, e.g. regression coeffs)
- `model_type` (e.g. "linear-regression-v1")
- `created_at`

---

## 7. ML Design

### 7.1 Goals

- Predict a user‑specific **Suitability Score (0–100)** for each 3‑hour ForecastSnapshot.
- Work with small data per user (5–50 sessions).
- Simple enough to run in Node/TS (no big infra).

### 7.2 Features

From each `ForecastSnapshot`:

- Wave:
  - `wave_height`
  - `wave_period`
  - `wave_direction`
- Wind:
  - `wind_speed`
  - `wind_direction`
  - `wind_orientation_category` (mapped using spot orientation into offshore/cross/onshore)
- Time:
  - `time_of_day_bucket` (dawn/morning/midday/afternoon/evening)
  - `day_of_week`
- Derived:
  - `is_weekend`
  - `is_before_work` / `after_work` if user defined.

### 7.3 Targets

- `overall_rating` (1–10).
- Normalize to 0–100 when turning into suitability score.

### 7.4 Model Phases

#### Phase 1 – Generic + Onboarding (Cold Start)

**Conditions:**

- `num_sessions < 3`.

**Scoring:**

- Use heuristics:
  - Score waves near user's ideal range higher.
  - Offshore > cross > onshore.
  - Penalize very strong wind.
  - Slightly boost preferred times-of-day.

**Output:** `generic_score` in [0, 100].

#### Phase 2 – Simple Regression

**Conditions:**

- `3 ≤ num_sessions < 10`.

**Model:**

- Per‑user linear regression / simple tree using JS library (e.g. `ml-regression-multivariate-linear` or similar).
- Fit `rating ~ wave_height + wave_period + wind_orientation + time_of_day + …`.

**Blending:**

- `final_score = 0.5 * generic_score + 0.5 * learned_score`.

#### Phase 3 – Learned Model Only

**Conditions:**

- `num_sessions ≥ 10`.

**Model:**

- Same linear regression or upgraded to gradient boosting/forest if needed later.
- `final_score = learned_score`.

### 7.5 Training & Updating

- Trigger training:
  - After N new sessions (e.g. every 3 new sessions).
  - Or nightly cron job.
- Store model parameters in `UserModelStats`.
- Use recent data more heavily (e.g. downweight sessions older than 90 days).

---

## 8. Android Implementation Details

### 8.1 Tech Stack (Client)

- **Language:** Kotlin.
- **UI:** Jetpack Compose.
- **Networking:** Retrofit + OkHttp.
- **Persistence:** Room (for local cache) or DataStore for preferences.
- **Auth:** Supabase Auth via REST / JWT (or simple custom auth server).
- **Architecture:** MVVM with Repository pattern.

### 8.2 Offline-First Considerations

- Cache latest 7–10 days of 3‑hour windows per favorite spot in local Room DB.
- Allow session logging offline:
  - Queue logs locally.
  - Sync to backend when connectivity returns.
- Show cached last-known forecast when offline.

---

## 9. Backend & Hosting

### 9.1 Backend Responsibilities

- Forecast service (Open‑Meteo integration).
- 3‑hour snapshot ingestion.
- Historical 7‑day backfill.
- ML scoring per user + caching.
- REST endpoints for Android:
  - `GET /spots`
  - `GET /spots/{id}/windows?start=…&end=…` (returns 3‑hour windows with scores)
  - `POST /sessions`
  - `GET /sessions/me`
  - `GET /insights/me`

### 9.2 Hosting

- Backend: **Railway**
  - Persistent Node.js server for ML + caching.
  - Better than Vercel for long‑running processes and in‑memory cache.
- Database: **Supabase** (managed Postgres)
  - 500 MB free tier, 50k MAU.
- Domain: optional for API (e.g. `api.swellmind.app`).

---

## 10. Cold-Start, Trust & UX

### 10.1 Cold-Start Strategy

- Before 3 sessions:
  - Show banner: "We're still learning your style; these are generic recommendations based on your preferences and typical surf heuristics."
- Between 3 and 10 sessions:
  - Show: "We're starting to personalize based on your 3+ logged sessions."
- ≥10 sessions:
  - "Fully personalized based on your logged sessions."

### 10.2 Explainability

- Each recommended window includes:
  - "Why": e.g. "These conditions are similar to your 8/10 sessions: 3–4 ft, 10–12s, offshore, morning."
- Insights screen explains how the data is used and how to improve recommendations.

---

## 11. Metrics & Evaluation

- **User metrics:** WAU (weekly active users), sessions logged/week, % recommended windows surfed.
- **Model metrics:** MAE (mean absolute error), correlation, online click‑through / surf‑through.
- **Product metrics:** retention (4‑week), engagement, NPS.

---

## 12. Roadmap (Android-First)

### Phase 0 – Backend + CLI Prototype

- Node.js service to:
  - Pull Open‑Meteo 3‑hour forecasts + last 7 days for 1–2 spots.
  - Store in Postgres.
  - Fit a simple regression model and test predictions.

### Phase 1 – Android MVP

- Basic Android app (Compose) with:
  - Onboarding.
  - Spots list.
  - Forecast dashboard for 3‑hour windows.
  - Log Session (including last 7 days).
  - Primitive Insights.

### Phase 2 – Refinement

- Better UI & animations.
- Improved ML (feature engineering, regularization).
- Push notifications for high‑score windows.
- Expanded spot coverage.

### Phase 3 – Scale

- Add iOS or web.
- Multi‑region rollout.
- Monetization (subscriptions).

---

## APPENDIX A: Implementation Details & Infrastructure

### A.1 Database Storage

**Recommended: Supabase (Free Tier)**

For this project, use **Supabase's free tier** for your PostgreSQL database and authentication:

**Free Tier Includes:**

- 500 MB database storage (sufficient for thousands of sessions + forecasts)
- 50,000 monthly active users
- Realtime subscriptions (if needed later)
- Built-in authentication (email/password, OAuth)
- Auto-generated REST API for your tables
- 2 GB bandwidth per month

**Why Supabase:**

- Zero config: auto‑generates API endpoints from your schema.
- Built‑in Row Level Security (RLS) for user data isolation.
- Excellent JS/TS client libraries.
- Free tier doesn't require credit card.
- Dashboard UI for SQL queries and table management.
- Can upgrade seamlessly when you scale.

**Setup:**

1. Go to https://supabase.com → Create account.
2. Create new project (choose EU region for Portugal).
3. In SQL Editor, paste schema (entities in section 6).
4. Copy project URL and anon key to backend environment variables.

**Connection from your backend:**

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);
```

**Connection from Android:**

```kotlin
// Using Supabase Kotlin client
val client = createSupabaseClient(
    supabaseUrl = BuildConfig.SUPABASE_URL,
    supabaseKey = BuildConfig.SUPABASE_ANON_KEY
) {
    install(Auth)
    install(Realtime)
}
```

**Alternative: Neon (if you need more storage)**

If you hit 500 MB quickly, consider **Neon's free tier**:

- 3 GB storage (6× Supabase).
- Serverless Postgres with auto‑scale‑to‑zero.
- Branching for testing.

Downside: No built‑in auth / APIs; you implement those yourself.

---

### A.2 Backend Hosting

**Recommended: Railway (Full‑Stack Deployment)**

Your workload:

- Node.js API.
- ML inference/training.
- Forecast caching.

This is well‑suited for **Railway**:

- Persistent containers → in‑memory cache survives requests.
- No serverless timeouts.
- Easy to deploy from GitHub.
- Free credit (~$5/month) covers small MVP.

**Why Railway over Vercel here:**

- Vercel's free tier is optimized for static sites + short serverless functions, not long‑running Node servers or ML workloads.
- In‑memory caches are ineffective on Vercel due to cold starts.
- Database calls from Vercel to Supabase go over public internet (latency).

**Railway Deployment:**

1. Push backend code to GitHub.
2. In Railway dashboard: New Project → Deploy from GitHub.
3. Select your repo + `/backend` directory.
4. Add environment variables (Supabase URL/key, Open‑Meteo settings).
5. Railway auto-deploys on every push to `main`.

---

### A.3 Android App Hosting

**No hosting needed for the app itself** – it's distributed via Google Play Store (later) or directly as APK during development.

**For development/testing:**

- Build locally on your machine.
- Use Android Studio / emulator or physical device.
- APK distributed via:
  - Email / Slack for internal testing.
  - Google Play Store for public beta/release.

---

### A.4 GitHub Integration

Yes, everything can and should be Git‑driven.

**Flow:**

- Store Android app, backend, and DB schema in a single GitHub repo.
- Railway connects to GitHub:
  - Auto‑deploys backend on every push to `main`.
  - Creates preview deployments for PRs.
- Supabase schema defined in `/db` with migrations, version‑controlled.

**Example repo layout:**

```text
swellmind/
├── android/               # Android app (Kotlin, Jetpack Compose)
│   ├── app/
│   ├── build.gradle.kts
│   └── gradle.properties
├── backend/               # Node.js API (Express/Fastify)
│   ├── src/
│   │   ├── api/
│   │   ├── services/
│   │   ├── ml/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── db/
│   ├── schema.sql
│   └── migrations/
├── docs/
│   └── PRODUCT_SPEC.md
├── .github/
│   └── workflows/
│       └── ci.yml
├── .gitignore
└── README.md
```

**Branch strategy:**

- `main` → Production (protected, requires PR).
- `develop` → Staging/testing.
- `feature/*` → Feature branches (each developer).

---

### A.5 API Caching Strategy (3‑Hour Windows + Last 7 Days)

**Objective:**

- Avoid calling Open‑Meteo on every user interaction.
- Support both forecasts and last 7 days historical data.
- Stay comfortably within free limits (~10k requests/day).

**Layer 1: Database Cache**

- Table `forecast_snapshots` holds:
  - 3‑hour windows for each spot for:
    - Last 7 days.
    - Next 7–10 days.
- For each spot:
  - Backend checks DB for snapshots in requested range.
  - If **missing** or **stale** (older than ~6 hours for the future range):
    - Calls Open‑Meteo once to fetch 7–10 days at 3‑hour resolution.
    - Replaces/updates entries in DB.

**Layer 2: In‑Memory Cache (Railway)**

- Node service keeps a `Map` / `node-cache` keyed by `spot_id+date_range`.
- TTL ~1 hour.
- Reduces DB read load for repeated queries.

**Layer 3: Pre‑computed Scores**

- When computing ML scores:
  - For each `ForecastSnapshot`:
    - Check `forecast_user_scores` for existing entry.
    - If missing, run inference once and store the result.
- Android then only fetches scored windows (fast).

**Example caching logic (pseudocode):**

```typescript
async function getForecastWindows(
  spotId: string,
  startDate: Date,
  endDate: Date,
) {
  const cacheKey = `forecast_${spotId}_${startDate.toISOString()}_${endDate.toISOString()}`;

  // Check in-memory cache (Layer 2)
  let cached = forecastCache.get(cacheKey);
  if (cached && cached.age < 3600) {
    return cached.data;
  }

  // Check DB cache (Layer 1)
  const dbCached = await supabase
    .from("forecast_snapshots")
    .select("*")
    .eq("spot_id", spotId)
    .gte("timestamp_utc", startDate)
    .lte("timestamp_utc", endDate)
    .gte("created_at", new Date(Date.now() - 6 * 60 * 60 * 1000)); // <6hrs old

  if (dbCached.data && dbCached.data.length > 0) {
    // Update in-memory cache
    forecastCache.set(cacheKey, { data: dbCached.data, age: 0 });
    return dbCached.data;
  }

  // Cache miss - fetch from Open-Meteo
  const newData = await fetchOpenMeteo3HourWindows(spotId, startDate, endDate);

  // Store in DB
  await supabase.from("forecast_snapshots").upsert(
    newData.map((w) => ({
      spot_id: spotId,
      timestamp_utc: w.timestamp,
      wave_height: w.waveHeight,
      wave_period: w.wavePeriod,
      wind_speed: w.windSpeed,
      // ... other fields
    })),
  );

  // Update in-memory cache
  forecastCache.set(cacheKey, { data: newData, age: 0 });

  return newData;
}
```

**Historical 7 days:**

- When a spot is first accessed:
  - Backend fetches last 7 days **and** next 7–10 days from Open‑Meteo in one call.
  - Both stored in `forecast_snapshots` with same logic.
- User can then backfill sessions from past windows.

**API Usage Summary:**

- Open‑Meteo free tier: ~10k requests/day.
- Your usage: ~10 spots × 2 calls/day (forecast + historical refresh) = ~20 calls/day. ✅ Well within limits.

---

### A.6 Design Inspiration & UI (Android)

For Android visuals:

- Browse **Dribbble**:
  - Search: "fitness wellness app ui", "surf app ui", "weather app minimal".
  - Look at: Material Design 3 (Material You) examples.
- Study real apps:
  - **Strava:** activity cards, progress insights.
  - **Surfline:** forecast layout (though you'll improve on this!).
  - **Headspace:** calm, welcoming onboarding flow.

**Material Design 3 (Android)**

- Use **Material 3** Compose theme for modern look.
- Color scheme: Ocean blues + sandy neutrals.
- Dark mode: Deep blues, neon accents for high-score badges.

**Typography:**

- **Headings:** Inter or default system font (Roboto).
- **Body:** System fonts for speed.

**Icons:**

- **Material Icons** (built-in) or **Heroicons**.
- Examples: waves, wind, map-pin, trending-up, calendar.

**Layout Patterns:**

- Card per 3‑hour window.
- Swipeable date selector.
- Bottom navigation (Home / Log / Insights / Settings).
- Collapsible/expandable detail cards.

---

## APPENDIX B: Tech Stack Summary

```yaml
Android:
  Language: Kotlin
  UI: Jetpack Compose
  Networking: Retrofit + OkHttp
  Local Storage: Room / DataStore
  Charts: MPAndroidChart or Vico (Compose-friendly)
  Auth: Supabase Auth REST
  Arch: MVVM + Repository pattern
  Dependency Injection: Hilt

Backend:
  Runtime: Node.js (TypeScript)
  Framework: Express or Fastify
  API: REST (JSON endpoints)
  Auth: Supabase Auth (JWT validation)
  Cache: node-cache (in-memory)
  ML: ml-regression (simple models), custom inference

Database:
  Provider: Supabase (PostgreSQL)
  Auth & RLS: Supabase policies
  SDK: @supabase/supabase-js (backend), supabase-kotlin (Android)

External APIs:
  Marine Weather: Open-Meteo Marine Weather API (3h time step, forecast + last 7 days)

Hosting:
  Backend: Railway (Node.js container)
  Database: Supabase (managed)
  Android: Google Play Store (or direct APK distribution)

DevOps:
  Version Control: GitHub
  CI/CD: Railway auto-deploy on push
  Environments:
    - main → production
    - develop → staging
    - feature/* → preview (optional)
```

---

## APPENDIX C: API Endpoints Reference

### Forecast Endpoints

```
GET /spots
  Returns: List of all available spots with coordinates

GET /spots/{id}/windows
  Params: start_date, end_date (YYYY-MM-DD), forecast_type (forecast|historical|both)
  Returns: 3-hour windows with scores and explanations
  Example: GET /spots/123/windows?start_date=2026-01-20&end_date=2026-01-27&forecast_type=both

GET /spots/{id}/window/{window_id}
  Returns: Single window details (for expanded view)
```

### Session Endpoints

```
POST /sessions
  Body: { spot_id, surf_timestamp, overall_rating, perceived_wind, perceived_size, perceived_crowd, notes }
  Returns: Created session with linked forecast

GET /sessions/me
  Params: limit, offset
  Returns: User's session history

GET /sessions/me/stats
  Returns: Aggregated stats (total sessions, avg rating by condition, etc.)
```

### Insights Endpoints

```
GET /insights/me
  Returns: User's ideal conditions summary

GET /insights/me/distribution/{metric}
  Params: metric (wave_height|wave_period|wind_orientation|time_of_day|crowd)
  Returns: Distribution data for charting

GET /insights/me/recommendations
  Returns: ML model info and confidence
```

### Auth Endpoints

```
POST /auth/signup
  Body: { email, password }
  Returns: user_id, auth_token

POST /auth/signin
  Body: { email, password }
  Returns: auth_token, user

POST /auth/refresh
  Returns: new auth_token

POST /auth/signout
  Returns: success
```

---

## APPENDIX D: Cost Overview

**MVP (First 6 Months):**

- Railway: within free credit (small containers).
- Supabase: free tier (DB < 500 MB, MAU << 50k).
- Open‑Meteo: free (<<10k requests/day).
- Domain: ~€10–15/year (optional, backend can use Railway subdomain).
- Google Play Store developer account: $25 (one-time).

**Total: effectively €1–3/month + $25 Play Store account.**

**Later scale (1000+ users):**

- Supabase Pro + database: ~€25–50/month.
- Railway: ~€20–50/month (depending on load).
- Open‑Meteo: still free (even 100k+ requests/day is within generous limits).
- **Total: ~€50–100/month + ongoing development.**

---

## APPENDIX E: Open‑Meteo Integration Example

**Fetching 3‑hour forecast + last 7 days:**

```typescript
async function fetchOpenMeteo3HourWindows(
  lat: number,
  lng: number,
  spotId: string,
) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const tenDaysForward = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  // Format dates as YYYY-MM-DD
  const startDate = sevenDaysAgo.toISOString().split("T")[0];
  const endDate = tenDaysForward.toISOString().split("T")[0];

  const url = new URL("https://marine-api.open-meteo.com/v1/marine");
  url.searchParams.append("latitude", lat.toString());
  url.searchParams.append("longitude", lng.toString());
  url.searchParams.append("start_date", startDate);
  url.searchParams.append("end_date", endDate);
  url.searchParams.append(
    "hourly",
    "wave_height,wave_period,wave_direction,wind_speed_10m,wind_direction_10m",
  );
  url.searchParams.append("timezone", "UTC");

  const response = await fetch(url.toString());
  const data = await response.json();

  // Parse 3-hour intervals (indices 0, 3, 6, 9, ...)
  const windows = [];
  for (let i = 0; i < data.hourly.time.length; i += 3) {
    windows.push({
      timestamp_utc: new Date(data.hourly.time[i] * 1000),
      wave_height: data.hourly.wave_height[i],
      wave_period: data.hourly.wave_period[i],
      wave_direction: data.hourly.wave_direction[i],
      wind_speed: data.hourly.wind_speed_10m[i],
      wind_direction: data.hourly.wind_direction_10m[i],
      spot_id: spotId,
    });
  }

  return windows;
}
```

---

## APPENDIX F: ML Model Training Example

**Simple per-user linear regression:**

```typescript
import { MultipleLinearRegression } from "ml-regression-multivariate-linear";

async function trainUserModel(userId: string) {
  // Fetch user's sessions with linked forecast data
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select(
      `
      overall_rating,
      forecast_snapshots (
        wave_height,
        wave_period,
        wind_speed,
        wind_orientation_category,
        timestamp_utc
      )
    `,
    )
    .eq("user_id", userId)
    .not("linked_forecast_id", "is", null);

  if (sessions.length < 3) {
    return null; // Not enough data
  }

  // Build feature matrix
  const X = [];
  const y = [];

  for (const session of sessions) {
    const forecast = session.forecast_snapshots;
    const timeOfDay = getTimeOfDayBucket(new Date(forecast.timestamp_utc));

    X.push([
      forecast.wave_height,
      forecast.wave_period,
      forecast.wind_speed,
      windCategoryToNumeric(forecast.wind_orientation_category),
      timeOfDayToNumeric(timeOfDay),
    ]);

    y.push(session.overall_rating);
  }

  // Train model
  const regression = new MultipleLinearRegression(X, y);

  // Store coefficients
  await supabase.from("user_model_stats").upsert(
    {
      user_id: userId,
      num_sessions: sessions.length,
      last_trained_at: new Date(),
      model_params: regression.toJSON(),
      model_type: "linear-regression-v1",
    },
    {
      onConflict: "user_id",
    },
  );

  return regression;
}

function predictScore(model, forecast) {
  const features = [
    forecast.wave_height,
    forecast.wave_period,
    forecast.wind_speed,
    windCategoryToNumeric(forecast.wind_orientation_category),
    timeOfDayToNumeric(getTimeOfDayBucket(new Date(forecast.timestamp_utc))),
  ];

  const predictedRating = model.predict(features)[0];
  // Clamp to 0-10, then scale to 0-100
  const score = Math.max(0, Math.min(10, predictedRating)) * 10;
  return Math.round(score);
}
```

---

## Final Notes

- **Start with the MVP:** Onboarding, Dashboard, Log Session, basic ML (generic + simple regression).
- **Iterate:** Add features based on user feedback.
- **Scale:** Improve ML model, add more spots/regions, push notifications, iOS support.

This document should give you a complete blueprint for building SwellMind as an Android-first product with a robust backend and ML-powered recommendations. Good luck!
