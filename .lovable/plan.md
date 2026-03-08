

# Add Floor Info to Booking Lists (Admin + Partner + Employee Views)

## Problem
Booking lists across admin and partner/employee views show Room and Seat but not the Floor number, making it difficult to locate students in multi-floor reading rooms.

## Scope of Changes

The `seats` table has a `floor` column. We need to include it in all queries that fetch seat info and display it alongside the seat number.

### 1. Service Layer — Add `floor` to seat select queries

**`src/api/adminBookingsService.ts`**
- Line 27: Change `seats:seat_id(number, category)` → `seats:seat_id(number, category, floor)`
- Line 121: Include `floor` in seatId mapping: `{ number: seat.number, floor: seat.floor }`
- Line 171: Change `seats:seat_id(number, price)` → `seats:seat_id(number, price, floor)`
- Line 490: Change `seats:seat_id(number)` → `seats:seat_id(number, floor)`

**`src/api/bookingsService.ts`** (line 110): Add `floor` to seat select

**`src/components/admin/operations/CheckInTracker.tsx`** (line 61): Add `floor` to seat select  
**`src/components/admin/operations/ReportedTodaySection.tsx`** (line 26): Add `floor` to seat select

### 2. UI — Display floor alongside seat number

Format: `Floor X · Seat #Y` (show floor only when > 0 or present)

**`src/components/admin/AdminBookingsList.tsx`**
- Line 58-60: Add `floor?: number` to seatId type
- Line 483: Show `Floor X · Seat #Y`
- Line 239: Include floor in CSV export

**`src/components/booking/BookingTransactionView.tsx`** (line 135): Show floor in seat display

**`src/components/admin/operations/CheckInTracker.tsx`** (line 284): Show floor in tracker

**`src/components/admin/operations/CheckInViewDetailsDialog.tsx`** (line 67): Show floor in detail view

**`src/components/profile/ProfileManagement.tsx`** (line 531): Show floor for student profile bookings

**`src/components/profile/ComplaintsPage.tsx`** (line 64): Show floor in complaint labels

**`src/pages/admin/DueManagement.tsx`** (line 304): Show floor in due management

### 3. Display Helper

Create a small utility or inline pattern:
```typescript
const seatDisplay = (seat: any) => {
  const floor = seat?.floor ? `Floor ${seat.floor} · ` : '';
  return `${floor}Seat #${seat?.number || 'N/A'}`;
};
```

### Files to modify
- `src/api/adminBookingsService.ts` — add floor to select queries + mapping
- `src/api/bookingsService.ts` — add floor to select query
- `src/components/admin/AdminBookingsList.tsx` — type + display + CSV
- `src/components/booking/BookingTransactionView.tsx` — display
- `src/components/admin/operations/CheckInTracker.tsx` — query + display
- `src/components/admin/operations/ReportedTodaySection.tsx` — query
- `src/components/admin/operations/CheckInViewDetailsDialog.tsx` — display
- `src/components/profile/ProfileManagement.tsx` — display
- `src/components/profile/ComplaintsPage.tsx` — display
- `src/pages/admin/DueManagement.tsx` — display

