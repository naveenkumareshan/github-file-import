

## Image-Based Click-to-Place Seat Mapping

### Concept
Add a new "Click to Place" mode to the existing floor plan designer. After uploading a background image (which visually shows seat locations), the admin switches to placement mode and simply clicks on each seat position in the image. Each click creates a seat at that spot. The admin can then assign seat number and price via a quick popup.

### How It Works

1. Admin uploads a floor plan image (existing feature -- already works)
2. Admin clicks a new **"Place Seats"** toggle button in the toolbar
3. Canvas cursor changes to a crosshair
4. Each click on the canvas creates a new seat at that exact position (saved to DB immediately)
5. A small popup appears after each click to let admin set seat number and price (with auto-incrementing defaults)
6. Seats render as numbered markers on top of the image
7. Admin can click existing seats to edit/delete them (existing feature)
8. Click "Place Seats" again to exit placement mode

No sections needed -- seats are placed directly on the canvas without requiring a section container. This is the simplest possible workflow.

### Changes

**File: `src/components/seats/FloorPlanDesigner.tsx`**

- Add `placementMode` boolean state
- Add "Place Seats" toggle button in toolbar (with MousePointerClick icon)
- When `placementMode` is true:
  - Canvas click creates a seat instead of panning
  - Cursor shows as crosshair
  - Show a small inline popover after placement with auto-filled seat number and default price (editable)
- New prop: `onPlaceSeat: (position: {x: number, y: number}, number: number, price: number) => void`
- Allow seats without a sectionId (free-placed seats render directly on canvas, not inside a section)
- Render free-placed seats (those with no sectionId) directly on the canvas at their absolute position

**File: `src/pages/SeatManagement.tsx`**

- Add `handlePlaceSeat(position, number, price)` handler that calls `adminSeatsService.createSeat()` and adds to local state
- Pass it as `onPlaceSeat` prop to FloorPlanDesigner
- No changes to existing section-based workflow -- both approaches coexist

### Technical Details

#### FloorPlanDesigner.tsx - New State and Logic

```text
New state:
- placementMode: boolean (false by default)
- nextSeatNumber: number (auto-incremented from max existing seat number)
- placementPrice: number (default 2000, persists between placements)

Toolbar addition:
[Place Seats] toggle button -- active state highlighted

Canvas click handler update:
- If placementMode && !dragging && !resizing:
  - Get canvas position from click
  - Call onPlaceSeat(position, nextSeatNumber, placementPrice)
  - Increment nextSeatNumber

Free-placed seat rendering:
- Filter seats where sectionId is undefined/null
- Render them as absolute-positioned buttons on the canvas (same style as section seats)
```

#### SeatManagement.tsx - New Handler

```text
handlePlaceSeat = async (position, number, price) => {
  const seatData = {
    number,
    floor: selectedFloor,
    cabinId,
    price,
    position,
    isAvailable: true,
    isHotSelling: false,
  };
  const res = await adminSeatsService.createSeat(seatData);
  if (res.success) {
    setSeats(prev => [...prev, res.data]);
    toast({ title: `Seat #${number} placed` });
  }
};
```

### No Database Changes Required
Seats already support being created without a sectionId. The existing `seats` table schema works as-is.

### Files Summary

| File | Action |
|---|---|
| `src/components/seats/FloorPlanDesigner.tsx` | Add placement mode toggle, crosshair cursor, click-to-place logic, free-placed seat rendering, price input in toolbar |
| `src/pages/SeatManagement.tsx` | Add `handlePlaceSeat` handler, pass as prop |

