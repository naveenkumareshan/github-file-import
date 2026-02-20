
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { hostelRoomService, HostelRoomData } from '@/api/hostelRoomService';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageUpload } from '@/components/ImageUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Image, Bed, Dice3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define sharing option type that matches the required fields in HostelRoomData
type SharingOptionType = {
  type: string;
  capacity: number;
  count: number;
  price: number;
  available?: number;
};

// Define the form schema
const roomFormSchema = z.object({
  name: z.string().min(2, 'Room name must be at least 2 characters'),
  roomNumber: z.string().min(1, 'Room number is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  floor: z.string().min(1, 'Floor information is required'),
  category: z.enum(['standard', 'premium', 'luxury']),
  basePrice: z.coerce.number().min(1, 'Base price must be greater than 0'),
  maxCapacity: z.coerce.number().min(1, 'Maximum capacity must be greater than 0'),
  isActive: z.boolean().default(true),
  imageSrc: z.string().optional(),
  images: z.array(z.string()).default([]), // Added support for multiple images
  amenities: z.array(z.string()).default([]),
  sharingOptions: z.array(
    z.object({
      type: z.string(),
      capacity: z.coerce.number().min(1),
      count: z.coerce.number().min(1),
      price: z.coerce.number().min(1),
    })
  ).default([]),
  beds: z.array(
    z.object({
      number: z.coerce.number().min(1),
      bedType: z.string(),
      sharingType: z.string(),
    })
  ).optional().default([]),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

interface HostelRoomFormProps {
  initialData?: HostelRoomData;
  hostelId: string;
  roomId?: string;
  onSuccess?: () => void;
}

const amenityOptions = [
  { id: 'wifi', label: 'WiFi' },
  { id: 'reading-lamp', label: 'Reading Lamp' },
  { id: 'desk', label: 'Desk' },
  { id: 'bookshelf', label: 'Bookshelf' },
  { id: 'power-outlet', label: 'Power Outlet' },
  { id: 'personal-locker', label: 'Personal Locker' },
  { id: 'adjustable-lighting', label: 'Adjustable Lighting' },
  { id: 'ergonomic-chair', label: 'Ergonomic Chair' },
  { id: 'coffee-service', label: 'Coffee Service' },
  { id: 'snack-bar', label: 'Snack Bar' },
  { id: 'attached-bathroom', label: 'Attached Bathroom' },
  { id: 'ac', label: 'Air Conditioning' },
  { id: 'heater', label: 'Heater' },
  { id: 'tv', label: 'TV' },
];

export const HostelRoomForm: React.FC<HostelRoomFormProps> = ({
  initialData,
  hostelId,
  roomId,
  onSuccess
}) => {
  const { toast } = useToast();
  const isEditing = !!roomId;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [beds, setBeds] = useState<Array<{number: number; bedType: string; sharingType: string}>>([]);

  // Convert initialData.sharingOptions to ensure it has all required properties
  const initialSharingOptions = initialData?.sharingOptions?.map(option => ({
    type: option.type,
    capacity: option.capacity,
    count: option.count,
    price: option.price,
    bedsCount: option.bedIds.length,
    available: option.available || 0
  })) || [];

  const defaultValues: RoomFormValues = {
    name: initialData?.name || '',
    roomNumber: initialData?.roomNumber || '',
    description: initialData?.description || '',
    floor: initialData?.floor || '',
    category: initialData?.category || 'standard',
    basePrice: initialData?.basePrice || 0,
    maxCapacity: initialData?.maxCapacity || 0,
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    imageSrc: initialData?.imageSrc || '',
    images: initialData?.images || [],
    amenities: initialData?.amenities || [],
    sharingOptions: initialSharingOptions.length > 0 
      ? initialSharingOptions 
      : [{ type: '2-sharing', capacity: 2, count: 1, price: 0 }],
    beds: [{ number: 1, bedType: 'single', sharingType: '2-sharing' }],
  };

  const totalCapacity = initialSharingOptions.reduce((sum, option) => {
      return sum + option.capacity * option.count;
    }, 0);

    const bedCount = initialSharingOptions.reduce((sum, option) => {
    return sum + option.bedsCount;
  }, 0);
    
  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues,
  });

  const sharingOptions = form.watch('sharingOptions') || [];
  const images = form.watch('images') || [];

  const addSharingOption = () => {
    const currentSharingOptions = form.getValues('sharingOptions') || [];
    form.setValue('sharingOptions', [
      ...currentSharingOptions,
      { type: `${currentSharingOptions.length + 2}-sharing`, capacity: currentSharingOptions.length + 2, count: 1, price: 0 },
    ]);
  };

  const removeSharingOption = (index: number) => {
    const currentSharingOptions = form.getValues('sharingOptions') || [];
    form.setValue(
      'sharingOptions',
      currentSharingOptions.filter((_, i) => i !== index)
    );
  };

  const updateSharingOption = (index: number, field: string, value: string | number) => {
    const currentSharingOptions = form.getValues('sharingOptions') || [];
    const updatedOptions = [...currentSharingOptions];
    
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: field === 'type' ? value : Number(value),
    };

    form.setValue('sharingOptions', updatedOptions);
  };

  // Handle image uploads
  const handleImageUpload = (url: string) => {
    const currentImages = form.getValues('images') || [];
    form.setValue('images', [...currentImages, url]);
    
    // If no main image set, use this as main image
    if (!form.getValues('imageSrc')) {
      form.setValue('imageSrc', url);
    }
  };

  // Remove an image from the array
  const handleRemoveImage = (url: string) => {
    const currentImages = form.getValues('images') || [];
    const filteredImages = currentImages.filter(image => image !== url);
    form.setValue('images', filteredImages);
    
    // If removing the main image, set the first available image as main
    if (form.getValues('imageSrc') === url) {
      form.setValue('imageSrc', filteredImages[0] || '');
    }
  };

  // Set an image as the main image
  const setAsMainImage = (url: string) => {
    form.setValue('imageSrc', url);
    toast({
      title: "Main Image Updated",
      description: "This image will be used as the room's primary image"
    });
  };

  // Add bed management functions
  const addBed = () => {
    const newBed = {
      number: Math.floor(Math.random() * 1000) + 1, // Random number between 1-1000
      bedType: 'single',
      sharingType: sharingOptions.length > 0 ? sharingOptions[0].type : '2-sharing',
    };
    setBeds([...beds, newBed]);
    form.setValue('beds', [...beds, newBed]);
  };

  const addRandomBeds = (count: number) => {
    const newBeds = [];
    for (let i = 0; i < count; i++) {
      const randomSharingOption = sharingOptions[Math.floor(Math.random() * sharingOptions.length)];
      newBeds.push({
        number: Number(`${Date.now()}${Math.floor(Math.random() * 100)}`),
        bedType: ['single', 'double', 'bunk'][Math.floor(Math.random() * 3)],
        sharingType: randomSharingOption ? randomSharingOption.type : '2-sharing',
      });
    }
    const updatedBeds = [...beds, ...newBeds];
    setBeds(updatedBeds);
    form.setValue('beds', updatedBeds);
    toast({
      title: "Beds Added",
      description: `${count} random beds have been added`
    });
  };

  const removeBed = (index: number) => {
    const updatedBeds = beds.filter((_, i) => i !== index);
    setBeds(updatedBeds);
    form.setValue('beds', updatedBeds);
  };

  const updateBed = (index: number, field: string, value: string | number) => {
    const updatedBeds = [...beds];
    (updatedBeds[index] as any)[field] = value;
    setBeds(updatedBeds);
    form.setValue('beds', updatedBeds);
  };

  async function onSubmit(data: RoomFormValues) {
    try {

      console.log(data)
      setIsSubmitting(true);
      let response;
      
      // Ensure all form data has required properties before submission
      const roomData: HostelRoomData = {
        name: data.name,
        roomNumber: data.roomNumber,
        description: data.description,
        floor: data.floor,
        category: data.category,
        basePrice: data.basePrice,
        maxCapacity: data.maxCapacity,
        isActive: data.isActive,
        imageSrc: data.imageSrc,
        images: data.images,
        beds: data.beds,
        amenities: data.amenities,
        hostelId: hostelId,
        sharingOptions: data.sharingOptions.map(option => ({
          type: option.type,
          capacity: option.capacity,
          count: option.count,
          price: option.price,
          // Calculate available if not provided
          available: option.capacity * option.count
        }))
      };
      
      if (isEditing && roomId) {
        response = await hostelRoomService.updateRoom(roomId, roomData);
      } else {
        response = await hostelRoomService.createRoom(hostelId, roomData);
      }

      if (response.success) {
        toast({
          title: isEditing ? "Room Updated" : "Room Created",
          description: isEditing 
            ? "Room information has been successfully updated" 
            : "New room has been successfully created",
        });
        
        // If we have beds data and this was a successful operation,
        // we would handle bed creation here (in a real implementation)
        if (beds.length > 0) {
          toast({
            title: "Beds Information",
            description: `${beds.length} beds will be processed in the next step`,
          });
        }
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(response.message || "Failed to save room");
      }
    } catch (error) {
      console.error("Error saving room:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} room. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[80vh] overflow-y-scroll rounded-md" >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter room name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="roomNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Floor</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Ground Floor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="luxury">Luxury</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the room features and amenities"
                      className="h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active Status</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Make this room available for booking
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            {/* Room Images Management */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Room Images</CardTitle>
                <Badge className="bg-blue-500">{images.length} images</Badge>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <ImageUpload
                    onUpload={handleImageUpload}
                    onRemove={handleRemoveImage}
                    existingImages={images}
                    className="w-full"
                    maxCount={10}
                  />
                </div>
              
                {images.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Set Main Image</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {images.map((imageUrl, index) => (
                        <div 
                          key={index} 
                          className={`relative border rounded-md overflow-hidden cursor-pointer ${
                            imageUrl === form.getValues('imageSrc') ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => setAsMainImage(imageUrl)}
                        >
                          <img 
                            src={import.meta.env.VITE_BASE_URL + imageUrl} 
                            alt={`Room image ${index + 1}`} 
                            className="w-full h-20 object-cover"
                          />
                          {imageUrl === form.getValues('imageSrc') && (
                            <div className="absolute bottom-0 inset-x-0 bg-primary text-primary-foreground text-[10px] py-1 px-2 text-center">
                              Main Image
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <FormField
              control={form.control}
              name="amenities"
              render={() => (
                <FormItem>
                  <div className="mb-2">
                    <FormLabel>Amenities</FormLabel>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {amenityOptions.map((amenity) => (
                      <FormField
                        key={amenity.id}
                        control={form.control}
                        name="amenities"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={amenity.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(amenity.id)}
                                  onCheckedChange={(checked) => {
                                    const updatedAmenities = checked
                                      ? [...field.value, amenity.id]
                                      : field.value?.filter(
                                          (value) => value !== amenity.id
                                        );
                                    field.onChange(updatedAmenities);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {amenity.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Sharing Options</CardTitle>
            {sharingOptions.length === 0 ? (<Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addSharingOption}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Sharing Option
            </Button>
            ):('')}
          </CardHeader>
          <CardContent>
            {sharingOptions.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No sharing options defined. Add at least one sharing option.
              </div>
            ) : (
              <div className="space-y-4">
                {sharingOptions.map((option, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end border-b pb-4">
                    <div>
                      <FormLabel className="text-xs">Type</FormLabel>
                      <Input 
                        value={option.type} 
                        onChange={(e) => updateSharingOption(index, 'type', e.target.value)}
                        placeholder="e.g., 2-sharing"
                      />
                    </div>
                    <div>
                      <FormLabel className="text-xs">Capacity</FormLabel>
                      <Input 
                        type="number" 
                        value={option.capacity} 
                        onChange={(e) => updateSharingOption(index, 'capacity', e.target.value)}
                      />
                    </div>
                    {/* <div>
                      <FormLabel className="text-xs">Count</FormLabel>
                      <Input 
                        type="number" 
                        value={option.count} 
                        onChange={(e) => updateSharingOption(index, 'count', e.target.value)}
                      />
                    </div> */}
                    <div>
                      <FormLabel className="text-xs">Price (₹)</FormLabel>
                      <Input 
                        type="number" 
                        value={option.price} 
                        onChange={(e) => updateSharingOption(index, 'price', e.target.value)}
                      />
                    </div>
                    <div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        className="text-red-500" 
                        onClick={() => removeSharingOption(index)}
                        disabled={sharingOptions.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bed Management Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Beds Management</CardTitle>
             <div className="flex gap-2">
            {bedCount > totalCapacity &&
              <><Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBed}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Bed
                </Button>
                {bedCount == 0 &&
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addRandomBeds(totalCapacity)}
                  className="flex items-center gap-2"
                >
                    <Dice3 className="h-4 w-4" />
                    Add {totalCapacity} Random Beds
                  </Button>
                }
                </>
            }
           
            </div>
          </CardHeader>
          <CardContent>
            {bedCount === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Bed className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p>No beds added yet. Add beds to this room for better management.</p>
                <div className="mt-4">
                  {bedCount == 0 &&
                    <Button 
                      type="button" 
                      onClick={() => addRandomBeds(totalCapacity)} 
                      variant="outline"
                      className="mx-auto"
                    >
                      <Dice3 className="h-4 w-4 mr-2" />
                      Add {totalCapacity} Random Beds
                    </Button>
                  }
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-6 gap-2 font-medium text-sm border-b pb-2">
                  <div>Bed Number</div>
                  <div className="col-span-2">Bed Type</div>
                  <div className="col-span-2">Sharing Type</div>
                  <div></div>
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {initialData?.sharingOptions.map((option, index) => (
                      <div>
                         {option.bedIds?.map((bed, bedIndex) => (
                        <div key={bedIndex} className="grid grid-cols-6 gap-2 items-center py-1 border-b border-dashed">
                          <div>
                            <Input 
                              value={bed.number} 
                              onChange={(e) => updateBed(index, 'number', parseInt(e.target.value) || 0)}
                              type="number"
                              className="h-8"
                            />
                          </div>
                          <div className="col-span-2">
                            <Select
                              value={bed.bedType}
                              onValueChange={(value) => updateBed(index, 'bedType', value)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Bed Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="single">Single Bed</SelectItem>
                                <SelectItem value="double">Double Bed</SelectItem>
                                <SelectItem value="bunk">Bunk Bed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            <Select
                              value={bed.sharingType}
                              onValueChange={(value) => updateBed(index, 'sharingType', value)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Sharing Type" />
                              </SelectTrigger>
                              <SelectContent>
                                {sharingOptions.map((option, idx) => (
                                  <SelectItem key={idx} value={option.type}>{option.type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500"
                              onClick={() => removeBed(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                         ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onSuccess?.()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Room' : 'Create Room')}
          </Button>
        </div>
      </form>
    </Form>
  );
};
