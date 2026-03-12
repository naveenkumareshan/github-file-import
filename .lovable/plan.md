

# Fix Property Cards: Show Trial Days + Subscribe Button (with Razorpay)

## Problem
Property cards in Manage Properties show "No Plan" even when the property has `free_trial_days` set by admin. There's no way to subscribe directly from the card — partners must navigate to "My Subscriptions" separately.

## Root Cause
`useSubscriptionAccess` hook only checks `property_subscriptions` table. It doesn't check the property's `free_trial_days` field or `created_at` to calculate remaining trial days. When no subscription exists, it always returns `isExpired=true` and `daysRemaining=0`.

## Changes

### 1. `src/hooks/useSubscriptionAccess.ts` — Add trial day awareness
- Add a new query to fetch the property's `free_trial_days` and `created_at` from `cabins` or `hostels` table (based on `propertyType`)
- Calculate trial days remaining: `free_trial_days - daysSince(created_at)`
- Return new fields: `trialDaysRemaining`, `isInTrial` (true if no subscription but trial days > 0)
- Adjust `isExpired` to be false when in trial

### 2. `src/components/admin/CabinItem.tsx` — Show trial badge + Subscribe button
- Use new `isInTrial` and `trialDaysRemaining` from hook
- When in trial: show amber badge "Trial (Xd left)" instead of "No Plan"
- When no plan and no trial: show "No Plan" + a small "Subscribe" button
- Subscribe button opens a dialog with plan selection + Razorpay checkout (reuse the `MySubscriptions` payment logic inline)

### 3. `src/components/admin/HostelItem.tsx` — Same changes as CabinItem
- Mirror the trial badge and Subscribe button logic

### 4. New component: `src/components/admin/PropertySubscribeDialog.tsx`
- Reusable dialog that accepts `propertyId`, `propertyName`, `propertyType`, `partnerId`
- Shows available plans from `subscription_plans` table (non-universal, active)
- Step 1: Select plan → Step 2: Capacity upgrades (if enabled) → Step 3: Summary + coupon + Pay button
- Uses same Razorpay flow as `MySubscriptions`: calls `subscription-create-order` edge function, opens Razorpay checkout, verifies via `subscription-verify-payment`
- On success: invalidates subscription queries, shows success toast

## Files Modified
- `src/hooks/useSubscriptionAccess.ts` — add trial calculation from property table
- `src/components/admin/CabinItem.tsx` — update badge logic + add Subscribe button
- `src/components/admin/HostelItem.tsx` — update badge logic + add Subscribe button
- `src/components/admin/PropertySubscribeDialog.tsx` — new reusable subscription dialog

