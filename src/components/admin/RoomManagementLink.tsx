
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building } from 'lucide-react';

interface RoomManagementLinkProps {
  isAdmin?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

export function RoomManagementLink({ 
  isAdmin = false,
  variant = 'default',
  size = 'default'
}: RoomManagementLinkProps) {
  const path = isAdmin ? '/room-management' : '/rooms';
  
  return (
    <Button 
      variant={variant} 
      size={size} 
      asChild
      className="flex items-center gap-1"
    >
      <Link to={path}>
        <Building className="h-4 w-4" />
        <span>Manage Rooms</span>
      </Link>
    </Button>
  );
}
