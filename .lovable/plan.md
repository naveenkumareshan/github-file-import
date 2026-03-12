

# Fix Visibility Toggle Labels + Verify All Toggle Buttons

## Problem
The "Partner Visibility" toggle tooltip says "Hide from Partner" — but the actual purpose is to hide the property from **employees** so they cannot see it in seat/bed maps. The partner (owner) should always see their own properties.

## Changes

### 1. Fix Tooltip Labels in All 3 Components
Update tooltip text in `CabinItem.tsx`, `HostelItem.tsx`, `MessItem.tsx`:
- "Hide from Partner" → "Hide from Employees"
- "Show to Partner" → "Show to Employees"

Also update the badge label for clarity:
- "● Visible" → "● Emp Visible"
- "● Hidden" → "● Emp Hidden"

### 2. Fix Toast Messages in Management Pages
Update toast descriptions in `RoomManagement.tsx`, `HostelManagement.tsx`, `MessManagement.tsx`:
- "hidden/shown in partner views" → "hidden/shown from employees"

### Files Modified
- `src/components/admin/CabinItem.tsx` — tooltip + badge text
- `src/components/admin/HostelItem.tsx` — tooltip + badge text
- `src/components/admin/MessItem.tsx` — tooltip + badge text
- `src/pages/RoomManagement.tsx` — toast message
- `src/pages/hotelManager/HostelManagement.tsx` — toast message
- `src/pages/admin/MessManagement.tsx` — toast message (if applicable)

