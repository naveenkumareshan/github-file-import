

# Fix Share Links to Show Clean, Readable URLs

## Problem
When sharing a reading room via WhatsApp, the URL shows ugly raw UUIDs:
```
inhalestays.com/book-seat/5de17f48-a577-4aeb-bd5e-316be04dcc95?ref=254ef4a6-94a7-4c06-91f7-895aa02e0657
```
It should look like:
```
inhalestays.com/book-seat/IS-ROOM-2026-00004?ref=IS-ROOM-2026-00004
```

## Root Cause
All cabins DO have serial numbers (e.g., `IS-ROOM-2026-00004`) in the database, but the `BookSeat.tsx` page never maps `d.serial_number` into the cabin state object. So when generating the share text, `cabin.serialNumber` is `undefined` and it falls back to the raw UUID.

The `?ref=` parameter also uses the full user UUID, making the URL even longer.

## Changes

### File 1: `src/pages/BookSeat.tsx`
- Add `serialNumber: (d as any).serial_number || undefined` to the cabin state mapping (around line 176), so the serial number is available when generating the share URL.

### File 2: `src/utils/shareUtils.ts`
- Shorten the `?ref=` parameter by using only the first 8 characters of the user ID (enough to be unique for referral tracking while keeping URLs clean).
- Update `buildUrl` function:
  ```
  const shortRef = userId ? userId.substring(0, 8) : undefined;
  return shortRef ? `${base}?ref=${shortRef}` : base;
  ```

### File 3: `src/hooks/useReferralCapture.ts`
- Update the referral capture logic to store the shortened ref value (no code change needed since it just stores whatever is in the `ref` param -- but the backend referral tracking should match on prefix if needed).

After these changes, shared URLs will look like:
```
inhalestays.com/book-seat/IS-ROOM-2026-00004?ref=254ef4a6
```

This is clean, readable, and immediately tells the recipient what room is being shared.

