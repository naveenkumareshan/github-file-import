

## Make All Sections Collapsible in CabinEditor

### Change
Wrap each of the 9 sections in the CabinEditor with the `Collapsible` component (already available in the project). All sections start **collapsed** by default. Clicking the section header (which will include a chevron arrow) expands/collapses the content.

### How It Works
- Each section's `CardHeader` becomes a `CollapsibleTrigger` with a down-arrow (`ChevronDown`) icon that rotates when open
- Each section's `CardContent` is wrapped in `CollapsibleContent` so it hides/shows
- All 9 sections default to `open={false}` (collapsed)
- The section header (badge + title + subtitle) remains always visible as the clickable trigger

### Technical Details

**File: `src/components/admin/CabinEditor.tsx`**

1. Import `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` from `@/components/ui/collapsible` and `ChevronDown` from `lucide-react`

2. For each of the 9 `<Card>` sections, restructure from:
```
<Card>
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>
```
to:
```
<Collapsible defaultOpen={false}>
  <Card>
    <CollapsibleTrigger asChild>
      <CardHeader className="cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SectionBadge ... />
            <div>title + subtitle</div>
          </div>
          <ChevronDown className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
        </div>
      </CardHeader>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <CardContent>...</CardContent>
    </CollapsibleContent>
  </Card>
</Collapsible>
```

3. Apply this pattern to all 9 sections (Basic Info, Images, Pricing, Timings, Slots, Amenities, Contact, Partner, Location)

4. No logic, state, or handler changes -- purely a UI wrapper addition

