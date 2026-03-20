

## Merge UPI Transactions into Linked Bank Accounts

### What's Changing

UPI is just a payment channel tied to a bank account. When a UPI mode has a `linked_bank_id` pointing to a bank_transfer mode, its transactions should appear under that bank account's balance — not as a separate UPI entry. The separate UPI tab will remain only for UPI modes that are **not** linked to any bank.

The `linked_bank_id` column already exists on `partner_payment_modes` and the PaymentModesManager already lets partners link UPI modes to banks. The only change needed is in how `BankManagement.tsx` groups and displays receipts.

### Changes

**File: `src/pages/admin/BankManagement.tsx`**

1. **Expand `PaymentMode` interface** to include `linked_bank_id: string | null`

2. **Fetch `linked_bank_id`** in the payment modes query (add it to the select)

3. **Update `modeLookup`** to include `linked_bank_id` data

4. **New grouping logic** — replace the separate `resolveType`-based grouping with a unified approach:
   - For UPI receipts where the UPI mode has a `linked_bank_id`: resolve the linked bank mode's label and group under that bank
   - For UPI receipts where no `linked_bank_id`: keep in UPI tab as before
   - Bank and Cash remain unchanged

5. **Merge `bankBalances` computation**: When computing bank balances, also include UPI receipts whose mode has a `linked_bank_id` pointing to a bank_transfer mode. The bank row will show combined total (bank + UPI) and all transactions together.

6. **Update `upiBalances`**: Only include UPI receipts whose mode does NOT have a `linked_bank_id`

7. **Update totals**: `totalBank` will now include linked-UPI amounts; `totalUpi` only shows unlinked UPI

8. **Detail page consistency**: The `BankTransactionDetail.tsx` page uses the same grouping logic, so the label-based navigation will work correctly since linked UPI receipts will be grouped under the bank label

### Summary
- 1 file edited: `src/pages/admin/BankManagement.tsx`
- UPI transactions with `linked_bank_id` merge into their parent bank's balance and transaction list
- Unlinked UPI modes continue showing in the UPI tab
- Historical/old transactions are automatically corrected since this is a display-layer change

