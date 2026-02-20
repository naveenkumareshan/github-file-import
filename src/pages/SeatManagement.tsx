import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { SeatMapEditor, Seat } from "@/components/seats/SeatMapEditor";
import {
  RoomElementPositioner,
  RoomElement,
} from "@/components/admin/RoomElementPositioner";
import { adminCabinsService } from "@/api/adminCabinsService";
import { adminSeatsService, SeatData } from "@/api/adminSeatsService";
import { ArrowLeft, Save, Plus, Building } from "lucide-react";

interface CabinData {
  _id: string;
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  isActive: boolean;
  category: "standard" | "premium" | "luxury";
  serialNumber?: string;
}

const SeatManagement = () => {
  const { cabinId } = useParams<{ cabinId: string }>();
  const navigate = useNavigate();

  const [cabin, setCabin] = useState<CabinData | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [loading, setLoading] = useState(true);
  const [roomElements, setRoomElements] = useState<RoomElement[]>([]);
  const [seatPrice, setSeatPrice] = useState<number>(0);
  const [showAddSeatForm, setShowAddSeatForm] = useState(false);
  const [numSeatsToAdd, setNumSeatsToAdd] = useState<number>(1);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedSeats, setDraggedSeats] = useState<string[]>([]);
  const [price, setPrice] = useState(0);
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(1);

  const [floorNumber, setFloorNumber] = useState("");
  const [editingFloorId, setEditingFloorId] = useState<number | null>(null);
  const [showAddFloorForm, setShowAddFloorForm] = useState(false);

  const handleOpenAddFloor = () => {
    setFloorNumber("");
    setEditingFloorId(null);
    setShowAddFloorForm(true);
  };

  const handleOpenEditFloor = (floor: { id: number; number: number }) => {
    setFloorNumber(floor.number.toString());
    setEditingFloorId(floor.id);
    setShowAddFloorForm(true);
  };



  const handleAddOrUpdateFloor = async () => {
    const number = floorNumber;
    if (!number) return toast({ title: "Enter floor number" });

    try {
      const response = await adminCabinsService.addUpdateCabinFloor(cabin._id, {
        floorId: editingFloorId, // pass floorId if editing
        number,
      });

      if (response.success) {
        setFloors(response.data.floors);
        toast({
          title: "Success",
          description: editingFloorId ? "Floor updated" : "Floor added",
        });
        setFloorNumber("");
        setEditingFloorId(null);
        setShowAddFloorForm(false);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (cabinId) {
      fetchCabinAndSeats(cabinId);
    }
  }, [cabinId]);

  useEffect(() => {
    if (selectedFloor) {
      fetchCabinSeats(cabinId, selectedFloor);
    }
  }, [selectedFloor]);

  const fetchCabinAndSeats = async (id: string) => {
    try {
      setLoading(true);

      // Fetch cabin details
      const cabinResponse = await adminCabinsService.getCabinById(id);
      if (cabinResponse.success) {
        setFloors(cabinResponse.data.floors);
        setCabin(cabinResponse.data);
        setSeatPrice(cabinResponse.data.price || 0);

        // Set room elements from cabin data if available
        if (
          cabinResponse.data.roomElements &&
          cabinResponse.data.roomElements.length > 0
        ) {
          setRoomElements(cabinResponse.data.roomElements);
        } else {
          // Initialize with default elements if none exist
          setRoomElements([
            { id: "door-1", type: "door", position: { x: 20, y: 20 } },
            { id: "bath-1", type: "bath", position: { x: 100, y: 20 } },
          ]);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch cabin details",
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "An error occurred while fetching data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCabinSeats = async (id: string, selectedFloor: number) => {
    try {
      setLoading(true);
      // Fetch seats for this cabin
      const seatsResponse = await adminSeatsService.getSeatsByCabin(
        id,
        selectedFloor,
      );
      if (seatsResponse.success) {
        setSeats(seatsResponse.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch seats",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "An error occurred while fetching data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSeatSelect = (seat: Seat) => {
    setSelectedSeat(seat === selectedSeat ? null : seat);
    setPrice(selectedSeat.price);
  };

  const toggleCabinStatus = async () => {
    if (!cabin) return;

    try {
      const updatedCabin = { ...cabin, isActive: !cabin.isActive };
      const response = await adminCabinsService.updateCabin(
        cabin._id,
        updatedCabin,
      );

      if (response.success) {
        setCabin(response.data);
        toast({
          title: "Success",
          description: `Reading room ${response.data.isActive ? "activated" : "deactivated"} successfully`,
        });
      } else {
        throw new Error(response.message || "Failed to update cabin status");
      }
    } catch (error) {
      console.error("Error updating cabin status:", error);
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const handleSavePositions = async () => {
    if (!cabinId) return;

    try {
      const seatsToUpdate = seats
        // .filter(seat => draggedSeats.includes(seat._id))
        .map((seat) => ({
          _id: seat._id,
          position: seat.position,
        }));

      const response =
        await adminSeatsService.updateSeatPositions(seatsToUpdate);

      if (response.success) {
        toast({
          title: "Success",
          description: "Seat positions updated successfully",
        });
        setDraggedSeats([]);
      } else {
        throw new Error(response.message || "Failed to update seat positions");
      }
    } catch (error) {
      console.error("Error saving seat positions:", error);
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const handleSaveRoomElements = async (elements: RoomElement[]) => {
    setRoomElements(elements);

    try {
      if (!cabinId) return;

      const response = await adminCabinsService.updateCabinLayout(
        cabinId,
        elements,
      );

      if (response.success) {
        toast({
          title: "Success",
          description: "Room layout saved successfully to database",
        });
      } else {
        throw new Error(
          response.error?.message || "Failed to save room layout",
        );
      }
    } catch (error) {
      console.error("Error saving room elements:", error);
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const handleToggleSeatAvailability = async (seat: Seat) => {
    try {
      const updatedSeat = { ...seat, isAvailable: !seat.isAvailable };
      const response = await adminSeatsService.updateSeat(
        seat._id,
        updatedSeat,
      );

      if (response.success) {
        setSeats(
          seats.map((s) =>
            s._id === seat._id ? { ...s, isAvailable: !s.isAvailable } : s,
          ),
        );
        toast({
          title: "Success",
          description: `Seat ${seat.number} ${updatedSeat.isAvailable ? "activated" : "deactivated"} successfully`,
        });
      } else {
        throw new Error(response.message || "Failed to update seat");
      }
    } catch (error) {
      console.error("Error updating seat:", error);
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const handleToggleHotSelling = async (seat: Seat) => {
    try {
      const updatedSeat = { ...seat, isHotSelling: !seat.isHotSelling };
      const response = await adminSeatsService.updateSeat(
        seat._id,
        updatedSeat,
      );

      if (response.success) {
        setSeats(
          seats.map((s) =>
            s._id === seat._id ? { ...s, isHotSelling: !s.isHotSelling } : s,
          ),
        );
        toast({
          title: "Success",
          description: `Seat ${seat.number} ${updatedSeat.isHotSelling ? "activated" : "deactivated"} successfully`,
        });
      } else {
        throw new Error(response.message || "Failed to update seat");
      }
    } catch (error) {
      console.error("Error updating seat:", error);
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const handlePriceChange = async (seat: Seat, price: number) => {
    try {
      const updatedSeat = { ...seat, price: Number(price) };
      const response = await adminSeatsService.updateSeat(
        seat._id,
        updatedSeat,
      );

      selectedSeat.price = Number(price);
      setSelectedSeat(selectedSeat);

      if (response.success) {
        setSeats(
          seats.map((s) =>
            s._id === seat._id ? { ...s, isHotSelling: !s.isHotSelling } : s,
          ),
        );
        toast({
          title: "Success",
          description: `Seat ${seat.number} updated successfully`,
        });
      } else {
        throw new Error(response.message || "Failed to update seat");
      }
    } catch (error) {
      console.error("Error updating seat:", error);
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const handleAddSeats = async () => {
    if (!cabinId || numSeatsToAdd <= 0) return;

    try {
      // Get the next seat number
      const nextSeatNumber =
        seats.length > 0
          ? Math.max(...seats.map((seat) => seat.number)) + 1
          : 1;

      const newSeats: SeatData[] = [];

      // Generate positions for new seats
      for (let i = 0; i < numSeatsToAdd; i++) {
        // Calculate position - place in rows of 10
        const row = Math.floor((seats.length + i) / 20);
        const col = (seats.length + i) % 20;

        newSeats.push({
          number: nextSeatNumber + i,
          floor: selectedFloor,
          cabinId,
          price: seatPrice,
          position: {
            x: 20 + col * 50,
            y: 100 + row * 40,
          },
          isAvailable: true,
          isHotSelling: false,
        });
      }

      const response = await adminSeatsService.bulkCreateSeats(newSeats);

      if (response.success) {
        // Refresh the seats list
        fetchCabinAndSeats(cabinId);
        setShowAddSeatForm(false);
        toast({
          title: "Success",
          description: `${numSeatsToAdd} seat(s) added successfully`,
        });
      } else {
        throw new Error(response.message || "Failed to add seats");
      }
    } catch (error) {
      console.error("Error adding seats:", error);
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // Extra data for the seat details panel
  const seatDetails = selectedSeat
    ? {
        ...selectedSeat,
        formattedPrice: `₹${selectedSeat.price}/month`,
        status: selectedSeat.isAvailable
          ? selectedSeat.isHotSelling
            ? "Hot Selling"
            : "Available"
          : "Unavailable",
      }
    : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-cabin-wood border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Button
        variant="outline"
        size="sm"
        onClick={handleGoBack}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cabins
      </Button>

      <Card className="mb-6">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">{cabin?.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {cabin?.category} • {cabin?.capacity} capacity • ₹{cabin?.price}
              /month
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Label
              htmlFor="cabin-status"
              className={cabin?.isActive ? "text-green-500" : "text-red-500"}
            >
              {cabin?.isActive ? "Active" : "Inactive"}
            </Label>
            <Switch
              id="cabin-status"
              checked={cabin?.isActive || false}
              onCheckedChange={toggleCabinStatus}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Room Layout Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Room Layout & Elements</CardTitle>
        </CardHeader>
        <CardContent>
          <RoomElementPositioner
            roomId={cabinId || ""}
            initialElements={roomElements}
            onSave={handleSaveRoomElements}
          />
        </CardContent>
      </Card>

      {/* Seat Management Section */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Seat Management</CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {floors.map((floor) => (
              <div
                key={floor.id}
                className={`border rounded-md p-4 flex flex-col items-center justify-center gap-2 cursor-pointer
                  ${selectedFloor === floor.id ? "bg-blue-100 border-blue-500" : "border-gray-300"}
                `}
                onClick={() => setSelectedFloor(floor.id)}
              >
                <Building className="h-6 w-6 text-gray-700" />
                <span className="font-medium text-gray-800">Floor {floor.number}</span>
                
                {/* Edit button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 px-2 py-1 text-sm"
                  onClick={(e) => {
                    e.stopPropagation(); // prevent card click
                    handleOpenEditFloor(floor);
                  }}
                >
                  ✎ Edit
                </Button>
              </div>
            ))}

            {/* Add Floor card */}
            <div
              className="border border-dashed rounded-md p-4 flex flex-col items-center justify-center gap-2 cursor-pointer text-gray-700"
              onClick={handleOpenAddFloor}
            >
              <Plus className="h-6 w-6" />
              <span className="font-medium">Add Floor</span>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => handleOpenAddFloor}
            >
              <Plus className="h-4 w-4" />
              Add Seats
            </Button>
            {draggedSeats.length > 0 && (
              <Button
                size="sm"
                className="flex items-center gap-2"
                onClick={handleSavePositions}
              >
                <Save className="h-4 w-4" />
                Save Positions
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {showAddSeatForm && (
            <div className="border rounded p-4 mb-6">
              <h3 className="text-lg font-medium mb-3">Add New Seats</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="num-seats">Number of Seats</Label>
                  <Input
                    id="num-seats"
                    type="number"
                    min="1"
                    value={numSeatsToAdd}
                    onChange={(e) =>
                      setNumSeatsToAdd(parseInt(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="seat-price">Price per Seat (₹/month)</Label>
                  <Input
                    id="seat-price"
                    type="number"
                    min="0"
                    value={seatPrice}
                    onChange={(e) =>
                      setSeatPrice(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddSeatForm(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddSeats}>Add Seats</Button>
              </div>
            </div>
          )}
          {showAddFloorForm && (
            <div className="border rounded p-4 mb-6">
              <h3 className="text-lg font-medium mb-3">
                {editingFloorId ? "Update Floor" : "Add New Floor"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="floor-number">Floor Number</Label>
                  <Input
                    id="floor-number"
                    type="number"
                    min="1"
                    value={floorNumber}
                    onChange={(e) =>
                      setFloorNumber(e.target.value)
                    }
                    placeholder="Enter floor number"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddFloorForm(false);
                    setFloorNumber("");
                  }}
                >
                  Cancel
                </Button>

                <Button onClick={handleAddOrUpdateFloor} disabled={!floorNumber}>
                  {editingFloorId ? "Update Floor" : "Add Floor"}
                </Button>
              </div>
            </div>
          )}

          {seats.length > 0 ? (
            <div>
              <SeatMapEditor
                seats={seats}
                onSeatSelect={handleSeatSelect}
                selectedSeat={selectedSeat}
                isAdmin={true}
                onSavePositions={handleSavePositions}
                roomElements={roomElements}
              />

              {selectedSeat && (
                <div className="mt-6 border rounded p-4">
                  <h3 className="text-lg font-medium mb-3">Seat Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Seat Number</p>
                      <p>{selectedSeat.number}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Price</p>
                      <p>{seatDetails?.formattedPrice}</p>
                      <input
                        type="number"
                        className="border px-2 py-1 rounded text-sm w-24"
                        placeholder="Price"
                        onChange={(e) => setPrice(Number(e.target.value))}
                        value={price}
                      />
                      <Button
                        size="sm"
                        onClick={() => handlePriceChange(selectedSeat, price)}
                      >
                        Update
                      </Button>
                    </div>
                    <div className="flex items-center ">
                      <p className="text-sm font-medium">Hot Selling</p>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="seat-status"
                          checked={selectedSeat.isHotSelling}
                          onCheckedChange={() =>
                            handleToggleHotSelling(selectedSeat)
                          }
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Availability</p>
                      <div className="flex items-center space-x-2">
                        <Label
                          htmlFor="seat-status"
                          className={
                            selectedSeat.isAvailable
                              ? "text-green-500"
                              : "text-red-500"
                          }
                        >
                          {selectedSeat.isAvailable
                            ? "Available"
                            : "Unavailable"}
                        </Label>
                        <Switch
                          id="seat-status"
                          checked={selectedSeat.isAvailable}
                          onCheckedChange={() =>
                            handleToggleSeatAvailability(selectedSeat)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No seats found for this room. Add some seats to begin.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SeatManagement;
