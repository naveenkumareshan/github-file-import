
import React from 'react';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { RoomSeat } from './RoomSeatButton';

interface EditSeatViewProps {
  seat: RoomSeat | null;
  onGoBack: (e: React.MouseEvent) => void;
  onConfirm: () => void;
}

export function EditSeatView({ seat, onGoBack, onConfirm }: EditSeatViewProps) {
  if (!seat) return null;
  
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-serif font-semibold text-cabin-dark">Seat Details</h2>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onGoBack}
          className="rounded-full h-8 w-8 flex items-center justify-center"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-6">
        <div className="p-4 bg-cabin-light/20 rounded-md">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-lg font-medium">Seat #{seat.number}</h3>
            <span className="text-lg font-bold text-cabin-wood">₹{seat.price}/month</span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-cabin-dark/70 mb-4">
                This seat is located in the {seat.number <= 57 ? "Non AC Room" : "AC Room"} section.
              </p>
              
              
              <div className="mt-4 p-3 bg-cabin-light/10 rounded-md">
                <h4 className="font-medium mb-2">Seat Features</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Personal desk space</li>
                  <li>Power outlet</li>
                  <li>Reading lamp</li>
                  <li>{seat.number <= 57 ? "Standard comfort chair" : "Premium ergonomic chair"}</li>
                  <li>{seat.number <= 57 ? "Shared air conditioning" : "Personal temperature control"}</li>
                </ul>
              </div>
            </div>
            
            <div className="border rounded-md p-4 bg-[#f6f8fa]">
              <h4 className="font-medium mb-3">Booking Information</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium capitalize">{seat.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">Row {Math.floor(seat.number / 10) + 1}, Position {seat.number % 10}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Availability</p>
                  <p className="font-medium">
                    {seat.status === 'available' 
                      ? 'Available for immediate booking' 
                      : 'Currently booked'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-4 mt-6">
          <Button 
            variant="outline"
            onClick={onGoBack}
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            className="bg-cabin-green hover:bg-cabin-green/80"
          >
            Confirm Selection
          </Button>
        </div>
      </div>
    </div>
  );
}
