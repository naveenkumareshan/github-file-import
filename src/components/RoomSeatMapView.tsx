
import React, { useRef } from 'react';
import { RoomSeatButton, RoomSeat } from "./RoomSeatButton";
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { RoomSeatLegend } from "./RoomSeatLegend";
import { SelectedSeatInfo } from "./SelectedSeatInfo";
import { TooltipProvider } from "./ui/tooltip";

interface RoomSeatMapViewProps {
  seats: RoomSeat[];
  onSeatClick: (seat: RoomSeat) => void;
  onHoveredSeat: (id: number | null) => void;
  selectedSeat: RoomSeat | null;
  onGoBack?: () => void;
  onSaveLayout?: () => void;
  isAdmin?: boolean; // Prop to determine if the user is an admin
}

export function RoomSeatMapView({
  seats,
  onSeatClick,
  onHoveredSeat,
  selectedSeat,
  onGoBack,
  onSaveLayout,
  isAdmin = false // Default to false (student view)
}: RoomSeatMapViewProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Handle navigation back
  const handleGoBack = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Prevent event bubbling
    if (onGoBack) onGoBack();
  };

  // Handle saving layout
  const handleSaveLayout = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Prevent event bubbling
    if (onSaveLayout) onSaveLayout();
    else console.log("Saving seat layout");
  };

  const displayedSelectedSeat = selectedSeat ? seats.find((s) => s.id === selectedSeat.id) : null;

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-serif font-semibold text-cabin-dark">Seat Selection</h3>
        <div className="flex gap-2">
          {onGoBack && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleGoBack}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          )}
          
          {/* Only show Save Layout button for admin users */}
          {isAdmin && onSaveLayout && (
            <Button 
              variant="default" 
              size="sm"
              onClick={handleSaveLayout}
              className="flex items-center gap-1"
            >
              <Save className="h-4 w-4" />
              Save Layout
            </Button>
          )}
        </div>
      </div>
      
      <ScrollArea 
        ref={scrollAreaRef}
        className="rounded-lg border" 
        style={{ height: "400px" }}
        type="always"
      >
        <div
          className="relative bg-[#f6f8fa] rounded-lg p-8 mx-auto"
          style={{ width: "100%", minWidth: 600, minHeight: 400 }}
          onClick={(e) => e.stopPropagation()} // Prevent event bubbling
        >
          {/* Balcony and Washrooms kept as-is for reference and orientation */}
          <div className="absolute bg-cabin-green text-white font-semibold rounded px-3 py-1 left-[530px] top-[80px]">
            Balcony
          </div>
          <div className="absolute left-[55px] bottom-[40px] text-xs">
            <div className="flex gap-2">
              <div className="border rounded bg-white px-2">Washroom</div>
              <div className="border rounded bg-white px-2">Washroom</div>
              <div className="border rounded bg-white px-2">Office</div>
            </div>
          </div>
          {/* Wrap all seats in a single TooltipProvider */}
          <TooltipProvider>
            {seats.map((seat) => (
              <RoomSeatButton
                key={seat.id}
                seat={seat}
                onSeatClick={onSeatClick}
                onSeatHover={onHoveredSeat}
              />
            ))}
          </TooltipProvider>
        </div>
      </ScrollArea>
      
      {/* Selected Seat Panel */}
      {displayedSelectedSeat && <SelectedSeatInfo seat={displayedSelectedSeat} />}
      {/* Legend */}
      <RoomSeatLegend />
    </>
  );
}
