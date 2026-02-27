

## Add Booking Duration Controls and Slot Duration Restrictions

This plan adds two new admin/partner settings to each reading room:

1. **Allowed Booking Durations** -- control whether Daily, Weekly, and/or Monthly bookings are offered at all
2. **Slots Applicable Durations** -- control which of the allowed durations show the time slot picker (only visible when slots are enabled)

---

### 1. Database Migration

Add two new JSONB columns to the `cabins` table:

```sql
ALTER TABLE cabins 
  ADD COLUMN allowed_durations jsonb NOT NULL DEFAULT '["daily","weekly","monthly"]',
  ADD COLUMN slots_applicable_durations jsonb NOT NULL DEFAULT '["daily","weekly","monthly"]';
```

- `allowed_durations`: Which duration types are offered to students (e.g., `["monthly"]` means only monthly bookings)
- `slots_applicable_durations`: Which of those durations require slot selection (e.g., `["daily"]` means only daily bookings show the slot picker)

---

### 2. API Layer -- `src/api/adminCabinsService.ts`

Map two new fields in both `createCabin` and `updateCabin`:

- `allowedDurations` maps to `allowed_durations`
- `slotsApplicableDurations` maps to `slots_applicable_durations`

---

### 3. Admin/Partner UI -- `src/components/admin/CabinEditor.tsx`

Add two new checkbox groups in the Timing section (section 4):

**A) "Allowed Booking Durations"** (always visible):
- Three checkboxes: Daily, Weekly, Monthly (all checked by default)
- At least one must remain checked
- Label: "Offer bookings for"

**B) "Apply Slots To"** (visible only when slots are enabled):
- Three checkboxes: Daily, Weekly, Monthly
- Only shows durations that are in `allowedDurations`
- Label: "Apply slots to"
- Placed below the "Enable Slots" toggle

State initialization from `existingCabin`:
```text
allowedDurations: existingCabin?.allowed_durations || ['daily','weekly','monthly']
slotsApplicableDurations: existingCabin?.slots_applicable_durations || ['daily','weekly','monthly']
```

---

### 4. Admin/Partner UI -- `src/components/admin/CabinForm.tsx`

Same two checkbox groups added to the form schema and rendered under the timing/slots section:
- `allowedDurations`: array of strings, default all three
- `slotsApplicableDurations`: array of strings, default all three

---

### 5. Student Booking Flow -- `src/components/seats/SeatBookingForm.tsx`

**Duration Type pills**: Only render durations that are in `cabin.allowed_durations`. If the array has only one entry, auto-select it and hide the pills.

**Time Slot picker**: Only show when:
1. `cabin.slotsEnabled === true`, AND
2. Selected duration type is in `cabin.slots_applicable_durations`

When slots are hidden for a duration, treat as full-day booking (no `slot_id`).

---

### 6. Manual Booking Flow -- `src/pages/admin/ManualBookingManagement.tsx`

Same two conditionals:
- Duration type selector only shows allowed durations from `cabin.allowed_durations`
- Slot selection step only appears when the selected duration is in `cabin.slots_applicable_durations`

---

### Files Modified

| File | Change |
|------|--------|
| Database migration | Add `allowed_durations` and `slots_applicable_durations` columns |
| `src/api/adminCabinsService.ts` | Map both new fields in create/update |
| `src/components/admin/CabinEditor.tsx` | Add "Offer bookings for" checkboxes + "Apply slots to" checkboxes |
| `src/components/admin/CabinForm.tsx` | Add both fields to schema and render checkboxes |
| `src/components/seats/SeatBookingForm.tsx` | Filter duration pills by `allowed_durations`; conditional slot display by `slots_applicable_durations` |
| `src/pages/admin/ManualBookingManagement.tsx` | Filter duration options and conditional slot step |

