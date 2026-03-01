import React from 'react';

interface BedShapeIconProps {
  width?: number;
  height?: number;
  rotation?: number;
  status: 'available' | 'occupied' | 'blocked' | 'selected';
  bedNumber: number;
  className?: string;
}

const STATUS_COLORS = {
  available: { frame: '#059669', fill: '#ecfdf5', pillow: '#a7f3d0', text: '#065f46' },
  occupied: { frame: '#2563eb', fill: '#eff6ff', pillow: '#bfdbfe', text: '#1e40af' },
  blocked: { frame: '#dc2626', fill: '#fef2f2', pillow: '#fecaca', text: '#991b1b' },
  selected: { frame: 'hsl(var(--primary))', fill: 'hsl(var(--primary) / 0.15)', pillow: 'hsl(var(--primary) / 0.4)', text: 'hsl(var(--primary))' },
};

export const BedShapeIcon: React.FC<BedShapeIconProps> = ({
  width = 48,
  height = 60,
  rotation = 0,
  status,
  bedNumber,
  className = '',
}) => {
  const colors = STATUS_COLORS[status];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 48 60"
      className={className}
      style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'center center' }}
    >
      {/* Bed frame */}
      <rect x="2" y="2" width="44" height="56" rx="4" ry="4"
        fill={colors.fill} stroke={colors.frame} strokeWidth="2" />
      
      {/* Headboard (thicker top bar) */}
      <rect x="2" y="2" width="44" height="10" rx="4" ry="4"
        fill={colors.frame} opacity="0.25" />
      <rect x="2" y="8" width="44" height="4"
        fill={colors.frame} opacity="0.25" />
      
      {/* Pillow */}
      <rect x="10" y="6" width="28" height="8" rx="3" ry="3"
        fill={colors.pillow} stroke={colors.frame} strokeWidth="1" opacity="0.8" />
      
      {/* Mattress lines */}
      <line x1="8" y1="28" x2="40" y2="28" stroke={colors.frame} strokeWidth="0.5" opacity="0.2" />
      <line x1="8" y1="36" x2="40" y2="36" stroke={colors.frame} strokeWidth="0.5" opacity="0.2" />
      <line x1="8" y1="44" x2="40" y2="44" stroke={colors.frame} strokeWidth="0.5" opacity="0.2" />

      {/* Bed number - counter-rotate so text is always readable */}
      <text
        x="24" y="38"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={colors.text}
        fontSize="12"
        fontWeight="bold"
        style={{ transform: `rotate(${-rotation}deg)`, transformOrigin: '24px 38px' }}
      >
        {bedNumber}
      </text>
    </svg>
  );
};
