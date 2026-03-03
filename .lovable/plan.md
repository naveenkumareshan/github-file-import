
# Clean URLs: Replace UUIDs with Serial Numbers in Admin/Partner Hostel and Cabin Pages

## Problem
URLs like `/admin/hostels/a1b2c3d4-3333-3333-3333-333333333333/beds` show raw UUIDs, which look messy and unprofessional. This affects:
- Hostel bed management pages (admin + partner)
- Hostel room view pages (admin + partner)
- Seat management pages (admin + partner)

## Solution
Apply the same dual-lookup pattern (serial_number first, UUID fallback) already used in student-facing pages.

## Changes

### 1. Navigation Links -- Use serial_number instead of UUID

| File | Current | Updated |
|------|---------|---------|
| `src/components/admin/HostelItem.tsx` | `navigate(.../hostels/${hostel.id}/beds)` | `navigate(.../hostels/${hostel.serial_number \|\| hostel.id}/beds)` |
| `src/pages/hotelManager/HostelManagement.tsx` | `navigate(.../hostels/${hostelId}/rooms)` | `navigate(.../hostels/${hostel.serial_number \|\| hostelId}/rooms)` |
| `src/pages/RoomManagement.tsx` | `navigate(.../cabins/${cabinId}/seats)` | `navigate(.../cabins/${cabin.serial_number \|\| cabinId}/seats)` |
| `src/components/admin/SeatManagementLink.tsx` | Uses raw `cabinId` prop | Accept + use `serialNumber` prop with fallback |

### 2. Detail Pages -- Add dual-lookup resolution

**`src/pages/admin/HostelBedManagementPage.tsx`**
- In `fetchAll()`, replace `supabase.from('hostels').select('*').eq('id', hostelId).single()` with a dual-lookup: try `serial_number` first via `maybeSingle()`, fall back to `id`
- Similarly update `hostelBedCategoryService`, `hostelFloorService`, `hostelSharingTypeService` calls to use the resolved UUID
- Update room queries to use resolved ID

**`src/pages/HostelRoomView.tsx`**
- In `fetchHostelAndRooms()`, add the same `isUUID` check pattern already used in `HostelRoomDetails.tsx`
- If not UUID, resolve via `hostelService.getHostelBySerialNumber()`, then use the resolved ID for room queries

**`src/pages/SeatManagement.tsx`**
- In `fetchCabinData()`, add dual-lookup: try `serial_number` first, fall back to UUID
- Use resolved UUID for all subsequent seat queries

### 3. Helper utility
Create a small reusable `isUUID` utility (already duplicated in 3 files) in `src/utils/idUtils.ts`:

```text
isUUID(s: string) => /^[0-9a-f]{8}-/.test(s)
```

Then replace the inline copies in `HostelRooms.tsx`, `HostelRoomDetails.tsx`, `BookSeat.tsx`, and the new files.

## Technical Details

The resolution pattern (same as already used in student pages):

```text
1. Check if param isUUID
2. If UUID -> query by .eq('id', param)
3. If not UUID -> query by .eq('serial_number', param)
4. Use resolved UUID for all child queries (rooms, beds, seats, etc.)
```

Routes in `App.tsx` need NO changes -- `:hostelId` and `:cabinId` params accept any string.

## Files to Create

| File | Purpose |
|------|---------|
| `src/utils/idUtils.ts` | Shared `isUUID()` helper |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/admin/HostelBedManagementPage.tsx` | Dual-lookup hostel by serial_number/UUID |
| `src/pages/HostelRoomView.tsx` | Dual-lookup hostel by serial_number/UUID |
| `src/pages/SeatManagement.tsx` | Dual-lookup cabin by serial_number/UUID |
| `src/components/admin/HostelItem.tsx` | Use `hostel.serial_number` in nav link |
| `src/pages/hotelManager/HostelManagement.tsx` | Use `hostel.serial_number` in nav link |
| `src/pages/RoomManagement.tsx` | Use `cabin.serial_number` in nav link |
| `src/components/admin/SeatManagementLink.tsx` | Accept serialNumber prop |
| `src/pages/HostelRooms.tsx` | Use shared `isUUID` from utils |
| `src/pages/HostelRoomDetails.tsx` | Use shared `isUUID` from utils |
| `src/pages/BookSeat.tsx` | Use shared `isUUID` from utils |
