
import React from "react";

interface LegendBoxProps {
  color: string;
  label: string;
}
function LegendBox({ color, label }: LegendBoxProps) {
  return (
    <div className="flex items-center gap-1">
      <div className={`inline-block w-5 h-5 border rounded mr-1 ${color}`}></div>
      <span className="text-xs">{label}</span>
    </div>
  );
}

export const RoomSeatLegend = () => (
  <div className="mt-4 flex flex-wrap gap-6 items-center justify-center">
    <LegendBox color="border-cabin-green bg-[#d4f7c4]" label="Available" />
    <LegendBox color="bg-cabin-dark" label="Selected" />
    <LegendBox color="bg-[#D3E4FD] border-blue-200" label="Sold" />
  </div>
);

export const SeatLayoutModeLegend = () => (
  <div className="mt-4 flex flex-wrap gap-4 items-center justify-center text-xs text-muted-foreground">
    <div className="flex items-center">
      <span className="font-semibold mr-1">Horizontal:</span> 
      <span>Seats arranged in rows</span>
    </div>
    <div className="flex items-center">
      <span className="font-semibold mr-1">Vertical:</span> 
      <span>Seats arranged in columns</span>
    </div>
  </div>
);
