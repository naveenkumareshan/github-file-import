
# Fix Payment Failures: Razorpay Receipt Length Error

## Root Cause

The edge function logs show the exact error:

```
receipt: the length must be no more than 40.
```

In `razorpay-create-order/index.ts`, the receipt is set as `booking_${bookingId}` where `bookingId` is a UUID (36 chars). This makes the receipt **44 characters**, exceeding Razorpay's **40-character limit**.

This causes all payments (initial booking payments AND due payments) to fail with "Edge Function returned a non-2xx status code."

## Fix

### File: `supabase/functions/razorpay-create-order/index.ts` (line 76)

Change the receipt field to use a shortened ID:

```
Before: receipt: `booking_${bookingId}`        // 44 chars - FAILS
After:  receipt: `bk_${bookingId.replace(/-/g, '').slice(0, 36)}`  // 39 chars - OK
```

This strips hyphens from the UUID and truncates to fit within Razorpay's 40-char limit while keeping the booking traceable.

This single fix resolves both issues:
1. Initial booking payments failing
2. Due payments failing (same edge function is used)

No frontend changes needed -- the error originates entirely from the Razorpay API rejecting the receipt length.
