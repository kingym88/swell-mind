# SwellMind - Feature Updates & Bug Fixes

## Overview
This document outlines critical updates and feature enhancements for the SwellMind surf forecasting application.

---

## 🐛 Bug Fixes

### Issue #1: Initial Load Layout Flash
**Priority:** High  
**Description:** When the app first loads, there's a brief (~1 second) period where elements render in an incorrect order before settling into the correct layout.

**Requirements:**
- Eliminate the layout shift on initial page load
- Ensure proper component rendering order from first paint
- Consider implementing:
  - Skeleton loading states
  - CSS-based layout preservation
  - Proper React hydration handling

**Acceptance Criteria:**
- No visible layout shift occurs during initial app load
- Components render in correct positions immediately
- Loading state is smooth and intentional

---

### Issue #4: Quick Stats Not Updating
**Priority:** High  
**Description:** Quick Stats section fails to update when users log new sessions. Current user has 6 logged sessions but UI shows only 4.

**Requirements:**
- Quick Stats must update in real-time when new sessions are added
- Ensure session count accuracy across the application
- Trigger ML algorithm recalculation after each new session
- Update all derived statistics (avg rating, best spot, model confidence)

**Acceptance Criteria:**
- Session count updates immediately after logging a session
- Average rating recalculates based on all sessions
- Best spot updates if a new session changes the ranking
- Model confidence updates after ML algorithm runs
- Changes persist across page refreshes

---

## ✨ Feature Enhancements

### Issue #2: Replace Reminder Functionality with Search & Best Windows

#### Part A: Reminder Bell Icon → Search Icon
**Current State:** Reminder bell icon in top-right (non-functional)  
**New Functionality:**

- Replace bell icon with search (🔍) icon
- Clicking opens surf spot search interface
- Search should allow users to:
  - Find surf spots by name
  - Filter by location
  - Add new spots to their saved list

**UI Specifications:**
- Icon position: Top-right header (current bell location)
- Search interface: Modal or slide-in panel
- Include search input with autocomplete
- Display search results with spot details

#### Part B: Set Reminder Button → Best Windows Button
**Current State:** "Set Reminder" button below forecast window (non-functional)  
**New Functionality:**

- Change button text to "Best Windows"
- Clicking navigates to a new page showing next best windows for ALL user's saved surf spots
- Page should display:
  - List of all user's surf spots
  - Next best window for each spot
  - Rating/score for each window
  - Sorted by rating (best to worst)

**UI Specifications:**
- Button style: Maintain current design
- New page route: `/best-windows` (or appropriate route)
- Include back navigation
- Display in card/list format similar to current forecast cards

---

### Issue #3: Add "All Spots" Selection & Location Display

#### Part A: All Spots Toggle
**Requirements:**
- Add an "All" button alongside spot selection buttons (Bafureira, Baleal, Carcavelos)
- When "All" is selected:
  - Recommendation window shows the highest-rated window across ALL user spots
  - If Bafureira has a 58 rating and Baleal has a 62 rating, show Baleal's window

**UI Specifications:**
- "All" button: Same style as spot selection buttons
- Default state: "All" selected on first load
- Active state: Visual indicator showing which option is selected
- Position: First in the row of spot buttons

#### Part B: Location Display in Best Window Card
**Requirements:**
- Add location information between "NEXT BEST WINDOW" text and the date/time
- Display format: [Map Icon] [Spot Name]
- Example: "📍 Bafureira"

**UI Specifications:**
- Small map/location icon (pin icon recommended)
- Spot name in clear, readable font
- Positioned directly below "NEXT BEST WINDOW" heading
- Above the date/time display
- Subtle styling to distinguish from main content

---

### Issue #5: Upcoming Windows - Reflect Selected Spot & Add Locations

**Requirements:**
- Upcoming Windows section must update based on selected spot/All toggle
- When specific spot selected: Show only windows for that spot
- When "All" selected: Show best windows across all spots with location labels
- Add location/spot name to each window card

**UI Specifications:**
- Each upcoming window card should display:
  - Spot name/location (when "All" is selected)
  - Rating score
  - Date and time
  - Wave conditions
  - Wind conditions
- Sort by rating (highest to lowest) when "All" is selected
- Cards should dynamically filter/update when spot selection changes

---

### Issue #6: Logged-Out User Experience

**Requirements:**
Modify the pre-login experience with the following changes:

#### Header Changes:
- Remove reminder bell icon
- Remove settings icon
- Add "Log In" button in their place (top-right)
- Log In button should trigger authentication flow

#### Quick Stats Section:
- Change to show generic/default statistics
- Display placeholder metrics such as:
  - "Join to track sessions"
  - Generic average ratings
  - Promotional content encouraging signup

#### Upcoming Windows:
- Display random/featured surf spots (not personalized)
- Show 3-4 sample upcoming windows
- Include popular surf spots in Portugal
- Maintain same card design as logged-in experience

**Acceptance Criteria:**
- Clear visual distinction between logged-in and logged-out states
- Prominent Log In call-to-action
- Engaging preview content that encourages signup
- No personalized data visible when logged out

---

### Issue #7: Rename "Quick Stats" to "Your Stats" for Logged-In Users

**Requirements:**
- When user is authenticated: Display heading as "Your Stats"
- When user is logged out: Keep heading as "Quick Stats"
- Maintain all other functionality and styling

**UI Specifications:**
- Simple text change
- Conditional rendering based on authentication state
- No other visual changes to the section

---

## 🎯 Success Metrics

- [ ] Zero layout shifts on page load (Issue #1)
- [ ] Search functionality accessible and functional (Issue #2a)
- [ ] Best Windows page created and navigable (Issue #2b)
- [ ] "All" toggle working correctly with accurate recommendations (Issue #3a)
- [ ] Location display visible in recommendation card (Issue #3b)
- [ ] Quick/Your Stats update immediately after session logging (Issue #4)
- [ ] ML algorithm runs on session creation (Issue #4)
- [ ] Upcoming Windows filter by spot selection (Issue #5)
- [ ] Logged-out experience fully implemented (Issue #6)
- [ ] Stats heading updates based on auth state (Issue #7)

---

## 📋 Technical Considerations

1. **State Management:** Ensure spot selection state is properly managed and persists across navigation
2. **Performance:** ML algorithm should run asynchronously to avoid blocking UI
3. **Caching:** Consider caching forecast data to reduce API calls
4. **Authentication:** Implement proper auth state checking for logged-in/logged-out experiences
5. **Routing:** Add new route for Best Windows page
6. **Data Updates:** Implement real-time or polling mechanism for stats updates

---

## 🔄 Implementation Priority

**Phase 1 (Critical):**
- Issue #1: Layout flash fix
- Issue #4: Stats updating bug
- Issue #7: Stats heading rename

**Phase 2 (High Priority):**
- Issue #3: All spots toggle and location display
- Issue #5: Upcoming windows filtering
- Issue #6: Logged-out experience

**Phase 3 (Enhancement):**
- Issue #2: Search and Best Windows functionality

---

## 📝 Notes

- All changes should maintain mobile-first responsive design
- Preserve existing wave emoji (🏄) branding elements
- Ensure accessibility standards are met for all new components
- Test thoroughly across different screen sizes and devices
