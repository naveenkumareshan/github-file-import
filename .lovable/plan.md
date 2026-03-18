

## Fix: Occupancy Chart Overlapping Expiring Bookings

The chart container div has `h-[200px]` but the `ChartContainer` wrapper inside it likely adds extra height (legend, padding), causing overflow that visually merges with the section below.

### Changes

**`src/components/admin/OccupancyChart.tsx`** — Add `overflow-hidden` to the chart wrapper and increase height to accommodate legend:
- Change `h-[200px]` to `h-[250px]` to give room for the legend below the chart
- Add `overflow-hidden` to prevent any bleed

**`src/components/admin/RevenueChart.tsx`** — Same fix for consistency:
- Change `h-[200px]` to `h-[250px]`
- Add `overflow-hidden`

Both charts get the same treatment so they remain visually balanced in the grid.

