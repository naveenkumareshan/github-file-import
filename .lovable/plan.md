

## Reorder Filters and Unify Label Styling

### Changes to `src/components/seats/SeatBookingForm.tsx`

#### 1. Move "Seat Type" before "Duration Type"
Currently the order is: Duration Type > Duration Count + Start Date > End Date badge > Time Slot > Seat Type.

New order: **Seat Type > Duration Type > Duration Count + Start Date > End Date badge > Time Slot**.

The Seat Type filter block (lines 712-744) will be cut from its current position and placed before the Duration Type section (before line 578). This lets the student pick AC/Non-AC first, then configure duration and slot.

#### 2. Consistent label styling
The "Duration Type" label uses `uppercase tracking-wide` while "Time Slot" and "Seat Type" use regular title case. All three labels will be unified to the same style -- title case with the same text size and weight (matching the reference screenshot):

- All filter labels: `text-xs font-medium text-muted-foreground` (no uppercase, no tracking-wide)
- "Duration Type" label changed from `uppercase tracking-wide` to match the others

This produces a clean, consistent look matching the reference image where labels read "Seat Type", "Duration Type", "Time Slot" in regular title case.

### File Modified
| File | Change |
|------|--------|
| `src/components/seats/SeatBookingForm.tsx` | Move Seat Type block above Duration Type; unify label casing to title case |

