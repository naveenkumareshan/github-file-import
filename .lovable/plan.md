

# Property QR Attendance System

## Overview
Build a QR-based daily attendance system for reading rooms and hostels. Students scan a property QR to mark presence; admins/partners see a green dot on seat/bed maps for checked-in students.

## Database

### New table: `property_attendance`
```sql
CREATE TABLE public.property_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  property_id UUID NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('reading_room', 'hostel')),
  seat_or_bed_id UUID,
  booking_id UUID,
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id, property_id, date)
);

ALTER TABLE public.property_attendance ENABLE ROW LEVEL SECURITY;

-- Students can insert their own attendance
CREATE POLICY "Students can insert own attendance"
ON public.property_attendance FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid());

-- Students can read own attendance
CREATE POLICY "Students can read own attendance"
ON public.property_attendance FOR SELECT TO authenticated
USING (student_id = auth.uid());

-- Partners/admins can read attendance for their properties
CREATE POLICY "Partners can read property attendance"
ON public.property_attendance FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'super_admin') OR
  public.is_partner_or_employee_of(
    CASE
      WHEN property_type = 'hostel' THEN (SELECT created_by FROM hostels WHERE id = property_id)
      ELSE (SELECT created_by FROM cabins WHERE id = property_id)
    END
  )
);
```

### New RPC: `mark_qr_attendance`
A `SECURITY DEFINER` function that:
1. Validates the student has an active booking at the property (checks `bookings` or `hostel_bookings`)
2. Checks no pending dues that block entry (optional — configurable)
3. Checks if already marked today (returns early with info if so)
4. Resolves the seat/bed ID from the active booking
5. Inserts into `property_attendance`
6. Returns success with student name, phone, seat/bed number, check-in time

```sql
CREATE OR REPLACE FUNCTION public.mark_qr_attendance(
  p_property_id UUID,
  p_property_type TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ ... $$;
```

## New Files

### 1. `src/pages/student/ScanAttendance.tsx`
Student-facing page with:
- Camera-based QR scanner (using `navigator.mediaDevices` + a lightweight QR decode library like `jsQR` — already used in MessAttendance pattern)
- On scan: parse QR → call `mark_qr_attendance` RPC → show success card with:
  - "Entry Recorded" header with checkmark
  - Student name, phone
  - Seat/Bed number
  - Check-in time
  - Property name
- Error states: no active booking, already checked in, dues pending
- Styled consistent with existing student app pages

### 2. `src/pages/admin/PropertyAttendance.tsx`
Admin/partner attendance dashboard page with:
- Property selector (reading rooms + hostels)
- Date picker (defaults to today)
- Table showing: Student Name, Phone, Seat/Bed, Check-in Time
- Summary cards: Total Present Today, Reading Room count, Hostel count
- Export option
- Follows existing admin page patterns (AdminTablePagination, etc.)

### 3. `src/api/attendanceService.ts`
Service layer with:
- `markAttendance(propertyId, propertyType)` — calls RPC
- `getPropertyAttendance(propertyId, date)` — fetches attendance records
- `getTodayAttendanceMap(propertyId)` — returns `Set<string>` of seat/bed IDs checked in today (for map dots)

## Modified Files

### 4. Seat Map — `src/pages/vendor/VendorSeats.tsx`
- On mount + every 30s interval, fetch today's attendance for the selected property via `getTodayAttendanceMap`
- In the grid/room view bed card rendering, if `attendanceSet.has(seat.id)`, render a small green dot at top-right corner:
  ```tsx
  {attendanceSet.has(seat.id) && (
    <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white z-10" title="Present today" />
  )}
  ```
- Does NOT affect existing status colors or state logic

### 5. Bed Map — `src/pages/admin/HostelBedMap.tsx`
- Same pattern: fetch attendance map, render green dot on bed cards in grid and room views
- 30s auto-refresh interval for attendance data only (not full bed refresh)

### 6. Student Dashboard — `src/pages/StudentDashboard.tsx`
- Add a "Scan Property QR" button card in the summary section
- Links to `/student/scan-attendance`

### 7. Routes — `src/App.tsx`
- Add `/student/scan-attendance` route under student protected routes pointing to `ScanAttendance`
- Add `/{admin,partner}/property-attendance` route pointing to `PropertyAttendance`

### 8. Sidebar — `src/components/admin/AdminSidebar.tsx`
- Add "Attendance" sub-item under both Reading Rooms and Hostels sections
- Icon: `UserCheck` (already imported)
- URL: `{routePrefix}/property-attendance?type=reading_room` and `?type=hostel`

## QR Code Content
Each property QR encodes a simple JSON string:
```json
{"propertyId":"uuid-here","type":"reading_room"}
```
Partners can generate/download this QR from their property management page. We'll add a "Download QR" button to the Manage Properties page that generates the QR using a client-side QR library.

### 9. QR Generation — `src/pages/partner/ManageProperties.tsx`
- Add a "QR Code" button on each property card
- Opens a dialog showing the QR code (generated client-side via `qrcode` npm package) with download button

## Auto-Refresh Strategy
- Attendance dots use a separate `useEffect` with 30s `setInterval` that only fetches the attendance set (lightweight query)
- Full seat/bed data refresh remains manual or on page load

## Technical Notes
- No new edge functions needed — RPC handles validation server-side
- QR scanning reuses the same `navigator.mediaDevices` + canvas pattern from `MessAttendance.tsx`
- The presence dot is purely visual and does not affect booking/availability logic
- `jsQR` library will need to be added as a dependency

