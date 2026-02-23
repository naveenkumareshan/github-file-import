
import React, { useState, useEffect, useRef } from 'react';
import { getImageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Facebook } from 'lucide-react';
import { authService } from '@/api/authService';
import { FcGoogle } from 'react-icons/fc';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SocialButtonProps {
  provider: 'google' | 'facebook' | 'twitter';
  label: string;
  icon: React.ReactNode;
  onLoginSuccess?: (data: any) => void;
  onLoginError?: (error: any) => void;
}

function SocialButton({ provider, label, icon, onLoginSuccess, onLoginError }: SocialButtonProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { SocialLogin } = useAuth();
  const checkClosedIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventListenerAddedRef = useRef(false);
  
  // Add event listener for messages from the OAuth popup
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      
      // Make sure the message is from our OAuth popup
      if (event.data && event.data.type === 'SOCIAL_AUTH_SUCCESS') {
        if (event.data.provider === provider) {
          try {
            // Clean up immediately when we get success message
            if (checkClosedIntervalRef.current) {
              clearInterval(checkClosedIntervalRef.current);
              checkClosedIntervalRef.current = null;
            }
            
            // Remove event listener
            window.removeEventListener('message', handleOAuthMessage);
            eventListenerAddedRef.current = false;
            
            // Extract token and user data
            const { token, userData } = event.data;
            
            // Create response object in the expected format
            const response = {
              success: true,
              token: token,
              user: userData
            };
            
            // Update auth context
            const loginSuccess = await SocialLogin(response);
            
            if (loginSuccess) {
              // Navigate based on user role
              let dashboardPath = '/student/dashboard';
              if (userData.role === 'admin') {
                dashboardPath = '/admin/dashboard';
              } else if (userData.role === 'hostel_manager') {
                dashboardPath = '/manager/dashboard';
              }
              
              toast({
                title: "Login Successful",
                description: `Successfully logged in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
              });
              
              navigate(dashboardPath);
              
              if (onLoginSuccess) {
                onLoginSuccess(response);
              }
            } else {
              throw new Error('SocialLogin returned false');
            }
          } catch (error) {
            toast({
              title: "Login Failed",
              description: `Failed to login with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
              variant: "destructive"
            });
            
            if (onLoginError) {
              onLoginError(error);
            }
          }
        }
      } else if (event.data && event.data.type === 'SOCIAL_AUTH_FAILURE') {
        if (event.data.provider === provider) {
         
          // Clean up on failure
          if (checkClosedIntervalRef.current) {
            clearInterval(checkClosedIntervalRef.current);
            checkClosedIntervalRef.current = null;
          }
          
          // Remove event listener
          window.removeEventListener('message', handleOAuthMessage);
          eventListenerAddedRef.current = false;
          
          toast({
            title: "Login Failed",
            description: event.data.error || `Failed to login with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
            variant: "destructive"
          });
          
          if (onLoginError) {
            onLoginError({ message: event.data.error });
          }
        }
      }
    };
    
    // Only add event listener if not already added
    if (!eventListenerAddedRef.current) {
      window.addEventListener('message', handleOAuthMessage);
      eventListenerAddedRef.current = true;
    }
    
    // Clean up on component unmount
    return () => {
      if (eventListenerAddedRef.current) {
        window.removeEventListener('message', handleOAuthMessage);
        eventListenerAddedRef.current = false;
      }
      if (checkClosedIntervalRef.current) {
        clearInterval(checkClosedIntervalRef.current);
        checkClosedIntervalRef.current = null;
      }
    };
  }, [provider, SocialLogin, toast, navigate, onLoginSuccess, onLoginError]);
  
  const handleSocialLogin = async () => {
    try {
      console.log(`Starting ${provider} login`);
      
      // Initialize OAuth popup based on provider
      let authWindow: Window | null;
      let authUrl = '';
      
      // Use actual OAuth endpoints
      switch(provider) {
        case 'google':
          authUrl = `/api/auth/${provider}`;
          break;
        case 'facebook':
          authUrl = `/api/auth/${provider}-login`;
          break;
        case 'twitter':
          authUrl = `/api/auth/${provider}-login`;
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
      
      // Open popup window for OAuth flow
      const width = 600;
      const height = 600;
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2;
      
      const fullAuthUrl = getImageUrl(authUrl); // Legacy social auth URL
      
      authWindow = window.open(
        fullAuthUrl,
        `${provider}Auth`,
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
      );
      
      // For demo purposes or in case the popup is blocked
      if (!authWindow) {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site to use social login.",
          variant: "destructive"
        });
        return;
      }
      
      // Monitor if popup is closed manually and handle login completion
      checkClosedIntervalRef.current = setInterval(async () => {
        if (authWindow && authWindow.closed) {
          if (checkClosedIntervalRef.current) {
            clearInterval(checkClosedIntervalRef.current);
            checkClosedIntervalRef.current = null;
          }
          
          // Check if we have stored auth data in localStorage (from the callback)
          const storedToken = localStorage.getItem('token');
          const storedUser = localStorage.getItem('user');
          
          if (storedToken && storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              
              const response = {
                success: true,
                token: storedToken,
                user: userData
              };
              
              // Update auth context
              const loginSuccess = await SocialLogin(response);
              
              if (loginSuccess) {
                // Navigate based on user role
                let dashboardPath = '/student/dashboard';
                if (userData.role === 'admin') {
                  dashboardPath = '/admin/dashboard';
                } else if (userData.role === 'hostel_manager') {
                  dashboardPath = '/manager/dashboard';
                }
                
                toast({
                  title: "Login Successful",
                  description: `Successfully logged in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
                });
                
                navigate(dashboardPath);
                
                if (onLoginSuccess) {
                  onLoginSuccess(response);
                }
              }
            } catch (error) {
              console.error('Error processing stored auth data:', error);
            }
          }
        }
      }, 1000);
      
    } catch (error) {
      console.error(`${provider} login error:`, error);
      toast({
        title: "Login Failed",
        description: `Failed to login with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
        variant: "destructive"
      });
      
      if (onLoginError) {
        onLoginError(error);
      }
    }
  };

  return (
    <Button
      onClick={handleSocialLogin}
      variant="outline"
      type="button"
      className="w-full flex items-center justify-center gap-2"
    >
      {icon}
      <span>Continue with {label}</span>
    </Button>
  );
}

interface SocialLoginButtonsProps {
  onLoginSuccess?: (data: any) => void;
  onLoginError?: (error: any) => void;
}

export function SocialLoginButtons({ onLoginSuccess, onLoginError }: SocialLoginButtonsProps) {
  return (
    <div className="space-y-3">
      <SocialButton
        provider="google"
        label="Google"
        icon={<FcGoogle className="h-4 w-4" />}
        onLoginSuccess={onLoginSuccess}
        onLoginError={onLoginError}
      />
    </div>
  );
}
