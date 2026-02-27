import React, { useState, useEffect } from 'react';
import { hostelService } from '@/api/hostelService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { HostelForm } from '@/components/admin/HostelForm';
import { AddRoomWithSharingForm } from '@/components/admin/AddRoomWithSharingForm';
import { Plus, Building2, Edit, Trash2, Bed, DoorOpen, Eye, Badge as BadgeIcon } from 'lucide-react';
import ErrorBoundary from '../../components/ErrorBoundary';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

const HostelManagement = () => {
  const [hostels, setHostels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHostelFormOpen, setIsHostelFormOpen] = useState(false);
  const [isRoomFormOpen, setIsRoomFormOpen] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState<any>(null);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { fetchHostels(); }, []);

  const fetchHostels = async () => {
    try {
      setLoading(true);
      setError(null);
      let data;
      if (user?.role === 'admin') {
        data = await hostelService.getAllHostels();
      } else {
        data = await hostelService.getUserHostels();
      }
      setHostels(data || []);
    } catch (error) {
      console.error('Error fetching hostels:', error);
      setError('Unable to fetch data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHostel = () => { setSelectedHostel(null); setIsHostelFormOpen(true); };
  const handleEditHostel = (hostel: any) => { setSelectedHostel(hostel); setIsHostelFormOpen(true); };

  const handleDeleteHostel = async (hostelId: string) => {
    try {
      await hostelService.deleteHostel(hostelId);
      toast({ title: "Success", description: "Hostel deleted successfully" });
      fetchHostels();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete hostel", variant: "destructive" });
    }
  };

  const handleAddRoom = (hostel: any) => { setSelectedHostel(hostel); setIsRoomFormOpen(true); };
  const handleFormSuccess = () => { setIsHostelFormOpen(false); setIsRoomFormOpen(false); fetchHostels(); };
  const handleViewRooms = (hostelId: string) => { navigate(`/admin/hostels/${hostelId}/rooms`); };

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Manage Hostels</h1>
            <p className="text-xs text-muted-foreground mt-0.5">View and manage all hostels and their rooms.</p>
          </div>
          <Button onClick={handleAddHostel} size="sm" className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Add Hostel
          </Button>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Building2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium">No Hostels Available</p>
                <p className="text-xs text-muted-foreground mb-4">Unable to fetch data. Please refresh.</p>
                <Button onClick={fetchHostels} variant="outline" size="sm">Retry</Button>
              </div>
            ) : hostels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Building2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium">No Hostels Found</p>
                <p className="text-xs text-muted-foreground mb-4">Start by adding your first hostel.</p>
                <Button onClick={handleAddHostel} size="sm"><Plus className="h-4 w-4 mr-1" /> Add Hostel</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Name</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Location</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Gender</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Status</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hostels.map((hostel, idx) => (
                      <TableRow key={hostel.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded overflow-hidden flex-shrink-0">
                              {hostel.logo_image ? (
                                <img src={hostel.logo_image} alt={hostel.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full bg-muted flex items-center justify-center">
                                  <Bed className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{hostel.name}</p>
                              <p className="text-xs text-muted-foreground">{hostel.serial_number}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {hostel.location || `${hostel.cities?.name || ''}, ${hostel.states?.name || ''}`}
                        </TableCell>
                        <TableCell><Badge variant="outline">{hostel.gender}</Badge></TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={hostel.is_active ? 'default' : 'secondary'}>
                              {hostel.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            {!hostel.is_approved && (
                              <Badge variant="outline" className="text-amber-600 border-amber-300">Pending Approval</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Button variant="outline" size="sm" onClick={() => handleAddRoom(hostel)} className="h-7 text-xs">
                              <DoorOpen className="h-3 w-3 mr-1" /> Add Room
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleViewRooms(hostel.id)} className="h-7 text-xs">
                              <Eye className="h-3 w-3 mr-1" /> Rooms
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditHostel(hostel)} className="h-7 w-7 p-0">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteHostel(hostel.id)}>
                              <Trash2 className="h-3 w-3" />
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
              hostelId={selectedHostel?.id}
              onSuccess={handleFormSuccess}
            />
          </DialogContent>
        </Dialog>

        {/* Image Gallery Dialog */}
        <Dialog open={isImageGalleryOpen} onOpenChange={setIsImageGalleryOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Hostel Images</DialogTitle>
            </DialogHeader>
            {selectedHostel && (
              <div className="space-y-6">
                <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden">
                  {selectedImage ? (
                    <img src={selectedImage} alt={selectedHostel.name} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Bed className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {selectedHostel.images?.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {selectedHostel.images.map((img: string, index: number) => (
                      <div 
                        key={index} 
                        onClick={() => setSelectedImage(img)}
                        className={`aspect-square rounded-md overflow-hidden cursor-pointer ${selectedImage === img ? 'ring-2 ring-primary' : ''}`}
                      >
                        <img src={img} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
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
              <DialogDescription>Fill in the room details and sharing options for this hostel.</DialogDescription>
            </DialogHeader>
            {selectedHostel && (
              <AddRoomWithSharingForm
                hostelId={selectedHostel.id}
                onSuccess={handleFormSuccess}
                onClose={() => setIsRoomFormOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
};

export default HostelManagement;
