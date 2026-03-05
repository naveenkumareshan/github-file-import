

# Add Floor and Room Filters to Hostel Bed Map

The hostel bed map (`src/pages/admin/HostelBedMap.tsx`) currently only has hostel, date, status, and search filters. The reading room equivalent (`VendorSeats.tsx`) has floor filtering. The user wants both floor and room filters for the hostel bed map, matching the reading room pattern.

## Changes in `src/pages/admin/HostelBedMap.tsx`

### 1. Add state variables (~line 87)
```typescript
const [selectedFloor, setSelectedFloor] = useState<string>('all');
const [selectedRoom, setSelectedRoom] = useState<string>('all');
```

### 2. Compute available floors and rooms from beds data
```typescript
const availableFloors = useMemo(() => {
  if (selectedHostelId === 'all') return [];
  const floors = [...new Set(beds.map(b => b.floor))].sort((a, b) => a - b);
  return floors.map(f => ({ value: String(f), label: `Floor ${f}` }));
}, [beds, selectedHostelId]);

const availableRooms = useMemo(() => {
  let filtered = beds;
  if (selectedFloor !== 'all') {
    filtered = filtered.filter(b => String(b.floor) === selectedFloor);
  }
  const rooms = [...new Map(filtered.map(b => [b.room_id, b.roomNumber])).entries()]
    .sort((a, b) => a[1].localeCompare(b[1], undefined, { numeric: true }));
  return rooms.map(([id, name]) => ({ value: id, label: name }));
}, [beds, selectedFloor]);
```

### 3. Reset filters on hostel/floor change
```typescript
useEffect(() => { setSelectedFloor('all'); setSelectedRoom('all'); }, [selectedHostelId]);
useEffect(() => { setSelectedRoom('all'); }, [selectedFloor]);
```

### 4. Apply floor and room filters in `filteredBeds` (~line 351)
Add before the existing status filter:
```typescript
if (selectedFloor !== 'all') {
  result = result.filter(b => String(b.floor) === selectedFloor);
}
if (selectedRoom !== 'all') {
  result = result.filter(b => b.room_id === selectedRoom);
}
```

### 5. Add filter dropdowns to the sticky filter row (~after line 921)
Insert floor and room `<Select>` components after the hostel selector, shown only when a specific hostel is selected:
```tsx
{selectedHostelId !== 'all' && availableFloors.length > 0 && (
  <Select value={selectedFloor} onValueChange={setSelectedFloor}>
    <SelectTrigger className="h-8 w-[120px] text-xs">
      <SelectValue placeholder="Floor" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all" className="text-xs font-medium">All Floors</SelectItem>
      {availableFloors.map(f => (
        <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>
      ))}
    </SelectContent>
  </Select>
)}

{selectedHostelId !== 'all' && availableRooms.length > 0 && (
  <Select value={selectedRoom} onValueChange={setSelectedRoom}>
    <SelectTrigger className="h-8 w-[130px] text-xs">
      <SelectValue placeholder="Room" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all" className="text-xs font-medium">All Rooms</SelectItem>
      {availableRooms.map(r => (
        <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
      ))}
    </SelectContent>
  </Select>
)}
```

**Single file change**: `src/pages/admin/HostelBedMap.tsx`

