
import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PaymentTimerProps {
  createdAt: string;
  expiryTimeInMinutes?: number;
  onExpiry?: () => void;
  onRetryPayment?: () => void;
  variant?: 'badge' | 'full' | 'compact';
  className?: string;
  showRetryButton?: boolean;
}

export const PaymentTimer = ({ 
  createdAt, 
  expiryTimeInMinutes = 5, 
  onExpiry,
  onRetryPayment,
  variant = 'badge',
  className = '',
  showRetryButton = false
}: PaymentTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
   const calculateTimeLeft = () => {
      const createdTime = new Date(createdAt).getTime();
      const expiryTime = createdTime + expiryTimeInMinutes * 60 * 1000;
      const now = Date.now();

      const remainingMs = Math.max(expiryTime - now, 0);
      const remainingSeconds = Math.floor(remainingMs / 1000);

      if (remainingMs === 0) {
        setTimeLeft(0);
        setIsExpired(true);

        if (onExpiry && !hasExpiredRef.current) {
          hasExpiredRef.current = true;
          onExpiry();
        }
      }

      return remainingSeconds;
    };

    const updateTimer = () => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
    };

    // Update immediately
    updateTimer();

    // Set up interval to update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [createdAt, expiryTimeInMinutes, onExpiry]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (isExpired) return 'text-red-600';
    if (timeLeft < 60) return 'text-red-500'; // Less than 1 minute
    if (timeLeft < 120) return 'text-amber-500'; // Less than 2 minutes
    return 'text-green-600';
  };

  if (variant === 'badge') {
    if (isExpired) {
      return (
        <Badge variant="destructive" className={className}>
          <AlertTriangle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }

    return (
      <Badge 
        variant="outline" 
        className={`${getTimerColor()} border-current ${className}`}
      >
        <Clock className="h-3 w-3 mr-1" />
        {formatTime(timeLeft)}
      </Badge>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 text-sm ${getTimerColor()} ${className}`}>
        <Clock className="h-4 w-4" />
        <span>{isExpired ? 'Expired' : formatTime(timeLeft)}</span>
        {showRetryButton && !isExpired && onRetryPayment && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetryPayment}
            className="ml-2 h-6 px-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div className={`flex items-center justify-between gap-4 p-3 rounded-lg border ${
      isExpired 
        ? 'bg-red-50 border-red-200' 
        : timeLeft < 60 
        ? 'bg-amber-50 border-amber-200'
        : 'bg-green-50 border-green-200'
    } ${className}`}>
      <div className="flex items-center gap-2">
        {isExpired ? (
          <AlertTriangle className="h-5 w-5 text-red-600" />
        ) : (
          <Clock className="h-5 w-5 text-gray-600" />
        )}
        <div>
          <p className="text-sm font-medium">
            {isExpired ? 'Payment Expired' : 'Payment Time Remaining'}
          </p>
          <p className={`text-lg font-bold ${getTimerColor()}`}>
            {isExpired ? 'Expired' : formatTime(timeLeft)}
          </p>
        </div>
      </div>
      
      {showRetryButton && !isExpired && onRetryPayment && (
        <Button
          variant="outline"
          onClick={onRetryPayment}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Payment
        </Button>
      )}
    </div>
  );
};
