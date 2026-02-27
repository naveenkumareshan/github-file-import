

## Reading Room Timing System

### Overview
Add a timing configuration system to Reading Rooms (cabins) that lets Admin/Partner set opening hours and working days. Display these timings across all student-facing and partner-facing pages.

---

### 1. Database Migration

Add 3 new columns to the `cabins` table:

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `opening_time` | `time` | `'06:00'` | Daily opening time |
| `closing_time` | `time` | `'22:00'` | Daily closing time |
| `working_days` | `jsonb` | `["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]` | Array of active day abbreviations |

Using simple time + working days covers the majority use case. Multiple slots can be added later as an enhancement.

---

### 2. Admin/Partner Form -- CabinForm.tsx

Add a new "Timings" section to `src/components/admin/CabinForm.tsx`:

- **Opening Time**: `<Input type="time">` (required)
- **Closing Time**: `<Input type="time">` (required, must be after opening)
- **Working Days**: 7 checkboxes (Mon-Sun), at least 1 required
- Add `openingTime`, `closingTime`, `workingDays` to the Zod schema with validation
- Pass these fields through to `adminCabinsService.createCabin()` / `updateCabin()`

---

### 3. Service Layer -- adminCabinsService.ts

Update `createCabin` and `updateCabin` to map:
- `openingTime` to `opening_time`
- `closingTime` to `closing_time`  
- `workingDays` to `working_days`

---

### 4. Display Timings on Student Pages

**a) Cabin interface (BookSeat.tsx, line 33)**
Add `openingTime`, `closingTime`, `workingDays` to the `Cabin` type.

**b) Cabins listing (Cabins.tsx)**
Map `opening_time`/`closing_time`/`working_days` from backend in the transform. Also update `cabinsService.getAllCabins` to select these fields.

**c) CabinCard.tsx**
Below the room name, show a compact timing line:
```
Open: 6:00 AM - 10:00 PM
```
If not open all 7 days, show: `Closed on Sunday` (or relevant days).

**d) CabinDetails.tsx / BookSeat.tsx hero section**
Show timings in the details tab -- opening/closing time and working days with day pills.

**e) Student Booking View (students/StudentBookingView.tsx)**
Show the room's timings in the booking details card.

---

### 5. Partner Dashboard

In the partner's room overview (cabin list/management), show the configured timings inline so partners can see at a glance.

---

### 6. Utility Helper

Create a small helper `src/utils/timingUtils.ts`:
- `formatTime(time: string)` -- converts "06:00" to "6:00 AM"
- `getClosedDays(workingDays: string[])` -- returns days not in the array
- `getTimingDisplay(opening, closing, workingDays)` -- returns formatted string

---

### Files to Create
- `src/utils/timingUtils.ts`

### Files to Modify
- Database migration (new columns on `cabins`)
- `src/components/admin/CabinForm.tsx` -- add timing fields
- `src/api/adminCabinsService.ts` -- map timing fields
- `src/api/cabinsService.ts` -- include timing fields in queries
- `src/pages/BookSeat.tsx` -- extend Cabin interface
- `src/pages/Cabins.tsx` -- map timing fields in transform
- `src/components/CabinCard.tsx` -- display timings
- `src/components/CabinDetails.tsx` -- display timings in details tab
- `src/pages/students/StudentBookingView.tsx` -- show timings
- `src/components/cabins/CabinsGrid.tsx` -- pass timing data through (if needed)

