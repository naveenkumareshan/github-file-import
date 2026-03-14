

# Consolidate All Action Buttons into One Row

## Problem
Currently actions are split across 2 rows (Row 1: Edit/Seats/QR, Row 2: Toggles/WhatsApp). User wants everything in a single row with proper spacing.

## Solution
Merge all buttons into one `flex` row with `gap-2` for spacing. WhatsApp on the left side with other toggles, QR pushed to the far right via `ml-auto`.

### Layout (single row, left to right):
`[Edit] [Seats] [Activate] [Online] [EmpVisible] [WhatsApp] ... [QR]`

For partner (non-admin), Edit/Seats are hidden, so they see:
`[Online] [EmpVisible] [WhatsApp] ... [QR]`

## Files
- `src/components/admin/CabinItem.tsx` — merge Row 1 + Row 2 into single `flex items-center gap-2` div
- `src/components/admin/HostelItem.tsx` — same
- `src/components/admin/MessItem.tsx` — same (no QR/WhatsApp but same single-row pattern)

