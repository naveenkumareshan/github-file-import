

# Mess Attendance Page Refinements

## Changes

### 1. Replace big QR section with a compact "View QR" button
Remove the large QR card (lines 160-209) and the QR fullscreen dialog. Replace with a simple button in the header row (next to the title), matching the Operations Hub pattern:
- Small `View QR` outline button with Eye icon
- Opens a Dialog showing the branded QR with Download button
- Keeps QR generation logic, just removes the inline display

### 2. Remove teal backgrounds from page
- Remove `bg-teal-50/30`, `bg-teal-50/40`, `bg-teal-50/50` from all Cards
- Keep teal borders and text accents for the active meal card only
- Subscriber summary cards: plain `border` styling, no colored backgrounds
- Consistent with other admin pages (white card backgrounds)

### 3. Add date selector for meal attendance cards & subscriber stats
- Add a date picker input above the meal cards grid
- When a date is selected, the meal cards and subscriber summary show data for that date (not just today)
- Future dates show subscriber counts (from active subscriptions with matching meal types) as "expected" meals
- Today still shows live feed + auto-refresh; other dates show historical/projected data

### File
**EDIT**: `src/pages/admin/MessAttendance.tsx` — restructure header, remove QR card, clean backgrounds, add date filter for stats

