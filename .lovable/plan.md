

## Split Payment: Multiple Payment Methods for Offline Due Collection

### Problem
Currently, due collection only supports a single payment method per transaction. Partners need to split a collection across multiple methods (e.g., ₹500 Cash + ₹500 UPI) in a single operation.

### Solution
Replace the single payment method selector with a dynamic "payment splits" system. Users add one or more payment entries, each with its own method, amount, transaction ID, and proof.

### UI Design
```text
┌─────────────────────────────────┐
│ Amount to Collect: ₹1000        │
├─────────────────────────────────┤
│ Payment Split #1                │
│ ┌─────────┐ ┌─────────────────┐│
│ │ Method   │ │ Amount: ₹500   ││
│ │ [Cash ●] │ │                 ││
│ └─────────┘ └─────────────────┘│
├─────────────────────────────────┤
│ Payment Split #2                │
│ ┌─────────┐ ┌─────────────────┐│
│ │ Method   │ │ Amount: ₹500   ││
│ │ [UPI ●]  │ │                 ││
│ │ Txn ID:  │ │ [__________]   ││
│ │ Proof:   │ │ [Upload]       ││
│ └─────────┘ └─────────────────┘│
├─────────────────────────────────┤
│ [+ Add Another Method]         │
│                                 │
│ Total: ₹1000 ✓ (matches)       │
│ [Confirm Collection · ₹1000]   │
└─────────────────────────────────┘
```

### Changes

**File: `src/components/admin/operations/CheckInFinancials.tsx`** (CollectDrawer)
1. Replace single `method/txnId/proofUrl` state with array: `paymentSplits: Array<{method, amount, txnId, proofUrl}>`
2. Default: one split with full remaining amount + cash method
3. "Add Another Method" button adds a new split entry
4. Each split shows: PaymentMethodSelector, amount input, conditional txn ID + proof
5. Validation: sum of split amounts must equal total amount; each non-cash split needs txn ID
6. On submit: create one due_payment/receipt **per split** (each with its own method, amount, txn ID, proof) — this preserves the existing receipt structure and bank reconciliation logic
7. Email receipt shows total amount with combined method summary

**File: `src/api/vendorSeatsService.ts`** (collectDuePayment)
- No change needed — we call it once per split from the UI, or refactor to accept an array of splits. Better approach: call the existing function once per split sequentially, since each split creates its own receipt and due_payment record.

**File: `src/pages/admin/DueManagement.tsx`**
- Update the inline collect dialog to also support splits (same pattern)

**File: `src/pages/vendor/VendorSeats.tsx`**
- Update inline due collection to support splits

### Key Logic

```typescript
interface PaymentSplit {
  id: string; // for React key
  method: string;
  amount: string;
  txnId: string;
  proofUrl: string;
}

// Default state
const [splits, setSplits] = useState<PaymentSplit[]>([
  { id: nanoid(), method: 'cash', amount: remainingAmount, txnId: '', proofUrl: '' }
]);

// Validation
const totalSplitAmount = splits.reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0);
const isValid = Math.abs(totalSplitAmount - parseFloat(amount)) < 0.01;

// Submit: loop through splits, call collectDuePayment for each
for (const split of splits) {
  await vendorSeatsService.collectDuePayment(due.id, parseFloat(split.amount), split.method, split.txnId, notes, split.proofUrl);
}
```

### Hostel Module (same file)
The hostel branch in CollectDrawer inserts directly into `hostel_due_payments` and `hostel_receipts`. Same loop pattern — one insert per split.

### Scope
- **4 files** modified
- No database changes needed — existing tables already support multiple payment records per due
- Receipts and bank reconciliation work automatically since each split creates its own receipt

