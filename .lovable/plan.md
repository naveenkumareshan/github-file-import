

## Fix: Admin Can't See Partner Bank Data

### Root Cause

The admin user (`8a0ee35f`) you're logged in as has **no cabins** (only 2 hostels) and **no payment modes** configured. The ISSM partner (`edb417fa`) is a different user who owns the cabins, receipts, and payment modes (ISSM IDFC, ISSM ICICI, H and L A/C, etc.).

The Bank Management page uses `getEffectiveOwnerId()` which returns the current user's ID. For admin, it returns the admin's own ID -- so it only shows the admin's hostels (7 receipts: Cash ₹5,000 + Online ₹5,160). The ISSM partner's data (554K+ in UPI, 105K in bank) is invisible to the admin.

### What needs to change

**1. Admin view should show ALL partners' data**

In `BankManagement.tsx`, when the user has the `admin` role:
- Fetch ALL cabins, hostels, mess, laundry (no `created_by` / `user_id` filter)
- Fetch ALL `partner_payment_modes` (no `partner_user_id` filter)
- This aggregates receipts and payment modes from every partner

**2. Partner view stays unchanged** -- shows only their own data via `getEffectiveOwnerId()`

**3. Same fix in `BankTransactionDetail.tsx`** -- admin should see all data there too

### Files Changed
- `src/pages/admin/BankManagement.tsx` -- detect admin role, remove owner filters for admin
- `src/pages/admin/BankTransactionDetail.tsx` -- same admin detection and unfiltered queries

### Technical Detail

```text
Current flow (admin):
  getEffectiveOwnerId() → admin's ID
  cabins.eq('created_by', adminId) → [] (no cabins)
  partner_payment_modes.eq('partner_user_id', adminId) → [] (no modes)
  Result: only hostel receipts with basic methods

Fixed flow (admin):
  Check user_roles for 'admin'
  If admin: cabins.select('id') (ALL), hostels.select('id') (ALL), etc.
  partner_payment_modes.select('*') (ALL)
  Result: all receipts from all partners with correct mode resolution
```

The UPI-to-bank linking UI is already implemented in `PaymentModesManager`. Once the admin can see the ISSM partner's modes, the "Linked Bank" dropdown on each UPI mode will be visible and functional.

