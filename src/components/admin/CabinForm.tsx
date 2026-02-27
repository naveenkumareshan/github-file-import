
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
import { Switch } from '@/components/ui/switch';
import { adminCabinsService } from '@/api/adminCabinsService';
import { ImageUpload } from '@/components/ImageUpload';
import { SlotManagement } from '@/components/admin/SlotManagement';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info } from 'lucide-react';

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
  is24Hours: z.boolean().default(false),
  slotsEnabled: z.boolean().default(false),
  allowedDurations: z.array(z.string()).default(['daily', 'weekly', 'monthly']),
  slotsApplicableDurations: z.array(z.string()).default(['daily', 'weekly', 'monthly']),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  workingDays: z.array(z.string()).optional(),
}).refine((data) => {
  if (!data.is24Hours) {
    return !!data.openingTime && !!data.closingTime && (data.workingDays?.length || 0) > 0;
  }
  return true;
}, {
  message: 'Opening time, closing time, and at least one working day are required when not 24/7',
  path: ['openingTime'],
});

type CabinFormValues = z.infer<typeof cabinSchema>;

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
  is24Hours?: boolean;
  slotsEnabled?: boolean;
  openingTime?: string;
  closingTime?: string;
  workingDays?: string[];
}

interface CabinFormProps {
  initialData?: any;
  onSuccess?: () => void;
  cabinId?: string;
}

export function CabinForm({ initialData, onSuccess, cabinId }: CabinFormProps) {
  const isEditing = !!cabinId;
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
    is24Hours: false,
    slotsEnabled: false,
    allowedDurations: ['daily', 'weekly', 'monthly'],
    slotsApplicableDurations: ['daily', 'weekly', 'monthly'],
    openingTime: '06:00',
    closingTime: '22:00',
    workingDays: ALL_DAYS,
  };

  const formValues = initialData ? {
    ...defaultValues,
    ...initialData,
    amenities: Array.isArray(initialData.amenities) ? initialData.amenities.join(', ') : '',
    is24Hours: initialData.is24Hours ?? initialData.is_24_hours ?? false,
    slotsEnabled: initialData.slotsEnabled ?? initialData.slots_enabled ?? false,
    allowedDurations: initialData.allowedDurations || initialData.allowed_durations || ['daily', 'weekly', 'monthly'],
    slotsApplicableDurations: initialData.slotsApplicableDurations || initialData.slots_applicable_durations || ['daily', 'weekly', 'monthly'],
    openingTime: initialData.openingTime || initialData.opening_time || '06:00',
    closingTime: initialData.closingTime || initialData.closing_time || '22:00',
    workingDays: initialData.workingDays || (Array.isArray(initialData.working_days) ? initialData.working_days : ALL_DAYS),
  } : defaultValues;

  const form = useForm<CabinFormValues>({
    resolver: zodResolver(cabinSchema),
    defaultValues: formValues
  });

  const is24Hours = form.watch('is24Hours');
  const slotsEnabled = form.watch('slotsEnabled');

  async function onSubmit(values: CabinFormValues) {
    try {
      setIsSubmitting(true);
      
      const cabinData: CabinData = {
        name: values.name,
        description: values.description,
        price: values.price,
        capacity: values.capacity,
        amenities: values.amenities || [],
        category: values.category,
        images: values.images,
        isActive: values.isActive,
        is24Hours: values.is24Hours,
        slotsEnabled: values.slotsEnabled,
        allowedDurations: values.allowedDurations,
        slotsApplicableDurations: values.slotsApplicableDurations,
        openingTime: values.is24Hours ? '00:00' : values.openingTime,
        closingTime: values.is24Hours ? '23:59' : values.closingTime,
        workingDays: values.is24Hours ? ALL_DAYS : values.workingDays,
      } as any;
      
      if (values.imageSrc) cabinData.imageSrc = values.imageSrc;
      if (values.serialNumber) cabinData.serialNumber = values.serialNumber;
      
      if (isEditing && cabinId) {
        await adminCabinsService.updateCabin(cabinId, cabinData);
        toast({ title: "Cabin updated", description: "Cabin has been successfully updated" });
      } else {
        await adminCabinsService.createCabin(cabinData);
        toast({ title: "Cabin created", description: "New cabin has been successfully created" });
        if (!cabinData.isActive) {
          toast({
            title: "⚠️ Room is inactive",
            description: "This room was created as inactive. Students won't see it until you activate it.",
            variant: "destructive",
          });
        }
      }
      
      if (onSuccess) onSuccess();
      if (!isEditing) form.reset(defaultValues);
    } catch (error) {
      console.error('Error saving cabin:', error);
      toast({ title: "Error", description: "There was an error saving the cabin", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Reading Room Name</FormLabel>
                <FormControl><Input placeholder="Enter reading room name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="price" render={({ field }) => (
              <FormItem>
                <FormLabel>Price (per month)</FormLabel>
                <FormControl><Input type="number" placeholder="Enter price" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="capacity" render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity</FormLabel>
                <FormControl><Input type="number" placeholder="Enter capacity" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="serialNumber" render={({ field }) => (
              <FormItem>
                <FormLabel>Serial Number</FormLabel>
                <FormControl><Input placeholder="Enter serial number (optional)" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <div className="space-y-4">
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea placeholder="Enter reading room description" className="h-24" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="amenities" render={({ field }) => (
              <FormItem>
                <FormLabel>Amenities</FormLabel>
                <FormControl><Input placeholder="Enter amenities separated by commas" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="isActive" render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Active Status</FormLabel>
                  <p className="text-sm text-muted-foreground">Mark this reading room as active and available</p>
                </div>
              </FormItem>
            )} />
          </div>
        </div>

        {/* Timings Section */}
        <div className="space-y-4 border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground">Room Timings</h3>
          
          {/* 24/7 Toggle */}
          <FormField control={form.control} name="is24Hours" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-sm">Open 24/7</FormLabel>
                <p className="text-xs text-muted-foreground">Room is open 24 hours, 7 days a week</p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )} />

          {is24Hours ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Info className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                This room is open 24 hours, 7 days a week
              </span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="openingTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opening Time *</FormLabel>
                    <FormControl><Input type="time" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="closingTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Closing Time *</FormLabel>
                    <FormControl><Input type="time" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="workingDays" render={({ field }) => (
                <FormItem>
                  <FormLabel>Working Days *</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {ALL_DAYS.map(day => {
                      const isSelected = (field.value || []).includes(day);
                      return (
                        <label
                          key={day}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) field.onChange([...current, day]);
                              else field.onChange(current.filter((d: string) => d !== day));
                            }}
                            className="sr-only"
                          />
                          {day}
                        </label>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
            </>
          )}
        </div>

        {/* Slot-Based Booking Toggle */}
        <div className="space-y-4 border rounded-lg p-4">
          <FormField control={form.control} name="slotsEnabled" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-sm">Enable Slot-Based Booking</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Allow students to book specific time slots (e.g., Morning / Evening batch)
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )} />

          {slotsEnabled && cabinId && (
            <SlotManagement cabinId={cabinId} />
          )}

          {slotsEnabled && !cabinId && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Info className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                Save the room first, then you can manage time slots
              </span>
            </div>
          )}

          {/* Allowed Booking Durations */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Offer bookings for</Label>
            <p className="text-xs text-muted-foreground">Choose which duration types students can book</p>
            <div className="flex flex-wrap gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map((dur) => {
                const allowedDurations = form.watch('allowedDurations') || ['daily', 'weekly', 'monthly'];
                const isSelected = allowedDurations.includes(dur);
                return (
                  <button
                    key={dur}
                    type="button"
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                    }`}
                    onClick={() => {
                      if (isSelected && allowedDurations.length <= 1) return;
                      const updated = isSelected ? allowedDurations.filter((d: string) => d !== dur) : [...allowedDurations, dur];
                      form.setValue('allowedDurations', updated);
                      // Also remove from slotsApplicableDurations if unchecked
                      if (isSelected) {
                        const slotsDur = form.watch('slotsApplicableDurations') || [];
                        form.setValue('slotsApplicableDurations', slotsDur.filter((d: string) => d !== dur));
                      }
                    }}
                  >
                    {dur.charAt(0).toUpperCase() + dur.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slots Applicable Durations - only when slots enabled */}
          {slotsEnabled && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Apply slots to</Label>
              <p className="text-xs text-muted-foreground">Which duration types require time slot selection</p>
              <div className="flex flex-wrap gap-2">
                {(form.watch('allowedDurations') || ['daily', 'weekly', 'monthly']).map((dur: string) => {
                  const slotsDur = form.watch('slotsApplicableDurations') || ['daily', 'weekly', 'monthly'];
                  const isSelected = slotsDur.includes(dur);
                  return (
                    <button
                      key={dur}
                      type="button"
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                      }`}
                      onClick={() => {
                        const updated = isSelected ? slotsDur.filter((d: string) => d !== dur) : [...slotsDur, dur];
                        form.setValue('slotsApplicableDurations', updated);
                      }}
                    >
                      {dur.charAt(0).toUpperCase() + dur.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <FormField control={form.control} name="imageSrc" render={({ field }) => (
          <FormItem>
            <FormLabel>Room Image</FormLabel>
            <FormControl>
              <ImageUpload
                existingImages={field.value ? [field.value] : []}
                onUpload={(url) => field.onChange(url)}
                onRemove={() => field.onChange('')}
                cabinId={cabinId}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => onSuccess ? onSuccess() : form.reset()} disabled={isSubmitting}>
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
