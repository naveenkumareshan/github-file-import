

# Fix: Operations Hub — Show Only Relevant Property Tabs

## Problem
The CheckInTracker (and ComplaintTracker) always shows both "Reading Room" and "Hostel" toggle buttons, even for partners who only have one property type. A partner with only hostels still sees the Reading Room tab, and vice versa.

## Solution
Use the existing `usePartnerPropertyTypes` hook in both `CheckInTracker` and `ComplaintTracker` to conditionally render only the relevant module toggles. For admins (who see all properties), keep both tabs visible.

## Changes

### `src/components/admin/operations/CheckInTracker.tsx`
1. Import `usePartnerPropertyTypes` hook
2. Get `hasReadingRooms`, `hasHostels` from the hook
3. Check user role — if admin, show all tabs; if partner/employee, show only tabs matching their property types
4. Auto-select the first available module as default (e.g., if only hostels, default to `'hostel'`)
5. Hide the module toggle entirely if the partner has only one property type

### `src/components/admin/operations/ComplaintTracker.tsx`
1. The complaints query currently fetches ALL complaints without module filtering. For partners, complaints are already scoped by RLS (own properties only), so the complaint list is already filtered.
2. However, the complaint list doesn't show a module filter — it shows all complaints together. No module toggle needed here since complaints already show mixed results. No change needed unless we want to add a module filter — keeping it as-is since complaints are already properly scoped.

### `src/pages/admin/OperationsHub.tsx`
No changes needed — the hub just renders the two tab components.

## Summary
- Only `CheckInTracker.tsx` needs the property-type-aware module toggle
- Partners with only reading rooms see only the Reading Room view (no toggle)
- Partners with only hostels see only the Hostel view (no toggle)
- Partners with both see the toggle as before
- Admins always see both tabs

