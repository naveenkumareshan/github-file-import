

# Plan: Subscription Gate for Property Creation + Free Trial + Seat Refresh Fix

## Issues Identified

### Issue 1: Partners adding properties without subscription
Currently, `ManageProperties` and `RoomManagement`/`HostelManagement` have no subscription check before allowing property creation. Any partner can click "Add New Property" and create cabins/hostels without paying.

### Issue 2: Free trial days for new partners
No `free_trial_days` setting exists. New partners should get a configurable number of free trial days when adding their first property.

### Issue 3: Seat auto-refresh not happening after partner booking
`fetchSeats()` IS called after booking (line 631 of VendorSeats.tsx), but the sheet stays open with stale data. The issue is that `bookingSuccess` is set to `true` and the booking step changes to `'details'` — the user sees a success view inside the sheet but the grid behind doesn't visually update because the sheet's stale `selectedSeat` isn't refreshed. Additionally, the "seats not shown" issue likely means when `cabins` array loads async and `selectedCabinId` is still `'all'`, `fetchSeats` fires before `cabins` are loaded — resulting in an empty `partnerCabinIds` being passed, which returns no seats.

## Approach

### 1. DB: Add `platform_config` table + `partner_trial_days` setting

```sql
CREATE TABLE public.platform_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read config
CREATE POLICY "Anyone can read config" ON public.platform_config
  FOR SELECT TO authenticated USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage config" ON public.platform_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Insert default trial days setting
INSERT INTO public.platform_config (key, value) VALUES ('partner_trial_days', '{"days": 7}');
```

### 2. Subscription gate in ManageProperties

When partner clicks "Add New Property":
- Check if partner has an active universal subscription OR active trial
- If universal subscription exists → show "Universal Package active, no payment needed" and proceed
- If within free trial period → proceed with a "Trial" badge
- If no subscription and trial expired → redirect to My Subscriptions page with a toast

**Logic**: Query `property_subscriptions` for the partner. Also query `partners.created_at` + `platform_config.partner_trial_days` to determine if trial is still active.

### 3. Admin settings: Free trial days control

Add a "Partner Trial Days" input to `AdminSettingsNew.tsx` (or a new section) that reads/writes to `platform_config` table with key `partner_trial_days`.

### 4. Fix seat auto-refresh after partner booking

In `VendorSeats.tsx`:
- After successful booking, close the sheet OR refresh the `selectedSeat` from the newly fetched seats
- Fix the `fetchSeats` dependency: ensure `cabins` are loaded before first fetch by guarding `fetchSeats` with `cabins.length > 0`

### 5. Fix "seats not shown" issue

The `fetchSeats` callback (line 171) has condition: `if (cabins.length === 0 && selectedCabinId !== 'all') return;`
When `selectedCabinId` is `'all'` and `cabins.length` is 0 (still loading), it proceeds but passes empty `partnerCabinIds` → query returns nothing.

**Fix**: Change guard to `if (cabins.length === 0) return;` — wait for cabins to load regardless of selected cabin.

## Files to Modify

| File | Change |
|------|--------|
| DB migration | Create `platform_config` table with `partner_trial_days` default |
| `src/pages/partner/ManageProperties.tsx` | Add subscription/trial gate before property creation |
| `src/pages/admin/AdminSettingsNew.tsx` | Add "Partner Trial Days" config input |
| `src/pages/vendor/VendorSeats.tsx` | Fix `fetchSeats` guard + close sheet or refresh after booking |

## Key Logic

```typescript
// ManageProperties - subscription gate
const handleAddProperty = async (tab: string) => {
  // Check universal subscription
  if (universalSub) {
    toast({ title: 'Universal Package Active' });
    proceed();
    return;
  }
  // Check free trial
  const trialDays = config?.days || 7;
  const partnerAge = daysSince(partner.created_at);
  if (partnerAge <= trialDays) {
    proceed(); // within trial
    return;
  }
  // Check any active property subscription
  if (hasActiveSubscription) {
    proceed();
    return;
  }
  // No subscription, no trial → redirect
  toast({ title: 'Subscription Required', variant: 'destructive' });
  navigate('/partner/subscriptions');
};
```

```typescript
// VendorSeats.tsx - fix seat loading guard
const fetchSeats = useCallback(async () => {
  if (cabins.length === 0) return; // Wait for cabins regardless
  // ... rest unchanged
}, [selectedCabinId, selectedDate, cabins]);

// After successful booking - close sheet
fetchSeats();
setSheetOpen(false); // Close sheet so grid updates are visible
```

