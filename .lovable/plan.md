

# Add Bank Narration Field to Reconciliation Approval

## Changes — Single File + DB Migration

### 1. Database Migration
Add `bank_narration text` column to all 4 receipt tables: `receipts`, `hostel_receipts`, `mess_receipts`, `laundry_receipts`.

### 2. Update `src/pages/admin/Reconciliation.tsx`

**Interface**: Add `bank_narration?: string` to `ReconciliationRow`.

**Queries**: Add `bank_narration` to all 4 select statements.

**Approve Dialog**: Add a `Textarea` field labeled "Bank Narration" below Bank Name, with placeholder "Paste bank statement remarks here". Store in new state `bankNarration`.

**Save Logic**: In `handleApproveConfirm`, include `bank_narration: bankNarration || null` in the update payload. Also update the local state mapping.

**Reset**: Clear `bankNarration` in `openApproveDialog`.

**Approved Tab Display**:
- Table: Add a "Narration" column after "Bank" showing `r.bank_narration || '-'`
- Mobile card: Show bank narration if present
- CSV export: Include "Bank Narration" column for approved tab

