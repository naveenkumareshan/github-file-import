
import React from 'react';
import { PricingBreakdown } from '../data/cabinsData';
import { Seat } from '../data/bookingData';

interface PricingSummaryProps {
  pricingDetails: PricingBreakdown;
  selectedSeat: Seat;
}

export function PricingSummary({ pricingDetails, selectedSeat }: PricingSummaryProps) {
  return (
    <div className="bg-cabin-light/20 p-4 rounded-md">
      <div className="flex justify-between mb-2">
        <p className="text-cabin-dark">Current Month ({pricingDetails.currentMonth.days} days)</p>
        <p className="font-medium text-cabin-dark">₹{pricingDetails.currentMonth.amount}</p>
      </div>
      
      <div className="flex justify-between mb-2">
        <p className="text-cabin-dark">Next Month ({pricingDetails.nextMonth.days} days)</p>
        <p className="font-medium text-cabin-dark">₹{pricingDetails.nextMonth.amount}</p>
      </div>
      
      {pricingDetails.remainingMonths.months > 0 && (
        <div className="flex justify-between mb-2">
          <p className="text-cabin-dark">
            Additional Months ({pricingDetails.remainingMonths.months})
          </p>
          <p className="font-medium text-cabin-dark">₹{pricingDetails.remainingMonths.amount}</p>
        </div>
      )}
      
      {pricingDetails.discount > 0 && (
        <div className="flex justify-between mb-2 text-green-600">
          <p>Total Discount</p>
          <p className="font-medium">-₹{pricingDetails.discount * pricingDetails.remainingMonths.months}</p>
        </div>
      )}
      
      <div className="border-t border-gray-200 mt-2 pt-2">
        <div className="flex justify-between font-medium text-lg">
          <p className="text-cabin-dark">Total Amount</p>
          <p className="text-cabin-dark">₹{pricingDetails.total}</p>
        </div>
      </div>
    </div>
  );
}
