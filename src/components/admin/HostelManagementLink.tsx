
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building } from 'lucide-react';

interface HostelManagementLinkProps {
  isAdmin?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

export function HostelManagementLink({ 
  isAdmin = false,
  variant = 'default',
  size = 'default'
}: HostelManagementLinkProps) {
  const path = isAdmin ? '/hostel-management' : '/hostels';
  
  return (
    <Button 
      variant={variant} 
      size={size} 
      asChild
      className="flex items-center gap-1"
    >
      <Link to={path}>
        <Building className="h-4 w-4" />
        <span>Manage Hostels</span>
      </Link>
    </Button>
  );
}
