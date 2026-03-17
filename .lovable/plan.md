
Goal: make the PIN reliably appear in Partner app when the user clicks the “Attendance PIN” button.

What I found
- The PIN popup opens, but PIN fetch fails.
- Network error is the blocker: `generate_attendance_pin` returns 400 with `null value in column "property_id" of relation "attendance_pins" violates not-null constraint`.
- Current universal PIN logic inserts by `owner_id`, but `attendance_pins.property_id/property_type` are still NOT NULL from the old schema.
- So the button can open, but PIN remains empty.

Implementation plan

1) Backend fix (highest priority)
- Create a migration to complete the universal-PIN schema transition:
  - Drop NOT NULL on `attendance_pins.property_id` and `attendance_pins.property_type` (or remove these legacy columns safely).
  - Keep `owner_id` unique and enforce it as the canonical key for universal PIN.
  - Keep `generate_attendance_pin(p_owner_id uuid)` aligned with `owner_id` insert/upsert only.
- Add safety in function:
  - Return clear error if `p_owner_id` is null.
  - Keep PIN generation logic unchanged (60s rotation).

2) UI behavior: show PIN on click, with clear states
- In `AttendancePinDisplay`:
  - Keep fetch triggered only when popover is opened (click behavior).
  - Add explicit error UI if fetch fails (`Couldn’t load PIN. Retry`), instead of blank content.
  - Add retry action in popover.
  - Keep countdown + auto-refresh only after successful PIN fetch.

3) Partner-app visibility robustness
- Don’t hide the button just because property-name list is temporarily empty.
- Show button if user has permission; inside popover show:
  - loading state,
  - error state,
  - or “No attached properties” message.
- Include mess properties in “Applies to” list so universal coverage is accurate for all attached property types.

4) Employee restriction checks (as requested earlier)
- Keep/strengthen rule: PIN visible only if employee is active and has `manage_attendance`.
- If `allowed_properties` is set, display only relevant attached properties in summary text.

5) Clean up React warning seen in console
- Adjust Popover trigger structure in `AttendancePinDisplay` to avoid ref-warning path (remove fragile trigger composition).
- This is secondary to PIN visibility but will reduce runtime noise and potential UI quirks.

Technical details
- Files to update:
  - `supabase/migrations/*` (new migration for `attendance_pins` nullability/canonical owner-based schema)
  - `src/components/admin/AttendancePinDisplay.tsx` (click-to-fetch states, retry, property coverage text, safer trigger)
  - (Optional) `src/api/attendanceService.ts` only if we add structured error propagation for UI messaging.
- Verification checklist:
  - Partner opens `/admin/operations` → clicks Attendance PIN → PIN appears.
  - RPC `generate_attendance_pin` returns 200.
  - PIN refreshes every minute with countdown.
  - Employee without permission cannot see button.
  - Employee with permission can see and open PIN.
