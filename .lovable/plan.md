

## Sidebar Menu Restructure

### Changes

**1. Remove "Finance" menu group entirely** (lines 102-116)

**2. Add "Key Deposits" as a sub-item inside the Bookings menu** — it will appear alongside "All Transactions", "Transfer Seat", and "Manual Booking".

**3. Reorder menu items so Bookings and Users appear right after Dashboard:**

Current order:
```
Dashboard
(Seat Map)
Finance        <-- remove
Hostels
Reading Rooms
Bookings
Users
...
```

New order:
```
Dashboard
(Seat Map)
Bookings       <-- moved up, now includes Key Deposits
Users           <-- moved up
Hostels
Reading Rooms
...
```

### Technical Details

In `src/components/admin/AdminSidebar.tsx`:

- Remove the Finance `menuItems.push` block (lines 102-116)
- Move the Bookings block (lines 168-207) to execute right after the Seat Map block (after line 100), and add a "Key Deposits" sub-item with url `/admin/deposits-restrictions` and `Wallet` icon
- Move the Users block (lines 209-226) to execute right after the Bookings block
- No route, page, or logic changes — only sidebar ordering and menu structure

