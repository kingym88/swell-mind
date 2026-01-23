# Settings Update Implementation Prompt

I need you to update the surf/wave app Settings screen to make the preference options interactive and apply these preferences throughout the entire app.

## Current Issues
The Wave Units, Wind Units, and Ideal Wave Size settings are currently static text displays and cannot be changed by the user.

## Required Changes

### 1. Wave Units Setting
Make this a selectable option with the following choices:
- Meters (m)
- Feet (ft)

When tapped, show a modal/picker to select between these units.

### 2. Wind Units Setting
Make this a selectable option with the following choices:
- Kilometers per hour (km/h)
- Miles per hour (mph)
- Knots (kn)
- Meters per second (m/s)e me

When tapped, show a modal/picker to select between these units.

### 3. Ideal Wave Size Setting
Make this a selectable range option with different increments based on the selected Wave Unit:

**When Wave Units = Meters:**
- 0-0.5m
- 0.5-1m
- 1-1.5m
- 1.5-2m
- 2-2.5m
- 2.5m+

**When Wave Units = Feet:**
- 0-1ft
- 1-2ft
- 2-3ft
- 3-4ft
- 4-5ft
- 5-6ft
- 6-7ft
- 7-8ft
- 8ft+

When tapped, show a modal/picker with the appropriate ranges based on the currently selected Wave Unit.

## Global Application of Settings

**Critical Requirement:** All unit preferences must be applied consistently throughout the entire app. This means:

- If a user selects "Feet" for Wave Units, ALL wave heights displayed anywhere in the app (home screen, sessions, spots, forecasts, etc.) must show in feet
- If a user selects "mph" for Wind Units, ALL wind speeds displayed anywhere in the app must show in mph
- Convert and display all measurements using the user's selected preferences

## Implementation Requirements

1. **State Management:** Store these preferences in app state/storage so they persist between sessions
2. **Real-time Updates:** When a user changes a preference, immediately update all screens showing that measurement type
3. **Conversion Functions:** Create utility functions to convert between units (meters ↔ feet, km/h ↔ mph ↔ knots ↔ m/s)
4. **UI Interaction:** Each preference row should be tappable and show a visual indicator (like a chevron/arrow) that it's interactive
5. **Selection Modal:** Create a clean modal or picker UI for selecting options
6. **Dynamic Ideal Wave Size:** Automatically update the Ideal Wave Size options when Wave Units are changed

## Technical Notes
- Maintain the current styling and layout of the Settings screen
- Keep the toggle switches for High Score Alerts and Daily Forecast unchanged
- Ensure the selected values are displayed on the right side of each preference row
- Consider using a context provider or similar pattern to make preferences available app-wide

## Testing Checklist
After implementation, verify:
- [ ] All three preference settings can be tapped and changed
- [ ] Selected values persist after closing and reopening the app
- [ ] Wave heights on all screens update when Wave Units change
- [ ] Wind speeds on all screens update when Wind Units change
- [ ] Ideal Wave Size options change appropriately when switching between meters and feet
- [ ] Conversions are mathematically accurate
- [ ] UI remains responsive and smooth when changing settings

Please implement these changes while maintaining the existing app functionality and design aesthetic.