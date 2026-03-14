

# Add WhatsApp Click Count Badge on Property Cards

Show the WhatsApp lead click count as a small badge on the top-right corner of the WhatsApp button in property cards, so partners can see lead counts at a glance without opening the dialog.

## Changes

### 1. `src/components/admin/CabinItem.tsx`
- Import `useQuery` and `supabase`
- Fetch click count from `whatsapp_clicks` table filtered by `property_id = cabin._id`
- Wrap the WhatsApp `<Button>` in a `relative` container and add a small red/primary badge showing the count (only if > 0) positioned at top-right corner

### 2. `src/components/admin/HostelItem.tsx`
- Same pattern: fetch click count for `property_id = hostel.id`
- Add the badge on the WhatsApp button

### Result
Partners see a small number badge (e.g., "5") on the WhatsApp button corner across all property cards, giving instant visibility into lead engagement.

## Files Modified
- `src/components/admin/CabinItem.tsx`
- `src/components/admin/HostelItem.tsx`

