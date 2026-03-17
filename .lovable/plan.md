
Goal: remove the remaining “.333” values and force whole-number currency everywhere.

What I found
- The global formatter is correct (`formatCurrency` rounds to nearest integer), but many screens still bypass it.
- On your current route (`/admin/dashboard`), decimals can still appear from:
  1) `DynamicStatisticsCards.tsx` using `₹{...toLocaleString()}`
  2) `RevenueChart.tsx` tooltip/axis formatter outputting raw values (can show fractional values like `.333`)
  3) chart tooltip fallback in `ui/chart.tsx` uses `item.value.toLocaleString()` (shows decimals when data is fractional)

Implementation plan
1) Immediate admin dashboard reset (the screen you’re on)
- Update `src/components/admin/DynamicStatisticsCards.tsx` to use `formatCurrency(...)` for Total Revenue, Today Revenue, Pending Payments.
- Update `src/components/admin/RevenueChart.tsx`:
  - Tooltip formatter -> `formatCurrency(Number(value) || 0)`
  - Y-axis formatter -> integer-safe output (no decimal “K” values).
- Update `src/components/admin/OccupancyChart.tsx` tooltip formatter to round displayed values to whole percent.

2) Global hard reset for remaining currency render paths
- Replace any money UI patterns still using:
  - `₹{amount.toLocaleString(...)}`
  - ``₹${amount}`` / ``₹${amount.toLocaleString(...)}``
- Convert to `formatCurrency(Number(amount) || 0)` across admin, partner, employee, and student files still using direct rupee rendering.

3) Guardrail so this doesn’t regress
- Add a final code sweep check for:
  - `₹{.*toLocaleString`
  - ``₹${``
  - currency tooltip formatters not using `formatCurrency`
- Keep date/time `toLocaleString` untouched.

4) Validation checklist
- Admin dashboard cards: no decimals.
- Revenue chart axis + tooltip: no `.333`.
- Occupancy tooltip: whole-number percent.
- Spot-check partner and student payment/summary screens for whole-number ₹ formatting only.

Technical details
- No backend or database change required.
- This is a frontend formatting consistency fix only, centered on replacing direct string formatting with the existing shared utility.
