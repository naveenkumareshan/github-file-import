

# Add WhatsApp Lead Click Count to Partner Property Dialog

## Plan

Show the number of WhatsApp clicks (leads) per property inside the `WhatsAppPropertyDialog` so partners can track how many students clicked the "Contact Property on WhatsApp" button.

## Changes

### `src/components/admin/WhatsAppPropertyDialog.tsx`
- When the dialog opens and fetches current settings, also query `whatsapp_clicks` table filtered by `property_id` to get the count
- Display the count as a small info line inside the dialog, e.g. "12 students clicked WhatsApp on this property"
- Show below the toggle/number fields, before the Save button
- Use `supabase.from('whatsapp_clicks').select('*', { count: 'exact', head: true }).eq('property_id', propertyId)` to get the count

This is a single-file change. No new tables or migrations needed — the `whatsapp_clicks` table already has `property_id`.

