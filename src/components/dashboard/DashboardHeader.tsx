
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardHeaderProps {
  onChangeNameClick: () => void;
  onChangePasswordClick: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  onChangeNameClick,
  onChangePasswordClick 
}) => {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Student Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name || "Student"}</p>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onChangeNameClick}
          className="text-foreground border-border hover:bg-muted"
        >
          Change Name
        </Button>
        <Button
          variant="outline"
          onClick={onChangePasswordClick}
          className="text-foreground border-border hover:bg-muted"
        >
          Change Password
        </Button>
      </div>
    </div>
  );
};