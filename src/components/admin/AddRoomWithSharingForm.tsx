
import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ImageUpload';
import { Badge, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { hostelService } from '@/api/hostelService';
import { RoomSharingOption, RoomWithSharingData } from '@/api/types';
import { Checkbox } from '@/components/ui/checkbox';

const sharingSchema = z.object({
  type: z.string(),
  capacity: z.coerce.number().min(1, { message: "Capacity must be at least 1" }),
  price: z.coerce.number().positive({ message: "Price must be positive" }),
  count: z.coerce.number().min(1, { message: "Count must be at least 1" })
});

const roomSchema = z.object({
  name: z.string().min(3, { message: 'Room name must be at least 3 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  maxCapacity: z.coerce.number().min(1, { message: "Capacity must be at least 1" }),
  roomNumber: z.string().min(1, { message: "Room Number must be at least 1" }),
  floor: z.string().min(1, { message: "Floor must be at least 1" }),
  basePrice: z.coerce.number().min(1, { message: "basePrice must be at least 1" }),
  category: z.enum(['standard', 'premium', 'luxury']),
  imageSrc: z.string().optional(),
  images: z.array(z.string()).default([]), // Added support for multiple images
  sharingOptions: z.array(sharingSchema).min(1, { message: "At least one sharing option is required" }),
  isActive: z.boolean().default(true),
  amenities: z.array(z.string()).default([]),
});

type RoomFormValues = z.infer<typeof roomSchema>;

interface AddRoomWithSharingFormProps {
  hostelId: string;
  onSuccess?: () => void;
  onClose?: () => void;
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

export function AddRoomWithSharingForm({ hostelId, onSuccess, onClose }: AddRoomWithSharingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: '',
      description: '',
      maxCapacity: 0,
      roomNumber: '',
      floor: '',
      basePrice: 1,
      category: 'standard',
      imageSrc: '',
      images:[],
      isActive:true,
      amenities: [],
      sharingOptions: [
        { type: '4-sharing', capacity: 4, price: 5000, count: 1 }
      ]
    }
  });
  const images = form.watch('images') || [];

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "sharingOptions"
  });

  const onSubmit = async (data: RoomFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Explicitly cast data to RoomWithSharingData
      const roomData: RoomWithSharingData = {
        name: data.name,
        description: data.description,
        maxCapacity: data.maxCapacity,
        roomNumber: data.roomNumber,
        floor: data.floor,
        basePrice: data.basePrice,
        category: data.category,
        imageSrc: data.imageSrc,
        sharingOptions: data.sharingOptions as RoomSharingOption[],
        isActive: data.isActive,
        amenities: data.amenities,
        images: data.images,
      };
      
      const response = await hostelService.addRoom(hostelId, roomData);
      
      toast({
        title: "Room Added",
        description: `Successfully added ${data.name} with sharing options`,
      });
      
      form.reset();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add room",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSharingOption = () => {
    append({ type: '4-sharing', capacity: 4, price: 2000, count: 1 });
  };

  const close = () => {
    form.reset();
    onClose();
  };

    // Set an image as the main image
  const setAsMainImage = (url: string) => {
    form.setValue('imageSrc', url);
    toast({
      title: "Main Image Updated",
      description: "This image will be used as the room's primary image"
    });
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


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

          {/* <div className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the room features"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageSrc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Image</FormLabel>
                  <FormControl>
                    <ImageUpload
                      existingImages={field.value ? [field.value] : []}
                      onUpload={(url) => field.onChange(url)}
                      onRemove={() => field.onChange('')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`floor`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Floor</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Floor Name /  Number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`roomNumber`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Number</FormLabel>
                  <FormControl>
                  <Input placeholder="Enter Room Number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
          </div> */}
          

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
                    className="w-full"
                    maxCount={5}
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
          <CardHeader>
            {/* <div className="flex justify-between items-center">
              <CardTitle>Sharing Options</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSharingOption}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Option
              </Button>
            </div> */}
          </CardHeader>
          <CardContent>
            {fields.map((field, index) => (
              <div 
                key={field.id} 
                className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 border rounded-md relative"
              >
                <FormField
                  control={form.control}
                  name={`sharingOptions.${index}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="2-sharing">2-Sharing</SelectItem>
                          <SelectItem value="3-sharing">3-Sharing</SelectItem>
                          <SelectItem value="4-sharing">4-Sharing</SelectItem>
                          <SelectItem value="5-sharing">5-Sharing</SelectItem>
                          <SelectItem value="6-sharing">6-Sharing</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`sharingOptions.${index}.capacity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* <FormField
                  control={form.control}
                  name={`sharingOptions.${index}.count`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Count</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

                <FormField
                  control={form.control}
                  name={`sharingOptions.${index}.price`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {form.formState.errors.sharingOptions?.message && (
              <p className="text-sm text-destructive">{form.formState.errors.sharingOptions.message}</p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {close()}}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding Room...' : 'Add Room'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
