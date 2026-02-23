

## Seat Management Enhancements

### 1. Draggable Seats on Canvas
Make placed seats draggable so admins can reposition them by clicking and dragging. When not in placement mode, clicking and dragging a seat will move it to a new position and save the updated coordinates.

**In `FloorPlanDesigner.tsx`:**
- Add `draggingSeatId` state and drag offset tracking
- On seat mousedown (when not in placement mode): start dragging, track offset
- On mousemove: update the dragged seat's position in real-time
- On mouseup: finalize position, call a new `onSeatMove` callback to persist
- Prevent panning while dragging a seat

### 2. Edit Category on Existing Seat Click
Replace the static "Category: Non-AC" text in the seat details panel with a dropdown/radio selector so admins can change the category of an already-placed seat.

**In `SeatManagement.tsx`:**
- Replace the plain text category display with a Select dropdown populated from the categories list
- Add a `handleCategoryUpdate` function that calls `adminSeatsService.updateSeat` with the new category
- When category changes, also update the seat's price to match the category's default price

### 3. Category Management (Add/Rename Categories with Pricing)
Create a new `seat_categories` database table so admins can define custom categories (e.g., "AC", "Non-AC", "Premium") with a default price per category. This replaces the hardcoded `SEAT_CATEGORIES` array.

**Database migration:**
- Create `seat_categories` table with columns: `id`, `cabin_id`, `name`, `price`, `created_at`
- Seed default categories (AC, Non-AC, Premium, Economy) per cabin or globally

**New service: `src/api/seatCategoryService.ts`**
- CRUD operations for seat categories scoped by cabin

**In `SeatManagement.tsx`:**
- Add a "Manage Categories" section/dialog where admins can:
  - Add a new category with a name and default price
  - Edit existing category name or price
  - Delete a category
- Fetch categories on load and pass to FloorPlanDesigner
- When a category's price is updated, optionally bulk-update all seats of that category

**In `FloorPlanDesigner.tsx`:**
- Accept `categories` as a prop instead of using hardcoded `SEAT_CATEGORIES`
- The placement dialog uses dynamic categories from the prop
- Price auto-fills from the selected category's default price

### 4. Price Controlled by Category
When placing or editing a seat, the price auto-fills based on the selected category's configured price. Admins can still override per-seat, but the category price is the default.

### 5. Remove Image Details Display
Remove the "Position: X: ..., Y: ..." column from the seat details panel (the screenshot shows it -- it's unnecessary clutter).

**In `SeatManagement.tsx`:**
- Remove the Position column from the selected seat details grid
- Change grid from `grid-cols-4` to `grid-cols-3`

---

### Technical Summary

| File | Changes |
|---|---|
| Database migration | Create `seat_categories` table (id, cabin_id, name, price, created_at) with default rows |
| `src/api/seatCategoryService.ts` | New file -- CRUD for seat categories |
| `src/components/seats/FloorPlanDesigner.tsx` | Add drag-to-move seats, accept dynamic categories prop, remove hardcoded SEAT_CATEGORIES |
| `src/pages/SeatManagement.tsx` | Add category management UI, editable category on seat details, drag handler, remove position display |
| `src/api/adminSeatsService.ts` | No changes needed (already supports category) |

### Database Schema

```text
seat_categories
  id          uuid  PK  default gen_random_uuid()
  cabin_id    uuid  FK -> cabins(id)
  name        text  NOT NULL
  price       numeric NOT NULL default 0
  created_at  timestamptz default now()
```
