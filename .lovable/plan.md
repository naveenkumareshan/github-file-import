

## Remove "Step" Labels and Tighten Spacing in Hostel Booking Flow

Match the hostel booking sections in `HostelRoomDetails.tsx` to the reading room's compact numbered-circle style.

### What Changes

**File: `src/pages/HostelRoomDetails.tsx`**

Replace all 5 step headers from the current verbose format:
```html
<h2 class="text-base font-bold">Step 1: Select Sharing Type</h2>
<p class="text-xs text-muted-foreground">Filter beds by sharing type...</p>
```

To the reading room's compact numbered-circle format:
```html
<Separator className="my-0" />
<div className="flex items-center gap-2">
  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">1</div>
  <Label className="text-sm font-semibold text-foreground">Select Sharing Type</Label>
</div>
```

Specific changes for each section:
1. **Section 1** (line ~511-514): "Step 1: Select Sharing Type" -> numbered circle "1" + "Select Sharing Type"
2. **Section 2** (line ~575-580): "Step 2: Stay Duration" -> numbered circle "2" + "Stay Duration"  
3. **Section 3** (line ~663-671): "Step 3: Select Your Bed" -> numbered circle "3" + "Select Your Bed"
4. **Section 4** (line ~686-692): "Step 4: Choose Package" -> numbered circle "4" + "Choose Package"
5. **Section 5** (line ~703-709): "Step 5: Review & Pay" -> numbered circle "5" + "Review & Pay"

Also reduce spacing between sections:
- Replace `pt-3` / `pt-4` on section wrappers with tighter spacing
- Replace `mb-2` / `mb-3` on header divs with the inline flex pattern (no extra margin)
- Remove the subtitle `<p>` tags entirely (reading room doesn't have them)
- Add `<Separator>` between sections like reading room does

