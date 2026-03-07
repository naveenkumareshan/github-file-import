

# Plan: Per-Property WhatsApp Toggle by Admin

## Overview
Replace the global WhatsApp toggle with per-property control. Admin can enable/disable WhatsApp chat for each Reading Room, Hostel, and Mess individually from the Partner Management expanded property rows. Properties under a universal (Diamond) subscription get auto-enabled.

## Database Changes

### Migration
```sql
-- Add whatsapp_chat_enabled to cabins, hostels, mess_partners
ALTER TABLE cabins ADD COLUMN whatsapp_chat_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE hostels ADD COLUMN whatsapp_chat_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE mess_partners ADD COLUMN whatsapp_chat_enabled boolean NOT NULL DEFAULT false;
```

No changes to `site_settings` table (keep it but stop using the global toggle for WhatsApp). The per-property column replaces the global check.

## Frontend Changes

### 1. `src/components/WhatsAppChatButton.tsx`
- Remove the `whatsappLeadService.getSiteWhatsappEnabled()` call.
- Add a new prop `whatsappChatEnabled: boolean` passed from the parent page.
- Show the button only when `whatsappChatEnabled && partnerData?.whatsapp_enabled && partnerData.whatsapp_number`.

### 2. `src/pages/BookSeat.tsx`
- Include `whatsapp_chat_enabled` in the cabin data fetch (already fetching from `cabins` table).
- Pass `whatsappChatEnabled={cabin.whatsappChatEnabled}` to `WhatsAppChatButton`.

### 3. `src/pages/HostelRoomDetails.tsx`
- Include `whatsapp_chat_enabled` in the hostel fetch.
- Pass prop to `WhatsAppChatButton`.

### 4. `src/pages/MessDetail.tsx`
- Include `whatsapp_chat_enabled` in the mess fetch.
- Pass prop to `WhatsAppChatButton`.

### 5. `src/components/admin/VendorApproval.tsx` — Add WhatsApp toggle per property
- Fetch `whatsapp_chat_enabled` alongside existing property data in `fetchProperties`.
- Add `whatsapp_chat_enabled` to `PropertyInfo` interface.
- In both mobile card and desktop table rows, add a WhatsApp toggle `Switch` per property.
- On toggle change, update the corresponding table (`cabins`/`hostels`/`mess_partners`) directly.
- Add a "WhatsApp" column header in the desktop table.

### 6. `src/components/admin/SiteSettingsForm.tsx`
- Remove the global WhatsApp toggle section (or keep it as informational, noting it's now per-property).

### 7. Auto-enable for universal subscribers
- In `VendorApproval.tsx`, when fetching properties, also check if the partner has an active universal subscription. If so, show the WhatsApp toggle as enabled/auto and optionally auto-enable on property approval.
- Alternatively, in `WhatsAppChatButton`, add a check: if the property's partner has an active universal subscription, treat `whatsapp_chat_enabled` as true regardless. This is simpler but adds an extra query.
- **Recommended approach**: Keep it simple — admin manually enables WhatsApp per property, but for universal plan partners, show a badge/note indicating they qualify. Admin still controls the toggle.

### 8. `src/api/whatsappLeadService.ts`
- Remove `getSiteWhatsappEnabled()` and `setSiteWhatsappEnabled()` methods (no longer needed).
- Add `getPropertyWhatsappEnabled(propertyType, propertyId)` if needed, or just rely on the prop passed from parent.

| File | Change |
|------|--------|
| Migration | Add `whatsapp_chat_enabled` to `cabins`, `hostels`, `mess_partners` |
| `src/components/WhatsAppChatButton.tsx` | Accept `whatsappChatEnabled` prop, remove global check |
| `src/pages/BookSeat.tsx` | Fetch & pass `whatsapp_chat_enabled` |
| `src/pages/HostelRoomDetails.tsx` | Fetch & pass `whatsapp_chat_enabled` |
| `src/pages/MessDetail.tsx` | Fetch & pass `whatsapp_chat_enabled` |
| `src/components/admin/VendorApproval.tsx` | Add per-property WhatsApp toggle in expanded rows |
| `src/components/admin/SiteSettingsForm.tsx` | Remove global WhatsApp toggle |
| `src/api/whatsappLeadService.ts` | Remove global setting methods |

