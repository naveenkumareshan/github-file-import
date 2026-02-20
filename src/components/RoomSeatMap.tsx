
import React, { useState } from 'react';
import { RoomSeat } from "./RoomSeatButton";
import { RoomSeatMapView } from './RoomSeatMapView';
import { EditSeatView } from './EditSeatView';
import { buildSeats } from '../utils/roomSeatUtils';

interface RoomSeatMapProps {
  seats?: RoomSeat[];
  onSeatSelect?: (seat: RoomSeat) => void;
  selectedSeat?: RoomSeat | null;
  onGoBack?: () => void;
  onSaveLayout?: () => void;
  isAdmin?: boolean; // New prop to determine if the user is an admin
}

export function RoomSeatMap({
  onSeatSelect,
  selectedSeat,
  onGoBack,
  onSaveLayout,
  isAdmin = false, // Default to false (student view)
}: RoomSeatMapProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSeatDetails, setSelectedSeatDetails] = useState<RoomSeat | null>(null);

  const seats = buildSeats(selectedSeat?.id);

  const handleSeatClick = (seat: RoomSeat) => {
    if (seat.status === "available" || seat.status === "hot") {
      setSelectedSeatDetails(seat);
      onSeatSelect?.(seat);
      setIsEditMode(true);
    }
  };

  // Handle navigation back
  const handleGoBack = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Prevent event bubbling
    if (isEditMode) {
      setIsEditMode(false);
      return;
    }
    if (onGoBack) onGoBack();
  };

  // Handle confirming seat selection
  const handleConfirmSeatSelection = () => {
    console.log("Seat confirmed:", selectedSeatDetails);
    setIsEditMode(false);
  };

  return (
    <div>
      {!isEditMode ? (
        <RoomSeatMapView 
          seats={seats}
          onSeatClick={handleSeatClick}
          onHoveredSeat={setHovered}
          selectedSeat={selectedSeat ? seats.find((s) => s.id === selectedSeat.id) || null : null}
          onGoBack={onGoBack}
          onSaveLayout={onSaveLayout}
          isAdmin={isAdmin} // Pass the isAdmin prop to RoomSeatMapView
        />
      ) : (
        <EditSeatView 
          seat={selectedSeatDetails} 
          onGoBack={handleGoBack}
          onConfirm={handleConfirmSeatSelection}
        />
      )}
    </div>
  );
}
