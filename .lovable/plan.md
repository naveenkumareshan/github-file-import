

# Fix: Booking Receipt Emails Not Being Sent

## Problem
The current email system (`bookingEmailService` → `jobProcessingService` → `axios`) tries to call an old Node.js backend at `localhost:5000/api` which doesn't exist. This means **no booking receipt emails are ever sent** — the calls silently fail.

Additionally, most booking flows (VendorSeats, HostelBedMap, RenewalSheet, CheckInFinancials due collection) don't even attempt to send emails.

## Prerequisite: Email Domain Setup
This project has a custom domain (`inhalestays.com`) but **no email domain is configured yet**. Before emails can be sent, you need to set up your sender domain. This is a one-time setup.

<lov-actions>
<lov-open-email-setup>Set up email domain</lov-open-email-setup>
</lov-actions>

**Once the email domain is configured**, I'll implement the following:

## Changes

### 1. Create `send-booking-receipt` Edge Function
- New edge function at `supabase/functions/send-booking-receipt/index.ts`
- Uses Lovable's transactional email system to send receipt emails
- Accepts booking details (student name/email, seat/bed info, dates, amounts, payment method, serial number)
- Sends a branded HTML email receipt with all booking/payment details

### 2. Replace Old Email Service
- Rewrite `src/api/bookingEmailService.ts` to call the new edge function via `supabase.functions.invoke('send-booking-receipt', ...)` instead of the dead axios/job API
- Keep the same interface so existing callers don't break

### 3. Add Email Triggers to All Booking Flows
Currently only `ManualBookingManagement` calls the email service. Add fire-and-forget email calls to:
- **VendorSeats** — after `createPartnerBooking` succeeds (reading room bookings)
- **HostelBedMap** — after hostel booking creation succeeds
- **RenewalSheet** — after renewal booking succeeds
- **Due collection flows** — after due payment is collected (receipt email for payment received)

### 4. Email Content
Each receipt email will include:
- Receipt serial number
- Student name
- Property name, seat/bed number
- Booking period (start → end date)
- Price breakdown (seat amount, discount, total)
- Amount paid, payment method
- Collected by name
- Due balance (if advance payment)

## Files Modified
- **New**: `supabase/functions/send-booking-receipt/index.ts`
- **Rewrite**: `src/api/bookingEmailService.ts` — use edge function instead of axios
- **Edit**: `src/pages/vendor/VendorSeats.tsx` — add email trigger after booking
- **Edit**: `src/pages/admin/HostelBedMap.tsx` — add email trigger after booking + due collection
- **Edit**: `src/components/admin/RenewalSheet.tsx` — add email trigger after renewal
- **Edit**: `src/components/admin/operations/CheckInFinancials.tsx` — add email trigger after due collection

