# SwellMind - Implementation Prompt for AI Agent

## Context
You are working on SwellMind, a personalized surf forecasting application built with React. The app helps surfers track sessions, get forecasts, and find the best surf windows. The frontend is deployed on Railway and uses a backend API for surf data and ML-powered recommendations.

## Your Task
Implement the following bug fixes and feature enhancements for the SwellMind application. Reference the attached `FEATURE_UPDATES.md` file for detailed specifications.

---

## Implementation Requirements

### 1. Fix Initial Load Layout Flash (Issue #1)
**Problem:** Elements render in wrong order for ~1 second on initial load  
**Solution Needed:**
- Implement proper loading states using skeleton screens or loading placeholders
- Ensure CSS prevents layout shifts (use min-height, aspect-ratio, or fixed dimensions)
- Consider using `content-visibility` CSS property for better rendering
- Implement proper React Suspense boundaries if using lazy loading
- Test and verify no Cumulative Layout Shift (CLS) occurs

### 2. Implement Search & Best Windows Features (Issue #2)

#### A. Replace Reminder Bell with Search Icon
- Remove the reminder bell icon from the header
- Add a search icon (magnifying glass) in its place
- Implement search modal/panel that:
  - Opens when search icon is clicked
  - Contains search input with real-time filtering
  - Displays surf spot results from database
  - Allows users to add spots to their saved list
  - Has proper mobile-friendly UI
  - Includes close/dismiss functionality

#### B. Replace "Set Reminder" with "Best Windows" Button
- Change button text from "Set Reminder" to "Best Windows"
- Create new route `/best-windows` (or appropriate path in your routing structure)
- Create new page component that:
  - Fetches all user's saved surf spots
  - Gets next best window for each spot
  - Displays spots in cards sorted by rating (highest first)
  - Shows wave height, wind, time/date for each window
  - Includes back navigation
  - Maintains consistent design with rest of app

### 3. Add "All Spots" Selection & Location Display (Issue #3)

#### A. Implement "All" Toggle Button
- Add "All" button as first option in spot selection row
- Make "All" the default selected state on page load
- When "All" is selected:
  - Calculate which spot has the highest-rated upcoming window
  - Display that spot's best window in the recommendation card
  - Highlight "All" button as active
- Ensure smooth transitions between selections
- Update state management to track selected spot ("All" or specific spot)

#### B. Add Location to Best Window Card
- Between "NEXT BEST WINDOW" heading and date/time, add a new row:
  - Small map/pin icon (📍 or use icon library)
  - Spot name (e.g., "Bafureira")
- Style with proper spacing and contrast
- Ensure it's visible but doesn't overpower main content

### 4. Fix Quick Stats Not Updating (Issue #4)
**Problem:** Stats show 4 sessions when user has logged 6  
**Solution Needed:**
- Debug why session count isn't updating after new session creation
- Implement proper state management or API refetch after session logging
- Ensure the following update after each new session:
  - Total session count
  - Average rating calculation
  - Best spot determination
  - Model confidence score
- Trigger ML algorithm recalculation on new session:
  - This should run server-side
  - Update model predictions after processing new session data
  - Refresh UI with updated recommendations
- Add loading indicators during recalculation if needed
- Verify data persistence across page refreshes

### 5. Update Upcoming Windows Section (Issue #5)
**Requirements:**
- Make Upcoming Windows reactive to spot selection from Issue #3
- When specific spot selected: Filter to show only that spot's windows
- When "All" selected: Show best windows across all spots
- For "All" view, add location label to each window card
- Sort windows by rating (highest to lowest)
- Maintain current card design and layout
- Ensure smooth filtering/transitions

### 6. Implement Logged-Out User Experience (Issue #6)

**Header Updates:**
- Remove reminder bell icon for logged-out users
- Remove settings icon for logged-out users  
- Add "Log In" button in top-right
- Style button prominently to encourage login
- Connect to your authentication flow

**Quick Stats Section (logged-out):**
- Show generic placeholder content:
  - "Join to track sessions" message
  - Generic surf statistics
  - Promotional content encouraging signup
- Use design from reference image provided
- No personalized data should be visible

**Upcoming Windows (logged-out):**
- Display 3-4 random/featured surf spots
- Show sample upcoming windows with realistic data
- Include popular Portuguese surf spots (Ericeira, Peniche, etc.)
- Maintain card design consistency
- Data should be generic, not personalized

**Implementation Notes:**
- Add authentication state check throughout app
- Create conditional rendering based on `isLoggedIn` or similar state
- Ensure proper handling of protected routes
- Consider using React context or state management for auth state

### 7. Rename "Quick Stats" to "Your Stats" (Issue #7)
**Simple change:**
- IF user is authenticated: Display heading as "Your Stats"
- IF user is logged out: Display heading as "Quick Stats"
- Implement with conditional rendering based on auth state
- No other changes to section styling or functionality

---

## Implementation Guidelines

### Code Quality
- Follow existing code patterns and conventions in the project
- Maintain mobile-first responsive design
- Use existing component library and styling system
- Write clean, commented code
- Implement proper error handling

### State Management
- Use appropriate state management (React hooks, Context, Redux, etc.)
- Ensure state updates are efficient and don't cause unnecessary re-renders
- Properly handle async operations with loading and error states

### API Integration
- Use existing API endpoints where possible
- Implement proper error handling for API calls
- Add loading indicators for async operations
- Consider implementing caching for forecast data

### Testing Approach
- Test on mobile and desktop viewports
- Verify authentication flows work correctly
- Test all interactive elements (buttons, toggles, search)
- Verify data updates reflect in real-time or on refresh
- Check for layout shifts and performance issues

### Performance Considerations
- Minimize bundle size
- Optimize images and assets
- Implement code splitting if needed
- Ensure ML algorithm runs asynchronously without blocking UI
- Consider implementing pagination for large data sets

---

## Implementation Priority

**Start with Phase 1 (Critical):**
1. Issue #1: Fix layout flash on initial load
2. Issue #4: Fix stats not updating after session logging
3. Issue #7: Update stats heading based on auth state

**Then Phase 2 (High Priority):**
4. Issue #3: Add "All" toggle and location display to best window
5. Issue #5: Make upcoming windows reactive to spot selection
6. Issue #6: Implement complete logged-out experience

**Finally Phase 3 (Enhancement):**
7. Issue #2: Add search functionality and Best Windows page

---

## Deliverables

Please provide:
1. Updated code for all affected components
2. Any new routes or pages created
3. Updated API calls or data fetching logic
4. Brief explanation of major changes made
5. Any potential issues or considerations to be aware of

---

## Questions to Consider During Implementation

- Where is the authentication state currently managed?
- What is the current routing structure?
- Which state management solution is being used?
- How are API calls currently structured?
- Is there a component library being used (Material-UI, Tailwind, etc.)?
- Where is the ML model prediction logic?
- How are surf spot selections currently stored?

Please ask for clarification on any of these points if needed before implementing.

---

## Success Criteria

- ✅ No visible layout shift on initial page load
- ✅ Search icon functional and opens search interface
- ✅ Best Windows button navigates to new page showing all spots
- ✅ "All" toggle works and shows best overall window
- ✅ Location displays correctly in recommendation card
- ✅ Stats update immediately after logging a session
- ✅ ML algorithm triggers on new session creation
- ✅ Upcoming windows filter based on spot selection
- ✅ Logged-out experience fully functional with Log In button
- ✅ Generic content displays for logged-out users
- ✅ Stats heading changes based on authentication state
- ✅ All features work on mobile and desktop
- ✅ No console errors or warnings
- ✅ Smooth user experience with proper loading states

---

## Additional Context

The app is built for surfers who want personalized surf forecasts based on their preferences and past session ratings. The ML model learns from user feedback to provide better recommendations over time. The user experience should be clean, fast, and mobile-first since many surfers will check conditions on their phones before heading to the beach.

Good luck with the implementation! 🏄‍♂️