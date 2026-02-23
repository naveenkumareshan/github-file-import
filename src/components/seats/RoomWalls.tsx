import React from 'react';

interface RoomWallsProps {
  width: number;
  height: number;
}

export const RoomWalls: React.FC<RoomWallsProps> = ({ width, height }) => {
  return (
    <svg className="absolute inset-0 pointer-events-none" width={width} height={height}>
      {/* Main walls */}
      <rect
        x={1}
        y={1}
        width={width - 2}
        height={height - 2}
        fill="none"
        stroke="hsl(var(--foreground))"
        strokeWidth={4}
        rx={2}
      />
      {/* Wall labels */}
      <text x={width / 2} y={16} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))" opacity={0.5}>
        Front Wall
      </text>
      <text x={width / 2} y={height - 6} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))" opacity={0.5}>
        Back Wall
      </text>
    </svg>
  );
};
