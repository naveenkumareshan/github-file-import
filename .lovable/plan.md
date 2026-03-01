

## Clean Up Legacy Data and Fix Display

### Problem
- Legacy rooms (101, 201) exist without proper `floor_id`, creating confusing entries like "Floor 2"
- Old test/seed beds are still showing up attached to these legacy rooms
- Room R101 was created via the new system but is inactive
- The display is cluttered with data that doesn't match the new hierarchy

### Step 1: Database Cleanup (Migration)

Delete all legacy beds and deactivate legacy rooms via a SQL migration:

```sql
-- Delete all beds for this hostel (clean slate)
DELETE FROM hostel_beds 
WHERE room_id IN (
  SELECT id FROM hostel_rooms 
  WHERE hostel_id = 'a1b2c3d4-1111-1111-1111-111111111111'
);

-- Deactivate legacy rooms that have no floor_id
UPDATE hostel_rooms 
SET is_active = false 
WHERE hostel_id = 'a1b2c3d4-1111-1111-1111-111111111111' 
AND floor_id IS NULL;
```

Note: 4 existing bookings reference these beds. The booking records stay intact (foreign keys are not CASCADE delete on beds), but these beds will no longer show in the UI.

### Step 2: Fix Room Query Filter

**File: `src/pages/admin/HostelBedManagementPage.tsx`**

Update the room fetch query to only load rooms where `is_active = true`. Currently the query loads all rooms including deactivated ones -- add `.eq('is_active', true)` filter to the rooms query so legacy/deleted rooms stop appearing entirely.

### Step 3: Hide Empty Floor Tabs

In the floor grouping logic, skip floors that have zero active rooms so "Unassigned" doesn't show as an empty tab.

### Result
- All old beds removed from display and database
- Legacy rooms (101, 201) hidden (deactivated)
- Only rooms created through the new Floor -> Room -> Bed flow will appear
- Admin can start fresh: create floors, then rooms under floors, then add beds inside rooms

