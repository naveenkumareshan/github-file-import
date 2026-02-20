import React, { useState, useEffect } from 'react';
import { hostelService, HostelData as HostelServiceData } from '@/api/hostelService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { HostelForm, HostelData as HostelFormData } from '@/components/admin/HostelForm';
import { AddRoomWithSharingForm } from '@/components/admin/AddRoomWithSharingForm';
import { Plus, Building, Edit, Trash2, Building2, Bed } from 'lucide-react';
import ErrorBoundary from '../../components/ErrorBoundary';
import { useNavigate } from 'react-router-dom';
import { DialogDescription } from '@radix-ui/react-dialog';
import { useAuth } from '@/contexts/AuthContext';

// Update the type to align with HostelForm's requirements
type HostelData = {
  _id: string;
  id: string;
  name: string;
  location: string;
  description: string; // Required in form
  city: string;
  area: string;
  locality: string;
  state: string;
  country: string;
  maxCapacity: number,
  contactEmail: string; // Required in form
  contactPhone: string; // Required in form
  isActive: boolean;
  logoImage?: string;
  images : string[],
  amenities?: string[];
  hostelCode?:string;
  coordinates?: {
    lat: number;
    lng: number;
  };
};

const HostelManagement = () => {
  const [hostels, setHostels] = useState<HostelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHostelFormOpen, setIsHostelFormOpen] = useState(false);
  const [isRoomFormOpen, setIsRoomFormOpen] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState<HostelData | null>(null);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchHostels();
  }, []);

  const fetchHostels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await hostelService.getUserHostels();
      
      if (response.success) {
        // Transform the data to ensure it matches our HostelData type
        const transformedHostels = response.data.map((hostel): HostelData => ({
          _id: hostel._id,
          id: hostel.id,
          name: hostel.name,
          location: hostel.location,
          description: hostel.description || '', // Ensure description is never null
          city: hostel.city,
          area: hostel.area,
          locality: hostel.locality,
          state: hostel.state,
          country: hostel.country,
          maxCapacity: hostel.maxCapacity,
          contactEmail: hostel.contactEmail || '', // Ensure contactEmail is never null
          contactPhone: hostel.contactPhone || '', // Ensure contactPhone is never null
          isActive: hostel.isActive,
          logoImage: hostel.logoImage,
          images: hostel.images,
          amenities: hostel.amenities,
          hostelCode:hostel.hostelCode,
          coordinates: hostel.coordinates
        }));
        
        setHostels(transformedHostels);
      } else {
        setError('Failed to load hostels');
        toast({
          title: "Error",
          description: "Failed to load hostels",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching hostels:', error);
      setError('Failed to load hostels');
      toast({
        title: "Error",
        description: "Failed to load hostels",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddHostel = () => {
    setSelectedHostel(null);
    setIsHostelFormOpen(true);
  };

  const handleEditHostel = (hostel: HostelData) => {
    // Make sure all required fields are present
    const completeHostel: HostelData = {
      ...hostel,
      description: hostel.description || '',
      contactEmail: hostel.contactEmail || '',
      contactPhone: hostel.contactPhone || '',
    };
    
    setSelectedHostel(completeHostel);
    setIsHostelFormOpen(true);
  };

  const handleDeleteHostel = async (hostelId: string) => {
    try {
      await hostelService.deleteHostel(hostelId);
      toast({
        title: "Success",
        description: "Hostel deleted successfully",
      });
      fetchHostels();
    } catch (error) {
      console.error('Error deleting hostel:', error);
      toast({
        title: "Error",
        description: "Failed to delete hostel",
        variant: "destructive"
      });
    }
  };

  const handleAddRoom = (hostel: HostelData) => {
    setSelectedHostel(hostel);
    setIsRoomFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsHostelFormOpen(false);
    setIsRoomFormOpen(false);
    fetchHostels();
  };

  const handleFormClose = () => {
    setIsRoomFormOpen(false);
  };

  const handleViewRooms = (hostelId: string) => {
    navigate(`/admin/hostels/${hostelId}/rooms`);
  };

   const handleOpenImageGallery = (hostel: HostelData, initialImage?: string) => {
    setSelectedHostel(hostel);
    setSelectedImage(initialImage || hostel.logoImage);
    setIsImageGalleryOpen(true);
  };


    // Check if user is admin
  // if (!user || user.role !== 'admin') {
  //   return (
  //     <div className="container mx-auto p-6">
  //       <Card>
  //         <CardContent className="flex flex-col items-center justify-center py-12">
  //           <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
  //           <p className="mb-4">You don't have permission to access this page.</p>
  //           <Button onClick={() => navigate('/')}>Back to Home</Button>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   );
  // }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-2xl font-bold">Hostel Management</CardTitle>
            <Button onClick={handleAddHostel} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Hostel
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-cabin-wood border-t-transparent rounded-full"></div>
              </div>
            ) : error ? (
              <div className="text-center py-6 text-red-500">{error}</div>
            ) : hostels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No Hostels Found</h3>
                <p className="text-muted-foreground mb-6">
                  Start by adding your first hostel to manage accommodation.
                </p>
                <Button onClick={handleAddHostel}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Hostel
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hostels.map((hostel) => (
                      <TableRow key={hostel._id}>
                        <TableCell className="flex items-center gap-2">
                          <div 
                            className="h-10 w-10 rounded overflow-hidden cursor-pointer"
                            onClick={() => handleOpenImageGallery(hostel)}
                          >
                            {hostel.logoImage ? (
                              <img src={import.meta.env.VITE_BASE_URL + hostel.logoImage} alt={hostel.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full bg-muted flex items-center justify-center">
                                <Bed className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <span className="font-medium">{hostel.name}</span>
                          <span className="font-medium">{hostel.hostelCode}</span>
                          
                        </TableCell>
                        <TableCell>{hostel.location}</TableCell>
                        <TableCell>
                          <div>
                            <p>{hostel.contactEmail}</p>
                            <p className="text-muted-foreground text-sm">{hostel.contactPhone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {hostel.isActive ? (
                            <Badge className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleAddRoom(hostel)}
                            >
                              Add Room
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleViewRooms(hostel._id)}
                            >
                              View Rooms
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => handleEditHostel(hostel)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="text-red-500" 
                              onClick={() => handleDeleteHostel(hostel._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Hostel Form Dialog */}
        <Dialog open={isHostelFormOpen} onOpenChange={setIsHostelFormOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedHostel ? 'Edit Hostel' : 'Add New Hostel'}</DialogTitle>
            </DialogHeader>
            <HostelForm
              initialData={selectedHostel || undefined}
              hostelId={selectedHostel?._id}
              onSuccess={handleFormSuccess}
            />
          </DialogContent>
        </Dialog>
        
        {/* Image Gallery Dialog */}
        <Dialog open={isImageGalleryOpen} onOpenChange={setIsImageGalleryOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Room Images</DialogTitle>
            </DialogHeader>
            {selectedHostel && (
              <div className="space-y-6">
                {/* Main Selected Image */}
                <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden">
                  {selectedImage ? (
                    <img 
                      src={import.meta.env.VITE_BASE_URL + selectedImage} 
                      alt={selectedHostel.name}
                      className="w-full h-full object-contain" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Bed className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {selectedHostel.images && selectedHostel.images.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {selectedHostel.images.map((img, index) => (
                      <div 
                        key={index} 
                        onClick={() => setSelectedImage(img)}
                        className={`aspect-square rounded-md overflow-hidden cursor-pointer ${
                          selectedImage === img ? 'ring-2 ring-primary' : ''
                        }`}
                      >
                        <img 
                          src={import.meta.env.VITE_BASE_URL + img} 
                          alt={`Room image ${index + 1}`} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
        {/* Add Room Form Dialog */}
        <Dialog open={isRoomFormOpen} onOpenChange={setIsRoomFormOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Room to {selectedHostel?.name}</DialogTitle>
              <DialogDescription>
                Fill in the room details and sharing options for this hostel.
              </DialogDescription>
            </DialogHeader>
            {selectedHostel && (
              <AddRoomWithSharingForm
                hostelId={selectedHostel._id}
                onSuccess={handleFormSuccess}
                onClose={handleFormClose}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
};

export default HostelManagement;
