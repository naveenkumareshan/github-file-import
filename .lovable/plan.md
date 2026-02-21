

## Fix: Show Seat Availability Map for Admin Users

### Problem
In `src/components/admin/AdminSidebar.tsx` (line 92), the "Seat Map" menu item has this condition:

```
if (user?.role !== 'admin' && hasPermission('seats_available_map'))
```

This **excludes admins entirely**. The admin user never sees the "Seat Map" link in the sidebar.

### Solution

**File: `src/components/admin/AdminSidebar.tsx`**

Change the condition on line 92 from:
```ts
if (user?.role !== 'admin' && hasPermission('seats_available_map'))
```
to:
```ts
if (user?.role === 'admin' || hasPermission('seats_available_map'))
```

Also update the `roles` array to include `'admin'`:
```ts
roles: ['admin', 'vendor', 'vendor_employee'],
```

This makes the Seat Map visible to admins (always) and to vendor/vendor_employee (when they have the `seats_available_map` permission).

### Additional Polish

**File: `src/pages/vendor/VendorSeats.tsx`**

Apply the same compact page header standard used across other admin pages:
- Replace `text-3xl font-bold` title with `text-lg font-semibold` + breadcrumb
- Reduce stat card value sizes from `text-2xl` to match dashboard KPI style
- Compact the Refresh button to `size="sm"`

No API, route, or logic changes needed -- the route `/admin/seats-available-map` already exists and renders `VendorSeats`.

