

# Fix: Show Partner's Payment Modes as Bank Name Options in Receipt Approval

## Problem
When approving a receipt in Reconciliation, the "Bank Name" field falls back to a manual text input because the code only looks for `mode_type === 'bank_transfer'` entries in `partner_payment_modes`. Currently, partners only have UPI and cash modes configured — no `bank_transfer` entries exist in the database. So the dropdown never appears.

## Solution
Remove the `bank_transfer`-only filter so ALL active partner payment modes (UPI, cash, bank_transfer) appear in the bank name dropdown. This gives the approver a pre-defined list to pick from instead of manual entry.

## Changes

### File: `src/pages/admin/Reconciliation.tsx`
- **Line ~224**: Change the filter from `m.mode_type === 'bank_transfer'` to include all mode types. Use all entries from `partner_payment_modes` as selectable options.
- Keep the auto-suggest logic for linked banks intact (it still works when `linked_bank_id` is set).
- Add an "Other" manual entry option so the approver can still type a custom bank name if needed (via a toggle or extra option in the dropdown).

### Technical Detail
```
Current (line 224):
  const bankEntries = (data || []).filter((m: any) => m.mode_type === 'bank_transfer');

Changed to:
  const bankEntries = data || [];
```

The dropdown UI (lines 676-686) already handles the Select vs Input fallback. With all payment modes included, the Select dropdown will now render.

Additionally, add a small "Enter manually" option at the bottom of the Select so the approver can still type a custom name when no matching mode exists.

