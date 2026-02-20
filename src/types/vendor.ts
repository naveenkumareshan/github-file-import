
export interface VendorEmployee {
  _id: string;
  id: string;
  vendorId: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: 'manager' | 'staff' | 'admin';
  permissions: string[];
  status: 'active' | 'inactive';
  salary?: number;
  createdAt: string;
  updatedAt: string;
}


export interface VendorBooking {
  id: string;
  vendorId: string;
  propertyId: string;
  studentId: string;
  seatId?: string;
  bedId?: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  amount: number;
  commission: number;
  payoutStatus: 'pending' | 'processed';
  bookingType: 'cabin' | 'hostel';
  createdAt: string;
}
