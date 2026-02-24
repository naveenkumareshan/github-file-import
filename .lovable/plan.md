

## Remove Duplicate Seat Amount and Locker Lines

### Problem
The form currently shows Seat Amount and Locker twice -- once as separate input/checkbox fields, and again inside the summary card below. The user wants only the summary card version, with the discount fields integrated there too.

### Current Layout (lines 1014-1057)
```text
SEAT AMOUNT (₹) [2000]          <-- REMOVE (duplicate)
[x] Include Locker  ₹300        <-- REMOVE (duplicate)
DISCOUNT [amount] [reason]       <-- MOVE into summary area
---Summary Card---
  Seat Amount         ₹2000     <-- KEEP (only display)
  Locker              ₹300      <-- KEEP
  Discount           -₹X        <-- KEEP
  Total              ₹2300      <-- KEEP
```

### New Layout
```text
[x] Include Locker (Mandatory)  ₹300   <-- Keep checkbox (needed for toggling)
DISCOUNT [amount] [reason]               <-- Keep inputs
---Summary Card---
  Seat Amount         ₹2000
  Locker              ₹300
  Discount           -₹X
  Total              ₹2300
```

Wait -- the user needs the locker checkbox to toggle it. But the Seat Amount input is read-only so it's truly redundant. Let me re-read: "two times seat amount and locker is showing only use down one only - with discount there only - no separate line needed."

The user wants:
1. **Remove** the standalone Seat Amount input (line 1014-1018) -- it's read-only and just duplicates the summary
2. **Remove** the standalone Locker checkbox section (lines 1020-1035) -- but we still need the checkbox functionality. Move it into the summary card as a toggleable line.
3. **Remove** the separate Discount section (lines 1037-1044) -- move the discount inputs into the summary card area.

### Changes in `src/pages/vendor/VendorSeats.tsx`

**1. Remove standalone Seat Amount input (lines 1014-1018)**
Delete the `<div>` with Label "Seat Amount" and readonly Input.

**2. Remove standalone Locker checkbox (lines 1020-1035)**
Delete the separate locker checkbox section.

**3. Remove standalone Discount section (lines 1037-1044)**
Delete the separate discount inputs.

**4. Expand the Summary Card (lines 1046-1057) to include everything**
Replace the summary card with a combined card that shows:
- Seat Amount line (read-only display): `Seat Amount  ₹2000`
- Locker line with checkbox: `[x] Include Locker (Mandatory)  ₹300` (clickable to toggle, disabled if mandatory)
- Discount inputs inline: `₹ Amount` + `Reason` input fields
- If discount > 0, show discount line: `Discount (reason)  -₹X`
- Separator
- **Total** bold: `Total  ₹2300`

### File Changed

| File | Change |
|------|--------|
| `src/pages/vendor/VendorSeats.tsx` | Remove duplicate seat amount, locker, discount sections; consolidate into single summary card |

