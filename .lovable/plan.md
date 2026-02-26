

## Add Downloadable Excel Template for Student Import

### What This Does
Adds a working "Download Template" button on the Import Students page so admins can download a ready-to-fill Excel file with the correct column headers, sample data, and formatting guidance.

### Template Columns
Based on the validation logic and backend processing, the template will include these columns:

| Column | Required | Format / Example |
|--------|----------|-----------------|
| name | Yes | John Doe |
| email | Yes | john@example.com |
| phone | Yes | 9876543210 (10 digits) |
| amount | Yes | 3000 (seat price, numeric) |
| key_deposite | No (defaults to 500) | 500 |
| startDate | Yes | DD-MM-YYYY (e.g. 01-03-2026) |
| endDate | Yes | DD-MM-YYYY (e.g. 01-04-2026) |
| seat_no | Yes | 1 (seat number to assign) |
| room_name | No | Room A |
| status | Yes | booked |
| receipt_no | Yes | RCP-001 |
| transaction_id | Yes | TXN-001 |
| pay_mode | Yes | Cash / Online / UPI |

### Changes to `src/components/admin/StudentExcelImport.tsx`

1. **Add `downloadTemplate` function** that:
   - Creates a worksheet with all 13 column headers
   - Adds 2 sample rows with realistic example data
   - Sets readable column widths
   - Downloads as `student_import_template.xlsx`

2. **Uncomment the "Download Template" button** (lines 425-428) so it becomes visible and clickable

### Issues Found During Review

The current import flow has a **date validation bug**: the `validateStudentData` function in `bulkBookingService.ts` checks `Date.parse(student.startDate)` but Excel dates arrive as serial numbers (e.g. `45352`), not date strings. `Date.parse("45352")` returns `NaN`, causing false validation errors. However, the component currently sets default values for `receipt_no`, `transaction_id`, and `status` in `handleFileUpload` (lines 117-123), so those required-field checks pass.

**No backend changes needed** -- the template just needs to match the existing column names used in `handleFileUpload` and `validateStudentData`.

### Files Changed

| File | Change |
|------|--------|
| `src/components/admin/StudentExcelImport.tsx` | Add `downloadTemplate` function, uncomment Download Template button |

