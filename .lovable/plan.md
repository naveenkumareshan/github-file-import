

## Compact Spacing for Booking Screen

Tighten vertical spacing across the entire SeatBookingForm and the BookSeat page wrapper without changing the layout structure.

### Changes

#### File: `src/components/seats/SeatBookingForm.tsx`

| Area | Current | New |
|------|---------|-----|
| Main content `space-y` | `space-y-5` (20px) | `space-y-3` (12px) |
| CardHeader padding | `py-3 px-4` | `py-2 px-3` |
| CardContent padding | `px-4 pt-3` | `px-3 pt-2` |
| Duration/date row padding | `p-3` | `p-2.5` |
| Label margin-bottom | `mb-2` | `mb-1` |
| End date badge top gap | inherited from space-y-5 | stays in flow with space-y-3 |
| Step 2 section | `space-y-4` | `space-y-2.5` |
| Summary card padding | `p-4 space-y-2.5` | `p-3 space-y-2` |
| Summary total `pt-1` | `pt-1` | `pt-0.5` |
| Separator before Step 2/3 | standard `<Separator />` | add `className="my-0"` (spacing handled by parent) |
| Rules collapsible | `mt-3` | `mt-2` |
| Terms checkbox | `mt-3` | `mt-2` |
| Pay button height | `h-11` | `h-10` |
| Advance payment card | `p-3 space-y-2` | `p-2.5 space-y-1.5` |
| Booking created section | `space-y-3` | `space-y-2` |

#### File: `src/pages/BookSeat.tsx`

| Area | Current | New |
|------|---------|-----|
| Info chips section padding | `px-3 pt-1 pb-1` | `px-3 pt-0.5 pb-0.5` |
| Details/Amenities section | `px-3 pt-2 pb-1`, inner `p-3` | `px-3 pt-1 pb-0.5`, inner `p-2.5` |
| Name/address section | `px-4 pt-3 pb-2` | `px-3 pt-2 pb-1` |
| Booking form wrapper | `px-3 pt-3` | `px-3 pt-2` |
| Chip gap | `gap-2` | `gap-1.5` |
| Amenity tag gap | `gap-1.5` | `gap-1` |

### Result

All gaps reduced to an 8-12-16px system. Line heights and font sizes stay the same. Structure and order untouched. The form will feel noticeably tighter and more app-like on mobile.

### Files Changed

| File | Change |
|------|--------|
| `src/components/seats/SeatBookingForm.tsx` | Reduce padding, margins, gaps, and space-y values throughout |
| `src/pages/BookSeat.tsx` | Tighten spacing in hero details, chips, amenities, and form wrapper |

