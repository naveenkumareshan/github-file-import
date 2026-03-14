

# Fix: WhatsApp Button Not Showing on Student Cabin (Reading Room) Page

## Problem

The `WhatsAppChatButton` component is already present on all three student property pages (BookSeat, HostelRoomDetails, MessDetail). However, on the **cabin/reading room page** (`BookSeat.tsx`), the `whatsapp_number` field is never mapped from the database response — it's always passed as an empty string. Since the button requires both `whatsappChatEnabled` AND `whatsappNumber` to be truthy, it never renders.

Hostel and Mess pages work correctly because they pass `(hostel as any).whatsapp_number` directly from the raw query data.

## Fix

**File: `src/pages/BookSeat.tsx`**

1. Add `whatsappNumber` to the `Cabin` interface (around line 68)
2. Map `whatsapp_number` from the database response when building the cabin object (around line 183, alongside the existing `whatsappChatEnabled` mapping):
   ```
   whatsappNumber: (d as any).whatsapp_number || '',
   ```
3. Update the `WhatsAppChatButton` usage (line 450) to use `cabin.whatsappNumber` instead of `(cabin as any).whatsappNumber`

This is a one-file, three-line fix. No other changes needed — hostel and mess pages already work correctly.

