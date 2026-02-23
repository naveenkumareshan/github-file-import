import React from 'react';

interface GridOverlayProps {
  width: number;
  height: number;
  gridSize: number;
  visible: boolean;
}

export const GridOverlay: React.FC<GridOverlayProps> = ({ width, height, gridSize, visible }) => {
  if (!visible) return null;

  const dots: React.ReactNode[] = [];
  for (let x = gridSize; x < width; x += gridSize) {
    for (let y = gridSize; y < height; y += gridSize) {
      dots.push(
        <circle key={`${x}-${y}`} cx={x} cy={y} r={1} fill="hsl(var(--muted-foreground))" opacity={0.25} />
      );
    }
  }

  return (
    <svg className="absolute inset-0 pointer-events-none" width={width} height={height}>
      {dots}
    </svg>
  );
};
