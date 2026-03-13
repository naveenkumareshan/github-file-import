

# Partner Mobile App — Full Feature Access via "More" Menu

## Problem
The partner bottom nav has only 5 tabs (Dashboard, Bookings, Properties, Earnings, Profile), but the desktop sidebar exposes 20+ features: Seat Map, Hostel Bed Map, Due Management, Receipts, Deposits, Operations Hub, Reports, Employees, Complaints, Reconciliation, Banks, Activity Log, Expiring Bookings, Subscriptions, Promotions, Reviews, etc. On mobile, partners have no way to reach these pages.

## Solution
Replace the **Profile** tab with a **More** tab that opens a full-screen drawer/sheet containing all sidebar menu items organized by category. Profile moves inside the "More" menu. This is the standard mobile app pattern (Instagram, YouTube, banking apps all use it).

## Bottom Nav Changes (`PartnerBottomNav.tsx`)
- 5 tabs remain: **Dashboard**, **Bookings**, **Properties**, **Earnings**, **More**
- "More" tab opens a Sheet (bottom drawer) instead of navigating

## New Component: `PartnerMoreMenu.tsx`
A Sheet/Drawer that mirrors the sidebar structure with sections:
- **Operations** → Operations Hub
- **Reading Rooms** → Seat Map, Due Management, Bookings, Expiring Bookings, Receipts, Key Deposits, Activity Log
- **Hostels** → Bed Map, Due Management, Hostel Bookings, Expiring Bookings, Hostel Receipts, Hostel Deposits, Activity Log
- **Laundry** → Laundry Dashboard
- **Mess / Food** → Manage Mess, Subscriptions, Receipts, Attendance
- **Users** → All Users, Create User, Coupons
- **Finance** → Reconciliation, Banks
- **More** → Employees, Complaints, Reports, Reviews, Promotions, Subscriptions, Profile

Each section conditionally shown using `usePartnerPropertyTypes` (same logic as sidebar). Items use the same permission checks via `useVendorEmployeePermissions`.

## Files
1. **Create** `src/components/partner/PartnerMoreMenu.tsx` — full menu sheet with all partner features grouped by category
2. **Modify** `src/components/partner/PartnerBottomNav.tsx` — replace Profile tab with More tab that toggles the sheet, add state management

## Key Details
- The sheet uses `ScrollArea` for long lists
- Each menu item is a `Link` that closes the sheet on tap
- Section headers match sidebar groupings (Reading Rooms, Hostels, etc.)
- Property-type and permission visibility logic reused from `AdminSidebar.tsx`
- Profile is the first item in the "More" menu for easy access

