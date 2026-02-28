

## Check-in Tracker Enhancements

Three improvements to the Check-in Tracker on the Operations page.

---

### 1. Add "View Details" and "Upload Document" buttons per row

Each booking row will get two new action buttons alongside "Mark Reported":
- **View Details**: Links to the existing admin booking view page (`/admin/bookings/:bookingId`)
- **Upload Document**: Opens a dialog to upload files (Aadhar, signed forms, etc.) to a dedicated storage bucket

**Storage setup** (new migration):
- Create a `checkin-documents` storage bucket (public: false)
- Add RLS policies for authenticated users to upload/read
- Add a `check_in_documents` JSONB column to both `bookings` and `hostel_bookings` tables to store file references (array of `{name, path, uploaded_at}`)

**Upload Dialog**: Simple file input allowing multiple files. On upload, files are stored to `checkin-documents/{booking_id}/{filename}` and references saved to the `check_in_documents` column. Already-uploaded docs shown as a list with download links.

---

### 2. Filter to only today and yesterday start dates

Currently the query fetches ALL unreported bookings regardless of start date. Change the queries to filter:
- `start_date` equals today OR yesterday only
- This keeps the page focused on "today's arrivals" and "yesterday's no-shows"

Update both the reading room and hostel booking queries to add `.in('start_date', [today, yesterday])` filter.

---

### 3. Show today's already-reported people

Add a new section below the pending table: "Reported Today" -- showing bookings where `checked_in_at` was set today.

- New query fetching bookings where `checked_in_at >= start of today` 
- Displayed in a separate collapsed/expandable table with a green header
- Shows: Student, Room/Seat, Start Date, Payment, Reported Time, Notes
- Read-only (no actions needed since already reported)

---

### Technical Changes

**New migration (1)**:
```text
- Create storage bucket 'checkin-documents' (private)
- RLS: authenticated users can upload and read
- Add check_in_documents jsonb column to bookings and hostel_bookings
```

**Modified file: `src/components/admin/operations/CheckInTracker.tsx`**:
1. Add date filter (today + yesterday) to both RR and hostel queries
2. Add new query for "reported today" bookings (checked_in_at >= today)
3. Add "View Details" button linking to `/admin/bookings/:id`
4. Add "Upload Docs" button opening an upload dialog
5. Add "Reported Today" expandable section at the bottom with a collapsible table
6. Upload dialog: file input, upload to storage, save references to check_in_documents column

