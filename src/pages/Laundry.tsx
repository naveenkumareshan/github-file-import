
import React from 'react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { laundryService } from '@/api/laundryService';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LaundryPriceList } from '@/components/LaundryPriceList';
import { LaundryComplaint } from '@/components/LaundryComplaint';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { LaundryLocationModal } from '@/components/LaundryLocationModal';
import { useState } from 'react';

// Create a new QueryClient instance
const queryClient = new QueryClient();

const LaundryContent = () => {
  const { isAuthenticated, user } = useAuth();
  const [showLocationModal, setShowLocationModal] = useState(false);
  
  const { data: laundryItems, isLoading } = useQuery({
    queryKey: ['laundryItems'],
    queryFn: async () => {
      const response = await laundryService.getMenuItems();
      return response.data;
    }
  });
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-cabin-dark">Laundry Service</h1>
            <p className="text-muted-foreground">Convenient laundry services for students</p>
          </div>
          
          {isAuthenticated && (
            <div className="flex gap-4 mt-4 md:mt-0">
              <Button onClick={() => setShowLocationModal(true)}>View Drop Locations</Button>
              
              <Button asChild variant="outline">
                <Link to="/laundry-request">Request Pickup</Link>
              </Button>
              
              {user?.role === 'admin' && (
                <Button asChild variant="secondary">
                  <Link to="/laundry-agent">Manage Orders</Link>
                </Button>
              )}
            </div>
          )}
        </div>
        
        <Separator className="my-6" />
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Our Laundry Services</CardTitle>
                <CardDescription>
                  Professional laundry services for all your needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-cabin-wood border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <LaundryPriceList />
                )}
              </CardContent>
            </Card>
            
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                  <CardDescription>Simple steps to use our laundry service</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="bg-cabin-light rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                        <span className="text-cabin-dark font-bold">1</span>
                      </div>
                      <h3 className="font-medium text-lg mb-2">Request Pickup</h3>
                      <p className="text-muted-foreground">Submit a request with your laundry details</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="bg-cabin-light rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                        <span className="text-cabin-dark font-bold">2</span>
                      </div>
                      <h3 className="font-medium text-lg mb-2">We Clean</h3>
                      <p className="text-muted-foreground">Our professionals clean your clothes</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="bg-cabin-light rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                        <span className="text-cabin-dark font-bold">3</span>
                      </div>
                      <h3 className="font-medium text-lg mb-2">Delivery</h3>
                      <p className="text-muted-foreground">Clean clothes delivered to your hostel</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div>
            <LaundryComplaint />
            
            {!isAuthenticated && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Login Required</CardTitle>
                  <CardDescription>Please log in to use our laundry services</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-muted-foreground">
                    You need to be logged in to request laundry services.
                  </p>
                  <Button asChild className="w-full">
                    <Link to="/student/login">Login Now</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
      
      {showLocationModal && (
        <LaundryLocationModal 
          onLocationSubmit={(location) => {
            console.log('Location submitted:', location);
            setShowLocationModal(false);
          }} 
        />
      )}
    </div>
  );
};

const Laundry = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LaundryContent />
    </QueryClientProvider>
  );
};

export default Laundry;
