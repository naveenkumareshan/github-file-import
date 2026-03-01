
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CabinManagement as CabinManagementComponent } from '@/components/admin/CabinManagement';
import { adminCabinsService } from '@/api/adminCabinsService';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/use-auth';
import { hostelManagerService } from '@/api/hostelManagerService';

interface CabinData {
  _id: string;
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  amenities: string[];
  imageUrl: string;
  category: 'standard' | 'premium' | 'luxury';
  isActive?: boolean;
  serialNumber?: string;
  totalSeats?: number;
  occupied?: number;
  available?: number;
}

const CabinManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [cabins, setCabins] = useState<CabinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    fetchCabins();
  }, []);
  
  const fetchCabins = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await hostelManagerService.getManagedCabins();
      
      if (response.success) {
        // Process cabin data
        const processedCabins = response.data.map((cabin: any) => ({
          ...cabin,
          _id: cabin._id || cabin.id,
          id: cabin.id || cabin._id,
          imageUrl: cabin.imageUrl || cabin.imageSrc || '/placeholder.svg',
          isActive: cabin.isActive !== false
        }));
        
        setCabins(processedCabins);
      } else {
        setError('Failed to fetch cabins');
        toast({
          title: "Error",
          description: "Failed to fetch cabins",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error fetching cabins:', err);
      setError('Failed to fetch cabins');
      toast({
        title: "Error",
        description: "Failed to fetch cabins",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleNewCabin = () => {
    navigate('/hostel-manager/cabins/new');
  };
  
  const handleEditCabin = (cabin: CabinData) => {
    navigate(`/hostel-manager/cabins/${cabin._id}/edit`);
  };
  
  const handleToggleCabinStatus = async (cabinId: string, isActive: boolean) => {
    try {
      const response = await adminCabinsService.updateCabin(cabinId, { isActive });
      
      if (response.success) {
        toast({
          title: "Success",
          description: `Cabin ${isActive ? 'activated' : 'deactivated'} successfully`
        });
        
        // Update the cabin in the state
        setCabins(prevCabins => 
          prevCabins.map(cabin => 
            cabin._id === cabinId ? { ...cabin, isActive } : cabin
          )
        );
      } else {
        throw new Error((response as any).error || `Failed to ${isActive ? 'activate' : 'deactivate'} cabin`);
      }
    } catch (error) {
      console.error('Error toggling cabin status:', error);
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive"
      });
    }
  };
  
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Filter cabins based on search query (client-side filtering)
  };
  
  const handleViewSeatDetails = (cabin: CabinData) => {
    navigate(`/seat-management/${cabin._id}`);
  };
  
  // Filter cabins based on search query
  const filteredCabins = cabins.filter(cabin => 
    cabin.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cabin.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (cabin.category && cabin.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  if (!user || (user.role !== "hostel_manager" && user.role !== "admin")) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto py-10 px-4">
          <Card>
            <CardContent className="py-10">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="mb-6">
                  You need to be logged in as a hostel manager to access this
                  page.
                </p>
                <Button onClick={() => navigate("/hostel-manager/login")}>
                  Go to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container mx-auto py-10 px-4">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4">
            <CardTitle className="text-2xl font-bold">Reading Room Management</CardTitle>
            <Button onClick={handleNewCabin} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Room
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Search by name, category or description..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : error ? (
              <div className="text-center py-6 text-red-500">{error}</div>
            ) : filteredCabins.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchQuery ? 'No cabins found matching your search.' : 'No cabins found. Add your first cabin!'}
              </div>
            ) : (
              <CabinManagementComponent 
                cabins={filteredCabins}
                onEditCabin={(index) => handleEditCabin(filteredCabins[index])}
                onToggleActive={handleToggleCabinStatus}
                onViewSeatDetails={handleViewSeatDetails}
                isAdmin={user.role === "admin"}
              />
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default CabinManagement;
