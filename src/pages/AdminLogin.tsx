import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { Footer } from '@/components/Footer';
import DemoCredentials, { DemoAccount } from '@/components/auth/DemoCredentials';

const ADMIN_DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: 'Admin',
    email: 'admin@inhalestays.com',
    password: 'Admin@123',
    description: 'Full platform management',
    accessRights: ['Dashboard', 'Bookings', 'Users', 'Rooms', 'Hostels', 'Reports', 'Payouts', 'Settings', 'Coupons', 'Notifications', 'Laundry Agent'],
  },
  {
    label: 'Super Admin',
    email: 'superadmin@inhalestays.com',
    password: 'Super@123',
    description: 'Unrestricted super-level access',
    accessRights: ['All Admin rights', 'Vendor Approval', 'Super Admin Panel', 'Error Logs', 'Email Templates'],
  },
];

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast({
          title: "Login Successful",
          description: "Welcome to the admin dashboard!",
        });
        const params = new URLSearchParams(location.search);
        const from = params.get('from') || '/admin/dashboard';
        navigate(from);
      } else {
        toast({
          title: "Login Failed",
          description: result.error || "Invalid email or password. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-accent/30">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-serif">Admin Login</CardTitle>
              <CardDescription>
                Sign in to your admin account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="admin@example.com" 
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password"
                    placeholder="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    required 
                  />
                  {/* <div className="text-right">
                    <Link to="/forgot-password" className="text-sm text-cabin-wood hover:underline">
                      Forgot password?
                    </Link>
                  </div> */}
                </div>                                
                <Button 
                  type="submit" 
                  className="w-full hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Logging in..." : "Login"}
                </Button>
              </form>
            </CardContent>
          </Card>
          <DemoCredentials
            accounts={ADMIN_DEMO_ACCOUNTS}
            onSelect={(email, password) => setFormData({ email, password })}
          />
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AdminLogin;