

## Fix Complaints: Standard UI, Laundry Support, Elapsed Timer, Pending/Resolved Split

This is a large, multi-part change touching database schema, three UI files, and adding a new utility.

---

### 1. Standard UI Format (S.No., Pagination) for All Views

**ComplaintsManagement.tsx** (partner/admin) currently lacks `AdminTablePagination` and `getSerialNumber`. Add pagination state, use `getSerialNumber` for S.No. column, add `AdminTablePagination` component at bottom — matching DueManagement pattern exactly.

**ComplaintTracker.tsx** (Operations Hub) already has pagination — no change needed.

**ComplaintsPage.tsx** (student) is mobile-first card layout — keep as-is since students don't use table format.

---

### 2. Laundry Complaints Support

The `complaints` table currently has `cabin_id`, `hostel_id`, `mess_id` but no `laundry_id` column. A separate `laundry_complaints` table exists but is disconnected from the unified complaints system.

**Database Migration:**
- Add `laundry_id UUID REFERENCES laundry_partners(id) ON DELETE SET NULL` to `complaints` table
- Add `'laundry'` as valid module value
- Update vendor/employee RLS policies on `complaints` to include laundry: `EXISTS (SELECT 1 FROM laundry_partners lp WHERE lp.id = c.laundry_id AND is_partner_or_employee_of(lp.partner_user_id))`
- Same for `ticket_messages` vendor policies

**Student ComplaintsPage.tsx:**
- Fetch laundry orders (active + expired within 7 days) alongside other bookings
- Filter all booking types: show only active bookings OR those expired within last 7 days
- Add laundry orders to the booking selector dropdown
- Set `laundry_id` and `module = 'laundry'` on insert

**ComplaintsManagement.tsx & ComplaintTracker.tsx:**
- Update query to join `laundry_partners:laundry_id(name, partner_user_id)`
- Update `getPropertyName` helper to include laundry
- Update partner scoping filter to include `laundry_partners?.partner_user_id === ownerId`

---

### 3. Elapsed Time Tracker

Add a utility function `getElapsedDisplay(createdAt, resolvedAt?)` that:
- If status is open/in_progress (no resolvedAt): calculates live elapsed from `created_at` to now
- If resolved/closed: calculates elapsed from `created_at` to `updated_at` (when status changed)
- Displays: `"3m"` → `"2h 15m"` → `"1d 5h"` → `"3d"` format

**Database Migration:**
- Add `resolved_at TIMESTAMPTZ` column to `complaints` table
- Create a trigger: when status changes to 'resolved' or 'closed', set `resolved_at = now()`; when reopened, set `resolved_at = NULL`

**All three UI files:**
- Show elapsed time badge next to status in table rows and complaint cards
- For open/in_progress: show in red/amber with live-updating display
- For resolved/closed: show in green with frozen time

---

### 4. Pending / Resolved Split (Due Management Pattern)

Replace the status dropdown filter with two toggle buttons: **"Pending"** (default) and **"Resolved"** — matching the DueManagement pattern.

- **Pending tab**: Shows complaints with status `open` or `in_progress`
- **Resolved tab**: Shows complaints with status `resolved` or `closed`

Apply this pattern to:
- `ComplaintsManagement.tsx` (partner/admin `/admin/complaints`)
- `ComplaintTracker.tsx` (Operations Hub)
- `ComplaintsPage.tsx` (student view — use two sections or toggle buttons above the card list)

---

### Summary of Files to Modify

| File | Changes |
|------|---------|
| **Database migration** | Add `laundry_id` column, `resolved_at` column, trigger for resolved_at, update RLS policies |
| `src/utils/complaintTimerUtils.ts` | New file — `getElapsedDisplay()` utility |
| `src/components/admin/ComplaintsManagement.tsx` | Pagination, S.No., laundry joins, elapsed timer, Pending/Resolved toggle, partner scoping for laundry |
| `src/components/admin/operations/ComplaintTracker.tsx` | Laundry joins, elapsed timer, Pending/Resolved toggle |
| `src/components/profile/ComplaintsPage.tsx` | Laundry booking support, 7-day expiry filter, elapsed timer, Pending/Resolved toggle |

