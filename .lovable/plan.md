

## Two-Part Plan: Universal Serial Numbers + Remove Jiya Chatbot

---

### Part 1: Universal Digital Serial Number System (IS- format)

Add a `serial_number` column to all major tables and auto-generate serial numbers using database triggers in the format `IS-ENTITY-YYYY-XXXXX`.

#### Database Changes (Migration)

1. **Create a `serial_counters` table** to track the next sequence number per entity type per year:

```text
serial_counters
  - entity_type (text, e.g. 'CUST', 'BOOK')
  - year (integer, e.g. 2026)
  - current_seq (integer, starts at 0)
  - PRIMARY KEY (entity_type, year)
```

2. **Create a `generate_serial_number` function** that atomically increments the counter and returns a formatted string like `IS-BOOK-2026-00001`.

3. **Add `serial_number` column** (text, unique) to these tables:
   - `profiles` (IS-CUST)
   - `cabins` (IS-ROOM) -- Reading Rooms
   - `bookings` (IS-BOOK)
   - `complaints` (IS-CMPL)
   - `support_tickets` (IS-TCKT)

4. **Create `BEFORE INSERT` triggers** on each table that auto-populate the `serial_number` column using the function.

5. **Backfill existing rows** with serial numbers so current data also gets formatted IDs.

#### Frontend Changes

Display `serial_number` alongside or in place of raw UUIDs in:

- **`src/components/admin/AdminBookingsList.tsx`** -- Show serial number in the bookings table
- **`src/components/admin/ComplaintsManagement.tsx`** -- Show serial number in the complaints table
- **`src/components/admin/SupportTicketsManagement.tsx`** -- Show serial number in the support tickets table
- **`src/components/booking/BookingsList.tsx`** (student view) -- Show serial number on booking cards
- **`src/components/booking/BookingTransactionView.tsx`** -- Show serial number in details
- **`src/components/admin/AdminBookingsList.tsx`** -- Show customer serial number
- **`src/pages/AdminStudents.tsx`** or user listing components -- Show IS-CUST serial numbers
- **`src/components/profile/ComplaintsPage.tsx`** -- Student-side complaint serial numbers
- **`src/components/profile/SupportPage.tsx`** -- Student-side support ticket serial numbers

The serial numbers will be fetched automatically since they come as columns from the database queries. Minimal query changes are needed.

---

### Part 2: Remove Jiya Chatbot Completely

Remove all Jiya chatbot code and references across the entire codebase.

#### Files to Delete
- `src/components/JiyaChatbot/ChatbotButton.tsx`
- `src/components/JiyaChatbot/ChatbotDialog.tsx`
- `src/components/JiyaChatbot/ChatMessage.tsx`
- `src/components/JiyaChatbot/index.ts`
- `src/components/admin/JiyaChats.tsx`
- `src/components/admin/ChatManagement.tsx`
- `public/jiya.jpg`

#### Files to Edit
- **`src/components/student/MobileAppLayout.tsx`** -- Remove ChatbotButton import and usage (lines 8, 61-64)
- **`src/App.tsx`** -- Remove ChatbotButton lazy import (line 19)
- **`src/pages/HostDashboard.tsx`** -- Remove ChatManagement import and usage
- **`src/components/admin/CustomerComplaints.tsx`** -- Remove "Jiya Chatbot" source reference from mock data

---

### Summary of Changes

| Area | Action |
|------|--------|
| Database | 1 new table, 1 function, 5 triggers, 5 new columns |
| Frontend (serial numbers) | ~8-10 files updated to display serial numbers |
| Jiya removal | 7 files deleted, 4 files edited |

