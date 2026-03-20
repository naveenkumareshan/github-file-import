

## Fix Bank Management Display + Add UPI-to-Bank Linking

### Root Cause: Critical Bug

In `BankManagement.tsx` line 145 and `BankTransactionDetail.tsx` line 58, the code checks:
```
if (mode.mode_type === 'bank') return 'bank';
```
But the actual `mode_type` stored in the database is `'bank_transfer'`, not `'bank'`. This causes ALL bank account transactions to fall through to the default `'cash'` category, making bank/UPI tabs appear empty.

### Fix 1: Correct mode_type check (both files)

**`src/pages/admin/BankManagement.tsx`** line 145:
- Change `mode.mode_type === 'bank'` → `mode.mode_type === 'bank_transfer'`

**`src/pages/admin/BankTransactionDetail.tsx`** line 58:
- Change `mode.mode_type` check to use `'bank_transfer'` instead of just returning `mode.mode_type` directly (which returns `'bank_transfer'` not `'bank'`)

### Fix 2: Add UPI-to-Bank linking for existing UPI modes

**`src/components/vendor/PaymentModesManager.tsx`**:
- Add a "Link to Bank" dropdown/button on each UPI mode row in the list
- When a UPI mode doesn't have a `linked_bank_id`, show a small Select dropdown to pick a bank
- When linked, show the link badge (already exists) plus an "Unlink" option
- On change, update `partner_payment_modes.linked_bank_id` via supabase update

### Files Changed
- `src/pages/admin/BankManagement.tsx` — fix `mode_type` comparison
- `src/pages/admin/BankTransactionDetail.tsx` — fix `mode_type` comparison  
- `src/components/vendor/PaymentModesManager.tsx` — add inline bank-linking UI for existing UPI modes

