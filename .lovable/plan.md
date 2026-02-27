

## Operations Hub: Check-in Tracker + Complaint Tracker

A new "Operations" sidebar item below Dashboard for Admin and Partner roles. Two tabs only -- no document management.

---

### Tab 1: Check-in Tracker (First-time Reporting)

Lists all active bookings where the student has NOT yet reported. This is for first-time reporting so that payment/formalities can be completed.

- Toggle between Reading Room and Hostel bookings
- Shows confirmed/advance_paid bookings where `checked_in_at IS NULL`
- Highlights "yesterday's no-shows" (start_date was yesterday, still not checked in)
- Each row: Student name/phone, Room/Seat or Hostel/Bed, Start Date, Payment Status
- "Mark Reported" button opens a dialog for optional notes, then sets `checked_in_at` timestamp

### Tab 2: Complaint Tracker

Streamlined complaint list with inline status toggles for quick resolution.

- One-click "Mark Resolved" / "Mark In Progress" buttons directly in the row
- Filter by module (Reading Room / Hostel) once module field is added
- Search and filter by status/priority
- Expandable row to view full description and respond inline

---

### Database Changes (2 migrations)

#### Migration 1: Check-in columns on bookings
```sql
ALTER TABLE bookings ADD COLUMN checked_in_at timestamptz DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN checked_in_by uuid DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN check_in_notes text DEFAULT '';

ALTER TABLE hostel_bookings ADD COLUMN checked_in_at timestamptz DEFAULT NULL;
ALTER TABLE hostel_bookings ADD COLUMN checked_in_by uuid DEFAULT NULL;
ALTER TABLE hostel_bookings ADD COLUMN check_in_notes text DEFAULT '';
```

#### Migration 2: Add module/hostel fields to complaints
```sql
ALTER TABLE complaints ADD COLUMN module text DEFAULT 'reading_room';
ALTER TABLE complaints ADD COLUMN hostel_id uuid DEFAULT NULL;
```

---

### Frontend Changes

#### New files (3)
- `src/pages/admin/OperationsHub.tsx` -- Page with 2 tabs: Check-in | Complaints, each with Reading Room/Hostel toggle
- `src/components/admin/operations/CheckInTracker.tsx` -- Lists pending first-time reportings with "Mark Reported" action and optional notes
- `src/components/admin/operations/ComplaintTracker.tsx` -- Inline status toggle, search, filter, expandable rows

#### Modified files (2)
- `src/components/admin/AdminSidebar.tsx` -- Add "Operations" menu item below Dashboard (ClipboardCheck icon, `/admin/operations`)
- `src/App.tsx` -- Add route `<Route path="operations" element={<OperationsHub />} />`

### Check-in Flow
```text
Partner opens Operations > Check-in tab
  -> Sees list of unreported bookings (checked_in_at IS NULL)
  -> Clicks "Mark Reported"
  -> Dialog: optional notes field
  -> Confirm -> sets checked_in_at = now(), checked_in_by = current user
  -> Booking disappears from pending list
```

