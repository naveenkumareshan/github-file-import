
import { RoomSeat } from '../components/RoomSeatButton';

// Define the room layout
export const ROOM_LAYOUT: Omit<RoomSeat, 'status' | 'price'>[] = [
  // Manually map out each seat with better positioning to avoid overlaps
  // Left block (Non AC cabins, about 57 seats)
  ...Array.from({ length: 57 }).map((_, i) => ({
    id: i + 1,
    number: i + 1,
    top: 20 + Math.floor(i / 7) * 40, // Increased vertical spacing
    left: 50 + (i % 7) * 40, // Increased horizontal spacing
  })),
  // Middle vertical (Lockers block, 7 seats)
  ...Array.from({ length: 7 }).map((_, i) => ({
    id: 57 + i + 1,
    number: 57 + i + 1,
    top: 30 + i * 42, // Increased spacing
    left: 350,
  })),
  // Right-Top and Center (AC Cabins, around 36 seats, spread in blocks)
  ...Array.from({ length: 36 }).map((_, i) => ({
    id: 64 + i,
    number: 64 + i,
    top: 20 + (i % 12) * 40, // Increased vertical spacing
    left: 420 + Math.floor(i / 12) * 42, // Increased horizontal spacing
  })),
];

const TOTAL_SEATS = 100;

export const buildSeats = (selectedSeatId?: number): RoomSeat[] => {
  // Generate seat prices randomly for demo
  const generatePrice = () => Math.floor(Math.random() * 300) + 1700; // Prices between 1700-2000
  
  // Generate 100 seats and set their status.
  return Array.from({ length: TOTAL_SEATS }).map((_, i) => {
    const seatNumber = i + 1;
    
    // Determine seat status - create hot selling section
    let status: 'available' | 'selected' | 'sold' | 'hot' = 'available';
    if (i >= 70 && i < 90) status = 'sold';
    if (i >= 20 && i < 35) status = 'hot'; // Hot selling section
    if (selectedSeatId && seatNumber === selectedSeatId) status = 'selected';
    
    // Ensure each seat has a unique ID that matches its seat number
    const layout = ROOM_LAYOUT.find(seat => seat.number === seatNumber) || {
      id: seatNumber,
      number: seatNumber,
      top: 400 + Math.floor(i / 20) * 40, // Bottom section with better spacing
      left: 80 + (i % 20) * 40,
    };
    
    return {
      ...layout,
      status,
      price: generatePrice(),
    };
  });
};
