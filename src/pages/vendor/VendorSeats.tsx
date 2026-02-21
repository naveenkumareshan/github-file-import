import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Users, Calendar as CalendarIcon, DollarSign, Edit, Save, X } from 'lucide-react';
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
  const [selectedCabin, setSelectedCabin] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState<VendorSeat | null>(null);
  const [searchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingSeat, setEditingSeat] = useState<VendorSeat | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [cabins, setCabins] = useState<VendorCabin[]>([]);
  const [seats, setSeats] = useState<VendorSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Date range states
  const [viewMode, setViewMode] = useState<"card" | "table">("table");

  const { toast } = useToast();
  const { hasPermission } = useVendorEmployeePermissions();
  const { user } = useAuth();

  const isSeatStatus = (v: string): v is Exclude<SeatFilters['status'], 'all'> =>
  ['available', 'occupied', 'hot-selling'].includes(v);

  // Build filters object
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
      const [cabinsResult] = await Promise.all([
        vendorSeatsService.getVendorCabins(),
      ]);

      if (cabinsResult.success && cabinsResult.data) {
        setCabins(cabinsResult.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSeats = async () => {
    try {
      const result = await vendorSeatsService.getVendorSeats(filters);
      if (result.success && result.data) {
        setSeats(result.data?.data);
      }
    } catch (error) {
      console.error('Error fetching seats:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchSeats();
  }, [selectedCabinId, statusFilter, searchTerm]);

  useEffect(() => {
    const interval = setInterval(fetchSeats, 100000);
    return () => clearInterval(interval);
  }, [filters]);


  const handleSeatSelect = (seat: VendorSeat) => {
    setSelectedSeat(seat);
  };

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

  const handleToggleHotSelling = async (seat: VendorSeat) => {
    setUpdating(true);
    try {
      const result = await vendorSeatsService.toggleHotSelling(seat._id, !seat.isHotSelling);
      if (result.success) {
        toast({ title: "Success", description: "Hot selling status updated" });
        fetchSeats();
      } else {
        toast({ title: "Error", description: "Failed to update hot selling status", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update hot selling status", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  function getSeatStatus(seat) {
    if (seat.currentBooking) return "Occupied";
    if (!seat.isAvailable) return "Un Available";
    if (seat.isHotSelling) return "Hot";
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
                  {seats.filter((s: VendorSeat) => !s.isAvailable).length}
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
                  {seats.filter((s: VendorSeat) => s.isAvailable).length}
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
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Label>
                    Reading Rooms Availability from{" "}
                    {new Date().toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}{" "}
                    to{" "}
                    {new Date(new Date().setDate(new Date().getDate() + 30)).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </Label>
                  <Select value={selectedCabinId} onValueChange={handleCabinChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Reading Rooms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reading Rooms</SelectItem>
                      {cabins.map((cabin: VendorCabin) => (
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
                      <SelectItem value="hot-selling">Hot Selling</SelectItem>
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
                  {seats.map((seat: VendorSeat) => (
                    <Card key={seat._id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">Seat #{seat.number}</h3>
                            <p className="text-sm text-muted-foreground">{seat.cabinName}</p>
                          </div>
                          <div className="flex gap-1">
                            <Badge 
                              variant={seat.isAvailable ? "default" : "secondary"}
                              className={
                                seat.isAvailable 
                                  ? seat.isHotSelling 
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {getSeatStatus(seat)}
                            </Badge>
                          </div>
                        </div>
                         { user.role =='admin' ||  hasPermission('seats_available_edit') &&
                        <><div className="flex items-center justify-between mb-2">
                            <p className="text-lg font-bold text-primary">₹{seat.price}/month</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPrice(seat)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div><div className="flex gap-2 mb-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleAvailability(seat)}
                                disabled={updating}
                              >
                                {seat.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                              </Button>
                              {seat.isAvailable && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleHotSelling(seat)}
                                  disabled={updating}
                                >
                                  {seat.isHotSelling ? 'Remove Hot' : 'Mark Hot'}
                                </Button>
                              )}
                            </div></>
}
                        {seat.currentBooking && (
                          <div className="mt-3 p-2 bg-muted rounded">
                            <p className="text-sm font-medium">{seat.currentBooking.studentName}</p>
                            <p className="text-sm font-medium">{seat.currentBooking.studentPhone}</p>
                            <p className="text-xs text-muted-foreground">{seat.currentBooking.studentEmail}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(seat.currentBooking.startDate).toLocaleDateString()} - 
                              {new Date(seat.currentBooking.endDate).toLocaleDateString()}
                            </p>
                            { seat.currentBooking.profilePicture &&
                              <a
                                href={import.meta.env.VITE_BASE_URL + seat.currentBooking.profilePicture}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  src={import.meta.env.VITE_BASE_URL + seat.currentBooking.profilePicture}
                                  alt={seat.currentBooking?.userId}
                                  className="w-15 h-20 object-contain cursor-pointer"
                                />
                              </a>
                            }
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
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  { hasPermission('seats_available_edit') &&
                  <TableHead>Actions</TableHead> }
                  <TableHead>Booking Info</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seats.map((seat: VendorSeat) => (
                  <TableRow key={seat._id}>
                    <TableCell>#{seat.number}</TableCell>
                    <TableCell>{seat.cabinName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={seat.isAvailable ? "default" : "secondary"}
                        className={
                          seat.isAvailable
                            ? seat.isHotSelling
                              ? "bg-orange-100 text-orange-800"
                              : "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {getSeatStatus(seat)}
                      </Badge>
                    </TableCell>
                    <TableCell>₹{seat.price}/mo</TableCell>
                    {(user.role =='admin' || user.role =='vendor' ||  hasPermission('seats_available_edit')) &&
                    <TableCell className="space-y-2">
                      
                      {seat.currentBooking ? null
                        : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAvailability(seat)}
                            disabled={updating}
                          >
                            {seat.isAvailable ? "Mark Unavailable" : "Mark Available"}
                          </Button>
                        )
                      }
                      {seat.isAvailable && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleHotSelling(seat)}
                          disabled={updating}
                        >
                          {seat.isHotSelling ? "Remove Hot" : "Mark Hot"}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPrice(seat)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </TableCell> }
                    <TableCell>
                      {seat.currentBooking ? (
                        <div className="text-sm">
                          <div className="font-medium">{seat.currentBooking.studentName}</div>
                          <div className="text-xs text-muted-foreground">{seat.currentBooking.studentPhone}</div>
                          <div className="text-xs text-muted-foreground">{seat.currentBooking.studentEmail}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(seat.currentBooking.startDate).toLocaleDateString()} -{' '}
                            {new Date(seat.currentBooking.endDate).toLocaleDateString()}
                          </div>
                            { seat.currentBooking.profilePicture &&
                              <a
                                href={import.meta.env.VITE_BASE_URL + seat.currentBooking.profilePicture}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  src={import.meta.env.VITE_BASE_URL + seat.currentBooking.profilePicture}
                                  alt={seat.currentBooking?.userId}
                                  className="w-10 h-10 object-contain cursor-pointer"
                                />
                              </a>
                            }
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No booking</span>
                      )}
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
                      <SelectValue placeholder="Select Reading Rooms" />
                    </SelectTrigger>
                    <SelectContent>
                      {cabins.map((cabin: VendorCabin) => (
                        <SelectItem key={cabin._id} value={cabin._id}>
                          {cabin.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedCabinId && selectedCabinId !== 'all' && (
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
              <Button 
                onClick={handleSavePrice}
                disabled={updating || !editPrice}
              >
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
    </div>
  );
};

export default VendorSeats;
