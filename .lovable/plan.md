

## Plan: Enhance Student Scan & Attendance History

### What's changing

**1. Scan result shows richer booking information**
- Update the `mark_qr_attendance` RPC to return additional fields: `booking_start_date`, `booking_end_date`, `booking_duration` (for reading room/hostel), and `meal_type` (for mess)
- The RPC already returns `meal_type` for mess but the frontend ignores it
- Update `MarkAttendanceResult` interface to include: `meal_type`, `booking_start_date`, `booking_end_date`, `booking_duration`
- Update `ScanAttendance.tsx` success card to display:
  - Booking validity period (e.g., "01 Mar – 31 Mar 2026")
  - Booking duration type (daily/weekly/monthly)
  - For mess: show meal type badge (Breakfast/Lunch/Dinner) and "already marked for this meal" message
  - For hostel: show room-bed label
  - Date of attendance

**2. RPC enhancement — return booking dates + only consider active bookings**
- Modify `mark_qr_attendance` to also return `booking_start_date` and `booking_end_date` from the matched booking
- The RPC already only considers current bookings (checks `start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE`), so expired bookings are already excluded — no change needed there

**3. Attendance History — add type filter buttons (Hostel, Reading Room, Mess)**
- Add 3 toggle filter buttons at the top of `AttendanceHistory.tsx`: "All", "Reading Room", "Hostel", "Mess"
- Filter displayed records by `property_type`
- Also enrich mess attendance records with mess partner names (currently only cabins and hostels are looked up)
- Show the property type badge correctly for mess entries (currently only shows "Room" or "Hostel")
- Include mess attendance from `mess_attendance` table in the history, or rely on the existing `property_attendance` entries for mess (the RPC already inserts into `property_attendance` for mess)

### Files to modify
- **SQL migration**: Update `mark_qr_attendance` to return `booking_start_date`, `booking_end_date`, `booking_duration` in the response jsonb
- **`src/api/attendanceService.ts`**: Add `meal_type`, `booking_start_date`, `booking_end_date`, `booking_duration` to `MarkAttendanceResult`
- **`src/pages/student/ScanAttendance.tsx`**: Enhanced success card with booking details, meal type badge, date display
- **`src/pages/student/AttendanceHistory.tsx`**: Add filter buttons (All/Reading Room/Hostel/Mess), enrich mess property names, fix type badge for mess

### Technical details

**RPC changes** — add to the return jsonb objects:
```sql
-- For reading_room and hostel returns:
'booking_start_date', b.start_date,
'booking_end_date', b.end_date,
'booking_duration', b.booking_duration  -- (reading room only)

-- For mess, already returns meal_type — just add:
'booking_start_date', ms.start_date,
'booking_end_date', ms.end_date
```

**AttendanceHistory filter** — simple state-based filter:
```tsx
const [typeFilter, setTypeFilter] = useState<string>('all');
// Filter buttons: All | Reading Room | Hostel | Mess
// Applied before pagination
const filtered = typeFilter === 'all' ? records : records.filter(r => r.property_type === typeFilter);
```

**Mess name enrichment** — in `fetchRecords`, add lookup for mess partner names alongside cabins and hostels.

