
import React from "react";
import { RoomSeat } from "./RoomSeatButton";

interface SelectedSeatInfoProps {
  seat: RoomSeat;
}

export const SelectedSeatInfo: React.FC<SelectedSeatInfoProps> = ({ seat }) => {
  return (
    <div className="mt-8 flex justify-center">
      <div className="w-full max-w-md p-5 bg-white border-2 border-cabin-green shadow-lg rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h4 className="text-xl font-semibold text-cabin-green">
              Selected Seat: #{seat.number}
            </h4>
            <p className="text-sm text-cabin-dark/70">
              Located in the {seat.number <= 57 ? "Non AC Cabin" : "AC Cabin"} section
            </p>
          </div>
          <div className="text-right">
            <p className="text-cabin-green font-bold text-lg">₹{seat.price}/month</p>
          </div>
        </div>
        {seat.status === "sold" && (
          <div className="text-blue-700 font-medium mt-1">Sold out</div>
        )}
      </div>
    </div>
  );
};
