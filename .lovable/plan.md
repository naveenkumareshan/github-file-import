

## Make Hostel and Study Room Listing Cards Consistent + Add Starting Price

### Problem
The listing cards on `/cabins` and `/hostels` have inconsistent layouts:
- **Study Rooms**: Shows category badge, price (₹900/mo), rating/New badge, and "Book" action
- **Hostels**: Shows gender badge, description text, NO price, and "View Rooms" action

The hostel cards are missing a starting price, and the bottom row shows different information.

### Changes

**1. `src/api/hostelService.ts` - Fetch min price with hostel listings**

Update `getAllHostels` query to also select related sharing options so we can compute a minimum price on the client side:
```
.select('*, states(name), cities(name), areas(name), hostel_rooms(hostel_sharing_options(price_monthly))')
```
This joins rooms and sharing options so each hostel object includes nested price data.

**2. `src/pages/Hostels.tsx` - Unify hostel cards to match study room card layout**

Restructure each hostel card's bottom row to match the study room pattern:
- Replace the description line with a **starting price** (computed as the minimum `price_monthly` from the nested sharing options): `₹X/mo`
- Show rating or "New" badge (using `hostel.average_rating` and `hostel.review_count`) -- same as study rooms
- Keep "View Rooms" action pill (analogous to "Book" on study rooms)

The updated bottom section of each card will look like:
```
[Star 4.2 (5)]  ₹3,000/mo          View Rooms
```
Instead of the current:
```
Premium men's paying gues...          View Rooms
```

### Files to Modify

| File | Change |
|------|--------|
| `src/api/hostelService.ts` | Add `hostel_rooms(hostel_sharing_options(price_monthly))` to the `getAllHostels` select query |
| `src/pages/Hostels.tsx` | Compute min price from nested data; replace description row with price + rating row matching study room cards |

### No Changes Needed
- Detail pages (`BookSeat.tsx` and `HostelRoomDetails.tsx`) are already consistent with each other -- both use the same hero, chips, and amenities pattern.
- Study room cards (`CabinsGrid.tsx`) are already the reference design and stay as-is.

