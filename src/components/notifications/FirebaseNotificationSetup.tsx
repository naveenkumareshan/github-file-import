import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff } from 'lucide-react';
import { firebaseNotificationService } from '@/services/firebaseNotificationService';
import { notificationService } from '@/api/notificationService';
import { toast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

export const FirebaseNotificationSetup: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if notifications are already enabled
    checkNotificationStatus();
    
    // Listen for foreground messages
    const unsubscribe = firebaseNotificationService.onMessageListener();
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const checkNotificationStatus = async () => {
    try {
      const token = await firebaseNotificationService.getCurrentToken();
      if (token) {
        setCurrentToken(token);
        setIsEnabled(true);
      }
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  };

  const enableNotifications = async () => {
    setIsLoading(true);
    try {
      const token = await firebaseNotificationService.initializeFirebase();
      
      if (token) {
        // Update FCM token on server
        await notificationService.updateFcmToken(token);
        
        setCurrentToken(token);
        setIsEnabled(true);
        
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive push notifications for offers and updates."
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Please allow notifications in your browser settings to receive updates.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({
        title: "Error",
        description: "Failed to enable notifications. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disableNotifications = async () => {
    try {
      // Clear token on server
      await notificationService.updateFcmToken('');
      
      setCurrentToken(null);
      setIsEnabled(false);
      
      toast({
        title: "Notifications Disabled",
        description: "You won't receive push notifications anymore."
      });
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast({
        title: "Error",
        description: "Failed to disable notifications.",
        variant: "destructive"
      });
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      await enableNotifications();
    } else {
      await disableNotifications();
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="notifications-toggle" className="text-sm">
            Receive notifications for offers and updates
          </Label>
          <Switch
            id="notifications-toggle"
            checked={isEnabled}
            onCheckedChange={handleToggleNotifications}
            disabled={isLoading}
          />
        </div>
        
        {!isEnabled && (
          <div className="text-sm text-muted-foreground">
            <p>Enable notifications to get:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Special offers and discounts</li>
              <li>Booking confirmations</li>
              <li>Important updates</li>
            </ul>
          </div>
        )}
        
        {isEnabled && currentToken && (
          <div className="text-sm text-green-600">
            ✓ Notifications are enabled and working
          </div>
        )}
        
        {!isEnabled && (
          <Button 
            onClick={enableNotifications} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Setting up...' : 'Enable Notifications'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};