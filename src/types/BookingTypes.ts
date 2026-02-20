
export interface BookingFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: "pending" | "completed" | "failed";
  startDate?: string;
  endDate?: string;
  userId?: string;
  seatId?: string;
  roomId?: string;
  bookingDuration?: "daily" | "weekly" | "monthly";
}

export interface BookingDuration {
  type: "daily" | "weekly" | "monthly";
  count: number;
  price: number;
}

export interface Booking {
  id: string;
  _id?: string;
  bookingId?: string;
  userId: string;
  cabinId: string;
  seatId: string;
  startDate: string;
  endDate: string;
  bookingDuration: "daily" | "weekly" | "monthly";
  durationCount: number;
  totalPrice: number;
  paymentStatus: "pending" | "completed" | "failed";
  status?: "pending" | "completed" | "failed"; 
  paymentMethod?: string;
  paymentDate?: string;
  createdAt: string;
  updatedAt?: string;
}
