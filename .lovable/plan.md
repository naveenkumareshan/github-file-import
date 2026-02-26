

## Move Seat Map and Due Management into Reading Rooms Section

### Current Structure
```text
- Dashboard
- Seat Map          (standalone)
- Due Management    (standalone)
- Reading Rooms
  - Bookings
  - Receipts
  - Key Deposits
  - Manage Rooms
  - Reviews
```

### New Structure
```text
- Dashboard
- Reading Rooms
  - Seat Map           (moved here, first)
  - Due Management     (moved here, second)
  - Bookings
  - Receipts
  - Key Deposits
  - Manage Rooms
  - Reviews
```

### Changes

**File: `src/components/admin/AdminSidebar.tsx`**

1. Remove the two standalone menu items for "Seat Map" (lines 92-100) and "Due Management" (lines 102-110) that are pushed before the Reading Rooms section
2. Inside the Reading Rooms block (starting line 112), insert "Seat Map" and "Due Management" as the first two sub-items of `readingRoomSubItems`, before "Bookings"
3. Keep the same permissions, icons, URLs, and role checks -- just nest them under Reading Rooms

