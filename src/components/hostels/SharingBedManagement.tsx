
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminHostelBedService } from '@/api/hostelBedService';
import { Bed, Plus, Save } from 'lucide-react';

interface SharingBedManagementProps {
  roomId: string;
  sharingOption: {
    type: string;
    capacity: number;
    count: number;
    price: number;
    available?: number;
  };
  onBedsAdded: () => void;
}

export const SharingBedManagement: React.FC<SharingBedManagementProps> = ({
  roomId,
  sharingOption,
  onBedsAdded
}) => {
  const [bedsToAdd, setBedsToAdd] = useState(0);
  const [bedType, setBedType] = useState<'single' | 'double' | 'bunk'>('single');
  const [bedPrice, setBedPrice] = useState(sharingOption.price);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  // Calculate max beds that can be added based on sharing option
  const maxBedsToAdd = sharingOption.count * sharingOption.capacity - (sharingOption.available || 0);
  
  const handleAddBeds = async () => {
    if (bedsToAdd <= 0 || bedsToAdd > maxBedsToAdd) {
      toast({
        title: "Invalid number of beds",
        description: `Please enter a number between 1 and ${maxBedsToAdd}`,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await adminHostelBedService.createSharingTypeBeds(
        roomId,
        sharingOption.type,
        bedsToAdd,
        {
          price: bedPrice,
          bedType,
          amenities
        }
      );
      
      if (response.success) {
        toast({
          title: "Success",
          description: `${bedsToAdd} beds added for ${sharingOption.type}`,
        });
        
        setBedsToAdd(0);
        onBedsAdded();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to add beds",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error adding beds for sharing type:", error);
      toast({
        title: "Error",
        description: "Failed to add beds. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">
          Add Beds for {sharingOption.type}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Total capacity: {sharingOption.count * sharingOption.capacity} beds</span>
            <span>Available: {sharingOption.available || 0} beds</span>
            <span>
              Remaining to add: {maxBedsToAdd} beds
            </span>
          </div>
          
          {maxBedsToAdd > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedsToAdd">Number of Beds to Add</Label>
                <Input 
                  id="bedsToAdd" 
                  type="number"
                  min={1}
                  max={maxBedsToAdd}
                  value={bedsToAdd}
                  onChange={(e) => setBedsToAdd(parseInt(e.target.value) || 0)}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bedType">Bed Type</Label>
                <Select 
                  value={bedType} 
                  onValueChange={(value) => setBedType(value as 'single' | 'double' | 'bunk')}
                >
                  <SelectTrigger id="bedType">
                    <SelectValue placeholder="Select bed type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Bed</SelectItem>
                    <SelectItem value="double">Double Bed</SelectItem>
                    <SelectItem value="bunk">Bunk Bed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bedPrice">Price per Bed (₹)</Label>
                <Input
                  id="bedPrice"
                  type="number"
                  value={bedPrice}
                  onChange={(e) => setBedPrice(parseInt(e.target.value) || 0)}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amenities">Amenities (comma separated)</Label>
                <Input
                  id="amenities"
                  value={amenities.join(', ')}
                  onChange={(e) => setAmenities(e.target.value.split(',').map(item => item.trim()).filter(Boolean))}
                  placeholder="e.g. Reading lamp, Charging point"
                  className="w-full"
                />
              </div>
              
              <div className="col-span-2">
                <Button
                  onClick={handleAddBeds}
                  disabled={bedsToAdd <= 0 || bedsToAdd > maxBedsToAdd || isSubmitting}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add {bedsToAdd} Beds
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <Bed className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-center">
                All beds for this sharing type have been added. No more beds can be added.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
