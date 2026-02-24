

## Discount, Payment Methods & Transaction ID Tracking

Add partner discount, 4 payment collection methods, and require transaction ID for UPI/Bank Transfer before confirming booking.

---

### Database Changes

Add 5 new columns to `bookings` table:

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `discount_amount` | numeric | 0 | Flat rupee discount applied by partner |
| `discount_reason` | text | '' | Why the discount was given |
| `payment_method` | text | 'online' | How payment was collected: `send_link`, `cash`, `upi`, `bank_transfer` |
| `collected_by` | uuid (nullable) | null | User ID of who collected payment |
| `collected_by_name` | text | '' | Display name: "InhaleStays" / partner name / employee name |
| `transaction_id` | text | '' | UPI or bank transfer transaction reference ID |

---

### Payment Method Options

| Option | Payment Status | Collected By | Transaction ID |
|--------|---------------|-------------|----------------|
| **Send Payment Link (InhaleStays)** | `pending` | "InhaleStays" | Not required |
| **Cash** | `completed` | Partner/Employee name | Not required |
| **PhonePe / UPI** | `completed` | Partner/Employee name | **Required** |
| **Bank Transfer** | `completed` | Partner/Employee name | **Required** |

---

### Booking Form Flow (Updated)

After student, plan, dates, price, discount, and locker selection:

1. **Discount Section** - Flat rupee discount input + optional reason field. Total recalculates instantly: `seatPrice - discount + locker`.

2. **Payment Method Selector** - Radio-style selection of 4 options.

3. **Transaction ID Field** - Appears ONLY when UPI or Bank Transfer is selected. Required field -- booking cannot be confirmed without it.

4. **Confirm Booking** button text changes based on method:
   - "Send Payment Link" for link option
   - "Confirm Booking (Cash)" for cash
   - "Confirm Booking (UPI)" for UPI
   - "Confirm Booking (Bank Transfer)" for bank

---

### Collection Logic

The system auto-determines `collected_by_name`:
- **Send Link**: "InhaleStays", `payment_status = 'pending'`
- **Cash / UPI / Bank Transfer**: Current user's profile name from `useAuth()`, `payment_status = 'completed'`

---

### Display Updates

In the booking detail cards (current/future bookings in the Sheet drawer), show:
- Discount amount and reason (if any)
- Payment method
- Collected by name
- Transaction ID (for UPI/Bank Transfer)

---

### Technical Changes

| File | Change |
|------|--------|
| **DB Migration** | Add 6 columns to `bookings`: `discount_amount`, `discount_reason`, `payment_method`, `collected_by`, `collected_by_name`, `transaction_id` |
| **`src/api/vendorSeatsService.ts`** | Update `PartnerBookingData` interface with new fields. Update `createPartnerBooking` to insert them. Update `SeatBookingDetail` and `mapBookingToDetail` to read them back. |
| **`src/pages/vendor/VendorSeats.tsx`** | Add discount inputs, payment method radio selector, conditional transaction ID field, updated total calculation, updated confirm button, display new fields in booking cards |

