import React, { useState, useEffect } from 'react';
import { getImageUrl } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Users, Calendar as CalendarIcon, DollarSign, Edit, Save, X, Eye } from 'lucide-react';
import { DateBasedSeatMap } from '@/components/seats/DateBasedSeatMap';
import { useToast } from '@/hooks/use-toast';
import { vendorSeatsService, VendorSeat, VendorCabin, SeatFilters } from '@/api/vendorSeatsService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useVendorEmployeePermissions } from '@/hooks/useVendorEmployeePermissions';
import { useAuth } from '@/contexts/AuthContext';

const VendorSeats: React.FC = () => {
  const [selectedCabinId, setSelectedCabinId] = useState<string>('all');
  const [selectedCabin, setSelectedCabin] = useState<VendorCabin | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<VendorSeat | null>(null);
  const [searchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingSeat, setEditingSeat] = useState<VendorSeat | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [cabins, setCabins] = useState<VendorCabin[]>([]);
  const [seats, setSeats] = useState<VendorSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [viewMode, setViewMode] = useState<"card" | "table">("table");

  const { toast } = useToast();
  const { hasPermission } = useVendorEmployeePermissions();
  const { user } = useAuth();

  const isSeatStatus = (v: string): v is Exclude<SeatFilters['status'], undefined> =>
  ['available', 'occupied'].includes(v);

  const filters: SeatFilters = {
    cabinId: selectedCabinId !== 'all' ? selectedCabinId : undefined,
    status:
    statusFilter !== 'all' && isSeatStatus(statusFilter)
      ? statusFilter
      : undefined,
    search: searchTerm || undefined
  };

  const handleCabinChange = (cabinId: string) => {
    setSelectedCabinId(cabinId);
    if (cabinId === "all") {
      setSelectedCabin(null);
      return;
    }
    const cabin = cabins.find((c) => c._id === cabinId) || null;
    setSelectedCabin(cabin);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const cabinsResult = await vendorSeatsService.getVendorCabins();
      if (cabinsResult.success && cabinsResult.data) {
        setCabins(cabinsResult.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: "Error", description: "Failed to fetch data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchSeats = async () => {
    try {
      const result = await vendorSeatsService.getVendorSeats(filters);
      if (result.success && result.data) {
        setSeats(result.data.data);
      }
    } catch (error) {
      console.error('Error fetching seats:', error);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchSeats(); }, [selectedCabinId, statusFilter, searchTerm]);
  useEffect(() => {
    const interval = setInterval(fetchSeats, 100000);
    return () => clearInterval(interval);
  }, [selectedCabinId, statusFilter, searchTerm]);

  const handleSeatSelect = (seat: VendorSeat) => { setSelectedSeat(seat); };

  const handleEditPrice = (seat: VendorSeat) => {
    setEditingSeat(seat);
    setEditPrice(seat.price.toString());
  };

  const handleSavePrice = async () => {
    if (!editingSeat || !editPrice) return;
    setUpdating(true);
    try {
      const result = await vendorSeatsService.updateSeatPrice(editingSeat._id, parseFloat(editPrice));
      if (result.success) {
        toast({ title: "Success", description: "Seat price updated successfully" });
        setEditingSeat(null);
        fetchSeats();
      } else {
        toast({ title: "Error", description: "Failed to update seat price", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update seat price", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleAvailability = async (seat: VendorSeat) => {
    setUpdating(true);
    try {
      const result = await vendorSeatsService.toggleSeatAvailability(seat._id, !seat.isAvailable);
      if (result.success) {
        toast({ title: "Success", description: "Seat availability updated" });
        fetchSeats();
      } else {
        toast({ title: "Error", description: "Failed to update availability", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update availability", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };


  function getSeatStatus(seat: VendorSeat) {
    if (seat.currentBooking) return "Occupied";
    if (!seat.isAvailable) return "Unavailable";
    return "Available";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Dashboard / Seat Map</p>
          <h1 className="text-lg font-semibold">Seat Availability Map</h1>
        </div>
        <Button size="sm" variant="outline" onClick={fetchData}>
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Reading Rooms</p>
                <p className="text-lg font-semibold">{cabins.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Seats</p>
                <p className="text-lg font-semibold">{seats.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Occupied</p>
                <p className="text-lg font-semibold">
                  {seats.filter((s) => s.currentBooking).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-lg font-semibold">
                  {seats.filter((s) => s.isAvailable && !s.currentBooking).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">Seat List</TabsTrigger>
          <TabsTrigger value="availability">Date-Based Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Label>Reading Room</Label>
                  <Select value={selectedCabinId} onValueChange={handleCabinChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Reading Room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reading Rooms</SelectItem>
                      {cabins.map((cabin) => (
                        <SelectItem key={cabin._id} value={cabin._id}>
                          {cabin.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Seats</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center mb-4">
            <CardTitle>Seats ({seats.length})</CardTitle>
            <Button variant="outline" onClick={() => setViewMode(viewMode === "card" ? "table" : "card")}>
              {viewMode === "card" ? "Switch to Table View" : "Switch to Card View"}
            </Button>
          </div>

          {viewMode === "card" ? (
            <ScrollArea className="h-[600px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {seats.map((seat) => (
                  <Card key={seat._id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">Seat #{seat.number}</h3>
                          <p className="text-sm text-muted-foreground">{seat.cabinName}</p>
                        </div>
                        <Badge 
                          variant={seat.isAvailable && !seat.currentBooking ? "default" : "secondary"}
                          className={
                            seat.currentBooking
                              ? "bg-red-100 text-red-800"
                              : seat.isAvailable
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {getSeatStatus(seat)}
                        </Badge>
                      </div>
                      {(user?.role === 'admin' || user?.role === 'vendor' || hasPermission('seats_available_edit')) && (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-lg font-bold text-primary">₹{seat.price}/month</p>
                            <Button variant="outline" size="sm" onClick={() => handleEditPrice(seat)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex gap-2 mb-2">
                            <Button variant="outline" size="sm" onClick={() => handleToggleAvailability(seat)} disabled={updating}>
                              {seat.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                            </Button>
                          </div>
                        </>
                      )}
                      {seat.currentBooking && (
                        <div className="mt-3 p-2 bg-muted rounded">
                          <p className="text-sm font-medium">{seat.currentBooking.studentName}</p>
                          <p className="text-sm font-medium">{seat.currentBooking.studentPhone}</p>
                          <p className="text-xs text-muted-foreground">{seat.currentBooking.studentEmail}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(seat.currentBooking.startDate).toLocaleDateString()} - 
                            {new Date(seat.currentBooking.endDate).toLocaleDateString()}
                          </p>
                          {seat.currentBooking.profilePicture && (
                            <a href={getImageUrl(seat.currentBooking.profilePicture)} target="_blank" rel="noopener noreferrer">
                              <img src={getImageUrl(seat.currentBooking.profilePicture)} alt="Student" className="w-15 h-20 object-contain cursor-pointer" />
                            </a>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seat</TableHead>
                  <TableHead>Cabin</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  {(user?.role === 'admin' || user?.role === 'vendor' || hasPermission('seats_available_edit')) && (
                    <TableHead>Actions</TableHead>
                  )}
                  <TableHead>Booking Info</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seats.map((seat) => (
                  <TableRow key={seat._id}>
                    <TableCell>#{seat.number}</TableCell>
                    <TableCell>{seat.cabinName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{seat.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={seat.isAvailable && !seat.currentBooking ? "default" : "secondary"}
                        className={
                          seat.currentBooking
                            ? "bg-red-100 text-red-800"
                            : seat.isAvailable
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {getSeatStatus(seat)}
                      </Badge>
                    </TableCell>
                    <TableCell>₹{seat.price}/mo</TableCell>
                    {(user?.role === 'admin' || user?.role === 'vendor' || hasPermission('seats_available_edit')) && (
                      <TableCell className="space-y-2">
                        {!seat.currentBooking && (
                          <Button variant="outline" size="sm" onClick={() => handleToggleAvailability(seat)} disabled={updating}>
                            {seat.isAvailable ? "Mark Unavailable" : "Mark Available"}
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleEditPrice(seat)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    )}
                    <TableCell>
                      {seat.currentBooking ? (
                        <div className="text-sm">
                          <div className="font-medium">{seat.currentBooking.studentName}</div>
                          <div className="text-xs text-muted-foreground">{seat.currentBooking.studentPhone}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(seat.currentBooking.startDate).toLocaleDateString()} -{' '}
                            {new Date(seat.currentBooking.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No booking</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedSeat(seat)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Date-Based Seat Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex-1 min-w-[200px]">
                  <Label>Reading Rooms</Label>
                  <Select value={selectedCabinId} onValueChange={handleCabinChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Reading Room" />
                    </SelectTrigger>
                    <SelectContent>
                      {cabins.map((cabin) => (
                        <SelectItem key={cabin._id} value={cabin._id}>
                          {cabin.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedCabinId && selectedCabinId !== 'all' && selectedCabin && (
                <DateBasedSeatMap
                  cabinId={selectedCabinId}
                  floorsList={selectedCabin.floors}
                  onSeatSelect={handleSeatSelect}
                  selectedSeat={selectedSeat}
                />
              )}

              {(!selectedCabinId || selectedCabinId === 'all') && (
                <div className="text-center py-8 text-muted-foreground">
                  Please select a reading room to view date-based availability
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Price Dialog */}
      <Dialog open={!!editingSeat} onOpenChange={() => setEditingSeat(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Seat Price</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Seat #{editingSeat?.number} - {editingSeat?.cabinName}</Label>
            </div>
            <div>
              <Label>New Price (₹/month)</Label>
              <Input
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder="Enter new price"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSavePrice} disabled={updating || !editPrice}>
                <Save className="h-4 w-4 mr-2" />
                Save Price
              </Button>
              <Button variant="outline" onClick={() => setEditingSeat(null)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Seat Details Dialog */}
      <Dialog open={!!selectedSeat && !editingSeat} onOpenChange={() => setSelectedSeat(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seat #{selectedSeat?.number} Details</DialogTitle>
          </DialogHeader>
          {selectedSeat && (
            <div className="space-y-4">
              {/* Seat Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="border rounded p-2">
                  <p className="text-xs text-muted-foreground">Number</p>
                  <p className="font-medium">#{selectedSeat.number}</p>
                </div>
                <div className="border rounded p-2">
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium">{selectedSeat.category}</p>
                </div>
                <div className="border rounded p-2">
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="font-medium">₹{selectedSeat.price}/mo</p>
                </div>
                <div className="border rounded p-2">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={selectedSeat.currentBooking ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                    {getSeatStatus(selectedSeat)}
                  </Badge>
                </div>
              </div>

              {/* Current Booking - Student Profile */}
              {selectedSeat.currentBooking && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Current Student</h4>
                  <div className="flex gap-4">
                    {selectedSeat.currentBooking.profilePicture && (
                      <a href={getImageUrl(selectedSeat.currentBooking.profilePicture)} target="_blank" rel="noopener noreferrer">
                        <img src={getImageUrl(selectedSeat.currentBooking.profilePicture)} alt="Student" className="w-16 h-20 object-contain rounded border" />
                      </a>
                    )}
                    <div className="grid grid-cols-2 gap-2 flex-1 text-sm">
                      <div><span className="text-muted-foreground">Name:</span> {selectedSeat.currentBooking.studentName}</div>
                      <div><span className="text-muted-foreground">Phone:</span> {selectedSeat.currentBooking.studentPhone}</div>
                      <div><span className="text-muted-foreground">Email:</span> {selectedSeat.currentBooking.studentEmail}</div>
                      <div><span className="text-muted-foreground">ID:</span> {selectedSeat.currentBooking.userId}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* All Bookings (Current + Future) */}
              {selectedSeat.allBookings && selectedSeat.allBookings.length > 0 ? (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">All Bookings (Current & Future)</h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Serial #</TableHead>
                          <TableHead className="text-xs">Student</TableHead>
                          <TableHead className="text-xs">Phone</TableHead>
                          <TableHead className="text-xs">From</TableHead>
                          <TableHead className="text-xs">To</TableHead>
                          <TableHead className="text-xs">Duration</TableHead>
                          <TableHead className="text-xs">Amount</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSeat.allBookings.map((b, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs">{b.serialNumber || '-'}</TableCell>
                            <TableCell className="text-xs">
                              <div>{b.studentName}</div>
                              {b.course && <div className="text-muted-foreground">{b.course}</div>}
                              {b.college && <div className="text-muted-foreground">{b.college}</div>}
                            </TableCell>
                            <TableCell className="text-xs">{b.studentPhone}</TableCell>
                            <TableCell className="text-xs">{b.startDate ? new Date(b.startDate).toLocaleDateString() : '-'}</TableCell>
                            <TableCell className="text-xs">{b.endDate ? new Date(b.endDate).toLocaleDateString() : '-'}</TableCell>
                            <TableCell className="text-xs">{b.durationCount} {b.bookingDuration}</TableCell>
                            <TableCell className="text-xs">₹{b.totalPrice}</TableCell>
                            <TableCell className="text-xs">
                              <Badge variant="outline" className="text-[10px]">{b.paymentStatus}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No bookings found for this seat.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorSeats;
