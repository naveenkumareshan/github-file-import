
import React, { useState, useEffect } from 'react';
import { Cabin, calculatePrice } from '../data/cabinsData';
import { Seat } from '../data/bookingData';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from './ui/badge';
import { addMonths, format } from 'date-fns';
import { bookingPlans } from '../data/bookingData';

interface BookingSummaryProps {
  cabin: Cabin;
  selectedSeat: Seat | null;
  bookingDate: Date | null;
  endDate: Date | null;
  onBookingDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  totalPrice: number;
}

export function BookingSummary({
  cabin,
  selectedSeat,
  bookingDate,
  endDate,
  onBookingDateChange,
  onEndDateChange,
  totalPrice
}: BookingSummaryProps) {
  const [selectedPlan, setSelectedPlan] = useState(bookingPlans[0]);
  
  useEffect(() => {
    // When booking date changes, update end date based on selected plan
    if (bookingDate) {
      const newEndDate = addMonths(new Date(bookingDate), selectedPlan.months);
      onEndDateChange(newEndDate);
    }
  }, [bookingDate, selectedPlan, onEndDateChange]);
  
  const handlePlanSelection = (planId: number) => {
    const plan = bookingPlans.find(p => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
      if (bookingDate) {
        const newEndDate = addMonths(new Date(bookingDate), plan.months);
        onEndDateChange(newEndDate);
      }
    }
  };
  
  // Calculate price breakdown if all data is available
  const getPriceBreakdown = () => {
    if (!cabin || !bookingDate || !endDate) return null;
    
    const startDateStr = format(bookingDate, 'yyyy-MM-dd');
    const priceBreakdown = calculatePrice(
      selectedSeat ? selectedSeat.price : cabin.price,
      selectedPlan.months,
      startDateStr
    );
    
    return priceBreakdown;
  };
  
  const priceBreakdown = getPriceBreakdown();

  return (
    <Card className="bg-white shadow-sm border border-border">
      <CardContent className="p-6">
        <h2 className="text-xl font-serif font-semibold mb-4 text-cabin-dark">Booking Summary</h2>
        
        {!selectedSeat ? (
          <div className="text-center py-4 text-cabin-dark/60">
            Please select a seat to continue
          </div>
        ) : (
          <>
            <div className="mb-4 p-3 bg-cabin-light/20 rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{cabin.name}</h3>
                  <p className="text-sm text-cabin-dark/70">{cabin.category.charAt(0).toUpperCase() + cabin.category.slice(1)}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Seat #{selectedSeat.number}</p>
                  <p className="text-sm">₹{selectedSeat.price}/month</p>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <Label className="block mb-2">Select Subscription Plan</Label>
              <div className="flex flex-wrap gap-2">
                {bookingPlans.map((plan) => (
                  <Button
                    key={plan.id}
                    type="button"
                    variant={selectedPlan.id === plan.id ? "default" : "outline"}
                    onClick={() => handlePlanSelection(plan.id)}
                    className="flex-1"
                  >
                    {plan.description}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <Label className="block mb-2">Start Date</Label>
              <Calendar
                mode="single"
                selected={bookingDate || undefined}
                onSelect={(date) => date && onBookingDateChange(date)}
                className="border rounded-md"
                disabled={(date) => date < new Date()}
              />
            </div>
            
            {bookingDate && endDate && (
              <div className="mb-6">
                <Label className="block mb-2">Duration</Label>
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <div className="font-medium">Start</div>
                    <div className="text-sm">{format(bookingDate, 'MMM dd, yyyy')}</div>
                  </div>
                  <div className="text-center px-3">
                    <Badge variant="outline">{selectedPlan.months} Month{selectedPlan.months > 1 ? 's' : ''}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">End</div>
                    <div className="text-sm">{format(endDate, 'MMM dd, yyyy')}</div>
                  </div>
                </div>
              </div>
            )}
            
            {priceBreakdown && (
              <div className="border-t mt-4 pt-4">
                <h3 className="font-medium mb-2">Price Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>First month ({priceBreakdown.currentMonth.days} days)</span>
                    <span>₹{priceBreakdown.currentMonth.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next month</span>
                    <span>₹{priceBreakdown.nextMonth.amount}</span>
                  </div>
                  {priceBreakdown.remainingMonths.months > 0 && (
                    <div className="flex justify-between">
                      <span>{priceBreakdown.remainingMonths.months} additional month{priceBreakdown.remainingMonths.months > 1 ? 's' : ''}</span>
                      <span>₹{priceBreakdown.remainingMonths.amount}</span>
                    </div>
                  )}
                  {priceBreakdown.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{priceBreakdown.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium pt-2 border-t">
                    <span>Total</span>
                    <span>₹{priceBreakdown.total}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
