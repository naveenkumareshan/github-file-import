

# Fix: Hostel Bed Management — Serial Number vs UUID

## Root Cause

The URL parameter `hostelId` contains a serial number (e.g., `IS-INSH-2026-00004`). The `fetchAll` function correctly resolves this to a UUID via a database lookup, but stores it only in a **local variable** `resolvedId`. All other handler functions (`handleAddCategory`, `handleAddFloor`, `handleAddSharingType`, `handleAddRoom`, etc.) pass the raw `hostelId` (serial number) directly to service calls that expect a UUID, causing the `"invalid input syntax for type uuid"` error.

## Fix

Store the resolved UUID in component state (e.g., `resolvedHostelId`) and use it everywhere instead of `hostelId`.

| File | Change |
|------|--------|
| `src/pages/admin/HostelBedManagementPage.tsx` | Add `resolvedHostelId` state. Set it in `fetchAll` after resolution. Replace all service calls that use `hostelId` with `resolvedHostelId`. |

### Specific locations to update (all in `HostelBedManagementPage.tsx`):
- **Line ~39**: Add `const [resolvedHostelId, setResolvedHostelId] = useState<string>('')`
- **Line ~142**: After resolving, call `setResolvedHostelId(resolvedId)`
- **Line ~520-523**: `handleAddCategory` — use `resolvedHostelId` instead of `hostelId`
- **Line ~527**: category refresh — use `resolvedHostelId`
- **Line ~557-565**: `handleAddFloor` — use `resolvedHostelId`
- **Line ~572-580**: `handleAddSharingType` — use `resolvedHostelId`
- **Line ~603-604**: sharing type refresh — use `resolvedHostelId`
- **Line ~615-616**: `handleAddRoom` — use `resolvedHostelId`
- Any other places that pass `hostelId` to database/service calls

This is a straightforward find-and-replace of `hostelId` → `resolvedHostelId` in all service/database calls within the file, keeping `hostelId` only for the initial resolution logic and navigation.

