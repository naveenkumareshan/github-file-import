

## Redesign: Edit Reading Room Page - Section-Wise Flow

### Problem
The current `CabinEditor.tsx` (1029 lines) crams everything into 4 tabs with an overloaded "Reading Room Details" tab containing room info, amenities, locker settings, advance booking, pricing, timings, slots, and images all in a single two-column layout. It's hard to navigate and find settings.

### New Design: Vertical Section-Based Layout

Replace the tab-based layout with a **single scrollable page** divided into clearly labeled, collapsible card sections. Each section has a numbered step indicator and descriptive header. This follows the premium SaaS admin pattern already used elsewhere in the app.

### Section Flow (Top to Bottom)

**Section 1 -- Basic Information**
- Room Name, Category (standard/premium/luxury), Seat Capacity, Description
- Clean 2-column grid on desktop, stacked on mobile

**Section 2 -- Images**
- Main image preview + ImageUpload component for multiple images
- Full-width section

**Section 3 -- Pricing and Locker**
- Starting Price (with /month label)
- Locker toggle, locker price, mandatory/optional radio
- Advance Booking toggle with all sub-fields (percentage/flat, validity days, auto-cancel)

**Section 4 -- Room Timings**
- 24/7 toggle switch
- When OFF: opening time, closing time, working days pills
- When ON: green confirmation message

**Section 5 -- Slot-Based Booking**
- Enable/disable toggle
- When enabled + room saved: embedded SlotManagement component
- When enabled + new room: "Save first" message

**Section 6 -- Amenities**
- Checkbox grid (3 columns desktop, 2 mobile) for all amenity options

**Section 7 -- Contact Person Details**
- Name, Phone, Email in a 2-column grid

**Section 8 -- Partner Assignment**
- Admin: partner dropdown selector + read-only detail card
- Partner: auto-loaded read-only details

**Section 9 -- Location**
- State/City/Area selector
- Full Address, Pincode, Locality
- Latitude/Longitude + MapPicker
- Nearby Landmarks

### UI/UX Details

- Each section is a `Card` with a compact `CardHeader` showing section number badge + title + subtitle
- Sticky footer bar with Cancel and Save buttons (always visible)
- Validation error banner at the top (unchanged)
- "Back to Dashboard" button stays in the page header
- All existing state, handlers, and logic remain identical -- this is purely a layout restructure
- Responsive: sections stack vertically, internal grids collapse on mobile

### Technical Details

**File modified: `src/components/admin/CabinEditor.tsx`**

- Remove `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` wrapper
- Remove `activeTab` state (no longer needed)
- Restructure the return JSX into 9 sequential `Card` sections within a single scrollable container
- Keep all state variables, handlers (`handleInputChange`, `handleAmenityChange`, `handleImageUpload`, `handleImageRemove`, `handleSave`, `handleLockerAvailableChange`, `handleMapLocationChange`), useEffects, and validation logic exactly as-is
- Update `handleSave` validation: remove `setActiveTab("details")` calls (no tabs anymore), just scroll to top on error
- Add a section number badge component (small circle with number) for visual flow
- Footer uses `sticky bottom-0` for always-visible save/cancel

**No other files are modified.** All features (24/7 toggle, slot management, advance booking, locker config, location picker, partner assignment, image upload) remain fully functional -- only their visual arrangement changes.

