

# Property-Specific Serial Numbers for Bookings, Receipts, and Dues

## Format
Each property gets a unique number. Serial numbers follow:
```text
IS-{PropertyNum}-{TypeCode}-{EntityCode}-{Increment}

Examples:
  Property #3 (Reading Room):
    Booking:  IS-00003-RR-BK-00001
    Receipt:  IS-00003-RR-RC-00001
    Due:      IS-00003-RR-DU-00001

  Property #7 (Hostel):
    Booking:  IS-00007-HS-BK-00001
    Receipt:  IS-00007-HS-RC-00001

  Property #12 (Mess):
    Subscription: IS-00012-M-BK-00001
    Receipt:      IS-00012-M-RC-00001

  Property #15 (Laundry):
    Order:    IS-00015-L-BK-00001
    Receipt:  IS-00015-L-RC-00001
```

Type codes: **RR** (Reading Room), **HS** (Hostel), **M** (Mess), **L** (Laundry)
Entity codes: **BK** (Booking/Subscription/Order), **RC** (Receipt), **DU** (Dues)

## Database Changes (Single Migration)

### 1. Shared sequence + property_number column
- Create sequence `property_number_seq`
- Add `property_number integer DEFAULT nextval('property_number_seq')` to: `cabins`, `hostels`, `mess_partners`, `laundry_partners`
- Backfill existing rows ordered by `created_at`

### 2. New function: `generate_property_serial(p_property_id uuid, p_property_table text, p_type_code text, p_entity_code text)`
- Looks up `property_number` from the appropriate table
- Uses `serial_counters` with composite key `{property_number}-{type_code}-{entity_code}` as entity_type
- Returns `IS-{padded_prop_num}-{type_code}-{entity_code}-{padded_seq}`

### 3. Update 12 trigger functions
Each trigger now calls `generate_property_serial` instead of `generate_serial_number`:

| Table | Property FK | Type | Entity |
|-------|-----------|------|--------|
| `bookings` | `cabin_id` → cabins | RR | BK |
| `receipts` | `cabin_id` → cabins | RR | RC |
| `dues` / `due_payments` | `cabin_id` → cabins | RR | DU |
| `hostel_bookings` | `hostel_id` → hostels | HS | BK |
| `hostel_receipts` | `hostel_id` → hostels | HS | RC |
| `hostel_dues` | `hostel_id` → hostels | HS | DU |
| `mess_subscriptions` | `mess_id` → mess_partners | M | BK |
| `mess_receipts` | `mess_id` → mess_partners | M | RC |
| `mess_dues` | `mess_id` → mess_partners | M | DU |
| `laundry_orders` | `laundry_partner_id` → laundry_partners | L | BK |
| `laundry_receipts` | `laundry_partner_id` → laundry_partners | L | RC |
| `laundry_complaints` | keep existing global serial (not property-scoped) |

### 4. Keep existing global serials untouched
- Properties themselves (cabins, hostels, etc.) keep their current IS-ROOM/IS-INSH serials
- Profiles, complaints, support tickets, settlements, attendance — unchanged
- Existing serial numbers on old bookings/receipts are NOT re-numbered (only new ones get the new format)

## No Frontend Changes Needed
Serial numbers are stored as strings and displayed as-is everywhere. The new format will just render differently. No code changes required in any of the 71+ files that display `serial_number`.

## Files Modified
- **1 database migration** — all schema + function + trigger changes in a single SQL migration

