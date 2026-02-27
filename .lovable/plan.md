

## Add Sharing Type Display and Security Deposit Collection to Hostel Bed Map Booking

### Changes to `src/pages/admin/HostelBedMap.tsx`

### 1. Show Sharing Type in Booking Flow

The `selectedBed.sharingType` is already available but not displayed. It will be added to:

- **Sheet header** (line ~1005): Show sharing type badge next to category badge
- **Booking confirmation summary** (line ~1324): Add sharing type row in the confirmation details
- **Booking success view** (line ~1111): Add sharing type in the confirmed booking summary
- **Current bookings list**: Show sharing type if available from the booking data

### 2. Security Deposit Collection Option

Currently, security deposit is saved as `hostel?.security_deposit || 0` but the admin cannot see or edit it during booking. Changes:

- **Add state variable**: `securityDeposit` (editable number input, pre-filled from hostel config)
- **Add toggle + editable input** in the booking form (after the Partial Payment section): "Collect Security Deposit" checkbox with an editable amount field (pre-filled with hostel's `security_deposit` value)
- **Show in booking summary**: Display security deposit as a separate line item below Total
- **Show in confirmation step**: Include security deposit amount
- **Show in success view**: Include security deposit collected
- **Update booking insert**: Use the edited security deposit value instead of the hostel default
- **Update receipt amount**: Add security deposit to the receipt amount when collected
- **Grand total display**: Show "Total + Security Deposit = Grand Total" so admin sees the full collection amount

### Visual Layout (Booking Form)

```text
Bed Amount                    5000
Discount          [amt] [reason]
----
Total                         5000

[x] Collect Security Deposit
    Amount: [500]  (editable, pre-filled from hostel config)

[ ] Partial Payment (Collect Less)

[Book Bed]
```

### Visual Layout (Confirmation)

```text
Student:        John Doe
Phone:          9876543210
----
Bed:            #7 - Room 201 - Inhale Stays
Sharing Type:   4-Sharing
Period:         27 Feb -> 27 Mar 2026
----
Bed Amount:                   5000
Total:                        5000
Security Deposit:              500
----
Grand Total:                  5500
```

### Data Changes

- `security_deposit` in the booking insert will use the edited value
- Receipt amount will include security deposit when the toggle is on
- `lastBookingInfo` will include `securityDeposit` and `sharingType` for the success view

