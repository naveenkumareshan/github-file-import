
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
