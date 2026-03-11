

# Move WhatsApp Chat Settings from Partner Profile to Per-Property Level

## What Changes

Currently WhatsApp number is stored once on the `partners` table and toggled per-property via `whatsapp_chat_enabled`. The user wants each property to have its **own WhatsApp number**, configured via a button beside "Pause" in the property cards.

## Database

Add `whatsapp_number text` column to `cabins` and `hostels` tables. The existing `whatsapp_chat_enabled` boolean on each table already controls visibility — now we pair it with a per-property number.

Migration:
- `ALTER TABLE cabins ADD COLUMN whatsapp_number text;`
- `ALTER TABLE hostels ADD COLUMN whatsapp_number text;`
- Backfill from partners table: `UPDATE cabins SET whatsapp_number = p.whatsapp_number FROM partners p WHERE cabins.created_by = p.user_id AND p.whatsapp_number IS NOT NULL;` (same for hostels)

## UI Changes

### 1. CabinItem & HostelItem — Add WhatsApp button beside Pause
- Add a small WhatsApp icon button (green `MessageCircle`) next to the Pause/Enable button
- Clicking opens a small dialog to set the WhatsApp number and toggle `whatsapp_chat_enabled` for that specific property
- Saves directly to the property's `whatsapp_number` and `whatsapp_chat_enabled` columns

### 2. Remove WhatsAppSettings from VendorProfile
- Remove the `<WhatsAppSettings />` component from `VendorProfile.tsx`
- Remove the import

### 3. Update WhatsAppChatButton
- Instead of fetching the partner's WhatsApp number from the `partners` table, accept `whatsappNumber` as a prop directly (passed from the property data already fetched on BookSeat/HostelRoomDetails/MessDetail pages)
- Simplifies the component — no extra API call needed

### 4. Update consumer pages (BookSeat, HostelRoomDetails, MessDetail)
- Pass the property's `whatsapp_number` directly to `WhatsAppChatButton`
- Already fetching property data which will now include `whatsapp_number`

## Files Modified
- `supabase/migrations/` — new migration
- `src/components/admin/CabinItem.tsx` — add WhatsApp config button + dialog
- `src/components/admin/HostelItem.tsx` — add WhatsApp config button + dialog
- `src/pages/vendor/VendorProfile.tsx` — remove WhatsAppSettings
- `src/components/WhatsAppChatButton.tsx` — accept number as prop, remove partner lookup
- `src/pages/BookSeat.tsx` — pass whatsapp_number from cabin data
- `src/pages/HostelRoomDetails.tsx` — pass whatsapp_number from hostel data
- `src/pages/MessDetail.tsx` — pass whatsapp_number from mess data (if applicable)

