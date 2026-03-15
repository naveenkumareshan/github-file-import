

## Add Module Toggle Settings for Student-Facing Features

### Problem
The admin settings "Navigation Menu" section only has 5 toggles (Cabin Booking, Hostels, Laundry, Room Sharing, About). Missing modules like **Mess/Food, Complaints, Attendance, Support** are not controllable. When a module is disabled, students should see it as "Launching Soon" instead of it being hidden entirely.

### What We'll Build

**1. Expand the `enabled_menus` settings in `SiteSettingsForm.tsx`**

Add these additional module toggles:
- **Mess / Food** (`mess`) — currently hardcoded as always visible
- **Complaints** (`complaints`)
- **Attendance** (`attendance`)
- **Support** (`support`)
- **Laundry Orders** (`laundryOrders`) — student laundry orders section

Group them visually:
- **Navigation Menus** — Cabin Booking, Hostels, Mess/Food, About
- **Student Features** — Laundry, Complaints, Attendance, Support, Room Sharing

**2. Update `Navigation.tsx`** — Use the `mess` toggle for the Food/Mess nav link (currently hardcoded `show: true`). When disabled, show the link with a "Launching Soon" badge instead of hiding it.

**3. Update `MobileBottomNav.tsx`** — Fetch `enabled_menus` from `site_settings`. For disabled modules, show the tab grayed out with a "Launching Soon" toast when tapped instead of navigating.

**4. Update student pages** — On disabled module pages (e.g., `/mess`, `/student/laundry-orders`), show a "Launching Soon" card with a message instead of the actual content, checking the `enabled_menus` config.

### Files to Modify
- `src/components/admin/SiteSettingsForm.tsx` — Add new toggle items, group them into sections
- `src/components/Navigation.tsx` — Show disabled items with "Launching Soon" badge, update `enabledMenus` interface
- `src/components/student/MobileBottomNav.tsx` — Fetch settings, show disabled tabs as grayed out with toast
- Create `src/components/student/LaunchingSoonGuard.tsx` — Reusable wrapper that shows "Launching Soon" screen for disabled modules
- `src/App.tsx` — Wrap relevant student routes with the guard component

### No Database Changes
The existing `site_settings` table with the `enabled_menus` key already stores a JSON object. We just add more keys to it — fully backward compatible.

