

# Redesign "My Subscriptions" Page — Summary Cards, Table View, Filters, Actions

## Current State
The page shows property cards with subscribe/upgrade buttons and a Razorpay checkout dialog. It works but lacks:
- Summary cards (active count, monthly cost, yearly billing, next renewal)
- Tabular view of all subscriptions with actions
- Filters by property type/name
- View Details, Download Invoice, Upgrade, Cancel actions
- **Bug**: Query uses `subscription_plans(*)` but table has two FKs to `subscription_plans` (`plan_id` and `previous_plan_id`), causing PGRST201 error. Must use `subscription_plans!property_subscriptions_plan_id_fkey(*)`.

## Changes — `src/pages/partner/MySubscriptions.tsx` (full rewrite)

### Fix the FK ambiguity bug
All queries using `.select('*, subscription_plans(*)')` on `property_subscriptions` will be changed to `.select('*, subscription_plans!property_subscriptions_plan_id_fkey(*)')`.

### Top Summary Cards (4 cards)
1. **Active Subscriptions** — count of subscriptions with `status = 'active'`
2. **Total Monthly Cost** — sum of `amount_paid / 12` for active subs
3. **Total Yearly Billing** — sum of `amount_paid` for active subs
4. **Next Renewal** — earliest `end_date` among active subs, with a "Renew" button

### Filters Row
- Property Type dropdown: All / Reading Room / Hostel / Universal
- Property Name search input (text filter)

### Subscriptions Table
Columns: Property Name, Plan, Billing Cycle (always "Yearly"), Amount Paid, Status (badge), Next Renewal Date

Row actions (dropdown or inline buttons):
- **View Details** — opens dialog showing full subscription info (plan features, capacity, dates, payment IDs)
- **Download Invoice** — generates and prints an invoice HTML (reuse invoice pattern)
- **Upgrade Plan** — opens existing plan selection dialog (reuse current flow)
- **Cancel Subscription** — only enabled if `end_date > today` (cancels future renewal, sets a `cancel_at_period_end` flag or updates status). For now: confirms and updates status to `cancelled` only if end_date is in the future (current period continues).

### Keep existing subscribe/upgrade dialog
The Razorpay checkout flow (steps 1-3) remains intact, triggered by "Upgrade Plan" action or the "Renew" button.

### Fetch all subscriptions (not just active)
Query includes `active`, `cancelled`, `expired` statuses to show full history.

### Resolve property names
Join property names by looking up `cabins` and `hostels` data already fetched. For universal subs, show "All Properties".

## Files Modified
- `src/pages/partner/MySubscriptions.tsx` — full redesign with summary cards, table, filters, actions

