

## Plan: Fix Sidebar Active State to Show Solid Primary Color

### Root Cause
The `sidebarMenuButtonVariants` in `src/components/ui/sidebar.tsx` includes hard-coded `data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground` styles. When `isActive=true`, these `data-[active=true]` selectors have higher specificity than the custom `bg-primary text-primary-foreground` classes passed via `className` in `AdminSidebar.tsx`, so the solid primary color never shows.

Same issue applies to `SidebarMenuSubButton` (line 549).

### Fix

**File: `src/components/ui/sidebar.tsx`**

1. **SidebarMenuButton base styles (line 428)**: Remove `data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground` from the CVA base string so custom className can control active styling.

2. **SidebarMenuSubButton styles (line 549)**: Remove `data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground` from the cn() call so the custom classes from AdminSidebar take effect.

This is the minimal change — no AdminSidebar changes needed since the correct classes (`bg-primary text-primary-foreground`) are already being passed there. They just need to stop being overridden by the component's built-in data-attribute styles.

