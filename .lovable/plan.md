

## Fix: Amount Column Overlapping Text in Booking Tables

### Problem
The 2x2 grid layout in the Amount column has insufficient spacing (`gap-x-3`), causing Seat/Locker and Paid/Due values to visually overlap, as shown in the screenshot.

### Solution
Increase horizontal gap and add minimum width to each column so values don't collide.

### Changes

#### 1. `src/pages/AdminBookings.tsx` (line 168)
- Change `gap-x-3` to `gap-x-4` for more horizontal space
- Add `min-w-[140px]` on the grid container to ensure enough room
- Make each grid item `whitespace-nowrap` to prevent wrapping mid-value

#### 2. `src/pages/hotelManager/AdminHostelBookings.tsx` (line 228)
- Same spacing fix: `gap-x-3` to `gap-x-4`, add `min-w-[140px]`, `whitespace-nowrap` on items

### Visual Result
```text
Before (overlapping):     After (spaced):
Seat: ₹2,000Locker: 300   Seat: ₹2,000    Locker: ₹300
Paid: ₹2,300Due: ₹0        Paid: ₹2,300    Due: ₹0
```

### Files modified: 2
- `src/pages/AdminBookings.tsx`
- `src/pages/hotelManager/AdminHostelBookings.tsx`

