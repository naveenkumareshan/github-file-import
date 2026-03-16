

## Student Layout Audit — Issues Found & Fix Plan

### Issues Identified

**1. CabinSearch (Reading Rooms) — Desktop/Tablet Layout Too Narrow**
- `CabinSearch.tsx` line 194 header uses `max-w-lg mx-auto` (no `lg:max-w-5xl`)
- Line 259 results section also uses `max-w-lg mx-auto` (no `lg:max-w-5xl`)
- All other marketplace pages (Hostels, Mess, Laundry) correctly use `max-w-lg lg:max-w-5xl mx-auto`
- **Fix:** Add `lg:max-w-5xl` to both sections in CabinSearch

**2. Laundry Route Missing LaunchingSoonGuard**
- `/laundry` and `/laundry/:id` routes in App.tsx (lines 350-351) have NO `LaunchingSoonGuard` wrapping
- But the bottom nav tab for laundry is missing entirely — there's no "Laundry" tab in `MobileBottomNav.tsx`
- The Navigation.tsx desktop nav also doesn't include a Laundry link
- **Fix:** Add `LaunchingSoonGuard` with `moduleKey="laundry"` to both laundry routes

**3. Bottom Nav Missing Laundry Tab**
- `MobileBottomNav.tsx` has 5 tabs: Home, Study Rooms, Hostels, Mess, Profile
- No Laundry tab — users can only reach laundry via Quick Actions on home page
- This is likely intentional (5 tabs is max), but Profile tab could be replaced or a "More" menu added
- **Decision:** Keep current 5-tab layout (Home, Study Rooms, Hostels, Mess, Profile) — Laundry is accessible via Quick Actions and this is a standard mobile pattern

**4. Navigation.tsx Desktop Nav Missing Laundry Link**
- Desktop nav links: Home, Reading Rooms, Hostels, Food/Mess, About
- No Laundry link on desktop
- **Fix:** Add Laundry link to desktop navigation between Mess and About

**5. MobileBottomNav Icon/Label Size**
- Bottom nav icons are `w-5 h-5` and labels are `text-[9px]` — these are quite small
- Per the memory note about scaled-up navigation, the bottom nav should also be slightly larger
- **Fix:** Increase icons to `w-6 h-6`, labels to `text-[10px]`, and min-height to `60px`

### Files to Change

| File | Changes |
|------|---------|
| `src/pages/CabinSearch.tsx` | Add `lg:max-w-5xl` to header and results containers |
| `src/App.tsx` | Wrap `/laundry` and `/laundry/:id` routes with `LaunchingSoonGuard moduleKey="laundry"` |
| `src/components/Navigation.tsx` | Add Laundry nav link |
| `src/components/student/MobileBottomNav.tsx` | Increase icon/label sizes for better readability |

