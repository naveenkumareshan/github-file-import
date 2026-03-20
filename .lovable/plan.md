## ✅ Cash Handover System + Bank/Cash Balance Pages

### Feature 1: Cash Handover (Operations Hub)
- `cash_handovers` table with OTP, RLS using `is_partner_or_employee_of`
- `generate_handover_otp()` and `verify_handover_otp()` DB functions
- CashHandoverTab in Operations page with Send/Incoming/Pending/History tabs
- Flow: Sender initiates → Receiver sees OTP + amount + sender name → Receiver reads OTP to sender → Sender enters OTP to confirm

### Feature 2: Bank Management Rewrite
- Fetches ALL receipts (not just reconciled) from 4 receipt tables
- Groups by Cash (per collector), Bank (per mode), UPI (per mode)
- Expandable rows with full transaction lists (date, serial, amount)
- Summary cards showing totals for Cash, Bank, UPI
