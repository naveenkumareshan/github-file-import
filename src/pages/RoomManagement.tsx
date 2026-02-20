import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { adminCabinsService } from '../api/adminCabinsService';
import { CabinItem } from '@/components/admin/CabinItem';
import { CabinEditor } from '@/components/admin/CabinEditor';
import { useNavigate } from 'react-router-dom';
import { Images, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminRoomsService } from '@/api/adminRoomsService';
import { useAuth } from '@/contexts/AuthContext';
import { vendorApprovalService } from '@/api/vendorApprovalService';

interface CabinData {
  _id: string;
  id: string;
  name: string;
  description: string;
  vendorId: any;
  address: string;
  price: number;
  capacity: number;
  amenities: string[];
  imageUrl: string;
  category: 'standard' | 'premium' | 'luxury';
  isActive?: boolean;
  isBookingActive?: boolean;
  serialNumber?: string;
  vendor?: {
    _id: string;
    businessName: string;
    vendorId: string;
  };
}

interface Vendor {
  _id: string;
  vendorId: string;
  businessName: string;
}

const RoomManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [cabins, setCabins] = useState<CabinData[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [showEditor, setShowEditor] = useState(false);
  const [selectedCabin, setSelectedCabin] = useState<CabinData | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // 3x3 grid
  const [totalItems, setTotalItems] = useState(0);
  
  const isAdmin = user?.role === 'admin';
  
  useEffect(() => {
    fetchCabins();
    if (isAdmin) {
      fetchVendors();
    }
  }, [currentPage, selectedVendor, isAdmin]);
  
  const fetchVendors = async () => {
    try {
      // This would be a call to get all vendors
      const filters = {
        page: 1,
        limit: 50,
      };
      // For now, we'll extract unique vendors from cabins
      const response = await vendorApprovalService.getAllVendors(filters);
      if (response.success && response.data) {  
        setVendors(response.data?.data?.vendors);
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
    }
  };
  
  const fetchCabins = async () => {
    try {
      setLoading(true);
      setError('');
      
      const filters = {
        page: currentPage,
        limit: itemsPerPage,
        ...(selectedVendor !== 'all' && { vendorId: selectedVendor }),
        ...(searchQuery && { search: searchQuery })
      };
      
      const response = await adminCabinsService.getAllCabins(filters);
      
      if (response.success) {
        const processedCabins = response.data.map((cabin: any) => ({
          ...cabin,
          _id: cabin._id || cabin.id,
          id: cabin.id || cabin._id,
          imageUrl: cabin.imageUrl || cabin.imageUrl || '/placeholder.svg',
          isActive: cabin.isActive !== false
        }));
        
        setCabins(processedCabins);
        setTotalItems(response.totalCount || processedCabins.length);
      } else {
              setError('Failed to fetch reading rooms');
        toast({
          title: "Error",
          description: "Failed to fetch reading rooms",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error fetching cabins:', err);
      setError('Failed to fetch reading rooms');
      toast({
        title: "Error",
        description: "Failed to fetch reading rooms",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleNewCabin = () => {
    setSelectedCabin(null);
    setShowEditor(true);
  };

  const manualBooking = () => {
    navigate('/admin/manual-bookings');
  };
  
  const backToRooms = () => {
    setShowEditor(false);
    return;
  };

  const handleEditCabin = (cabin: CabinData) => {
    setSelectedCabin(cabin);
    setShowEditor(true);
  };
  
  const handleDeleteCabin = async (cabinId: string) => {
    if (!window.confirm('Are you sure you want to delete this reading room?')) {
      return;
    }
    
    try {
      const response = await adminCabinsService.deleteCabin(cabinId);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Reading Room deleted successfully"
        });
        
        setCabins(prevCabins => prevCabins.filter(cabin => cabin._id !== cabinId));
      } else {
        throw new Error(response.message || 'Failed to delete cabin');
      }
    } catch (error) {
      console.error('Error deleting cabin:', error);
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive"
      });
    }
  };
  
  const handleSaveCabin = async (cabinData: any) => {
    try {
      let response;

      if (!cabinData) {
        backToRooms();
      } else {
        const cabinDataStore = {
          name: cabinData.name,
          description: cabinData.description,
          price: cabinData.price,
          lockerAvailable: cabinData?.lockerAvailable,
          lockerPrice: cabinData?.lockerPrice,
          isBookingActive: cabinData?.isBookingActive,
          capacity: cabinData.capacity,
          amenities: cabinData.amenities || [],
          category: cabinData.category,
          imageSrc: cabinData.images.length > 0 ? cabinData.images[0] : cabinData.imageUrl,
          images: cabinData.images,
          isActive: cabinData.isActive,
          ownerDetails: {
            ownerName: cabinData.ownerName,
            ownerPhone: cabinData.ownerPhone,
            ownerEmail: cabinData.ownerEmail,
          },
          location: {
            fullAddress: cabinData.fullAddress,
            city: cabinData.city,
            state: cabinData.state,
            pincode: cabinData.pincode,
            coordinates: {
              latitude: cabinData.latitude,
              longitude: cabinData.longitude
            },
            area: cabinData.area,
            locality: cabinData.locality,
            nearbyLandmarks: cabinData.nearbyLandmarks || []
          }
        };
        
        if (selectedCabin) {
          response = await adminCabinsService.updateCabin(selectedCabin._id, cabinDataStore);
        } else {
          response = await adminCabinsService.createCabin(cabinDataStore);
        }
        
        if (response.success) {
          toast({
            title: "Success",
            description: selectedCabin ? "Reading Room updated successfully" : "Reading Room created successfully"
          });
          
          setShowEditor(false);
          fetchCabins();
        } else {
          throw new Error(response.message || `Failed to ${selectedCabin ? 'update' : 'create'} cabin`);
        }
      }
      
    } catch (error) {
      console.error('Error saving cabin:', error);
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive"
      });
    }
  };
  
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCabins();
  };
  
  const handleVendorChange = (value: string) => {
    setSelectedVendor(value);
    setCurrentPage(1);
  };
  
  const handleCloseEditor = () => {
    setShowEditor(false);
    setSelectedCabin(null);
  };
  
  const handleManageSeats = (cabinId: string) => {
    navigate(`/admin/cabins/${cabinId}/seats`);
  };
  
  const handleToggleActive = async (roomId: string, isActive: boolean) => {
    try {
      const roomToUpdate = cabins.find(room => room._id === roomId);
      if (!roomToUpdate || !roomToUpdate._id) return;
      
      // console.log(isActive)
      // if (!isActive) {
        await adminRoomsService.restoreRoom(roomToUpdate._id, 'roomStatus',isActive);
      // } else {
      //   await adminRoomsService.deleteRoom('roomStatus',roomToUpdate._id);
        
      // }
      
      toast({
        title: isActive ? "Room Activated" : "Room Deactivated",
        description: `Room ${roomToUpdate.name} has been ${isActive ?  'deactivated' : 'activated'}`
      });
    } catch (error) {
      console.error('Error toggling room status:', error);
      toast({
        title: "Error",
        description: "Failed to update room status",
        variant: "destructive"
      });
    }
  };

   const onToggleBooking = async (roomId: string, isActive: boolean) => {
    try {
      const roomToUpdate = cabins.find(room => room._id === roomId);
      if (!roomToUpdate || !roomToUpdate._id) return;
      
      // if (!isActive) {
        await adminRoomsService.restoreRoom(roomToUpdate._id, 'bookingStatus', isActive);
      // } else {
      //   await adminRoomsService.deleteRoom('bookingStatus',roomToUpdate._id);
      // }
      
      toast({
        title: isActive ? "Room Activated" : "Room Deactivated",
        description: `Room ${roomToUpdate.name} has been ${isActive ?  'deactivated' : 'activated'}`
      });
    } catch (error) {
      console.error('Error toggling room status:', error);
      toast({
        title: "Error",
        description: "Failed to update room status",
        variant: "destructive"
      });
    }
  };

  // Filter cabins based on search query (client-side for current page)
  const filteredCabins = cabins.filter(cabin => 
    cabin.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cabin.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cabin.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={i === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(i)}
          className="mx-1"
        >
          {i}
        </Button>
      );
    }

    return buttons;
  };
  
  return (
    <div className="container mx-auto p-6">
      {!showEditor ? (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row justify-between items-center pb-4">
            <CardTitle className="text-2xl font-bold">Reading Room Management</CardTitle>
            <Button onClick={handleNewCabin} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Room
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <form onSubmit={handleSearch} className="flex-1">
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
              
              {isAdmin && vendors.length > 0 && (
                <div className="w-full md:w-64">
                  <Select value={selectedVendor} onValueChange={handleVendorChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vendors</SelectItem>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor._id} value={vendor._id}>
                          {vendor.businessName} ({vendor.vendorId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-cabin-wood border-t-transparent rounded-full"></div>
              </div>
            ) : error ? (
              <div className="text-center py-6 text-red-500">{error}</div>
            ) : filteredCabins.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchQuery || selectedVendor !== 'all' ? 'No reading rooms found matching your criteria.' : 'No reading rooms found. Add your first reading room!'}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCabins.map(cabin => (
                    <CabinItem
                      key={cabin._id}
                      cabin={cabin}
                      onToggleActive={handleToggleActive}
                      onToggleBooking={onToggleBooking}
                      onEdit={() => handleEditCabin(cabin)}
                      onDelete={() => handleDeleteCabin(cabin._id)}
                      onManageSeats={() => handleManageSeats(cabin._id)}
                    />
                  ))}
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {startItem} to {endItem} of {totalItems} results
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center">
                        {renderPaginationButtons()}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <CabinEditor
          onSave={handleSaveCabin}
          onCancel={backToRooms}
          existingCabin={selectedCabin}
          isAdmin={true}
        />
      )}
    </div>
  );
};

export default RoomManagement;
