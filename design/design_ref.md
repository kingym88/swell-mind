# SwellMind Design Reference

This document outlines the visual design direction for the SwellMind surf recommendation app, inspired by modern fitness app UI patterns but adapted for surf forecasting.

## Design Philosophy

SwellMind combines the clean, motivational aesthetic of fitness apps with ocean-inspired colors and surf-specific imagery. The design should feel:

- **Calm & Flowing**: Like the ocean itself - not aggressive or overwhelming
- **Data-Rich but Clear**: Show forecast details without clutter
- **Personalized**: Reflect each user's unique surf preferences
- **Action-Oriented**: Make it easy to decide "should I surf now?"

---

## Screen Layouts

### 1. Surf Forecast Dashboard (Home)

**Inspired by:** Fitness app home dashboard  
**SwellMind Adaptation:**

**Header:**
- Personalized greeting with surf emoji: "Hey [Name] 🏄"
- Tagline: "Here's your surf forecast" or "Great conditions ahead!"
- Icons: Notifications (alert for high-score windows), Settings

**Hero Card: Today's Best Window**
- Large gradient card (ocean blues/teals)
- Time window: "Tomorrow, 6:00 AM - 9:00 AM"
- User Suitability Score: "92/100" with circular progress indicator
- Key conditions snapshot:
  - Wave: "1.5m @ 11s, WNW"
  - Wind: "Offshore, 8 km/h"
  - Tide: "Rising mid"
- "Why This is Good For You": Short explanation
- CTA Button: "Log This Session" or "Set Reminder"

**Spot Selector:**
- Horizontal scrollable chips/pills for favorite spots
- Active spot highlighted in blue
- Icons: Beach/break type indicator

**Quick Stats Section:**
- Dark cards in grid (2x2):
  - "Sessions This Month": 12
  - "Best Rated Spot": Ericeira
  - "Avg Rating": 7.8/10
  - "Model Confidence": High (based on logged sessions)

**Upcoming Windows:**
- Section title: "Next 7 Days"
- Scrollable horizontal cards showing 3-hour windows
- Mini version of hero card:
  - Date/time
  - Score badge (color-coded: green >75, yellow 50-75, gray <50)
  - Wave height + wind orientation icon
  - "Recommended" badge if score >75

**Bottom Section:**
- "Log a Past Session" button
- "View Insights" link

---

### 2. Session Logs & Insights Screen

**Inspired by:** Goals/progress screen  
**SwellMind Adaptation:**

**Header:**
- Back button, "My Sessions" title, filter/search icon
- Tab toggle: "Recent Sessions" / "Insights"

**Recent Sessions Tab:**

**Session Cards** (stacked, blue gradient):
- Circular spot icon/photo on left
- Session info:
  - Spot name
  - Date/time
  - Rating badge: "8/10" with star icon
  - Conditions: "1.3m @ 10s, Offshore"
  - Progress bar showing how it compared to your average
- Tap to expand: Shows notes, perceived wind/size/crowd
- Edit/delete options on swipe

**Sessions shown:**
- Peniche - 8/10 - "2 days ago"
- Ericeira - 9/10 - "5 days ago"  
- Guincho - 6/10 - "1 week ago"
- Carcavelos - 7/10 - "2 weeks ago"

**Insights Tab:**

**Your Ideal Conditions Card:**
- Gradient background (ocean sunset colors)
- Title: "You Surf Best When..."
- Data visualization:
  - Wave height range: "1.2m - 1.8m"
  - Period preference: "10-12s"
  - Wind: "Offshore or light cross"
  - Time: "Morning (6am - 10am)"
  - Crowd tolerance: "Low to medium"
- Based on: "15 logged sessions"

**Charts Section:**
- Rating vs Wave Height (line chart)
- Rating vs Wind Orientation (bar chart)
- Rating vs Time of Day (heatmap style)
- Sessions by Spot (pie chart)

**Model Performance:**
- "ML Model Accuracy": Shows MAE or correlation
- "Keep logging sessions to improve recommendations!"

---

### 3. Spots Map View

**Inspired by:** Partners map view  
**SwellMind Adaptation:**

**Search Bar:**
- Location/spot name with autocomplete
- Back button, filter icon (filter by break type, region)
- "Add Custom Spot" button

**Map:**
- Full-screen map (Mapbox or Google Maps)
- Custom surf spot markers:
  - Blue wave pin for saved favorites
  - Gray wave pin for other spots
  - Color intensity shows current score (green = high, yellow = medium, gray = low)
  - Tap pin to see preview card

**Map Pin Design:**
- Wave-shaped teardrop pin
- Icon indicating break type (beach break, point, reef)
- Pulsing animation for "recommended now" spots

**Bottom Sheet:**
- "Your Spots" section with star icon
- List of favorite spots with quick stats:
  - Name
  - Distance from current location
  - Current score
  - Next good window
- "Discover Nearby" button to explore new spots

**Spot Detail Modal (when pin tapped):**
- Spot photo/image
- Current conditions summary
- Score for next window
- "View Full Forecast" button
- "Add to Favorites" toggle

---

### 4. Log Session Screen

**Layout:**
- Full-screen modal with gradient background
- "Log Session" title with close button

**Form Fields:**

**Spot Selection:**
- Dropdown or searchable list
- Pre-filled if coming from a specific forecast window

**Date & Time:**
- Toggle: "Just now" / "Earlier this week"
- Date picker (last 7 days only)
- Time picker (3-hour window selector)

**Rating Slider:**
- Large, prominent slider (1-10)
- Emoji feedback (😞 to 🤩)
- Label: "How was it overall?"

**Perceived Conditions:**
- Wind: 3 button toggle (Too Onshore / Just Right / Too Weak)
- Wave Size: Slider (1-10) with labels (Too Small → Perfect → Too Big)
- Crowd: Slider (1-10) with labels (Empty → Packed)

**Notes (Optional):**
- Text area: "Add notes about this session..."
- Max 500 characters

**Bottom:**
- "Cancel" and "Log Session" buttons
- Show linked forecast: "Conditions: 1.5m @ 11s, Offshore"

---

### 5. Settings Screen

**Standard Settings List:**

**Spots:**
- Manage Favorite Spots
- Add Custom Spot

**Units:**
- Wave Height: Meters / Feet
- Wind Speed: km/h / knots / mph
- Temperature: Celsius / Fahrenheit

**Notifications:**
- High Score Alerts: Toggle
- Daily Forecast Digest: Toggle
- Time preference for notifications

**Preferences:**
- Ideal wave size range
- Crowd tolerance
- Preferred times of day

**Account:**
- Email
- Change password
- Export my data (JSON download)
- Delete account (red text, with confirmation)

**About:**
- Version number
- Privacy Policy link
- Terms of Service link
- Send Feedback
- Rate on Play Store

---

## Design System

### Color Palette

**Primary Ocean Blues:**
| Name              | Hex       | Usage                                    |
| ----------------- | --------- | ---------------------------------------- |
| Deep Ocean        | `#006494` | Primary brand color, important buttons   |
| Surf Blue         | `#0582CA` | Interactive elements, links              |
| Sky Blue          | `#00A6FB` | Highlights, selected states              |
| Foam White        | `#E8F4F8` | Light backgrounds, cards                 |

**Accent Colors:**
| Name           | Hex       | Usage                              |
| -------------- | --------- | ---------------------------------- |
| Sunset Orange  | `#FF6B35` | High scores, "Recommended" badges  |
| Sandy Beige    | `#F4E8C1` | Neutral backgrounds                |
| Reef Green     | `#4ECDC4` | Success states, positive feedback  |
| Storm Gray     | `#546E7A` | Disabled states, secondary text    |

**Score-Based Colors:**
| Score Range | Color       | Hex       | Label              |
| ----------- | ----------- | --------- | ------------------ |
| 85-100      | Success     | `#4CAF50` | "Recommended!"     |
| 70-84       | Good        | `#8BC34A` | "Good conditions"  |
| 50-69       | Moderate    | `#FFC107` | "Might be worth it"|
| 30-49       | Poor        | `#FF9800` | "Not ideal"        |
| 0-29        | Very Poor   | `#9E9E9E` | "Skip this one"    |

**Backgrounds:**
| Name               | Hex       | Usage                    |
| ------------------ | --------- | ------------------------ |
| App Background     | `#F5F7FA` | Main screen background   |
| Card Background    | `#FFFFFF` | Cards, modals            |
| Dark Card          | `#1A2332` | Secondary info cards     |

**Text:**
| Name           | Hex       | Usage                          |
| -------------- | --------- | ------------------------------ |
| Primary Text   | `#1A1A1A` | Headlines, important info      |
| Secondary Text | `#6B7280` | Descriptions, labels           |
| Light Text     | `#FFFFFF` | Text on dark/colored backgrounds|

### Typography

**Font Family:** 
- Primary: **Inter** (clean, modern, highly legible)
- Alternative: **SF Pro** (iOS-style), **Roboto** (Android default)
- Headings: **Poppins** or **Montserrat** (optional for more personality)

**Scale:**
| Style          | Size | Weight | Usage                        |
| -------------- | ---- | ------ | ---------------------------- |
| H1 (Display)   | 32sp | Bold   | Screen titles                |
| H2 (Headline)  | 24sp | Semi   | Section headers              |
| H3 (Title)     | 20sp | Medium | Card titles                  |
| Body Large     | 16sp | Regular| Primary content              |
| Body           | 14sp | Regular| Secondary content, descriptions|
| Caption        | 12sp | Regular| Labels, metadata             |
| Button         | 16sp | Semi   | Button text                  |

**Line Height:** 1.5x for body text, 1.3x for headings

### Icons

**Style:** 
- Use **Material Icons** (filled for active states, outlined for inactive)
- Custom surf icons where needed:
  - Wave: 🌊 or custom wave outline
  - Wind: 💨 with arrow showing direction
  - Offshore: ↗️ away from shore
  - Onshore: ↙️ toward shore
  - Cross-shore: ↔️
  - Tide: Rising ↗️ / Falling ↘️ / Mid ➡️

**Icon Colors:**
- Active: Primary Blue (`#0582CA`)
- Inactive: Gray (`#9E9E9E`)
- On dark backgrounds: White (`#FFFFFF`)

### Components

#### 1. Forecast Window Cards

**Default State:**
```
┌─────────────────────────────────────┐
│ Tomorrow, 6:00 AM - 9:00 AM    [92] │ ← Score badge
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 🌊 1.5m @ 11s, WNW                  │ ← Wave info
│ 💨 Offshore, 8 km/h                 │ ← Wind info
│ 🌊 Rising mid                       │ ← Tide info
│                                     │
│ Similar to your 9/10 sessions      │ ← Explanation
│                                     │
│ [ Recommended ]                     │ ← Badge (if >75)
└─────────────────────────────────────┘
```

**Styling:**
- Border radius: 16px
- Padding: 16px
- Background: White with subtle gradient overlay for high scores
- Shadow: `0px 2px 8px rgba(0, 0, 0, 0.1)`
- Score badge: Circular, color-coded, positioned top-right

**Compact Version (for scrollable list):**
```
┌──────────────────────┐
│ [85] 8:00 AM - 11:00 │
│ 1.3m, Offshore       │
└──────────────────────┘
```

#### 2. Session Log Cards

**Layout:**
```
┌─────────────────────────────────────────┐
│  [📍]  Ericeira                    ⭐ 9  │ ← Spot + rating
│        2 days ago                        │
│        ━━━━━━━━━━━━━━━━━━━━━━━━━━ 90%  │ ← Progress vs avg
│        1.5m @ 12s, Offshore              │
│        "Perfect morning glass!"          │ ← Notes snippet
└─────────────────────────────────────────┘
```

**Styling:**
- Gradient background (light blue → darker blue)
- White text for contrast
- Circular spot icon (could be break type icon or photo)
- Swipe actions: Edit (left), Delete (right)

#### 3. Score Badges

**Circular Progress:**
```
     ┌─────┐
     │ 92  │  ← Large number
     │ /100│  ← Small denominator
     └─────┘
```

**Styling:**
- Circular border (ring) showing percentage filled
- Color-coded by score range
- Background: Semi-transparent white or solid color
- Size: 48x48px (compact), 80x80px (hero card)

**Pill Badge (for "Recommended"):**
```
[ 🏄 Recommended ]
```

**Styling:**
- Rounded pill (border-radius: 24px)
- Background: Gradient (orange to red for high energy)
- White text, emoji prefix
- Padding: 8px 16px

#### 4. Buttons

**Primary Button:**
- Background: Primary Blue (`#0582CA`)
- Text: White, semi-bold
- Border radius: 12px
- Padding: 12px 24px
- Shadow: `0px 4px 12px rgba(5, 130, 202, 0.3)`
- Hover/Press: Darken 10%

**Secondary Button:**
- Background: Transparent
- Border: 2px solid Primary Blue
- Text: Primary Blue
- Same dimensions as primary

**Pill Button (Activity Categories):**
- Background: White / Light Gray (inactive)
- Background: Primary Blue (active)
- Border: 1px solid gray (inactive)
- Border radius: 24px
- Padding: 8px 16px
- Icon + Text

#### 5. Input Fields

**Text Input:**
- Background: White
- Border: 1px solid `#E5E7EB` (inactive)
- Border: 2px solid Primary Blue (focus)
- Border radius: 8px
- Padding: 12px
- Placeholder color: `#9CA3AF`

**Slider:**
- Track: Gray (`#E5E7EB`)
- Active track: Primary Blue
- Thumb: Circular, blue with white border
- Value display: Above thumb
- Labels: Below track (min/max)

**Dropdown/Select:**
- Same styling as text input
- Chevron icon on right
- Options in modal/bottom sheet

#### 6. Navigation

**Bottom Tab Bar:**
- Background: White
- Active tab: Blue icon + blue label
- Inactive: Gray icon + gray label
- Height: 64px
- 5 tabs:
  1. 🏠 Home (Forecast Dashboard)
  2. 📊 Sessions (Session Logs & Insights)
  3. 📍 Spots (Map View)
  4. ➕ Log (Log Session - center, larger)
  5. ⚙️ Settings

**Tab Icons:**
- Size: 24x24px
- Material Icons or custom surf icons

**Special: Center "Log" Button**
- Elevated above tab bar
- Circular, larger (56x56px)
- Floating action button (FAB) style
- Primary blue background
- Plus icon

#### 7. Charts (Insights)

**Line Chart (Rating vs Wave Height):**
- X-axis: Wave height (m or ft)
- Y-axis: Average rating (1-10)
- Line color: Primary Blue
- Grid: Light gray, subtle
- Data points: Circular markers
- Tooltip on tap

**Bar Chart (Rating vs Wind Orientation):**
- Categories: Offshore, Cross, Onshore
- Bar color: Gradient (blue)
- Height: Proportional to avg rating

**Heatmap (Rating vs Time of Day):**
- Rows: Days of week
- Columns: Time buckets (Dawn, Morning, Midday, Afternoon, Evening)
- Color: Green (high rating) → Yellow → Gray (low rating)

### Spacing & Layout

**Grid System:**
- Base unit: 8px
- Padding/margins: Multiples of 8px (8, 16, 24, 32)
- Card spacing: 16px between cards
- Section spacing: 24px between sections
- Screen padding: 16px horizontal, 24px vertical

**Safe Areas:**
- Top: Account for status bar + 16px
- Bottom: Account for navigation bar + bottom tab bar

### Animations

**Transitions:**
- Screen transitions: Slide (300ms, ease-out)
- Modal entry: Slide up from bottom (250ms)
- Card expand: Smooth scale + fade (200ms)

**Interactive:**
- Button press: Scale down 95% (100ms)
- Card tap: Slight elevation increase (150ms)
- Progress bar fill: Animated on load (500ms, ease-in-out)

**Loading States:**
- Skeleton screens for forecast loading (gray shimmer)
- Spinner for session submission (blue circular)
- Pull-to-refresh: Ocean wave animation

**Micro-interactions:**
- Score badge: Pulse once when high score appears
- "Recommended" badge: Subtle glow/pulse animation
- Map pins: Bounce on load
- Success confirmation: Checkmark with scale + fade

### Imagery

**Spot Photos:**
- Aspect ratio: 16:9 or 4:3
- Rounded corners: 12px
- Fallback: Default beach/wave illustration with blue gradient overlay

**Empty States:**
- Illustration style: Minimal line art (wave, surfboard)
- Color: Primary blue lines
- Message: Encouraging ("Log your first session to get started!")

**Iconography:**
- Prefer icons over text where possible
- Consistent style (outlined vs filled)
- Surf-specific: Wave, wind, tide, surfboard, beach, clock

### Dark Mode (Future Consideration)

**Colors:**
- Background: `#0F1419` (deep ocean night)
- Cards: `#1A2332` (darker blue-gray)
- Text: `#E8F4F8` (light foam)
- Primary: Lighter blue (`#00A6FB`)

---

## Screen Flow Diagram

```
Onboarding
    ↓
Home (Forecast Dashboard) ← [Default screen]
    ↓
    ├→ Tap Window → Log Session Modal → Success → Home
    ├→ Bottom Nav: Sessions → Session Logs/Insights
    ├→ Bottom Nav: Spots → Map View → Spot Detail → Forecast
    ├→ Bottom Nav: Log → Log Session Modal
    └→ Bottom Nav: Settings → Settings Screen
                                    ↓
                              [Manage Spots, Units, Privacy]
```

---

## Responsive Design

**Phone (Primary Target):**
- Single column layout
- Full-width cards
- Scrollable content
- Bottom navigation

**Tablet (Future):**
- Two-column layout for dashboard
- Side navigation instead of bottom tabs
- Larger cards with more details visible
- Split view (list + detail)

---

## Accessibility

**Touch Targets:**
- Minimum 48x48dp for all interactive elements
- Adequate spacing between tappable items (8dp+)

**Contrast:**
- Text on white: WCAG AA compliant (4.5:1 minimum)
- Text on blue cards: Use white text (7:1+ contrast)

**Content Descriptions:**
- All icons have descriptive labels
- Screen reader support for charts (announce data points)

**Text Scaling:**
- Support system font size settings
- Test at 1.5x and 2x scaling

---

## File Structure

```
design/
├── DESIGN_REFERENCE.md          # This document
├── mockups/                     # Original fitness app inspiration
│   ├── home_dashboard.png
│   ├── goals_screen.png
│   └── partners_map_view.png
├── swellmind/                   # SwellMind-specific designs (to be created)
│   ├── forecast_dashboard.png   # Main forecast screen
│   ├── session_logs.png         # Session history
│   ├── insights.png             # Insights/analytics view
│   ├── spots_map.png            # Spots map view
│   ├── log_session.png          # Log session modal
│   └── onboarding_flow.png      # Onboarding screens
└── components/                  # Component library (to be created)
    ├── forecast_card.png
    ├── session_card.png
    ├── score_badge.png
    └── buttons.png
```

---

## Design Tokens (for Development)

```kotlin
// colors.kt
object SwellMindColors {
    val DeepOcean = Color(0xFF006494)
    val SurfBlue = Color(0xFF0582CA)
    val SkyBlue = Color(0xFF00A6FB)
    val FoamWhite = Color(0xFFE8F4F8)
    
    val SunsetOrange = Color(0xFFFF6B35)
    val ReefGreen = Color(0xFF4ECDC4)
    val StormGray = Color(0xFF546E7A)
    
    val SuccessGreen = Color(0xFF4CAF50)
    val WarningYellow = Color(0xFFFF C107)
    val ErrorRed = Color(0xFFF44336)
}

// typography.kt
object SwellMindTypography {
    val displayLarge = TextStyle(fontSize = 32.sp, fontWeight = FontWeight.Bold)
    val headlineMedium = TextStyle(fontSize = 24.sp, fontWeight = FontWeight.SemiBold)
    val titleLarge = TextStyle(fontSize = 20.sp, fontWeight = FontWeight.Medium)
    val bodyLarge = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.Normal)
    val bodyMedium = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Normal)
    val labelSmall = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Normal)
}

// spacing.kt
object SwellMindSpacing {
    val xs = 4.dp
    val sm = 8.dp
    val md = 16.dp
    val lg = 24.dp
    val xl = 32.dp
}
```

---

## Next Steps for Design

1. **Create SwellMind-Specific Mockups:**
   - Design all 5 core screens in Figma/Sketch
   - Focus on forecast dashboard and session logging first

2. **Component Library:**
   - Build reusable components (cards, buttons, badges)
   - Document variants and states

3. **Prototype:**
   - Create interactive prototype for user testing
   - Test with 3-5 surfers for feedback

4. **Handoff to Development:**
   - Export assets (icons, images)
   - Provide design tokens
   - Annotate spacing, colors, typography

---

*This design system should evolve based on user testing and feedback. Start simple, iterate based on real usage.*