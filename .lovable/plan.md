
# Show Last 2 Bookings from Both Reading Rooms and Hostels (Mixed)

## What Changes
Currently the Profile page only shows the 2 most recent **reading room** bookings. The user wants to see the 2 most recent bookings overall -- mixing both reading room (`bookings` table) and hostel (`hostel_bookings` table) bookings, sorted by `created_at` descending.

## How It Works

### File: `src/components/profile/ProfileManagement.tsx`

**Change 1: Update `loadBookings` to fetch both sources**

- Fetch reading room bookings (existing logic) and hostel bookings in parallel
- For hostel bookings: query `hostel_bookings` with joined `hostels(name)`, filtered by `user_id`, ordered by `created_at desc`
- Normalize both into a common shape with a `type` field (`'reading_room'` or `'hostel'`)
- Merge, sort by `created_at` descending, take first 2
- Then fetch dues for reading room bookings and hostel_dues for hostel bookings as before

**Change 2: Update the booking card rendering**

- For reading room bookings: show cabin name + seat number (existing)
- For hostel bookings: show hostel name + bed/room info
- Link reading room bookings to `/student/bookings/:id` and hostel bookings to `/student/hostel-bookings/:id`
- Badge logic remains the same but uses `status` for hostel bookings and `payment_status` for reading room bookings

### Technical Details

```typescript
const loadBookings = async () => {
  try {
    // Fetch both in parallel
    const [readingRes, hostelRes] = await Promise.all([
      bookingsService.getUserBookings(),
      supabase.from('hostel_bookings')
        .select('*, hostels(name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(2)
    ]);

    // Normalize reading room bookings
    const readingBookings = (readingRes.success && Array.isArray(readingRes.data))
      ? readingRes.data.map(b => ({ ...b, type: 'reading_room' }))
      : [];

    // Normalize hostel bookings
    const hostelBookings = (hostelRes.data || []).map(b => ({
      ...b,
      type: 'hostel',
      payment_status: b.status, // map status -> payment_status for badge logic
    }));

    // Merge, sort by created_at desc, take 2
    const merged = [...readingBookings, ...hostelBookings]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2);

    // Fetch dues for reading room bookings in merged list
    // Fetch hostel_dues for hostel bookings in merged list
    // ... (attach dueAmount as before)

    setBookings(merged);
  } finally {
    setLoadingBookings(false);
  }
};
```

Rendering update -- show hostel name for hostel type:
```tsx
<p className="text-[12px] font-semibold text-foreground truncate">
  {b.type === 'hostel'
    ? `${(b.hostels as any)?.name || 'Hostel'} — Bed #${b.bed_number || '—'}`
    : `${(b.cabins as any)?.name || 'Reading Room'} — Seat #${b.seat_number || '—'}`}
</p>
```

Link destination based on type:
```tsx
<Link key={b.id} to={b.type === 'hostel' ? `/student/hostel-bookings/${b.id}` : `/student/bookings/${b.id}`}>
```

No database changes needed.
