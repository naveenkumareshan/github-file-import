

# Plan: Remove Validity Date Picker + Add Due Date Picker for Offline Bookings

## Summary

Two changes:
1. **Remove** the seat/bed validity date editing (pencil icon) from both Due Management pages — validity always equals booking end date, no manual override needed.
2. **Add** a due date picker in the hostel advance booking flow (it already exists in reading room flow) and ensure the due date column in both due management pages shows the editable pencil (already present — just keep it).

## Changes

### 1. Remove Seat Validity Date Picker from Due Management

**`src/pages/admin/DueManagement.tsx`**:
- Remove the `seat_valid` option from `editingField` state type (change to just `'due_date' | null`)
- Remove the `openDateEdit(due, 'seat_valid')` pencil button (lines 335-337)
- Remove validity-related branches in the date edit dialog (lines 468, 474, 480-486 — the `seat_valid` label, max constraint, help text)
- Remove max date validation in `handleSaveDate` (line 165-167)
- Keep the validity column as **display-only** (no pencil icon)

**`src/pages/admin/HostelDueManagement.tsx`**:
- Remove the `bed_valid` option from `editingField` state type
- Remove the pencil button next to bed validity (lines 384-395)
- Remove validity-related branches in the date edit dialog (lines 529, 533-536, 542, 550-552, 563)
- Keep the validity column as display-only

### 2. Add Due Date Picker in Hostel Advance Booking Flow

**`src/pages/admin/HostelBedMap.tsx`**:
- Add a due date picker (Calendar popover) inside the advance booking section (after the amount input, around line 1381), matching the pattern already used in `VendorSeats.tsx` lines 1542-1561
- Label it "Due Date (Reminder)" with a calendar popover using `manualDueDate` state (already exists)
- The `manualDueDate` state and `advanceComputed.dueDate` logic already exist — just need the UI picker

### Files Modified
| File | Change |
|------|--------|
| `src/pages/admin/DueManagement.tsx` | Remove seat validity pencil + edit dialog branch |
| `src/pages/admin/HostelDueManagement.tsx` | Remove bed validity pencil + edit dialog branch |
| `src/pages/admin/HostelBedMap.tsx` | Add due date picker UI in advance booking section |

