

## Maximize Seat Map Area and Show Full Layout Image

### Problems

1. **Seat map area too small**: The `DateBasedSeatMap` wraps the `FloorPlanViewer` inside a `Card > CardHeader ("Seat Map") > CardContent` which adds padding, a title bar, and border -- all wasting precious screen space on mobile. The zoom controls also sit in a separate row above the canvas, further shrinking the seat area.

2. **Layout image not fully visible**: The background image has `opacity: 30%` (layoutImageOpacity defaults to 30), making it nearly invisible. Students need to clearly see the admin-uploaded floor plan at full opacity so they understand the room layout.

3. **Side padding wasting space**: The `CardContent` has default padding (`p-6`), plus the parent `SeatBookingForm` and `BookSeat` pages add their own `px-3` padding. This compounds to ~40px of dead space on each side.

---

### Changes

#### 1. `DateBasedSeatMap.tsx` -- Remove Card wrapper for student view

When `exportcsv={false}` (student context), remove the `Card > CardHeader > CardContent` wrapper around the FloorPlanViewer. Render the FloorPlanViewer directly with no card padding or "Seat Map" title. The floor selector buttons also get tighter spacing.

Keep the Card wrapper for `exportcsv={true}` (admin context).

#### 2. `FloorPlanViewer.tsx` -- Compact zoom controls, maximize canvas

- Move zoom controls **inside** the canvas as a floating overlay (absolute positioned, top-right, small transparent buttons) instead of a separate row above
- Remove `space-y-3` wrapper spacing
- Increase canvas height from `h-[60vh]` to `h-[70vh]` 
- Remove border and rounded corners on the canvas for edge-to-edge feel on mobile
- Set `layoutImageOpacity` to `100` for student view (full visibility of the floor plan image)

#### 3. `DateBasedSeatMap.tsx` -- Pass full opacity for student view

When `exportcsv={false}`, pass `layoutImageOpacity={100}` to `FloorPlanViewer` so the admin-uploaded background image shows at full opacity.

#### 4. `SeatBookingForm.tsx` -- Remove extra label

The "Select Your Seat" label with `text-lg font-semibold` and `mb-4` margin takes space. Make it smaller or remove it since the seat map is self-explanatory.

---

### Technical Details

| File | Change |
|---|---|
| `src/components/seats/FloorPlanViewer.tsx` | Move zoom buttons inside canvas as floating overlay (absolute top-right, z-30, small semi-transparent buttons). Remove outer `space-y-3`. Canvas: remove border, increase to `h-[70vh]`, remove rounded-lg for student view. Legend: make more compact inline. |
| `src/components/seats/DateBasedSeatMap.tsx` | When `exportcsv={false}`: remove Card/CardHeader/CardContent wrapper, render FloorPlanViewer directly. Pass `layoutImageOpacity={100}`. Compact floor selector. |
| `src/components/seats/SeatBookingForm.tsx` | Reduce "Select Your Seat" label size from `text-lg` to `text-sm`, reduce margin. |

**Zoom controls (floating overlay inside canvas):**
```text
+----------------------------------+
|                      [- 75% + F] |  <-- small floating buttons
|                                  |
|  (seats on full layout image)    |
|                                  |
|                        +------+  |
|                        | mini |  |
|                        +------+  |
+----------------------------------+
```

