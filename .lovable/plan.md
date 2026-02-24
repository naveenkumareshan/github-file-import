

## Fix Scroll Zoom and Add Minimap to Seat Map Viewer

### Problems

1. **Scroll-to-zoom hijacks page scrolling**: The `onWheel` handler on the canvas intercepts normal page scrolling and zooms in/out instead. Students scrolling up/down on their phone accidentally zoom the seat map.

2. **No spatial awareness**: When zoomed in, students have no idea where they are in the overall layout. They need a small minimap (like in Google Maps or design tools) showing the full layout with a highlighted rectangle indicating the current viewport position.

### Changes

**File: `src/components/seats/FloorPlanViewer.tsx`**

#### 1. Remove scroll-to-zoom
- Delete the `handleWheel` function and remove `onWheel={handleWheel}` from the canvas div
- Keep the manual zoom buttons (+/-/fit) for intentional zoom control

#### 2. Add a Minimap overlay in the bottom-right corner of the canvas
- A small fixed-size box (e.g. 120x90px) with a semi-transparent background
- Renders all seats as tiny dots (2-3px) scaled to fit the minimap
- Draws a blue rectangle showing the currently visible viewport area
- The viewport rectangle updates as the user pans and zooms
- Clicking on the minimap jumps the viewport to that area

**Minimap calculation logic:**
```text
minimapScale = min(minimapWidth / roomWidth, minimapHeight / roomHeight)

Viewport rectangle:
  - x = (-pan.x / zoom) * minimapScale
  - y = (-pan.y / zoom) * minimapScale
  - width = (containerWidth / zoom) * minimapScale
  - height = (containerHeight / zoom) * minimapScale
```

**Visual layout:**
```text
+----------------------------------+
|  Canvas (seats + floor plan)     |
|                                  |
|                                  |
|                        +------+  |
|                        | Mini |  |
|                        | Map  |  |
|                        | [##] |  |
|                        +------+  |
+----------------------------------+
```

The `[##]` represents the blue viewport indicator rectangle within the minimap, showing where the student is currently looking in the overall layout.

### Technical Details

| Change | Detail |
|---|---|
| Remove `handleWheel` | Delete function (line 78-81) and `onWheel` prop (line 131) |
| Add minimap container | Absolute positioned div at bottom-right, 120x90px, bg-black/60, rounded, border |
| Render minimap seats | Map all seats as tiny colored dots (green=available, grey=booked, blue=selected) scaled to minimap dimensions |
| Render viewport rect | Calculate visible area from `pan`, `zoom`, and container dimensions, draw as a semi-transparent blue rectangle |
| Minimap click handler | On click, calculate the corresponding pan position and update `pan` state to jump viewport there |
| Container dimensions | Track with a `ResizeObserver` or read from `containerRef.current.clientWidth/Height` |

Only one file needs to be modified: `src/components/seats/FloorPlanViewer.tsx`
