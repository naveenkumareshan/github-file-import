
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { adminCabinsService } from '@/api/adminCabinsService';
import { adminSeatsService } from '@/api/adminSeatsService';
import { SeatLayoutEditor } from '@/components/hostel-manager/SeatLayoutEditor';
import { ReviewsManager } from '@/components/reviews/ReviewsManager';

interface Cabin {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
}

const CabinSeatsManagement = () => {
  const { cabinId } = useParams<{ cabinId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cabin, setCabin] = useState<Cabin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cabinId) {
      fetchCabinData();
    }
  }, [cabinId]);

  const fetchCabinData = async () => {
    try {
      setLoading(true);
      
      const response = await adminCabinsService.getCabinById(cabinId!);
      
      if (response.success && response.data) {
        setCabin(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load cabin data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching cabin:', error);
      toast({
        title: "Error",
        description: "Failed to load cabin data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/hostel-manager/cabins');
  };

  const handleSeatBooking = () => {
    navigate(`/hostel-manager/cabins/${cabinId}/bookings`);
  };

  return (
    <div className="min-h-screen bg-accent/30">
      <Navigation />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button variant="outline" onClick={handleGoBack} className="flex items-center gap-1 mb-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Cabins
            </Button>
            <h1 className="text-2xl font-bold">Manage Reading Room Seats</h1>
            {cabin && (
              <p className="text-muted-foreground">{cabin.name}</p>
            )}
          </div>
          
          <Button onClick={handleSeatBooking}>
            Manage Bookings
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-8 flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </CardContent>
          </Card>
        ) : !cabin ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="mb-4 text-red-500">Cabin not found</p>
              <Button onClick={handleGoBack}>Go Back</Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="layout">
            <TabsList className="mb-4">
              <TabsTrigger value="layout">Seat Layout</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            
            <TabsContent value="layout">
              <SeatLayoutEditor cabinId={cabinId!} onSaved={fetchCabinData} />
            </TabsContent>
            
            <TabsContent value="reviews">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewsManager entityType="Cabin" entityId={cabinId!} showForm={false} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default CabinSeatsManagement;
