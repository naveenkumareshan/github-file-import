

## Plan: PIN Override for Students with Dues

### Concept
The PIN system is **not** for all students — it's an override mechanism only for students who have overdue fees. Normal students continue scanning QR as usual. When a student with dues scans QR, they're told to get a PIN from the employee. The employee gives them the 4-digit PIN, the student enters it, and attendance is marked despite the dues.

### Flow

```text
Student scans QR
  ├── No dues → Attendance marked normally (no change)
  └── Has dues → Error: "Fee due. Get PIN from staff"
                    │
                    ▼
        Employee shows rotating PIN (PropertyAttendance page)
        Student enters PIN in their app
                    │
                    ▼
        mark_pin_attendance RPC → skips due check → marks attendance
```

### Implementation

**1. Database migration**
- Create `attendance_pins` table: `id`, `property_id`, `property_type`, `pin_secret` (text), `created_at`
- RLS: partner/employee can select/insert on their properties
- New RPC `generate_attendance_pin(p_property_id, p_property_type)`: creates secret if not exists, returns current 4-digit PIN (HMAC-based, rotates every 60s) and seconds remaining
- New RPC `mark_pin_attendance(p_property_id, p_property_type, p_pin)`: validates PIN, finds active booking, **skips due check** (that's the whole point of PIN), prevents duplicate attendance, returns same rich result as `mark_qr_attendance`

**2. Update QR error message**
- In `mark_qr_attendance` RPC: change the dues error message to: `'Fee due pending. Please get the entry PIN from staff to mark attendance.'`

**3. Student UI (`ScanAttendance.tsx`)**
- When error contains "PIN from staff", show a special card with a 4-digit OTP input (using existing `InputOTP` component)
- Student enters PIN + submits → calls `mark_pin_attendance`
- On success, shows the same rich success card
- No PIN tab visible by default — only appears when dues are detected

**4. Partner/Employee UI (`PropertyAttendance.tsx`)**
- Add a "Show PIN" card at the top with property selector
- Shows current 4-digit PIN in large font + circular countdown (60s)
- Auto-refreshes every second (countdown) and regenerates PIN each minute
- Only visible to partner/employee roles

**5. Service layer (`attendanceService.ts`)**
- Add `markPinAttendance(propertyId, propertyType, pin)` method
- Add `getAttendancePin(propertyId, propertyType)` method

### Files to modify
- **SQL migration**: `attendance_pins` table, `generate_attendance_pin` RPC, `mark_pin_attendance` RPC, update dues error message in `mark_qr_attendance`
- **`src/api/attendanceService.ts`**: add PIN methods
- **`src/pages/student/ScanAttendance.tsx`**: PIN entry UI on due detection
- **`src/pages/admin/PropertyAttendance.tsx`**: PIN display card with countdown

