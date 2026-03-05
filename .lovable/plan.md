

# Remove "R" prefix from hostel bed labels

The bed cards in the grid view display labels like `RFlat 101-B1` because the code prepends an "R" before `roomNumber`. Since the room numbers already contain meaningful names (e.g., "Flat 101"), the extra "R" is confusing.

## Changes in `src/pages/admin/HostelBedMap.tsx`

| Line | Current | Fix |
|------|---------|-----|
| 988 | `R{bed.roomNumber}-B{bed.bed_number}` | `{bed.roomNumber}-B{bed.bed_number}` |
| 1115 | `R{blockBed?.roomNumber}-B{blockBed?.bed_number}` | `{blockBed?.roomNumber}-B{blockBed?.bed_number}` |

Two simple string template edits — just remove the literal "R" prefix in both places.

