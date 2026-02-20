
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';

interface SeatManagementLinkProps {
  cabinId: string | number;
  isAdmin?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

export function SeatManagementLink({ 
  cabinId, 
  isAdmin = false,
  variant = 'default',
  size = 'default'
}: SeatManagementLinkProps) {
  const path = isAdmin ? `/admin/rooms/${cabinId}/seats` : `/seat-management/${cabinId}/seats`;
  
  return (
    <Button 
      variant={variant} 
      size={size} 
      asChild
      className="flex items-center gap-1"
    >
      <Link to={path}>
        <Building2 className="h-4 w-4" />
        <span>Manage Seats</span>
      </Link>
    </Button>
  );
}
