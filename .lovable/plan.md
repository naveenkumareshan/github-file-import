

## Plan: Filter Bottom Nav Items by Partner's Property Types

### Problem
The `PartnerBottomNav` displays `pinnedItems` from saved preferences (or defaults) without checking if those items are still relevant to the partner's actual property types. For example, a partner with only Reading Rooms could see Hostel or Laundry nav items if they were previously saved.

### Fix — `src/hooks/usePartnerNavPreferences.ts`

Add property-type filtering to the `pinnedItems` output:

1. Import and use `usePartnerPropertyTypes` inside `usePartnerNavPreferences`
2. Filter `pinnedItems` against the partner's actual property types using the `category` field on each `NavItem`
3. Also filter against employee permissions using `usePartnerEmployeePermissions`
4. If after filtering, fewer than 4 valid items remain, backfill from `DEFAULT_NAV_ITEMS` (which are all `category: 'general'` and always valid)

This ensures that:
- The bottom nav only shows items the partner actually has properties for
- The customizer already filters correctly (confirmed — it uses `filteredNavOptions`)
- The More menu already filters correctly (confirmed — it checks `hasReadingRooms`, `hasHostels`, etc.)

### Changes

**File: `src/hooks/usePartnerNavPreferences.ts`**
- Import `usePartnerPropertyTypes` and `usePartnerEmployeePermissions`
- Add a filtering step on `pinnedItems` that removes items whose `category` doesn't match the partner's property types (e.g., `category: 'hostels'` removed if `!hasHostels`)
- Also remove items whose `permission` the employee doesn't have
- Backfill with general defaults if the filtered list has fewer than 4 items

This is a single-file change that fixes the bottom nav for all partners and employees.

