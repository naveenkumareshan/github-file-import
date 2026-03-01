
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { adminRoomsService } from '@/api/adminRoomsService';

interface RoomData {
  name: string;
  description: string;
  price: number;
  category: string;
  capacity: number;
  amenities: string[];
  isActive: boolean;
  serialNumber: string;
  imageSrc: string;
}
import { ImageUpload } from '@/components/ImageUpload';

// Define the form schema with Zod
const roomSchema = z.object({
  name: z.string().min(3, { message: 'Room name must be at least 3 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  price: z.coerce.number().positive({ message: 'Price must be a positive number' }),
  capacity: z.coerce.number().int().positive().default(1),
  category: z.enum(['standard', 'premium', 'luxury']),
  serialNumber: z.string().optional(),
  isActive: z.boolean().default(true),
  imageSrc: z.string().optional(),
  amenities: z.array(z.string()).default([])
});

type RoomFormValues = z.infer<typeof roomSchema>;

interface RoomFormProps {
  initialData?: Partial<RoomFormValues>;
  onSuccess?: () => void;
  roomId?: string;
}

export function RoomForm({ initialData, onSuccess, roomId }: RoomFormProps) {
  const isEditing = !!roomId;
  
  const defaultValues: Partial<RoomFormValues> = {
    name: '',
    description: '',
    price: 0,
    capacity: 1,
    category: 'standard',
    serialNumber: '',
    isActive: true,
    imageSrc: '',
    amenities: [],
    ...initialData
  };

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues
  });

  const amenityOptions = [
    { id: 'reading-lamp', label: 'Reading Lamp' },
    { id: 'desk', label: 'Desk' },
    { id: 'bookshelf', label: 'Bookshelf' },
    { id: 'power-outlet', label: 'Power Outlet' },
    { id: 'personal-locker', label: 'Personal Locker' },
    { id: 'adjustable-lighting', label: 'Adjustable Lighting' },
    { id: 'ergonomic-chair', label: 'Ergonomic Chair' },
    { id: 'coffee-service', label: 'Coffee Service' },
    { id: 'snack-bar', label: 'Snack Bar' },
    { id: 'private-bathroom', label: 'Private Bathroom' },
    { id: '24-7-access', label: '24/7 Access' },
    { id: 'priority-access', label: 'Priority Access' }
  ];

  async function onSubmit(values: RoomFormValues) {
    try {
      if (isEditing && roomId) {
        // Ensure all required fields are present for update
        await (adminRoomsService as any).updateRoom(roomId, values);
        toast({
          title: "Room updated",
          description: "Room has been successfully updated"
        });
      } else {
        // For creating, manually ensure all required fields are present
        const roomData: RoomData = {
          name: values.name,
          description: values.description,
          price: values.price,
          category: values.category,
          capacity: values.capacity,
          amenities: values.amenities,
          isActive: values.isActive,
          serialNumber: values.serialNumber,
          imageSrc: values.imageSrc
        };
        await (adminRoomsService as any).createRoom(roomData);
        toast({
          title: "Room created",
          description: "New room has been successfully created"
        });
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      if (!isEditing) {
        form.reset(defaultValues);
      }
    } catch (error) {
      console.error('Error saving room:', error);
      toast({
        title: "Error",
        description: "There was an error saving the room",
        variant: "destructive"
      });
    }
  }

  // Update image upload handler to match the expected type
  const handleImageUpload = async (fileOrUrl: File | string) => {
    // If it's a string (URL), just set it directly
    if (typeof fileOrUrl === 'string') {
      form.setValue('imageSrc', fileOrUrl);
      return;
    }
    
    if (!roomId) {
      // If no roomId (creating new room), just set the file for form submission
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('imageSrc', reader.result as string);
      };
      reader.readAsDataURL(fileOrUrl);
      return;
    }
    
    try {
      const result = await (adminRoomsService as any).uploadRoomImage(roomId, fileOrUrl);
      if (result.success) {
        form.setValue('imageSrc', result.data.url);
        toast({
          title: "Success",
          description: "Image uploaded successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not upload image",
        variant: "destructive"
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
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
            
            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Room ID (e.g., SR001)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                        <SelectValue placeholder="Select a category" />
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
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
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
              
              <FormField
                control={form.control}
                name="capacity"
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
            </div>
            
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
                      Mark this room as available for booking
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the room features" 
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
        
        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onSuccess ? onSuccess() : form.reset()}
          >
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Update Room' : 'Create Room'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
