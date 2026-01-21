# SwellMind Product Spec - Additional Sections

## Section 13: Error Handling & Edge Cases

### 13.1 API Error Handling

**Open-Meteo API Failures:**

- **Timeout Strategy:**
  - Set request timeout to 10 seconds
  - Retry up to 3 times with exponential backoff (1s, 2s, 4s)
  - If all retries fail, use cached data with staleness indicator

- **Partial Data Handling:**
  - If wave_height is null but other params exist: mark window as "incomplete data"
  - If critical params missing (wave_height + wave_period): skip that window entirely
  - Log missing data incidents for monitoring

- **Rate Limiting:**
  - Open-Meteo returns 429: back off for 1 hour, serve cached data
  - Display to user: "Using recent forecast data (updated X hours ago)"

- **Invalid Coordinates:**
  - If Open-Meteo returns no data for spot coordinates, flag spot as "unavailable"
  - Notify user: "Forecast unavailable for this location. Try a nearby spot."

**User-Facing Error Messages:**

```
API_TIMEOUT: "Couldn't load forecast. Using cached data from [time]."
NO_INTERNET: "No internet connection. Showing offline forecast."
SPOT_UNAVAILABLE: "Forecast unavailable for this spot. Try again later."
SERVER_ERROR: "Something went wrong. We're looking into it."
```

### 13.2 Data Quality Edge Cases

**Missing Forecast Snapshot for Session:**

When user logs a session but no forecast exists within ±90 minutes:

1. **Option A (Recommended):** Create a "manual session" without linked forecast
   - Store session with `linked_forecast_id = null`
   - Don't use for ML training (can't extract features)
   - Show in session history with note: "Conditions not recorded"

2. **Option B:** Fetch historical data on-demand
   - Call Open-Meteo for that specific timestamp
   - Create forecast snapshot retroactively
   - More API calls but better data coverage

**Outlier Detection in User Ratings:**

Prevent ML model corruption from unusual rating patterns:

- If user rates >80% sessions as 10/10: 
  - Apply rating compression (normalize within user's range)
  - Show insight: "You love almost everything! Try rating relative to your best sessions."

- If user rates everything 1-5:
  - Model still works (learns within that range)
  - Normalize scores to 0-100 for comparability

- If user gives contradictory ratings (same conditions rated 2 and 9):
  - Weight recent ratings more heavily
  - Use median instead of mean for similar conditions

**Null/Missing Values in API Response:**

```typescript
interface SafeForecastSnapshot {
  wave_height: number | null
  wave_period: number | null
  wave_direction: number | null
  wind_speed: number | null
  wind_direction: number | null
}

function validateForecastData(data: SafeForecastSnapshot): boolean {
  // Require at minimum: wave_height and wind_speed
  return data.wave_height !== null && data.wind_speed !== null
}

function handleIncompleteData(data: SafeForecastSnapshot) {
  // Fill missing wave_period with default (10s - typical for most swells)
  if (!data.wave_period) data.wave_period = 10
  
  // Fill missing directions with "unknown" flag
  if (!data.wave_direction) data.wave_direction = -1 // Special value
  if (!data.wind_direction) data.wind_direction = -1
  
  return data
}
```

### 13.3 Session Logging Edge Cases

**Duplicate Session Prevention:**

- Before saving, check for existing session:
  - Same user + spot + timestamp within 30 minutes
  - Prompt: "You already logged a session at [spot] at [time]. Update instead?"

**Wrong Data Correction:**

- Allow session editing within 7 days:
  - Update rating, notes, perceived conditions
  - Trigger model retraining if rating changed significantly (>2 points)
  - Show edit history (optional, for data integrity)

**Timezone Confusion:**

- Always store timestamps in UTC in database
- Display in user's local timezone
- When user logs "I surfed this morning":
  - Capture current device timezone
  - Convert to UTC for storage
  - Show confirmation: "Session logged for [local time], [date]"

### 13.4 Spot Management Edge Cases

**User Creates Duplicate Custom Spot:**

- Before saving custom spot:
  - Check if any spot exists within 500m radius
  - Prompt: "Similar spot found: [name]. Use this instead?"
  - If user confirms new spot, allow it (maybe it's a different break)

**Wrong Coordinates Reported:**

- Add "Report Issue" button on each spot
- Form asks: "What's wrong? (Wrong location / Wrong name / Duplicate / Other)"
- Admin review queue for spot corrections
- Until fixed, show warning on spot: "Location being verified"

**Poor Open-Meteo Coverage:**

Some coastal geometries (narrow bays, islands) may have spotty data:

- Test each spot during onboarding
- If >30% of forecast calls fail, mark spot as "limited coverage"
- Display badge: "⚠️ Limited forecast data available"

---

## Section 14: Security & Privacy

### 14.1 Security Requirements

**API Key Management (Android):**

```kotlin
// WRONG - Never hardcode keys
const val SUPABASE_KEY = "eyJhbGc..." // ❌

// CORRECT - Use BuildConfig + ProGuard
object Config {
    val supabaseUrl: String
        get() = BuildConfig.SUPABASE_URL
    
    val supabaseAnonKey: String
        get() = BuildConfig.SUPABASE_ANON_KEY
}

// In build.gradle.kts
android {
    buildTypes {
        release {
            buildConfigField("String", "SUPABASE_URL", "\"${System.getenv("SUPABASE_URL")}\"")
            buildConfigField("String", "SUPABASE_ANON_KEY", "\"${System.getenv("SUPABASE_ANON_KEY")}\"")
        }
    }
}
```

**Additional obfuscation:**

```kotlin
// Use Android Keystore for sensitive data
class SecureStorage(context: Context) {
    private val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    
    fun encryptAndStore(key: String, value: String) {
        // Encrypt with Android Keystore
        // Store in EncryptedSharedPreferences
    }
}
```

**Backend Rate Limiting:**

```typescript
import rateLimit from 'express-rate-limit'

// Per-endpoint rate limits
const forecastLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15min per IP
  message: 'Too many forecast requests, please try again later'
})

const sessionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 session logs per hour
  message: 'Too many sessions logged, please try again later'
})

app.get('/spots/:id/windows', forecastLimiter, getWindows)
app.post('/sessions', sessionLimiter, createSession)
```

**Input Validation:**

```typescript
import { z } from 'zod'

const sessionSchema = z.object({
  spot_id: z.string().uuid(),
  surf_timestamp: z.string().datetime(),
  overall_rating: z.number().min(1).max(10),
  perceived_size: z.number().min(1).max(10),
  perceived_crowd: z.number().min(1).max(10),
  notes: z.string().max(500).optional(), // Prevent huge text blobs
  perceived_wind: z.enum(['too_onshore', 'just_right', 'too_weak'])
})

app.post('/sessions', async (req, res) => {
  try {
    const validatedData = sessionSchema.parse(req.body)
    // Process...
  } catch (error) {
    return res.status(400).json({ error: 'Invalid input data' })
  }
})
```

**SQL Injection Prevention:**

- Use Supabase client (parameterized queries by default)
- Never construct raw SQL from user input
- Example of safe query:

```typescript
// SAFE - Supabase uses parameterized queries
const { data } = await supabase
  .from('sessions')
  .select('*')
  .eq('user_id', userId) // Automatically escaped

// DANGEROUS - Never do this
const query = `SELECT * FROM sessions WHERE user_id = '${userId}'` // ❌
```

**Authentication Token Management:**

```typescript
// Backend: JWT validation
import jwt from 'jsonwebtoken'

async function authenticateRequest(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }
  
  try {
    // Verify with Supabase or custom JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.sub
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Token refresh strategy
app.post('/auth/refresh', async (req, res) => {
  const { refresh_token } = req.body
  
  // Validate refresh token
  // Issue new access token (short-lived, 1hr)
  // Return new tokens
})
```

**Android Token Storage:**

```kotlin
// Use EncryptedSharedPreferences
class TokenManager(context: Context) {
    private val sharedPreferences = EncryptedSharedPreferences.create(
        "auth_prefs",
        MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build(),
        context,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
    
    fun saveToken(token: String) {
        sharedPreferences.edit().putString("access_token", token).apply()
    }
    
    fun getToken(): String? = sharedPreferences.getString("access_token", null)
}
```

### 14.2 Privacy & GDPR Compliance

**Privacy Policy (Required for MVP):**

Create at `https://swellmind.app/privacy` covering:

1. **Data Collected:**
   - Account info (email)
   - Location data (spot coordinates, not user location tracking)
   - Surf session logs (ratings, notes, timestamps)
   - Device info (Android version, app version for debugging)
   - No cookies on Android app

2. **Data Usage:**
   - Personalized recommendations (ML model)
   - Product improvements
   - No selling to third parties
   - No advertising

3. **Data Storage:**
   - Stored on Supabase servers (EU region)
   - Encrypted in transit (HTTPS) and at rest
   - Retained until account deletion

4. **User Rights (GDPR):**
   - Access your data (export feature)
   - Delete your data (account deletion)
   - Correct your data (edit sessions)
   - Withdraw consent (delete account)

5. **Third-Party Services:**
   - Open-Meteo (no user data shared, public API)
   - Supabase (data processor, EU-based)
   - Railway (hosting, EU region when possible)

**Terms of Service:**

Create at `https://swellmind.app/terms` covering:

- Age requirement (13+ or 18+ depending on region)
- Acceptable use policy
- Disclaimer (forecasts for informational purposes, surf at own risk)
- Limitation of liability
- Account termination conditions

**Data Deletion (MVP Required, Not Future):**

```kotlin
// Android: Settings screen
Button(onClick = { showDeleteAccountDialog = true }) {
    Text("Delete Account", color = Color.Red)
}

if (showDeleteAccountDialog) {
    AlertDialog(
        title = { Text("Delete Account?") },
        text = { 
            Text("This will permanently delete:\n" +
                 "• All your sessions\n" +
                 "• Your preferences\n" +
                 "• Your ML model\n\n" +
                 "This cannot be undone.")
        },
        onDismissRequest = { showDeleteAccountDialog = false },
        confirmButton = {
            TextButton(
                onClick = { viewModel.deleteAccount() },
                colors = ButtonDefaults.textButtonColors(contentColor = Color.Red)
            ) {
                Text("Delete Everything")
            }
        },
        dismissButton = {
            TextButton(onClick = { showDeleteAccountDialog = false }) {
                Text("Cancel")
            }
        }
    )
}
```

```typescript
// Backend: DELETE /users/me
app.delete('/users/me', authenticateRequest, async (req, res) => {
  const userId = req.userId
  
  try {
    // Delete in order (foreign key constraints)
    await supabase.from('forecast_user_scores').delete().eq('user_id', userId)
    await supabase.from('user_model_stats').delete().eq('user_id', userId)
    await supabase.from('sessions').delete().eq('user_id', userId)
    await supabase.from('user_spots').delete().eq('user_id', userId)
    
    // Finally delete user (Supabase Auth)
    await supabase.auth.admin.deleteUser(userId)
    
    res.json({ message: 'Account deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete account' })
  }
})
```

**Data Export:**

```typescript
// GET /users/me/export
app.get('/users/me/export', authenticateRequest, async (req, res) => {
  const userId = req.userId
  
  // Fetch all user data
  const [user, sessions, spots, modelStats] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('sessions').select('*, forecast_snapshots(*)').eq('user_id', userId),
    supabase.from('user_spots').select('*, spots(*)').eq('user_id', userId),
    supabase.from('user_model_stats').select('*').eq('user_id', userId).single()
  ])
  
  const exportData = {
    user: user.data,
    sessions: sessions.data,
    spots: spots.data,
    model_stats: modelStats.data,
    exported_at: new Date().toISOString()
  }
  
  // Return as JSON download
  res.setHeader('Content-Disposition', 'attachment; filename="swellmind-data.json"')
  res.setHeader('Content-Type', 'application/json')
  res.json(exportData)
})
```

**Consent Flow (Onboarding):**

```kotlin
// During onboarding, before account creation
Column {
    Text("Before you start:", style = MaterialTheme.typography.titleMedium)
    Spacer(Modifier.height(16.dp))
    
    Row(verticalAlignment = Alignment.CenterVertically) {
        Checkbox(
            checked = privacyAccepted,
            onCheckedChange = { privacyAccepted = it }
        )
        Text("I agree to the ")
        TextButton(onClick = { openUrl("https://swellmind.app/privacy") }) {
            Text("Privacy Policy")
        }
    }
    
    Row(verticalAlignment = Alignment.CenterVertically) {
        Checkbox(
            checked = termsAccepted,
            onCheckedChange = { termsAccepted = it }
        )
        Text("I agree to the ")
        TextButton(onClick = { openUrl("https://swellmind.app/terms") }) {
            Text("Terms of Service")
        }
    }
    
    Button(
        onClick = { createAccount() },
        enabled = privacyAccepted && termsAccepted
    ) {
        Text("Create Account")
    }
}
```

**Analytics with Privacy:**

Use privacy-focused analytics (no personal data):

```typescript
// Track only aggregated, anonymous events
analytics.track({
  event: 'session_logged',
  properties: {
    spot_region: 'lisbon', // Not specific spot
    rating_range: '8-10', // Not exact rating
    // No user_id, email, or personal data
  }
})
```

---

## Section 15: Testing Strategy

### 15.1 Backend Testing

**Unit Tests (Jest + TypeScript):**

```typescript
// __tests__/ml/scoring.test.ts
import { calculateGenericScore, predictUserScore } from '../src/ml/scoring'

describe('Generic Scoring', () => {
  it('should score offshore wind higher than onshore', () => {
    const offshore = calculateGenericScore({
      wave_height: 1.5,
      wind_orientation: 'offshore',
      user_prefs: { ideal_size_min: 1, ideal_size_max: 2 }
    })
    
    const onshore = calculateGenericScore({
      wave_height: 1.5,
      wind_orientation: 'onshore',
      user_prefs: { ideal_size_min: 1, ideal_size_max: 2 }
    })
    
    expect(offshore).toBeGreaterThan(onshore)
  })
  
  it('should penalize waves outside user preference range', () => {
    const ideal = calculateGenericScore({
      wave_height: 1.5,
      user_prefs: { ideal_size_min: 1, ideal_size_max: 2 }
    })
    
    const tooSmall = calculateGenericScore({
      wave_height: 0.5,
      user_prefs: { ideal_size_min: 1, ideal_size_max: 2 }
    })
    
    expect(ideal).toBeGreaterThan(tooSmall)
  })
})

describe('User Model Prediction', () => {
  it('should predict scores within 0-100 range', () => {
    const model = trainMockModel([
      { features: [1.5, 10, 5], rating: 8 },
      { features: [2.0, 12, 3], rating: 9 }
    ])
    
    const score = predictUserScore(model, { wave_height: 1.7, wave_period: 11, wind_speed: 4 })
    
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})
```

**Integration Tests (Supertest):**

```typescript
// __tests__/api/sessions.test.ts
import request from 'supertest'
import { app } from '../src/index'

describe('POST /sessions', () => {
  let authToken: string
  
  beforeAll(async () => {
    // Create test user and get token
    const res = await request(app)
      .post('/auth/signup')
      .send({ email: 'test@example.com', password: 'test123' })
    authToken = res.body.token
  })
  
  it('should create a session with valid data', async () => {
    const res = await request(app)
      .post('/sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        spot_id: 'test-spot-uuid',
        surf_timestamp: '2026-01-20T08:00:00Z',
        overall_rating: 8,
        perceived_size: 7,
        perceived_crowd: 5,
        perceived_wind: 'just_right'
      })
    
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.overall_rating).toBe(8)
  })
  
  it('should reject invalid rating', async () => {
    const res = await request(app)
      .post('/sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        spot_id: 'test-spot-uuid',
        surf_timestamp: '2026-01-20T08:00:00Z',
        overall_rating: 15, // Invalid (>10)
      })
    
    expect(res.status).toBe(400)
  })
  
  it('should link session to nearest forecast snapshot', async () => {
    // Create forecast snapshot at 08:00
    await createTestForecastSnapshot({
      spot_id: 'test-spot-uuid',
      timestamp: '2026-01-20T08:00:00Z',
      wave_height: 1.5
    })
    
    // Log session at 08:30 (within 90min)
    const res = await request(app)
      .post('/sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        spot_id: 'test-spot-uuid',
        surf_timestamp: '2026-01-20T08:30:00Z',
        overall_rating: 8
      })
    
    expect(res.body.linked_forecast_id).toBeTruthy()
  })
})
```

**Open-Meteo API Integration Tests:**

```typescript
// __tests__/services/openmeteo.test.ts
import { fetchOpenMeteoWindows } from '../src/services/openmeteo'

describe('Open-Meteo Integration', () => {
  it('should fetch 3-hour windows for valid coordinates', async () => {
    const windows = await fetchOpenMeteoWindows({
      lat: 38.7223,
      lng: -9.1393,
      startDate: '2026-01-20',
      endDate: '2026-01-21'
    })
    
    expect(windows.length).toBeGreaterThan(0)
    expect(windows[0]).toHaveProperty('wave_height')
    expect(windows[0]).toHaveProperty('wind_speed')
  }, 15000) // 15s timeout for real API call
  
  it('should handle API timeout gracefully', async () => {
    // Mock slow API
    jest.setTimeout(2000)
    
    await expect(
      fetchOpenMeteoWindows({ lat: 38.7223, lng: -9.1393 }, { timeout: 100 })
    ).rejects.toThrow('Timeout')
  })
})
```

### 15.2 Android Testing

**Unit Tests (JUnit + Mockk):**

```kotlin
// SessionViewModelTest.kt
class SessionViewModelTest {
    private lateinit var viewModel: SessionViewModel
    private val mockRepository = mockk<SessionRepository>()
    
    @Test
    fun `should validate rating range`() {
        viewModel = SessionViewModel(mockRepository)
        
        viewModel.updateRating(15) // Invalid
        assertFalse(viewModel.isValid)
        
        viewModel.updateRating(8) // Valid
        assertTrue(viewModel.isValid)
    }
    
    @Test
    fun `should link session to nearest forecast within 90 minutes`() = runTest {
        val forecast = ForecastSnapshot(
            timestamp = Instant.parse("2026-01-20T08:00:00Z")
        )
        coEvery { mockRepository.findNearestForecast(any(), any()) } returns forecast
        
        viewModel.logSession(
            timestamp = Instant.parse("2026-01-20T08:30:00Z")
        )
        
        coVerify { mockRepository.createSession(withArg {
            assertEquals(forecast.id, it.linkedForecastId)
        }) }
    }
}
```

**Compose UI Tests:**

```kotlin
// ForecastDashboardTest.kt
@Test
fun displaysHighScoreWindowsWithRecommendedBadge() {
    composeTestRule.setContent {
        ForecastDashboard(
            windows = listOf(
                Window(score = 85, time = "08:00", waveHeight = 1.5),
                Window(score = 60, time = "11:00", waveHeight = 1.2)
            )
        )
    }
    
    // High score window should show "Recommended" badge
    composeTestRule
        .onNodeWithText("08:00")
        .assertIsDisplayed()
    
    composeTestRule
        .onNodeWithText("Recommended")
        .assertIsDisplayed()
    
    // Low score window should not
    composeTestRule
        .onNodeWithText("11:00")
        .assertIsDisplayed()
    
    composeTestRule
        .onNodeWithText("Recommended")
        .assertDoesNotExist()
}

@Test
fun logSessionFlowWorks() {
    composeTestRule.setContent {
        LogSessionScreen()
    }
    
    // Fill form
    composeTestRule.onNodeWithText("Rating").performClick()
    composeTestRule.onNodeWithText("8").performClick()
    
    composeTestRule.onNodeWithText("Wave Size").performClick()
    composeTestRule.onNodeWithText("7").performClick()
    
    // Submit
    composeTestRule.onNodeWithText("Log Session").performClick()
    
    // Verify success message
    composeTestRule.onNodeWithText("Session logged successfully").assertIsDisplayed()
}
```

**End-to-End Tests (Espresso or Maestro):**

```kotlin
// E2E test using Maestro (YAML format)
// tests/e2e/login_and_log_session.yaml
appId: com.swellmind.app
---
- launchApp
- tapOn: "Sign In"
- inputText: "test@example.com"
- tapOn: "Password"
- inputText: "password123"
- tapOn: "Sign In"
- assertVisible: "Welcome back"
- tapOn: "Log Session"
- tapOn: "Rating"
- tapOn: "8"
- tapOn: "Log Session"
- assertVisible: "Session logged"
```

### 15.3 Load Testing

**Backend Load Test (Artillery):**

```yaml
# load-test.yml
config:
  target: 'https://api.swellmind.app'
  phases:
    - duration: 60
      arrivalRate: 10 # 10 users/sec
    - duration: 120
      arrivalRate: 50 # Ramp to 50 users/sec
  processor: "./auth-processor.js"

scenarios:
  - name: "Forecast retrieval"
    flow:
      - post:
          url: "/auth/signin"
          json:
            email: "load-test@example.com"
            password: "test123"
          capture:
            - json: "$.token"
              as: "authToken"
      - get:
          url: "/spots/{{ spotId }}/windows?start_date=2026-01-20&end_date=2026-01-27"
          headers:
            Authorization: "Bearer {{ authToken }}"
          expect:
            - statusCode: 200
            - contentType: json
            - hasProperty: data
```

Run with: `artillery run load-test.yml`

**Expected Performance Targets:**

- API response time (p95): <500ms
- Forecast retrieval (p95): <1s
- Session logging (p95): <300ms
- Concurrent users supported: 100+
- Database connections: <25 concurrent

### 15.4 Beta Testing Plan

**Internal Alpha (Week 1-2):**

- Team members + close friends (5-10 users)
- Focus: Core functionality, critical bugs
- Distribution: Direct APK via Slack/email
- Feedback: Shared Google Doc

**Closed Beta (Week 3-6):**

- Invite local surf community (30-50 users)
- Focus: User experience, onboarding clarity, ML accuracy
- Distribution: Google Play Internal Testing track
- Feedback: In-app feedback form + weekly survey
- Metrics: Daily active users, sessions logged/week, crash rate

**Open Beta (Week 7-10):**

- Public sign-up via landing page (100-500 users)
- Distribution: Google Play Beta track
- Focus: Scalability, diverse use cases, feature requests
- Incentive: Early access to premium features

**Launch Criteria:**

- Crash-free rate >99%
- Average rating >4.0 stars
- >50 users with 10+ logged sessions
- ML model predicts scores with MAE <2.0

---

## Section 16: Monitoring & Analytics

### 16.1 Application Performance Monitoring

**Recommended Tool: Sentry (Free Tier)**

**Setup:**

```typescript
// Backend: src/index.ts
import * as Sentry from "@sentry/node"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
})

// Error tracking
app.use(Sentry.Handlers.requestHandler())
app.use(Sentry.Handlers.errorHandler())
```

```kotlin
// Android: Application.kt
class SwellMindApp : Application() {
    override fun onCreate() {
        super.onCreate()
        
        SentryAndroid.init(this) { options ->
            options.dsn = BuildConfig.SENTRY_DSN
            options.environment = if (BuildConfig.DEBUG) "debug" else "production"
            options.tracesSampleRate = 0.1
        }
    }
}
```

**Custom Events to Track:**

```typescript
// Track ML model performance
Sentry.addBreadcrumb({
  category: 'ml',
  message: 'Model prediction',
  level: 'info',
  data: {
    user_sessions_count: 15,
    predicted_score: 82,
    model_type: 'linear-regression-v1'
  }
})

// Track API errors
try {
  const data = await fetchOpenMeteo(lat, lng)
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      service: 'open-meteo',
      spot_id: spotId
    }
  })
}
```

### 16.2 Analytics Strategy

**Privacy-Focused Analytics: Plausible or Simple Analytics**

Why not Google Analytics: GDPR compliance concerns, user privacy

**Setup (Plausible):**

```typescript
// Backend: Track server-side events
import axios from 'axios'

async function trackEvent(event: string, props: Record<string, any>) {
  await axios.post('https://plausible.io/api/event', {
    name: event,
    url: `app://swellmind/${event}`,
    domain: 'swellmind.app',
    props: props
  }, {
    headers: { 'User-Agent': 'SwellMind Backend' }
  })
}

// Usage
await trackEvent('session_logged', {
  spot_region: session.spot.region, // Aggregated, not specific spot
  rating_bucket: Math.floor(session.rating / 2) * 2, // 0-2, 2-4, 4-6, etc.
})
```

**Key Metrics to Track:**

**Acquisition:**
- New sign-ups per day/week
- Sign-up source (if you add referral tracking)
- Onboarding completion rate

**Activation:**
- Time to first session logged
- Users who log ≥3 sessions (model activation threshold)
- Onboarding funnel drop-off points

**Engagement:**
- Daily/Weekly/Monthly Active Users (DAU/WAU/MAU)
- Sessions logged per user per week
- Forecast views per user per day
- Average time in app per session
- Feature usage (Insights view %, Settings access %)

**Retention:**
- D1, D7, D30 retention rates
- Cohort retention by sign-up week
- Churn indicators (no activity in 14 days)

**Product Quality:**
- ML model accuracy by user (MAE of predictions vs actual ratings)
- % of recommended windows that were surfed
- Forecast data freshness (time since last Open-Meteo update)
- API error rates by endpoint
- App crash rate (target: <0.1%)

**Implementation Example:**

```typescript
// Track anonymously
class Analytics {
  track(event: string, props?: Record<string, any>) {
    // Only track if user opted in (GDPR)
    if (!user.analyticsConsent) return
    
    // Remove PII
    const sanitized = {
      ...props,
      user_id: hashUserId(user.id), // One-way hash
      timestamp: Date.now()
    }
    
    // Send to Plausible or your analytics backend
    plausible.trackEvent(event, sanitized)
  }
}

// Usage in Android
analytics.track('forecast_viewed', {
  spot_region: 'lisbon',
  forecast_days_ahead: 3,
  num_windows_shown: 8
})

analytics.track('session_logged', {
  rating: 8,
  has_notes: true,
  backfilled: false // Logged immediately vs retroactive
})

analytics.track('ml_recommendation_clicked', {
  score: 85,
  model_confidence: 'high' // Based on num_sessions
})
```

### 16.3 Database Monitoring

**Supabase Dashboard Metrics:**

Monitor via Supabase dashboard:
- Database size growth (alert at 400MB / 80% of free tier)
- Active connections (alert at >20)
- Slow queries (>1s execution time)
- Failed queries rate

**Custom Monitoring Queries:**

```sql
-- Monitor forecast storage growth
SELECT 
  DATE(created_at) as date,
  COUNT(*) as snapshots_created,
  COUNT(DISTINCT spot_id) as unique_spots
FROM forecast_snapshots
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;

-- Identify users ready for model training
SELECT 
  user_id,
  COUNT(*) as session_count,
  MAX(created_at) as last_session
FROM sessions
WHERE linked_forecast_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) >= 3
  AND COUNT(*) % 3 = 0; -- Every 3rd session triggers training

-- Monitor ML model performance
SELECT 
  u.email,
  ums.num_sessions,
  ums.model_type,
  ums.last_trained_at,
  AVG(ABS(fus.predicted_score - s.overall_rating * 10)) as mae
FROM user_model_stats ums
JOIN users u ON u.id = ums.user_id
JOIN forecast_user_scores fus ON fus.user_id = ums.user_id
JOIN sessions s ON s.linked_forecast_id = fus.forecast_id
GROUP BY u.email, ums.num_sessions, ums.model_type, ums.last_trained_at
HAVING COUNT(s.id) >= 5;
```

### 16.4 API Endpoint Monitoring

**Health Check Endpoint:**

```typescript
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {}
  }
  
  // Check database
  try {
    await supabase.from('users').select('count').limit(1)
    health.services.database = 'ok'
  } catch (error) {
    health.services.database = 'error'
    health.status = 'degraded'
  }
  
  // Check Open-Meteo
  try {
    const response = await fetch('https://marine-api.open-meteo.com/v1/marine?latitude=38.7&longitude=-9.1&hourly=wave_height')
    health.services.openmeteo = response.ok ? 'ok' : 'error'
  } catch (error) {
    health.services.openmeteo = 'error'
    health.status = 'degraded'
  }
  
  res.status(health.status === 'ok' ? 200 : 503).json(health)
})
```

**Uptime Monitoring (Free Tools):**

- **UptimeRobot** (free tier: 50 monitors, 5-min intervals)
  - Monitor `/health` endpoint
  - Alert via email if down >5 minutes

- **BetterStack** (free tier with alerts)
  - Monitor response times
  - Alert on slow queries (>2s)

**Custom Metrics Tracking:**

```typescript
// Middleware to track response times
app.use((req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`)
      
      Sentry.captureMessage(`Slow API request`, {
        level: 'warning',
        tags: {
          method: req.method,
          path: req.path,
          duration: duration
        }
      })
    }
    
    // Track metrics
    metrics.recordResponseTime(req.path, duration)
  })
  
  next()
})
```

### 16.5 Cost Monitoring

**Set Up Billing Alerts:**

**Railway:**
1. Project Settings → Usage
2. Set budget alert at $3/month (50% of free credit)
3. Email notification when exceeded

**Supabase:**
1. Project Settings → Billing
2. Monitor:
   - Database size (alert at 400MB)
   - Bandwidth (alert at 1.5GB)
   - Monthly Active Users (alert at 40k)

**Open-Meteo Monitoring:**

```typescript
// Track API usage
let dailyApiCalls = 0
let lastResetDate = new Date().toDateString()

function trackOpenMeteoCall() {
  const today = new Date().toDateString()
  
  if (today !== lastResetDate) {
    // New day - reset counter
    console.log(`Open-Meteo calls yesterday: ${dailyApiCalls}`)
    dailyApiCalls = 0
    lastResetDate = today
  }
  
  dailyApiCalls++
  
  // Alert if approaching limit
  if (dailyApiCalls > 8000) {
    Sentry.captureMessage('Approaching Open-Meteo daily limit', {
      level: 'warning',
      extra: { calls_today: dailyApiCalls }
    })
  }
}
```

**Cost Per User Calculation:**

```typescript
// Run monthly to track unit economics
async function calculateCostPerUser() {
  const activeUsers = await supabase
    .from('sessions')
    .select('user_id')
    .gte('created_at', thirtyDaysAgo)
    .distinct('user_id')
  
  const costs = {
    railway: 5, // Monthly cost in USD
    supabase: 0, // Free tier
    domain: 1, // Amortized annual cost
    total: 6
  }
  
  const costPerUser = costs.total / activeUsers.length
  
  console.log(`Monthly cost per active user: ${costPerUser.toFixed(2)}`)
  
  // Track in analytics
  analytics.track('monthly_metrics', {
    active_users: activeUsers.length,
    total_cost: costs.total,
    cost_per_user: costPerUser
  })
}
```

---

## Appendix G: Database Indexes & Performance

### G.1 Required Indexes

**Critical for Query Performance:**

```sql
-- Forecast snapshots: Most queried table
CREATE INDEX idx_forecast_spot_time 
ON forecast_snapshots(spot_id, timestamp_utc DESC);

CREATE INDEX idx_forecast_created 
ON forecast_snapshots(created_at DESC);

-- Sessions: Filter by user and time
CREATE INDEX idx_sessions_user_time 
ON sessions(user_id, surf_timestamp_utc DESC);

CREATE INDEX idx_sessions_forecast 
ON sessions(linked_forecast_id) 
WHERE linked_forecast_id IS NOT NULL;

-- User scores: Primary lookup
CREATE INDEX idx_scores_user_forecast 
ON forecast_user_scores(user_id, forecast_id);

CREATE INDEX idx_scores_forecast 
ON forecast_user_scores(forecast_id);

-- Spots: Geospatial lookup
CREATE INDEX idx_spots_region 
ON spots(region);

-- User preferences
CREATE INDEX idx_users_region 
ON users(home_region);
```

**Composite Indexes for Complex Queries:**

```sql
-- Find sessions in date range for insights
CREATE INDEX idx_sessions_user_created 
ON sessions(user_id, created_at DESC) 
INCLUDE (overall_rating, linked_forecast_id);

-- Stale forecast detection
CREATE INDEX idx_forecast_stale 
ON forecast_snapshots(spot_id, created_at) 
WHERE timestamp_utc > NOW();
```

### G.2 Query Optimization Examples

**Before Optimization:**

```sql
-- Slow: Scans all forecast snapshots
SELECT * FROM forecast_snapshots 
WHERE spot_id = 'abc-123' 
  AND timestamp_utc BETWEEN '2026-01-20' AND '2026-01-27'
ORDER BY timestamp_utc;
```

**After Optimization:**

```sql
-- Fast: Uses idx_forecast_spot_time
SELECT 
  id, timestamp_utc, wave_height, wave_period, 
  wind_speed, wind_direction, wind_orientation_category
FROM forecast_snapshots 
WHERE spot_id = 'abc-123' 
  AND timestamp_utc >= '2026-01-20'::timestamptz 
  AND timestamp_utc < '2026-01-28'::timestamptz
ORDER BY timestamp_utc;
```

**Explain Plan:**

```sql
EXPLAIN ANALYZE
SELECT * FROM forecast_snapshots 
WHERE spot_id = 'abc-123' 
  AND timestamp_utc BETWEEN '2026-01-20' AND '2026-01-27';

-- Should show: Index Scan using idx_forecast_spot_time
-- Cost should be <100, Execution time <10ms
```

### G.3 Data Retention & Archival

**Problem:** forecast_snapshots grows indefinitely

**Solution:** Archive old data

```sql
-- Delete forecasts older than 90 days
DELETE FROM forecast_snapshots
WHERE timestamp_utc < NOW() - INTERVAL '90 days'
  AND created_at < NOW() - INTERVAL '90 days';

-- Or archive to separate table
CREATE TABLE forecast_snapshots_archive (
  LIKE forecast_snapshots INCLUDING ALL
);

INSERT INTO forecast_snapshots_archive
SELECT * FROM forecast_snapshots
WHERE timestamp_utc < NOW() - INTERVAL '90 days';

DELETE FROM forecast_snapshots
WHERE timestamp_utc < NOW() - INTERVAL '90 days';
```

**Automated with Supabase:**

```sql
-- Create scheduled job (requires Supabase Pro or cron job)
-- Alternative: Run as weekly cron from Railway backend
SELECT cron.schedule(
  'archive-old-forecasts',
  '0 2 * * 0', -- Every Sunday at 2am
  $
  DELETE FROM forecast_snapshots
  WHERE timestamp_utc < NOW() - INTERVAL '90 days'
  $
);
```

**Backend Cron Job:**

```typescript
import cron from 'node-cron'

// Run every Sunday at 2am
cron.schedule('0 2 * * 0', async () => {
  console.log('Running forecast cleanup...')
  
  const { data, error } = await supabase
    .from('forecast_snapshots')
    .delete()
    .lt('timestamp_utc', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
  
  console.log(`Deleted ${data?.length || 0} old forecasts`)
})
```

### G.4 Database Size Projections

**Estimation:**

- **Forecast snapshots:** 
  - 10 spots × 8 windows/day × 90 days retention = 7,200 rows
  - ~200 bytes/row = ~1.4 MB
  
- **Sessions:**
  - 100 users × 3 sessions/week × 52 weeks = 15,600 rows
  - ~300 bytes/row = ~4.7 MB
  
- **Forecast user scores:**
  - 100 users × 10 spots × 8 windows × 10 days = 80,000 rows
  - ~100 bytes/row = ~8 MB

**Total for MVP year 1:** ~50 MB (well under 500 MB limit)

**At scale (1000 users, 50 spots):**
- Forecasts: 50 × 8 × 90 = 36,000 rows = ~7 MB
- Sessions: 1000 × 3 × 52 = 156,000 rows = ~47 MB
- Scores: 1000 × 50 × 8 × 10 = 4M rows = ~400 MB

**Total at scale:** ~450 MB (approaching limit, consider archival or upgrade)

---

## Appendix H: Pre-Launch Checklist

### H.1 Legal & Compliance

- [ ] Privacy Policy published at swellmind.app/privacy
- [ ] Terms of Service published at swellmind.app/terms
- [ ] GDPR consent flow in onboarding
- [ ] Data deletion feature implemented and tested
- [ ] Data export feature implemented and tested
- [ ] Cookie banner (if adding web version)
- [ ] Age verification (13+ or 18+ based on region)

### H.2 Security

- [ ] API keys secured in environment variables (not hardcoded)
- [ ] Android keys obfuscated with ProGuard/R8
- [ ] Rate limiting enabled on all endpoints
- [ ] Input validation on all API endpoints
- [ ] SQL injection prevention verified (parameterized queries)
- [ ] Authentication tokens encrypted on device
- [ ] HTTPS enforced on all backend endpoints
- [ ] Supabase Row Level Security (RLS) policies enabled
- [ ] Security audit completed (basic penetration testing)

### H.3 Performance

- [ ] Database indexes created
- [ ] Query performance tested (all <1s)
- [ ] API response times measured (p95 <500ms)
- [ ] Load testing completed (100+ concurrent users)
- [ ] Caching strategy implemented and verified
- [ ] Image optimization (if adding session photos)
- [ ] App size <50 MB
- [ ] Cold start time <3 seconds on mid-range device

### H.4 Monitoring & Analytics

- [ ] Sentry error tracking configured (backend + Android)
- [ ] Analytics tracking implemented (Plausible or alternative)
- [ ] Health check endpoint created (/health)
- [ ] Uptime monitoring set up (UptimeRobot)
- [ ] Billing alerts configured (Railway + Supabase)
- [ ] Database size monitoring dashboard created
- [ ] Custom metrics tracking implemented

### H.5 Testing

- [ ] Backend unit tests passing (>80% coverage)
- [ ] Backend integration tests passing
- [ ] Android unit tests passing (>70% coverage)
- [ ] Android UI tests passing
- [ ] End-to-end tests passing
- [ ] Load testing completed
- [ ] Beta testing completed (30+ users, 2+ weeks)
- [ ] Critical bugs resolved (crash-free rate >99%)

### H.6 User Experience

- [ ] Onboarding flow tested with 5+ new users
- [ ] Empty states designed and implemented
- [ ] Error messages reviewed for clarity
- [ ] Offline mode tested thoroughly
- [ ] Session logging tested for last 7 days
- [ ] ML recommendations tested with multiple user profiles
- [ ] Insights screen tested with various session counts
- [ ] Settings screen complete and tested
- [ ] Help/FAQ content written

### H.7 Content & Design

- [ ] App icon designed (1024×1024)
- [ ] Splash screen designed
- [ ] Play Store screenshots prepared (phone + tablet)
- [ ] Play Store description written
- [ ] Feature graphic created (1024×500)
- [ ] Promo video created (optional but recommended)
- [ ] Email templates designed (welcome, password reset)
- [ ] In-app messaging reviewed

### H.8 Infrastructure

- [ ] Backend deployed to Railway (production environment)
- [ ] Database migrated to Supabase (production)
- [ ] Environment variables configured
- [ ] Domain configured (optional: api.swellmind.app)
- [ ] SSL certificate verified
- [ ] Backup strategy documented
- [ ] Disaster recovery plan documented

### H.9 Google Play Store

- [ ] Developer account created ($25 one-time fee)
- [ ] App bundle (AAB) built and signed
- [ ] Play Store listing completed
- [ ] Content rating completed
- [ ] Target audience and content declarations
- [ ] Privacy policy URL provided
- [ ] Internal testing track tested (team)
- [ ] Closed beta track tested (30+ users)
- [ ] Open beta track tested (100+ users, optional)
- [ ] Release notes prepared

### H.10 Post-Launch

- [ ] Monitor crash reports daily (week 1)
- [ ] Monitor user feedback and reviews
- [ ] Track key metrics (DAU, retention, session logging rate)
- [ ] Prepare hotfix deployment process
- [ ] Schedule post-launch retrospective
- [ ] Plan first update (based on feedback)

---

## Section 17: Migration & Versioning Strategy

### 17.1 Database Migrations

**Use Supabase Migrations:**

```bash
# Initialize migrations
supabase init

# Create migration
supabase migration new create_initial_schema

# Apply migration locally
supabase db reset

# Apply to production
supabase db push
```

**Example Migration:**

```sql
-- migrations/20260120_create_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (managed by Supabase Auth)
-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL,
  surf_timestamp_utc TIMESTAMPTZ NOT NULL,
  linked_forecast_id UUID,
  overall_rating INT CHECK (overall_rating >= 1 AND overall_rating <= 10),
  perceived_wind TEXT CHECK (perceived_wind IN ('too_onshore', 'just_right', 'too_weak')),
  perceived_size INT CHECK (perceived_size >= 1 AND perceived_size <= 10),
  perceived_crowd INT CHECK (perceived_crowd >= 1 AND perceived_crowd <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_user_time ON sessions(user_id, surf_timestamp_utc DESC);

-- Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Migration Workflow:**

1. Develop locally with Supabase local instance
2. Create migration file
3. Test migration on staging database
4. Review migration SQL
5. Apply to production during low-traffic window
6. Verify with health checks

### 17.2 API Versioning

**Versioned Endpoints:**

```typescript
// Version 1 (initial)
app.get('/v1/spots/:id/windows', getWindowsV1)

// Version 2 (future: add weather parameter)
app.get('/v2/spots/:id/windows', getWindowsV2)

// Default to latest
app.get('/spots/:id/windows', getWindowsV2)
```

**Deprecation Strategy:**

```typescript
app.get('/v1/spots/:id/windows', (req, res, next) => {
  // Warn about deprecation
  res.setHeader('X-API-Deprecation', 'This endpoint will be removed on 2026-06-01. Use /v2/spots/:id/windows')
  res.setHeader('X-API-Sunset', '2026-06-01')
  
  next()
}, getWindowsV1)
```

**Android Client Version Handling:**

```kotlin
// API client with version support
class ApiClient(private val version: String = "v2") {
    private val baseUrl = "https://api.swellmind.app/$version"
    
    suspend fun getWindows(spotId: String): List<Window> {
        return retrofit.get("$baseUrl/spots/$spotId/windows")
    }
}

// Check minimum app version on backend
app.use((req, res, next) => {
  const appVersion = req.headers['x-app-version']
  const minVersion = '1.0.0'
  
  if (appVersion && compareVersions(appVersion, minVersion) < 0) {
    return res.status(426).json({
      error: 'App update required',
      min_version: minVersion,
      download_url: 'https://play.google.com/store/apps/details?id=com.swellmind.app'
    })
  }
  
  next()
})
```

### 17.3 App Update Strategy

**Forced Updates:**

```kotlin
// Check on app startup
class SplashViewModel : ViewModel() {
    fun checkAppVersion() {
        viewModelScope.launch {
            try {
                val response = apiClient.getAppConfig()
                
                if (response.minVersion > BuildConfig.VERSION_CODE) {
                    _state.value = State.UpdateRequired(
                        message = "Please update to continue using SwellMind",
                        storeUrl = response.storeUrl
                    )
                } else if (response.recommendedVersion > BuildConfig.VERSION_CODE) {
                    _state.value = State.UpdateAvailable(
                        message = "A new version is available with improvements"
                    )
                } else {
                    _state.value = State.Continue
                }
            } catch (e: Exception) {
                // Allow app to continue if version check fails
                _state.value = State.Continue
            }
        }
    }
}
```

**Backend Config Endpoint:**

```typescript
app.get('/config', (req, res) => {
  res.json({
    min_version: 100, // Version code 100 = 1.0.0
    recommended_version: 110, // 1.1.0
    store_url: 'https://play.google.com/store/apps/details?id=com.swellmind.app',
    features: {
      ml_enabled: true,
      notifications_enabled: true
    }
  })
})
```

**Rollout Strategy (Play Store):**

1. Release to 10% of users (day 1)
2. Monitor crash rates and reviews
3. Increase to 50% (day 3)
4. Full rollout to 100% (day 7)
5. If critical issues found, halt rollout and release hotfix

---

## Section 18: Accessibility & Internationalization

### 18.1 Accessibility (Android)

**Content Descriptions:**

```kotlin
// All interactive elements need descriptions
IconButton(
    onClick = { },
    modifier = Modifier.semantics {
        contentDescription = "Log new surf session"
    }
) {
    Icon(Icons.Default.Add, contentDescription = null) // Icon labeled by button
}

// Images
Image(
    painter = painterResource(R.drawable.wave_icon),
    contentDescription = "Wave conditions: 1.5 meters at 10 second period",
    modifier = Modifier.size(48.dp)
)
```

**Text Contrast:**

```kotlin
// Ensure sufficient contrast (WCAG AA: 4.5:1 for normal text)
val surfaceColor = MaterialTheme.colorScheme.surface
val textColor = MaterialTheme.colorScheme.onSurface // Auto-contrasts

// For custom colors, verify contrast
@Composable
fun HighScoreBadge() {
    Surface(
        color = Color(0xFF4CAF50), // Green background
        modifier = Modifier.semantics {
            heading() // Mark as important
        }
    ) {
        Text(
            text = "Recommended",
            color = Color.White, // Verify 4.5:1 contrast
            style = MaterialTheme.typography.labelSmall
        )
    }
}
```

**Text Scaling:**

```kotlin
// Support dynamic text sizes
Text(
    text = "Wave Height",
    style = MaterialTheme.typography.bodyMedium, // Scales with system settings
    maxLines = 2,
    overflow = TextOverflow.Ellipsis
)

// Test with largest text size in settings
```

**Touch Targets:**

```kotlin
// Minimum 48dp touch target
Button(
    onClick = { },
    modifier = Modifier
        .defaultMinSize(minHeight = 48.dp)
        .padding(horizontal = 16.dp)
) {
    Text("Log Session")
}
```

**Screen Reader Testing:**

- Enable TalkBack on test device
- Navigate entire app using only TalkBack
- Verify all content is readable
- Ensure logical focus order

### 18.2 Internationalization (i18n)

**String Resources:**

```xml
<!-- res/values/strings.xml (English) -->
<resources>
    <string name="app_name">SwellMind</string>
    <string name="log_session">Log Session</string>
    <string name="wave_height">Wave Height: %1$s m</string>
    <string name="recommended">Recommended</string>
    
    <plurals name="sessions_logged">
        <item quantity="one">%d session logged</item>
        <item quantity="other">%d sessions logged</item>
    </plurals>
</resources>

<!-- res/values-pt/strings.xml (Portuguese) -->
<resources>
    <string name="app_name">SwellMind</string>
    <string name="log_session">Registar Sessão</string>
    <string name="wave_height">Altura das Ondas: %1$s m</string>
    <string name="recommended">Recomendado</string>
    
    <plurals name="sessions_logged">
        <item quantity="one">%d sessão registada</item>
        <item quantity="other">%d sessões registadas</item>
    </plurals>
</resources>
```

**Usage in Compose:**

```kotlin
@Composable
fun WaveInfo(height: Float) {
    Text(
        text = stringResource(R.string.wave_height, height),
        style = MaterialTheme.typography.bodyMedium
    )
}

@Composable
fun SessionCount(count: Int) {
    Text(
        text = pluralStringResource(R.plurals.sessions_logged, count, count)
    )
}
```

**Date/Time Formatting:**

```kotlin
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale

@Composable
fun formatTimestamp(instant: Instant): String {
    val locale = Locale.getDefault() // User's locale
    val formatter = DateTimeFormatter
        .ofLocalizedDateTime(FormatStyle.MEDIUM)
        .withZone(ZoneId.systemDefault())
    
    return formatter.format(instant)
}

// Outputs:
// English: "Jan 20, 2026, 8:30 AM"
// Portuguese: "20 de jan. de 2026, 08:30"
```

**Number Formatting:**

```kotlin
import java.text.NumberFormat

@Composable
fun formatWaveHeight(meters: Float, useImperial: Boolean): String {
    val formatter = NumberFormat.getInstance()
    formatter.maximumFractionDigits = 1
    
    return if (useImperial) {
        val feet = meters * 3.28084f
        "${formatter.format(feet)} ft"
    } else {
        "${formatter.format(meters)} m"
    }
}
```

**RTL (Right-to-Left) Support:**

```kotlin
// Compose handles RTL automatically, but test with Arabic/Hebrew
// Force RTL for testing:
// Developer Options → Force RTL layout direction

// Ensure icons flip appropriately
Icon(
    imageVector = Icons.AutoMirrored.Filled.ArrowForward,
    contentDescription = "Next",
    modifier = Modifier.semantics {
        // Will flip in RTL
    }
)
```

---

This completes the additional sections for your product spec. These additions cover all the critical gaps I identified and should give you (and the AI developing the app) a comprehensive blueprint for building SwellMind successfully.

Would you like me to elaborate on any specific section or create additional appendices?