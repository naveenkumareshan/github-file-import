

## Cash Handover System + Bank/Cash Balance Pages

### Overview
Two features: (1) OTP-based cash handover in the Operations page, and (2) functional bank/cash balance pages with transaction lists.

---

### Feature 1: Cash Handover with OTP (Operations Page)

**Flow**:
1. Sender (employee/partner holding cash) initiates a handover — selects receiver + enters amount
2. A `cash_handovers` record is created with status `pending` and a 4-digit OTP
3. The **receiver** sees the pending handover in their "Incoming" tab — showing OTP, amount, and sender name
4. Receiver reads the OTP aloud to the sender
5. Sender enters the OTP and clicks confirm → status becomes `completed`
6. Cash balance transfers from sender to receiver

**Database Migration**:
- Create `cash_handovers` table: `id`, `partner_user_id`, `from_user_id`, `from_name`, `to_user_id`, `to_name`, `amount`, `otp_code` (4-digit), `status` (pending/completed/expired/cancelled), `notes`, `created_at`, `completed_at`
- RLS: partner and their employees can read/write within same partner org
- DB function `generate_handover_otp()` — returns random 4-digit code
- DB function `verify_handover_otp(handover_id, otp)` — validates and marks completed

**UI Changes**:
- New tab "Cash Handover" in `OperationsHub.tsx` (with HandshakeIcon)
- New component `src/components/admin/operations/CashHandoverTab.tsx`:
  - **Initiate Handover**: Select receiver from employee list, enter amount, submit → creates pending record
  - **Incoming Handovers**: Shows pending handovers where current user is receiver — displays OTP prominently, amount, sender name
  - **Sender Confirmation**: Sender sees pending outgoing handovers with OTP input field — enters OTP from receiver to confirm
  - **History**: Completed handovers list

---

### Feature 2: Bank & Cash Balances with Transactions

**Changes to `BankManagement.tsx`**:

1. **Fetch all receipts** (not just reconciled) from `receipts`, `hostel_receipts`, `mess_receipts`, `laundry_receipts` with `payment_method`, `amount`, `collected_by_name`, `created_at`, `serial_number`
2. **Fetch `partner_payment_modes`** to map IDs → labels and mode_types (cash/bank/upi)
3. **Three sections**:
   - **Cash Balances**: Group by `collected_by_name` for cash-method receipts. Adjust with `cash_handovers` (outgoing subtract, incoming add). Expandable rows showing receipt list.
   - **Bank Balances**: Group by bank payment mode label. Expandable transaction list.
   - **UPI Balances**: Group by UPI mode label. Expandable transaction list.
4. Summary cards at top showing total cash in hand, total in banks, total in UPI

### Files Modified/Created
- **Migration**: `cash_handovers` table + 2 DB functions + RLS
- **New**: `src/components/admin/operations/CashHandoverTab.tsx`
- **Edit**: `src/pages/admin/OperationsHub.tsx` — add Cash Handover tab
- **Edit**: `src/pages/admin/BankManagement.tsx` — rewrite with grouped balances + transaction lists

### Implementation Order
1. Database migration
2. CashHandoverTab component
3. Add tab to OperationsHub
4. BankManagement rewrite

