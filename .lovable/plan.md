

## Add Split Payment to First-Time Bookings

Currently, split payment (via `SplitPaymentCollector`) is only used in due collection flows. The following first-time booking and renewal screens still use a single `PaymentMethodSelector` and need to be upgraded:

### Files to Change

| # | File | Context |
|---|------|---------|
| 1 | `src/pages/vendor/VendorSeats.tsx` | Reading room new booking (payment step ~lines 1888-1931) |
| 2 | `src/components/admin/RenewalSheet.tsx` | Reading room renewal (payment step ~lines 412-453) |
| 3 | `src/pages/admin/HostelBedMap.tsx` | Hostel new booking (payment step ~lines 2054-2088) |
| 4 | `src/pages/admin/MessBookings.tsx` | Mess new booking (payment step ~lines 908-939) |
| 5 | `src/pages/admin/HostelDueManagement.tsx` | Hostel due collection (~lines 463-492) |
| 6 | `src/pages/admin/MessDueManagement.tsx` | Mess due collection (~lines 400-416) |

### Pattern (same for each file)

**State change:** Replace `paymentMethod`, `transactionId`, `paymentProofUrl` states with a single `splits` state using `PaymentSplit[]` from `SplitPaymentCollector`.

**UI change:** Replace the `PaymentMethodSelector` + conditional `TransactionID` + `PaymentProofUpload` block with a single `<SplitPaymentCollector>` component, passing the total amount being collected.

**Submission change:** For first-time bookings, use the **first split's** method/txnId/proofUrl as the primary booking record (since the API expects a single payment method per booking call). If there are multiple splits, call the existing due-payment/receipt API for additional splits after the booking is created. For due collections (#5, #6), loop through splits calling the collect API once per split (same pattern already used in CheckInFinancials and DueManagement).

**Validation change:** Replace `paymentMethod !== 'cash' && !transactionId.trim()` checks with `validateSplits(splits, totalAmount) !== null`.

### Reset logic
On sheet open/close, reset splits to `[createDefaultSplit(totalAmount)]` instead of resetting individual method/txnId/proofUrl states.

