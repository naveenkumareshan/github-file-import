

# Fix: Study Room Button & Search Not Working

## Issues Found

1. **Search not working**: The `/cabins` route renders `CabinSearch.tsx`, NOT `Cabins.tsx`. All our previous search changes were applied to the wrong file. `CabinSearch.tsx` already has a working search — it triggers on Enter key via `handleQuickSearch()`. The search input uses the `Input` component but requires pressing Enter to trigger. The issue is that typing doesn't auto-search (no debounce), user must press Enter.

2. **"Study Rooms" bottom nav not highlighted properly**: In `MobileBottomNav.tsx`, the Profile tab's `isActive` check (`pathname.startsWith('/student')`) matches ALL `/student/*` routes. But when on `/cabins`, the Study Rooms tab IS correctly highlighted. The actual issue is likely that the bottom nav "Study Rooms" button label/icon isn't visually distinct enough, or the sticky header in `CabinSearch.tsx` overlaps with the MobileAppLayout.

## Plan

### 1. `src/pages/CabinSearch.tsx` — Fix search to auto-trigger on typing (debounced)
- Add debounced search: when user types, auto-trigger `handleSearch` after 400ms delay (matching Hostels/Mess pattern)
- Keep Enter key support as well
- This makes the search bar behave consistently across all three marketplaces

### 2. `src/components/student/MobileBottomNav.tsx` — Fix Profile tab isActive overlap
- Change Profile tab `isActive` from `pathname.startsWith('/student')` to only match specific student dashboard/profile paths
- This prevents it from conflicting with other tabs when on routes like `/student/mess`

### Files Modified
| File | Change |
|------|--------|
| `src/pages/CabinSearch.tsx` | Add debounced auto-search on typing |
| `src/components/student/MobileBottomNav.tsx` | Fix Profile tab isActive to not overlap other tabs |

