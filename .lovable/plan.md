

## Accordion-Style Collapsible Sections

### Change
Convert the 9 independent `Collapsible` sections into an accordion pattern where only one section can be open at a time. Opening any section automatically closes the previously open one.

### Technical Details

**File: `src/components/admin/CabinEditor.tsx`**

1. Add a state variable to track which section is currently open:
   ```typescript
   const [openSection, setOpenSection] = useState<number | null>(null);
   ```

2. Replace `defaultOpen={false}` on each `Collapsible` with controlled `open` and `onOpenChange`:
   ```typescript
   <Collapsible
     open={openSection === 1}
     onOpenChange={(isOpen) => setOpenSection(isOpen ? 1 : null)}
   >
   ```

3. Apply this pattern to all 9 sections, using section numbers 1-9 as identifiers.

No other files modified. All existing features, state, and handlers remain unchanged.

