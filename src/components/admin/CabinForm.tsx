
import React, { useState } from 'react';
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
import { adminCabinsService } from '@/api/adminCabinsService';
import { ImageUpload } from '@/components/ImageUpload';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the form schema with Zod
const cabinSchema = z.object({
  name: z.string().min(3, { message: 'Cabin name must be at least 3 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  price: z.coerce.number().positive({ message: 'Price must be a positive number' }),
  capacity: z.coerce.number().int().positive().default(1),
  amenities: z.string().optional().transform(val => val ? val.split(',').map(item => item.trim()) : []),
  images: z.string().optional().transform(val => val ? val.split(',').map(item => item.trim()) : []),
  imageSrc: z.string().optional(),
  category: z.enum(['standard', 'premium', 'luxury']),
  serialNumber: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CabinFormValues = z.infer<typeof cabinSchema>;

// Define the expected shape for adminCabinsService
interface CabinData {
  name: string;
  description: string;
  price: number;
  capacity: number;
  amenities: string[];
  images: string[];
  imageSrc?: string;
  category: 'standard' | 'premium' | 'luxury';
  serialNumber?: string;
  isActive: boolean;
}

interface CabinFormProps {
  initialData?: any;
  onSuccess?: () => void;
  cabinId?: string;
}

export function CabinForm({ initialData, onSuccess, cabinId }: CabinFormProps) {
  const isEditing = !!cabinId;
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const defaultValues: Partial<CabinFormValues> = {
    name: '',
    description: '',
    price: 0,
    capacity: 1,
    amenities: [],
    images: [],
    imageSrc: '',
    category: 'standard',
    serialNumber: '',
    isActive: true,
  };

  // If we have initial data, merge it with the default values
  const formValues = initialData ? {
    ...defaultValues,
    ...initialData,
    // Convert the array to a comma-separated string if it exists
    amenities: Array.isArray(initialData.amenities) ? initialData.amenities.join(', ') : '',
  } : defaultValues;

  const form = useForm<CabinFormValues>({
    resolver: zodResolver(cabinSchema),
    defaultValues: formValues
  });

  async function onSubmit(values: CabinFormValues) {
    try {
      setIsSubmitting(true);
      
      // Create cabin data object with required fields
      const cabinData: CabinData = {
        name: values.name,
        description: values.description,
        price: values.price,
        capacity: values.capacity,
        amenities: values.amenities || [], // Ensure it's an array
        category: values.category,
        images: values.images,
        isActive: values.isActive
      };
      
      // Add optional fields if they exist
      if (values.imageSrc) cabinData.imageSrc = values.imageSrc;
      if (values.serialNumber) cabinData.serialNumber = values.serialNumber;
      
      let savedCabin;
      
      if (isEditing && cabinId) {
        savedCabin = await adminCabinsService.updateCabin(cabinId, cabinData);
        toast({
          title: "Cabin updated",
          description: "Cabin has been successfully updated"
        });
      } else {
        savedCabin = await adminCabinsService.createCabin(cabinData);
        toast({
          title: "Cabin created",
          description: "New cabin has been successfully created"
        });
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      if (!isEditing) {
        form.reset(defaultValues);
      }
    } catch (error) {
      console.error('Error saving cabin:', error);
      toast({
        title: "Error",
        description: "There was an error saving the cabin",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

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
                  <FormLabel>Reading Room Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter reading room name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (per month)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter price" {...field} />
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
                    <Input type="number" placeholder="Enter capacity" {...field} />
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
                    <Input placeholder="Enter serial number (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
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
                      placeholder="Enter reading room description" 
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amenities</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter amenities separated by commas"
                      {...field} 
                    />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      Mark this reading room as active and available
                    </p>
                  </div>
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
                  cabinId={cabinId} // Pass cabinId for cabin-specific uploads
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
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Reading Room' : 'Create Reading Room'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
