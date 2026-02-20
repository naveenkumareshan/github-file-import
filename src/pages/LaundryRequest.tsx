import React, { useState } from 'react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';

const LaundryRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    roomNumber: '',
    block: '',
    floor: '',
    pickupTime: '',
    items: [
      { icon: '👕', name: 'T-Shirt', price: 15, quantity: 0 },
      { icon: '👖', name: 'Jeans', price: 30, quantity: 0 },
      { icon: '👔', name: 'Shirt', price: 20, quantity: 0 },
      { icon: '🛏️', name: 'Bedsheet', price: 40, quantity: 0 },
      { icon: '🧣', name: 'Towel', price: 20, quantity: 0 }
    ],
    notes: ''
  });
  
  const handleItemChange = (index: number, quantity: number) => {
    const updatedItems = [...formData.items];
    updatedItems[index].quantity = quantity;
    setFormData({ ...formData, items: updatedItems });
  };
  
  const totalAmount = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = formData.items.reduce((sum, item) => sum + item.quantity, 0);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Filter out items with zero quantity
    const selectedItems = formData.items.filter(item => item.quantity > 0);
    
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item for laundry",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }
    
    // Prepare the order data
    const orderData = {
      id: Date.now(),
      orderNumber: `LD-${Math.floor(Math.random() * 10000)}`,
      requestDate: new Date().toLocaleDateString(),
      status: "Processing",
      items: selectedItems,
      totalAmount,
      pickupLocation: {
        roomNumber: formData.roomNumber,
        block: formData.block,
        floor: formData.floor,
        pickupTime: formData.pickupTime
      }
    };
    
    // Save to local storage for demo purposes
    try {
      const existingOrders = localStorage.getItem('currentOrders');
      const orders = existingOrders ? JSON.parse(existingOrders) : [];
      orders.push(orderData);
      localStorage.setItem('currentOrders', JSON.stringify(orders));
      
      toast({
        title: "Laundry request submitted",
        description: "Your laundry request has been submitted successfully.",
        variant: "default"
      });
      
      navigate('/laundry');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit laundry request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-accent/30">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cabin-dark">Request Laundry Pickup</h1>
          <p className="text-muted-foreground">Fill in the details for your laundry pickup request</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pickup Location</CardTitle>
                  <CardDescription>Enter your room details for pickup</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="roomNumber" className="text-sm font-medium">Room Number</label>
                      <Input 
                        id="roomNumber" 
                        placeholder="e.g. 101" 
                        value={formData.roomNumber}
                        onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="block" className="text-sm font-medium">Block</label>
                      <Select 
                        value={formData.block} 
                        onValueChange={(value) => setFormData({ ...formData, block: value })}
                      >
                        <SelectTrigger id="block">
                          <SelectValue placeholder="Select block" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">Block A</SelectItem>
                          <SelectItem value="B">Block B</SelectItem>
                          <SelectItem value="C">Block C</SelectItem>
                          <SelectItem value="D">Block D</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="floor" className="text-sm font-medium">Floor</label>
                      <Select 
                        value={formData.floor} 
                        onValueChange={(value) => setFormData({ ...formData, floor: value })}
                      >
                        <SelectTrigger id="floor">
                          <SelectValue placeholder="Select floor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st Floor</SelectItem>
                          <SelectItem value="2">2nd Floor</SelectItem>
                          <SelectItem value="3">3rd Floor</SelectItem>
                          <SelectItem value="4">4th Floor</SelectItem>
                          <SelectItem value="5">5th Floor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="pickupTime" className="text-sm font-medium">Preferred Pickup Time</label>
                      <Select 
                        value={formData.pickupTime} 
                        onValueChange={(value) => setFormData({ ...formData, pickupTime: value })}
                      >
                        <SelectTrigger id="pickupTime">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="9:00 AM - 11:00 AM">9:00 AM - 11:00 AM</SelectItem>
                          <SelectItem value="11:00 AM - 1:00 PM">11:00 AM - 1:00 PM</SelectItem>
                          <SelectItem value="1:00 PM - 3:00 PM">1:00 PM - 3:00 PM</SelectItem>
                          <SelectItem value="3:00 PM - 5:00 PM">3:00 PM - 5:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Items</CardTitle>
                  <CardDescription>Select the items for laundry service</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center border-b pb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{item.icon}</span>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">₹{item.price} per item</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            type="button"
                            variant="outline" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleItemChange(index, Math.max(0, item.quantity - 1))}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button 
                            type="button"
                            variant="outline" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleItemChange(index, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Special Instructions</CardTitle>
                  <CardDescription>Any additional notes for the laundry staff</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Special instructions for your laundry..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="min-h-[100px]"
                  />
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Items:</span>
                      <span className="font-medium">{totalItems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">₹{totalAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service Fee:</span>
                      <span className="font-medium">₹0</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>₹{totalAmount}</span>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || totalItems === 0}
                  >
                    {loading ? "Submitting..." : "Submit Request"}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Your laundry will typically be ready within 24-48 hours.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
      
      <Footer />
    </div>
  );
};

export default LaundryRequest;
