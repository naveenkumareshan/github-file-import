

## Replace UUID URLs with Clean Serial Numbers

Currently, student-facing pages show ugly UUIDs in the URL bar (e.g., `/book-seat/5de17f48-a577-4aeb-bd5e-316be04dcc95`). This plan replaces them with the existing `serial_number` field (e.g., `/book-seat/IS-ROOM-2026-00004`).

### Affected Student-Facing Routes

| Current URL | New URL |
|---|---|
| `/book-seat/5de17f48-...` | `/book-seat/IS-ROOM-2026-00004` |
| `/hostels/a1b2c3d4-...` | `/hostels/IS-INSH-2026-00001` |
| `/hostels/:id/rooms` | `/hostels/IS-INSH-2026-00001/rooms` |
| `/book-confirmation/:bookingId` | (kept as UUID - internal reference) |
| `/booking-confirmation/:bookingId` | (kept as UUID - internal reference) |

Booking confirmations will keep UUIDs since those are one-time pages and the IDs are not user-meaningful.

---

### Changes

**1. API: Add lookup-by-serial-number methods**

- **`src/api/cabinsService.ts`** -- Add `getCabinBySerialNumber(serialNumber)` that queries `cabins` table with `.eq('serial_number', serialNumber)`.
- **`src/api/hostelService.ts`** -- Add `getHostelBySerialNumber(serialNumber)` that queries `hostels` table with `.eq('serial_number', serialNumber)`.

**2. Navigation: Use serial_number instead of UUID when linking**

Update all student-facing navigation to pass `serial_number` instead of `id`:

- **`src/components/CabinCard.tsx`** -- Change `Link to={/book-seat/${cabin._id}}` to use `cabin.serial_number || cabin._id`
- **`src/components/search/CabinSearchResults.tsx`** -- Same change for cabin links
- **`src/components/search/CabinMapView.tsx`** -- Update `navigate(/book-seat/...)` calls
- **`src/pages/Hostels.tsx`** -- Change `navigate(/hostels/${hostel.id})` to use `hostel.serial_number || hostel.id`

**3. Detail pages: Resolve serial_number to data**

- **`src/pages/BookSeat.tsx`** -- Update `fetchCabinDetails` to first try `getCabinBySerialNumber(cabinId)`, falling back to `getCabinById(cabinId)` if it looks like a UUID (for backward compatibility).
- **`src/pages/HostelRoomDetails.tsx`** -- Same pattern: try serial number lookup first, fall back to UUID.
- **`src/pages/HostelRooms.tsx`** -- Same pattern for hostel rooms page.

**4. Downstream navigation within detail pages**

Some detail pages navigate to sub-pages using the ID. These will be updated to pass along the serial_number:
- **`src/pages/HostelRooms.tsx`** -- `handleBookRoom` uses `roomId` which comes from the rooms API (these are room-level UUIDs, not hostel-level, and don't have serial numbers -- these stay as UUIDs since they're internal references).

### Backward Compatibility

The detail pages will detect whether the URL parameter is a UUID or serial number:
- If it matches UUID format (`/^[0-9a-f]{8}-/`), use the existing `getById` method
- Otherwise, use the new `getBySerialNumber` method

This ensures any bookmarked or shared old-format links still work.

### Files to Modify

| File | Change |
|------|--------|
| `src/api/cabinsService.ts` | Add `getCabinBySerialNumber` method |
| `src/api/hostelService.ts` | Add `getHostelBySerialNumber` method |
| `src/components/CabinCard.tsx` | Use serial_number in link |
| `src/components/search/CabinSearchResults.tsx` | Use serial_number in link |
| `src/components/search/CabinMapView.tsx` | Use serial_number in navigation |
| `src/pages/Hostels.tsx` | Use serial_number in navigation |
| `src/pages/BookSeat.tsx` | Resolve serial_number to cabin data |
| `src/pages/HostelRoomDetails.tsx` | Resolve serial_number to hostel data |
| `src/pages/HostelRooms.tsx` | Resolve serial_number to hostel data |

