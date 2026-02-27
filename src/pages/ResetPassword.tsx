
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Lock, CheckCircle, AlertTriangle } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [isRecoverySession, setIsRecoverySession] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoverySession(true);
      }
    });

    // Also check if there's already a session (user clicked the link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Check URL hash for recovery type
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');
        if (type === 'recovery' || session) {
          setIsRecoverySession(true);
        }
      } else {
        // Give a short delay for the auth state change to fire
        setTimeout(() => {
          setIsRecoverySession((prev) => prev === null ? false : prev);
        }, 2000);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast({
        title: "All Fields Required",
        description: "Please fill in all password fields.",
        variant: "destructive"
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please ensure both passwords are identical.",
        variant: "destructive"
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
        throw error;
      }
      
      setIsPasswordReset(true);
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset successfully."
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isRecoverySession === null) {
    return (
      <div className="min-h-screen bg-accent/30">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <Card>
              <CardContent className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  if (isRecoverySession === false) {
    return (
      <div className="min-h-screen bg-accent/30">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <CardTitle className="text-2xl font-serif">Invalid Reset Link</CardTitle>
                <CardDescription>
                  This password reset link is invalid or has expired.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  The reset link may have expired or already been used. Please request a new password reset.
                </p>
                <Button 
                  onClick={() => navigate('/student/forgot-password')}
                  className="w-full"
                >
                  Request New Reset Link
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-accent/30">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                {isPasswordReset ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <Lock className="h-6 w-6 text-primary" />
                )}
              </div>
              <CardTitle className="text-2xl font-serif">
                {isPasswordReset ? 'Password Reset Complete' : 'Reset Your Password'}
              </CardTitle>
              <CardDescription>
                {isPasswordReset ? 
                  'Your password has been successfully reset.' :
                  'Enter your new password below.'
                }
              </CardDescription>
            </CardHeader>
            
            {!isPasswordReset ? (
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input 
                      id="newPassword" 
                      type="password" 
                      placeholder="Enter new password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      required 
                      disabled={isSubmitting}
                      minLength={6}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      placeholder="Confirm new password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      required 
                      disabled={isSubmitting}
                      minLength={6}
                    />
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Password must be at least 6 characters long.
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                        Resetting Password...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </form>
              </CardContent>
            ) : (
              <CardContent className="text-center space-y-4">
                <div className="bg-green-50 text-green-800 p-4 rounded-md border border-green-200">
                  <h3 className="font-medium mb-1">Password Reset Successful!</h3>
                  <p className="text-sm">
                    Your password has been successfully reset. You can now login with your new password.
                  </p>
                </div>
                
                <Button 
                  onClick={() => navigate('/student/login')}
                  className="w-full"
                >
                  Go to Login
                </Button>
              </CardContent>
            )}
            
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                Remember your password?{' '}
                <Link to="/student/login" className="text-primary hover:underline font-medium">
                  Return to Login
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
