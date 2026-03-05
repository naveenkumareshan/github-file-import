

# Fix: Hostel Bed Map — Booked bed colors not visible

## Investigation Summary

After thorough code review, the booking detection logic is correct — the query fetches active bookings, maps them by `bed_id`, and sets `dateStatus` to `'booked'` or `'expiring_soon'` when a matching booking exists.

The actual problem is that the color values used are extremely subtle pastel tints (`bg-red-50`, `bg-emerald-50`, `bg-amber-50`) which are nearly indistinguishable from each other and from the white background, especially on typical screens. The reading room seat map uses much more vivid colors (`bg-[#d4f7c4]`, `bg-[#D3E4FD]`) which are clearly distinguishable.

## Fix in `src/pages/admin/HostelBedMap.tsx`

Update the `statusColors` function (~line 868) to use stronger, more distinguishable colors:

| Status | Current (too subtle) | Proposed (vivid) |
|--------|---------------------|-------------------|
| available | `bg-emerald-50 border-emerald-400` | `bg-emerald-100 border-emerald-500` |
| booked | `bg-red-50 border-red-400` | `bg-red-100 border-red-500` |
| expiring_soon | `bg-amber-50 border-amber-400` | `bg-amber-100 border-amber-500` |
| blocked | `bg-muted border-muted-foreground/30` | (keep as-is) |

Also update the legend color indicators (~line 1029) to match the new stronger colors:
- Available: `bg-emerald-400` → `bg-emerald-500`
- Booked: `bg-red-400` → `bg-red-500`
- Expiring: `bg-amber-400` → `bg-amber-500`

Single file change: `src/pages/admin/HostelBedMap.tsx`

