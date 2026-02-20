
export interface RoomSharingOption {
  type: string;
  capacity: number;
  count: number;
  price: number;
}

export interface RoomWithSharingData {
  name: string;
  description: string;
  category: string;
  imageSrc?: string;
  maxCapacity: number,
  roomNumber: string,
  floor: string,
  isActive:boolean,
  basePrice: number,
  sharingOptions: RoomSharingOption[];
  amenities:string[];
  images: string[];
}

export interface HostelBed {
  _id?: string;
  number: number;
  hostelId: string;
  roomId: string;
  roomNumber: string;
  floor: string;
  isAvailable?: boolean;
  price: number;
  bedType: 'single' | 'double' | 'bunk';
  sharingType: 'private' | '2-sharing' | '3-sharing' | '4-sharing' | '5-sharing' | '6-sharing' | '8-sharing';
  sharingOptionId?: string;
  amenities?: string[];
  currentBookingId?: string;
  status?: 'available' | 'occupied' | 'unavailable';
  position?: { x: number; y: number };
}