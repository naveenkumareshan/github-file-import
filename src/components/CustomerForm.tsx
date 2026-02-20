
import React from 'react';
import { Cabin } from '../data/cabinsData';
import { Seat, BookingPlan } from '../data/bookingData';

interface CustomerFormProps {
  cabin: Cabin;
  selectedSeat: Seat | null;
  selectedPlan: BookingPlan;
  date: string;
  customerName: string;
  customerEmail: string;
  onDateChange: (date: string) => void;
  onNameChange: (name: string) => void;
  onEmailChange: (email: string) => void;
  disableNameEmail?: boolean;
}

export function CustomerForm({
  cabin,
  selectedSeat,
  selectedPlan,
  date,
  customerName,
  customerEmail,
  onDateChange,
  onNameChange,
  onEmailChange,
  disableNameEmail = false
}: CustomerFormProps) {
  function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Selected Cabin</label>
        <div className="bg-cabin-light/30 p-3 rounded-md">
          <p className="font-medium">{cabin.name}</p>
          <p className="text-sm text-cabin-dark/70">Base price: ₹{cabin.price}/month</p>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Selected Seat</label>
        <div className="bg-cabin-light/30 p-3 rounded-md">
          {selectedSeat ? (
            <div>
              <p>Seat #{selectedSeat.number}</p>
              <p className="text-sm text-cabin-dark/70">Price: ₹{selectedSeat.price}/month</p>
            </div>
          ) : (
            <p className="text-cabin-dark/50">Please select a seat from the map</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium mb-1">Start Date</label>
        <input
          type="date"
          id="date"
          className="w-full border-border rounded-md p-2"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          min={getTodayDate()}
          required
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">Your Name</label>
        <input
          type="text"
          id="name"
          className={`w-full border-border rounded-md p-2 ${disableNameEmail ? 'bg-gray-100' : ''}`}
          value={customerName}
          onChange={(e) => onNameChange(e.target.value)}
          required
          readOnly={disableNameEmail}
        />
        {disableNameEmail && 
          <p className="text-xs text-muted-foreground mt-1">Using your registered name from your account</p>
        }
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          id="email"
          className={`w-full border-border rounded-md p-2 ${disableNameEmail ? 'bg-gray-100' : ''}`}
          value={customerEmail}
          onChange={(e) => onEmailChange(e.target.value)}
          required
          readOnly={disableNameEmail}
        />
        {disableNameEmail && 
          <p className="text-xs text-muted-foreground mt-1">Using your registered email from your account</p>
        }
      </div>
    </div>
  );
}
