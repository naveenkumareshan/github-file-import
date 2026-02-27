export interface Cabin {
  id: string;
  _id: string;
  name: string;
  description: string;
  price: number;
  imageSrc: string;
  imageUrl: string;
  capacity: number;
  amenities: string[];
  category: "standard" | "premium" | "luxury";
  isActive: boolean;
  serialNumber: string;
  averageRating?: number;
  reviewCount?: number;
  cabinCode?: string;
  openingTime?: string;
  closingTime?: string;
  workingDays?: string[];
}

export interface PricingBreakdown {
  basePrice: number;
  taxes: number;
  discount: number;
  total: number;
  currentMonth?: {
    days: number;
    amount: number;
  };
  nextMonth?: {
    days: number;
    amount: number;
  };
  remainingMonths?: {
    months: number;
    amount: number;
  };
}

export const calculatePrice = (basePrice: number, duration: number = 1, startDate?: string): PricingBreakdown => {
  const taxes = basePrice * 0.18; // 18% GST
  const discount = 0;
  const total = (basePrice * duration) + taxes - discount;
  
  // Calculate current month days
  const now = startDate ? new Date(startDate) : new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const currentMonthDays = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const dailyRate = basePrice / 30;
  
  return {
    basePrice: basePrice * duration,
    taxes,
    discount,
    total,
    currentMonth: {
      days: currentMonthDays,
      amount: Math.round(dailyRate * currentMonthDays)
    },
    nextMonth: {
      days: 30,
      amount: basePrice
    },
    remainingMonths: {
      months: Math.max(0, duration - 2),
      amount: basePrice * Math.max(0, duration - 2)
    }
  };
};
