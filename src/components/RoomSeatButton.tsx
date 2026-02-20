
import React from "react";

type SeatStatus = 'available' | 'selected' | 'sold' | 'hot';

export interface RoomSeat {
  id: number;
  number: number;
  top: number;
  left: number;
  status: SeatStatus;
  price?: number;
}

interface RoomSeatButtonProps {
  seat: RoomSeat;
  onClick?: (seat: RoomSeat) => void;
  onSeatClick?: (seat: RoomSeat) => void;
  onSeatHover?: (id: number) => void;
}

const RoomSeatButton: React.FC<RoomSeatButtonProps> = ({ seat, onClick, onSeatClick, onSeatHover }) => {
  const colorMap: Record<SeatStatus, string> = {
    available: 'bg-green-500',
    selected: 'bg-blue-500',
    sold: 'bg-red-500',
    hot: 'bg-orange-500',
  };

  return (
    <button
      onClick={() => { onClick?.(seat); onSeatClick?.(seat); }}
      onMouseEnter={() => onSeatHover?.(seat.id)}
      className={`absolute w-8 h-8 rounded text-white text-xs font-bold ${colorMap[seat.status]}`}
      style={{ top: seat.top, left: seat.left }}
    >
      {seat.number}
    </button>
  );
};

export { RoomSeatButton };
export default RoomSeatButton;

