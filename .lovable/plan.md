

## Compress Booking Table Row Height

Reduce vertical space across all booking table rows by tightening fonts, padding, badges, and text wrapping in both Reading Room and Hostel booking tables.

### Changes (2 files)

#### `src/pages/AdminBookings.tsx` (Reading Room)

1. **Student cell** (line 153-156): Reduce to `text-[11px]`, put name+email on one line with `whitespace-nowrap`, truncate email with `max-w-[180px] truncate inline-block align-bottom`
2. **Category badge** (line 157): Already `text-[10px]` -- add `leading-none` and keep `py-0` to flatten it further
3. **Room/Seat cell** (line 158-160): Add `whitespace-nowrap` to prevent text wrapping across multiple lines
4. **Row padding**: Change all `py-1.5` to `py-1` across every TableCell for tighter rows
5. **Amount grid** (line 168): Reduce `gap-y-0.5` to `gap-y-0`, keep `gap-x-4`

#### `src/pages/hotelManager/AdminHostelBookings.tsx` (Hostel)

Same set of changes:
1. **Student cell** (line 214-216): `text-[11px]`, `whitespace-nowrap`, truncated email
2. **Row padding**: All `py-1.5` to `py-1`
3. **Room/Bed cell** (line 219-221): Add `whitespace-nowrap`
4. **Amount grid** (line 228): `gap-y-0` instead of `gap-y-0.5`

### Expected Result
Row height drops from ~80px to ~40-44px, matching the premium SaaS density target. No content is lost -- just tighter spacing and prevented wrapping.

