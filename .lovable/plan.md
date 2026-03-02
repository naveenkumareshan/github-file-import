
# Add "View Food Menu" Button in Details & Amenities Section

## What This Does
Add a "View Food Menu" button inside the **Details & Amenities** card (alongside amenities) so users can quickly access the food menu from the top of the page -- not just from the food plan section further down.

## Changes

### `src/pages/HostelRoomDetails.tsx`

**In the Details & Amenities section (around line 566)**, after the amenities list and before the closing `</div>`, add a `FoodMenuModal` button that shows only when the hostel has food available (mandatory or optional):

- Condition: `hostel.food_policy_type === 'mandatory' || hostel.food_policy_type === 'optional' || hostel.food_enabled`
- Render a styled button wrapped in the existing `FoodMenuModal` component
- Button style: matches the amenity chip style but with a distinct food/menu icon (Utensils) and a clickable appearance

The existing `FoodMenuModal` in the food plan section (line ~863) stays as-is -- this adds a second entry point for convenience.

| File | Change |
|------|--------|
| `src/pages/HostelRoomDetails.tsx` | Add `FoodMenuModal` button inside Details & Amenities section, visible when food facility exists |
