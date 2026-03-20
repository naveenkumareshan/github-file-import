## ✅ Fixed: Separate Locker & Security Deposit from Seat/Bed Fees

### Solution Applied
Replaced broken PostgREST joins (no FK exists) with manual JS-side lookup maps. All receipts now use `booking_id` to look up the associated booking's locker/security data and split amounts proportionally. This works for all periods including backdated/historical data.
