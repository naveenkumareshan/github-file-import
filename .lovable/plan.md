

# Plan: WhatsApp Contact in Complaint & Support Chats

## Overview
Add a WhatsApp contact button inside the `TicketChat` component so students can directly reach the property owner (for complaints) or the admin (for support tickets) via WhatsApp. Admin configures their support WhatsApp number in Site Settings. For complaints, the partner's existing WhatsApp number from the `partners` table is used.

## Database Changes

**Add admin support WhatsApp number to `site_settings`:**
- Insert a new row: `key = 'admin_whatsapp'`, `value = { number: '' }` into `site_settings` (using data insert, not migration).

No schema changes needed -- `site_settings` already exists with `key/value` structure, and `partners` already has `whatsapp_number`.

## Frontend Changes

### 1. `src/components/shared/TicketChat.tsx` — Add WhatsApp button
- Add two new optional props: `whatsappNumber?: string` and `whatsappLabel?: string` (e.g. "Chat with Property Owner" or "Chat with Support").
- When `whatsappNumber` is provided and non-empty, show a green WhatsApp button strip at the top of the chat area (below the header) with the label and a pre-drafted message like: "Hi, I have a complaint regarding [ticket subject]. Ticket ID: [serial_number]".
- Clicking opens `wa.me/{number}?text={encoded_message}`.

### 2. `src/components/profile/ComplaintsPage.tsx` — Pass partner WhatsApp number
- When a complaint is selected and has `cabin_id`, `hostel_id`, or `mess_id`, fetch the property owner's WhatsApp number:
  - For `cabin_id`: query `cabins` -> get `created_by` -> query `partners` for `whatsapp_number` where `user_id = created_by`.
  - For `hostel_id`: query `hostels` -> get `created_by` -> query `partners`.
  - For `mess_id`: query `mess_partners` -> get `user_id` -> query `partners`.
- Pass the resolved number to `TicketChat` as `whatsappNumber` with label "Chat with Property Owner".

### 3. `src/components/profile/SupportPage.tsx` — Pass admin WhatsApp number
- On mount or when a ticket is selected, fetch `site_settings` where `key = 'admin_whatsapp'` to get the admin's WhatsApp number.
- Pass it to `TicketChat` as `whatsappNumber` with label "Chat with Support".

### 4. `src/components/admin/SiteSettingsForm.tsx` — Admin WhatsApp number input
- Replace the current "WhatsApp Chat for Partners" info text with an "Admin Support WhatsApp Number" input field.
- On load, fetch from `site_settings` where `key = 'admin_whatsapp'`.
- On save, upsert to `site_settings`.

## Summary

| File | Change |
|------|--------|
| `src/components/shared/TicketChat.tsx` | Add optional `whatsappNumber` + `whatsappLabel` props, render WhatsApp contact strip |
| `src/components/profile/ComplaintsPage.tsx` | Fetch partner WhatsApp number from property -> partners, pass to TicketChat |
| `src/components/profile/SupportPage.tsx` | Fetch admin WhatsApp number from site_settings, pass to TicketChat |
| `src/components/admin/SiteSettingsForm.tsx` | Add admin WhatsApp number input field, save to site_settings |
| Data insert | Insert `admin_whatsapp` key into `site_settings` |

