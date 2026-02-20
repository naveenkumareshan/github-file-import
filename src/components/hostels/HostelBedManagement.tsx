
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminHostelBedService } from '@/api/hostelBedService';
import { Bed, Plus, Save, Trash } from 'lucide-react';

interface HostelBedManagementProps {
  hostelId: string;
  roomId: string;
  roomNumber: string;
  floor: string;
  onSuccess?: () => void;
}

export const HostelBedManagement: React.FC<HostelBedManagementProps> = ({
  hostelId,
  roomId,
  roomNumber,
  floor,
  onSuccess
}) => {
  const [beds, setBeds] = useState<Array<{
    number: number;
    bedType: 'single' | 'double' | 'bunk';
    sharingType: 'private' | '2-sharing' | '3-sharing' | '4-sharing';
    price: number;
    amenities: string[];
  }>>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAddBed = () => {
    setBeds([
      ...beds,
      {
        number: beds.length + 1,
        bedType: 'single',
        sharingType: '2-sharing',
        price: 500,
        amenities: []
      }
    ]);
  };

  const handleRemoveBed = (index: number) => {
    setBeds(beds.filter((_, i) => i !== index));
  };

  const handleChangeBed = (index: number, field: string, value: any) => {
    const updatedBeds = [...beds];
    (updatedBeds[index] as any)[field] = value;
    setBeds(updatedBeds);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (beds.length === 0) {
      toast({
        title: "No beds added",
        description: "Please add at least one bed",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Send beds to API
      const response = await adminHostelBedService.bulkCreateBeds(
        hostelId,
        beds.map(bed => ({
          ...bed,
          hostelId,
          roomNumber,
          roomId,
          floor
        }))
      );
      
      toast({
        title: "Success",
        description: `${beds.length} beds have been added to the room`,
      });
      
      setBeds([]);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error adding beds:", error);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Manage Beds</h3>
          <p className="text-muted-foreground">
            Add beds to room #{roomNumber} on {floor} floor
          </p>
        </div>
        
        <Button onClick={handleAddBed}>
          <Plus className="h-4 w-4 mr-2" />
          Add Bed
        </Button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {beds.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <Bed className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground mb-4">No beds added yet</p>
                <Button type="button" variant="outline" onClick={handleAddBed}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bed
                </Button>
              </CardContent>
            </Card>
          ) : (
            beds.map((bed, index) => (
              <Card key={index} className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveBed(index)}
                  className="absolute right-2 top-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash className="h-4 w-4" />
                </Button>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Bed {bed.number}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`bed-${index}-number`}>Bed Number</Label>
                      <Input
                        id={`bed-${index}-number`}
                        type="number"
                        value={bed.number}
                        onChange={(e) => handleChangeBed(index, 'number', parseInt(e.target.value))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`bed-${index}-price`}>Price (₹/day)</Label>
                      <Input
                        id={`bed-${index}-price`}
                        type="number"
                        value={bed.price}
                        onChange={(e) => handleChangeBed(index, 'price', parseInt(e.target.value))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`bed-${index}-type`}>Bed Type</Label>
                      <Select
                        value={bed.bedType}
                        onValueChange={(value) => handleChangeBed(index, 'bedType', value)}
                      >
                        <SelectTrigger id={`bed-${index}-type`}>
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
                      <Label htmlFor={`bed-${index}-sharing`}>Sharing Type</Label>
                      <Select
                        value={bed.sharingType}
                        onValueChange={(value) => handleChangeBed(index, 'sharingType', value as any)}
                      >
                        <SelectTrigger id={`bed-${index}-sharing`}>
                          <SelectValue placeholder="Select sharing type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="2-sharing">2 Sharing</SelectItem>
                          <SelectItem value="3-sharing">3 Sharing</SelectItem>
                          <SelectItem value="4-sharing">4 Sharing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`bed-${index}-amenities`}>Amenities (comma separated)</Label>
                      <Input
                        id={`bed-${index}-amenities`}
                        value={bed.amenities.join(', ')}
                        onChange={(e) => handleChangeBed(
                          index, 
                          'amenities', 
                          e.target.value.split(',').map(item => item.trim()).filter(Boolean)
                        )}
                        placeholder="e.g. Attached bathroom, Study table, Cupboard"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          
          {beds.length > 0 && (
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Beds
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
