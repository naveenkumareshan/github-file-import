

## Add Phone and Email Alongside Student Names

Wherever a student name is displayed in admin pages, ensure phone number and email are also shown. Here are the files that need updates:

### Files to Update

**1. ComplaintsManagement.tsx (line 137)**
- Table row currently shows only `(c.profiles as any)?.name`
- Add phone and email below the name in the table cell

**2. SupportTicketsManagement.tsx (line 120)**
- Table row currently shows only `(t.profiles as any)?.name`
- Add phone and email below the name in the table cell

**3. DashboardExpiringBookings.tsx (line 82)**
- Currently shows only `booking.studentName`
- Add phone and email (requires checking if `studentPhone`/`studentEmail` fields exist in the API response, or adding them)

**4. DueManagement.tsx (line 207-208)**
- Currently shows name and phone but missing email
- Add email line: `(due.profiles as any)?.email`

**5. Receipts.tsx (line 242-243)**
- Currently shows name and phone but missing email
- Add email from profile data (need to also fetch email in the profiles query at line 79)

**6. SeatTransferManagement.tsx (line 418-419)**
- Currently shows name and email but missing phone
- Add phone line (requires the `userId` interface to include `phone`)

**7. BookingTransactions.tsx (line 61-65)**
- Currently shows name and email but missing phone
- Add phone line below email

### Technical Details

- For components using Supabase `profiles` join (Complaints, Support Tickets): the query already selects `name, email, phone`, so phone and email are available -- just need to display them
- For Receipts: update the profiles query to also select `email`, and add `studentEmail` to the mapped data
- For DashboardExpiringBookings: check if the API response includes phone/email; if not, display what's available
- For SeatTransferManagement and BookingTransactions: these use backend API data; display phone if available in the response
- Pattern: show name in bold, then phone and email in smaller muted text below, consistent with AdminBookingsList

