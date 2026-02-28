

## Fix: Hostel Due Management - Calendar/Dialog Issues and Cleanup

### Issues Identified

1. **Calendar numbers bleeding through table** - The Date Edit Dialog with Calendar component is rendering incorrectly, causing calendar day numbers (1-28) to appear overlaid on the table. The Dialog component is receiving a ref warning ("Function components cannot be given refs"), which may cause the overlay/backdrop to fail.

2. **Dialog rendering issue** - The `open={!!editingField}` pattern combined with an inline Calendar may be causing render glitches.

### Fix Approach

**File: `src/pages/admin/HostelDueManagement.tsx`**

1. **Replace Dialog-based date picker with Popover-based inline editing** - Instead of a separate Dialog with a full Calendar component, use a Popover attached directly to the pencil button for each date field. This avoids the Dialog ref warning and keeps editing inline and clean.

2. **Alternatively, fix the Dialog approach** by:
   - Moving the Calendar into a properly structured Dialog with a controlled `open` state using a separate boolean (e.g., `dateDialogOpen`) instead of deriving from `editingField`
   - Ensuring the Dialog only mounts when explicitly opened
   - Adding `initialFocus` handling to prevent focus/render issues

3. **Chosen approach: Use a simple date Input field in a small Dialog** instead of the full Calendar component, which is simpler and avoids the Calendar rendering bug entirely:
   - Replace the `<Calendar>` component inside the date edit Dialog with a standard `<input type="date">` field
   - This eliminates the Calendar bleed-through issue entirely
   - Keep the Dialog for the modal editing experience

### Technical Changes

**`src/pages/admin/HostelDueManagement.tsx`**:

- Remove the `Calendar` import and the Popover-related imports (unused)
- Replace the Date Edit Dialog's Calendar component with a simple `<Input type="date">` control
- Use a dedicated `dateDialogOpen` boolean state instead of `!!editingField` to control Dialog visibility
- Update the save handler to parse the date from the input value
- Remove unused imports (`Popover`, `PopoverContent`, `PopoverTrigger`, `Calendar`, `cn`)

This is a minimal, focused fix that resolves the visual bug without restructuring the page.
