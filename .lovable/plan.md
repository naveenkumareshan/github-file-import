

## Plan: Modern Active Sidebar Styling

### Current State
- Active top-level items: `border-l-2 border-primary bg-primary/8 text-primary font-medium`
- Active sub-items: Same border-l + light bg
- Hover: `hover:bg-muted/60`
- Group headers: muted icon + text

### Changes — Single file: `src/components/admin/AdminSidebar.tsx`

#### 1. Active Top-Level Item (line 729)
Replace the subtle border-l style with a full primary background:
```tsx
className={isActive 
  ? "bg-primary text-primary-foreground font-semibold rounded-lg shadow-sm" 
  : "hover:bg-muted/60 transition-all duration-200"}
```
Also force icon white when active via the Link className.

#### 2. Active Sub-Item (line 706)
Same treatment for sub-menu items:
```tsx
className={isActive 
  ? "bg-primary text-primary-foreground font-medium rounded-md shadow-sm" 
  : "hover:bg-muted/60 transition-all duration-200"}
```

#### 3. Inactive Hover Enhancement
Add `transition-all duration-200` to all inactive states (already partially there, just ensure consistency).

#### 4. Active Group Parent Header (line 685)
When a collapsible group contains an active child, give the group trigger a subtle highlight:
```tsx
className={`w-full justify-between transition-all duration-200 ${
  isActiveItem(item.url, item.subItems) 
    ? "bg-primary/10 text-primary font-semibold" 
    : "hover:bg-muted/60"
}`}
```

#### 5. Icon Color
- Active items: icon gets `text-primary-foreground` (white on primary bg)
- Active group parent: icon gets `text-primary`
- Inactive: keep `text-muted-foreground`

#### 6. Left Indicator Bar (Optional Enhancement)
Add a 3px left border-radius indicator on active items using a `before:` pseudo-element via Tailwind's `relative before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:bg-primary-foreground before:rounded-full` on active items.

### Summary
Single file change to `AdminSidebar.tsx` — updating 3 className expressions (top-level active, sub-item active, group header active) to use solid primary background with white text/icons, smooth transitions, and rounded corners.

