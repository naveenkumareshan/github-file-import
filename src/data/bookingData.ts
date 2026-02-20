
export interface Seat {
  id: number;
  number: number;
  cabinId: number;
  isAvailable: boolean;
  price: number;
  position: {
    x: number;
    y: number;
  };
  isHotSelling?: boolean;
  unavailableUntil?: string; // Date string for when the seat becomes available again
  customerName?: string; // Added for booking details
  customerPhone?: string; // Added for booking details
  customerEmail?: string; // Added for booking details
}

interface BookingTime {
  id: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface BookingPlan {
  id: number;
  months: number;
  description: string;
}

// This is a key change: we will store a global state of modified seats
// so that changes in admin page reflect in the booking page
let globalSeats: Seat[] = [];

export const bookingPlans: BookingPlan[] = [
  { id: 1, months: 1, description: "Monthly Plan" },
  { id: 2, months: 3, description: "Quarterly Plan (₹100 discount per month)" },
  { id: 3, months: 6, description: "Half-yearly Plan (₹100 discount per month)" }
];

// Persist seats data to localStorage
const persistSeatsData = () => {
  try {
    localStorage.setItem('globalSeats', JSON.stringify(globalSeats));
  } catch (error) {
    console.error('Error saving seats data to localStorage:', error);
  }
};

// Load seats data from localStorage
const loadSeatsDataFromStorage = (): Seat[] | null => {
  try {
    const savedSeats = localStorage.getItem('globalSeats');
    return savedSeats ? JSON.parse(savedSeats) : null;
  } catch (error) {
    console.error('Error loading seats data from localStorage:', error);
    return null;
  }
};

// Add a function to initialize seats if none exist
export const initializeSeats = () => {
  const savedSeats = loadSeatsDataFromStorage();
  if (savedSeats && savedSeats.length > 0) {
    globalSeats = savedSeats;
    return globalSeats;
  }
  
  // If no saved data, generate new seats
  if (globalSeats.length === 0) {
    // generateSeats();
  }
  return globalSeats;
};
