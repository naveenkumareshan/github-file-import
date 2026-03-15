

## Add WhatsApp Button to Support Page Header

### Change
Add a small WhatsApp button in the sticky header bar of `SupportPage.tsx` (next to the "New Ticket" button). It uses the already-loaded `adminWhatsapp` number. Clicking opens WhatsApp with a pre-filled support message.

### File
- `src/components/profile/SupportPage.tsx` — Add a green WhatsApp icon button in the header bar, visible only when `adminWhatsapp` is set. Opens `https://wa.me/{number}?text=...` in a new tab.

