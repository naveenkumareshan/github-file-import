

# Partner Mobile Nav Improvements — 3 Fixes

## 1. Increase Bottom Nav Size
Current nav uses `min-h-[56px]`, icons `w-5 h-5`, text `text-[9px]`. Will increase to `min-h-[64px]`, icons `w-6 h-6`, text `text-[10px]` for better tap targets.

**File**: `src/components/partner/PartnerBottomNav.tsx`

## 2. Filter Nav Customizer Options by Property Type & Permissions
Currently `ALL_NAV_OPTIONS` shows everything (hostel, laundry, mess items) regardless of what the partner actually owns. Will pass `usePartnerPropertyTypes` and `usePartnerEmployeePermissions` data into the customizer and filter options accordingly.

**Approach**:
- Add a `category` field to each `NavItem` in `ALL_NAV_OPTIONS` (e.g., `'reading_rooms'`, `'hostels'`, `'laundry'`, `'mess'`, `'general'`)
- In `PartnerNavCustomizer`, accept property types and permissions as props, filter `ALL_NAV_OPTIONS` before rendering
- Alternatively (simpler): compute the filtered list in `PartnerMoreMenu` and pass it to `PartnerNavCustomizer`

**Files**: `src/hooks/usePartnerNavPreferences.ts` (add categories), `src/components/partner/PartnerNavCustomizer.tsx` (accept filtered list), `src/components/partner/PartnerMoreMenu.tsx` (compute filtered list and pass it)

## 3. Move "Customize Nav Bar" Button to Bottom
Move the customize button from the top of the More menu to just above the Sign Out button. Make it a small, subtle button instead of a full-width outlined bar.

**File**: `src/components/partner/PartnerMoreMenu.tsx`

