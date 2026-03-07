

# Plan: Redesign Admin Settings — Persist All Settings to Database

## Problem
Currently, site settings (name, logo, description, menu toggles) are stored in **localStorage**, meaning changes only apply to the current browser. They don't reflect for other users or devices. The UI also needs to match the high-density SaaS-style admin panel pattern.

## Approach
1. **Move all site settings to the `site_settings` database table** using existing key-value structure. Keys: `site_name`, `site_description`, `site_logo`, `enabled_menus`, `admin_whatsapp`.
2. **Redesign `SiteSettingsForm.tsx`** with compact, high-density SaaS-style layout (text-xs/text-[11px], reduced padding) matching admin panel standards. Organize into logical sections: Branding, Navigation, Support.
3. **Update `Navigation.tsx`** to fetch settings from the database instead of localStorage, with a fallback cache.
4. **Redesign `AdminSettingsNew.tsx`** page with the compact admin UI pattern.

## Database Changes
**No schema changes needed.** The `site_settings` table already supports key-value storage. We'll insert/upsert these keys:
- `site_name` → `{ value: "Inhalestays" }`
- `site_description` → `{ value: "Reading Cabin Booking" }`
- `site_logo` → `{ url: "/uploads/..." }`
- `enabled_menus` → `{ bookings: true, hostel: true, laundry: true, roomSharing: true, about: true }`
- `admin_whatsapp` (already exists)

## Frontend Changes

### 1. `src/components/admin/SiteSettingsForm.tsx` — Full rewrite
- Load all settings from `site_settings` table on mount (batch fetch all keys).
- Save each setting to `site_settings` via upsert on submit.
- Remove all localStorage usage.
- Compact SaaS-style UI: smaller fonts, tighter spacing, grouped sections (Branding card, Navigation Toggles card, Support card).
- Logo preview with the current logo URL.
- Fix typo "Cabing Booking" → "Cabin Booking".

### 2. `src/components/Navigation.tsx` — Read from DB
- Replace `localStorage.getItem('siteSettings')` with a database fetch from `site_settings`.
- Fetch `site_name`, `site_logo`, `enabled_menus` keys.
- Cache in sessionStorage for performance, refresh on page load.

### 3. `src/pages/admin/AdminSettingsNew.tsx` — Compact redesign
- Apply compact admin panel styling to the page header and tabs.
- Use `text-xs` / reduced padding pattern on the tab triggers.
- Keep the 5-tab structure (Site, Payment, Email, SMS, Platform).

### 4. Remove `src/pages/AdminSettings.tsx`
- This old page is unused (route points to `AdminSettingsNew`). Can be cleaned up.

## Summary

| File | Change |
|------|--------|
| `src/components/admin/SiteSettingsForm.tsx` | Full rewrite: DB-backed, compact UI, grouped sections |
| `src/components/Navigation.tsx` | Fetch settings from DB instead of localStorage |
| `src/pages/admin/AdminSettingsNew.tsx` | Compact admin UI styling |

