

## Compact Seat Management Layout

### Changes

**1. Remove Active/Inactive toggle from this page**
The room's active/inactive status belongs on the main reading room listing page, not inside seat management. We will remove the Switch and status label from the cabin header card.

**2. Compact the header into a slim inline bar**
Replace the full Card for the cabin name with a simple inline row showing just the name and metadata (category, capacity, price) -- no card wrapper needed, just a heading line below the "Back to Rooms" button.

**3. Collapse Categories and Floors into a single compact row**
Instead of two separate full-width Cards, combine Categories and Floors into a single Card with two side-by-side sections (or a compact horizontal bar), drastically reducing vertical space.

**4. Maximize the Floor Plan Designer area**
Remove the Card wrapper around the Floor Plan Designer and reduce padding so the designer canvas takes up as much screen space as possible.

---

### Technical Details

**File: `src/pages/SeatManagement.tsx`**

| Section | Current | After |
|---|---|---|
| Cabin header | Full Card with Active/Inactive Switch | Slim inline text row -- no card, no toggle |
| Categories card | Separate full Card | Merged into a compact bar with collapsible content |
| Floors card | Separate full Card with large tiles | Inline horizontal pill/tab selector beside categories |
| Floor Plan Designer | Wrapped in Card with header | Minimal wrapper, full-width, reduced padding |

Specific changes:
- **Remove** the `toggleCabinStatus` function and the `<Switch>` + status label JSX (lines 241-246)
- **Remove** the `import { Switch }` line
- **Replace** the cabin header Card with a simple `<div>` showing name + metadata in one line
- **Merge** Categories and Floors into one compact Card with two sections side by side
- **Reduce** floor tiles from large cards to small inline pills/buttons
- **Remove** the Card wrapper around Floor Plan Designer, keep just a minimal container
- **Reduce** container padding from `p-6 space-y-6` to `p-4 space-y-3`

