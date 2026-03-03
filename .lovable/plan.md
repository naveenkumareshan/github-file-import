

# Differentiate Reading Room and Hostel Color Themes

## Problem
Both the Reading Room (BookSeat + SeatBookingForm) and Hostel (HostelRoomDetails) booking pages use identical `bg-primary` (deep blue) for all interactive elements -- step numbers, active pills, duration toggles, badges, and end-date chips. This creates a monotone blue experience that doesn't leverage the full brand palette (blue, green, teal) established on the public homepage, and makes the two product types visually indistinguishable.

## Solution
Assign each product type its own color identity from the brand palette while keeping them harmonious:

- **Reading Rooms**: Keep `primary` (deep blue) as the dominant color -- this is the core product
- **Hostels**: Use `secondary` (green) as the dominant accent -- differentiates hostels visually

This way, when a student navigates from a Reading Room booking to a Hostel booking, the color shift signals they're in a different product context, making the experience feel more polished and premium.

## Changes

### 1. `src/pages/HostelRoomDetails.tsx` -- Hostel Booking Page
Switch all `bg-primary` interactive accents to the green/secondary palette:
- **Step number circles**: `bg-primary` to `bg-secondary` (green circles instead of blue)
- **Active filter pills** (sharing type, category): `bg-primary text-primary-foreground border-primary` to `bg-secondary text-secondary-foreground border-secondary`
- **Duration toggle active**: `bg-primary text-primary-foreground` to `bg-secondary text-secondary-foreground`
- **View toggle (grid/layout) active**: same change to secondary
- **End date badge**: `bg-primary/10 text-primary` to `bg-secondary/10 text-secondary`
- **Amenity checkmarks**: `text-primary` to `text-secondary`
- **Food menu button**: `bg-primary/10 text-primary border-primary/20` to `bg-secondary/10 text-secondary border-secondary/20`
- **Review section accents**: primary references to secondary
- Keep info chips (emerald for price, blue for rooms, amber for deposit, pink/blue for gender) as they are -- these are semantic and already work well

### 2. `src/pages/BookSeat.tsx` -- Reading Room Detail Page
Already uses `bg-primary` throughout -- **no changes needed**. Blue is the correct identity for Reading Rooms.

### 3. `src/components/seats/SeatBookingForm.tsx` -- Reading Room Booking Form
Already uses `bg-primary` throughout -- **no changes needed**. Blue is correct here.

### 4. `src/pages/Cabins.tsx` -- Reading Rooms List
Already uses `bg-primary` for active filter pills -- **no changes needed**.

### 5. `src/pages/Hostels.tsx` -- Hostels List
Switch active filter pills and gender badges to secondary green to match the hostel identity:
- Active filter pill: `bg-primary text-primary-foreground border-primary` to `bg-secondary text-secondary-foreground border-secondary`
- Gender badge on cards: `bg-primary text-primary-foreground` to `bg-secondary text-secondary-foreground`

## Summary

| File | Change |
|------|--------|
| `src/pages/HostelRoomDetails.tsx` | Replace ~15 instances of `bg-primary` interactive accents with `bg-secondary` equivalents |
| `src/pages/Hostels.tsx` | Replace active filter pill and gender badge colors to secondary |
| `src/pages/BookSeat.tsx` | No changes -- blue is correct |
| `src/components/seats/SeatBookingForm.tsx` | No changes -- blue is correct |
| `src/pages/Cabins.tsx` | No changes -- blue is correct |

This creates a clear visual language: **Blue = Study Rooms**, **Green = Hostels**, while both still feel part of the same brand family.
