

# Move WhatsApp Button From Floating to Inline "Contact Property" Section

## Problem
The floating WhatsApp button at the bottom-right corner looks like a generic customer support widget, confusing students. It should be placed inline within the property details so students clearly understand it's for contacting that specific property.

## Changes

### 1. Remove floating `WhatsAppChatButton` from all three student pages
- `src/pages/BookSeat.tsx` — remove the `<WhatsAppChatButton>` at line 446
- `src/pages/HostelRoomDetails.tsx` — remove the `<WhatsAppChatButton>` at line 1077
- `src/pages/MessDetail.tsx` — remove the `<WhatsAppChatButton>` at line 611

### 2. Add inline "Contact Property" button inside `CabinDetails.tsx`
- Accept new props: `whatsappChatEnabled`, `whatsappNumber`, `partnerUserId`, `propertyId`
- After the Amenities section (line ~165), add a "Contact Property" section:
  - Green button with WhatsApp icon + "Contact Property on WhatsApp" text
  - Only renders when `whatsappChatEnabled && whatsappNumber` are truthy
  - Calls `whatsappLeadService.trackClick()` on click, then opens `wa.me` link

### 3. Add inline "Contact Property" button in `HostelRoomDetails.tsx`
- Place the button inline within the hostel details card (near the description/amenities area), not as a floating element
- Same green styled button with clear "Contact Property on WhatsApp" label

### 4. Add inline "Contact Property" button in `MessDetail.tsx`
- Same pattern — place within the mess detail content area

### 5. Keep `WhatsAppChatButton` component
- The floating component file stays for potential future use but is no longer imported in student pages

## Result
Students see a clear, labeled "Contact Property on WhatsApp" button within the property details — no confusion with a support chatbot.

## Files Modified
- `src/components/CabinDetails.tsx` — add inline WhatsApp contact button + new props
- `src/pages/BookSeat.tsx` — remove floating button, pass WhatsApp props to CabinDetails
- `src/pages/HostelRoomDetails.tsx` — remove floating, add inline button
- `src/pages/MessDetail.tsx` — remove floating, add inline button

