

## Fix: "Leads CRM" Not Visible in Partner Sidebar

### Root Cause
The "Leads CRM" link is inside the **Operations** section of `PartnerMoreMenu.tsx` (line 76). That section has `show: can('view_operations')` — meaning the **entire section is hidden** if the partner/employee doesn't have the `view_operations` permission. Since Leads CRM has no permission requirement of its own, it should always be visible.

### Fix

**`src/components/partner/PartnerMoreMenu.tsx`** — Move "Leads CRM" out of the Operations section into its own always-visible section, or add it to a section that's always shown (e.g., create a new "CRM" section with `show: true`).

Specifically:
1. Remove `{ title: 'Leads CRM', url: '/partner/leads', icon: UserPlus }` from the Operations section
2. Add a new section above Operations:
```
{
  title: 'CRM',
  show: true,
  items: [
    { title: 'Leads CRM', url: '/partner/leads', icon: UserPlus },
  ],
}
```

This ensures the Leads link is always visible regardless of permissions.

### Files Modified
- `src/components/partner/PartnerMoreMenu.tsx`

