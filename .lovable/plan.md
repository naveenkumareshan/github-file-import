

## Fix: Background Image Visible Through Sections

### Problem
When sections are added to the canvas, they completely cover the background layout image because:
1. Sections use `bg-background` class (solid white/dark background) at `zIndex: 3`
2. The background image is at `zIndex: 0`
3. The section body area is fully opaque, hiding the image beneath it

### Solution
Make section backgrounds semi-transparent so the layout image shows through while sections and seats remain visible and usable.

### Changes

**File: `src/components/seats/FloorPlanDesigner.tsx`**

1. **Section container**: Replace `bg-background` with a semi-transparent background using inline style (`rgba`) instead of a Tailwind class, so the layout image is visible underneath
2. **Section body area**: Make the body background transparent (currently inherits the opaque parent background)
3. **Seat rectangles**: Keep seats with a slightly opaque background so they remain readable, but allow the image to subtly show through

Specifically:
- Change the section `colorClass` from `bg-background` to `bg-background/60` (or use `bg-transparent` with a subtle backdrop) so the layout image shows through
- The section header can stay slightly more opaque for readability
- When no layout image is present, sections should still look clean with their colored borders

This is a small CSS-level fix -- no logic or data changes needed.
