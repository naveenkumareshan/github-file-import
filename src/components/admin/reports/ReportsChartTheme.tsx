
import React from 'react';
import { ChartContainer } from '@/components/ui/chart';

const chartTheme = {
  revenue: {
    label: 'Revenue',
    theme: {
      light: '#8884d8',
      dark: '#a78bfa',
    }
  },
  occupancy: {
    label: 'Occupancy',
    theme: {
      light: '#6E59A5',
      dark: '#8b5cf6',
    }
  },
  completed: {
    label: 'Completed',
    theme: {
      light: '#22c55e',
      dark: '#4ade80',
    }
  },
  pending: {
    label: 'Pending',
    theme: {
      light: '#f59e0b',
      dark: '#fbbf24',
    }
  },
  failed: {
    label: 'Failed',
    theme: {
      light: '#ef4444',
      dark: '#f87171',
    }
  },
  premium: {
    label: 'Premium',
    theme: {
      light: '#EC4899',
      dark: '#F472B6',
    }
  },
  standard: {
    label: 'Standard',
    theme: {
      light: '#8B5CF6',
      dark: '#A78BFA',
    }
  },
  basic: {
    label: 'Basic',
    theme: {
      light: '#3B82F6',
      dark: '#60A5FA',
    }
  }
};

interface EnhancedChartProps {
  children: React.ReactElement;
  config?: Record<string, any>;
  className?: string;
  height?: number | string;
}

export const EnhancedChart: React.FC<EnhancedChartProps> = ({ 
  children, 
  config = chartTheme,
  className,
  height = 300
}) => {
  // Convert the height style to a proper React style object
  const heightStyle = typeof height === 'number' ? `${height}px` : height;
  
  return (
    <div className={`h-[${heightStyle}] w-full ${className || ''}`}>
      <ChartContainer config={config}>
        {children}
      </ChartContainer>
    </div>
  );
};