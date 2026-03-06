
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface BookingExtensionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  booking: any;
  bookingType: 'cabin' | 'hostel';
  currentEndDate: Date;
  onExtensionComplete: () => void;
}

export const BookingUpdateDatesDialog = ({
  open,
  onOpenChange,
  bookingId,
  booking,
  bookingType,
  currentEndDate,
  onExtensionComplete
}: BookingExtensionDialogProps) => {
  const [remarks, setRemarks] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [startDate, setStartDate] = useState<Date>(new Date(booking.startDate));
  const [endDate, setEndDate] = useState<Date>(new Date(booking.endDate));

  const handleUpdateBooking = async () => {
    try {
      setIsLoading(true);

      const table = bookingType === 'cabin' ? 'bookings' : 'hostel_bookings';
      const updateData: any = {
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      };

      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Booking updated successfully",
        description: `Dates updated to ${format(startDate, 'PPP')} – ${format(endDate, 'PPP')}`,
      });

      onExtensionComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Update error:", error);
      toast({
        title: "Update failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Booking</DialogTitle>
          <DialogDescription>
            Update booking start date and end date
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="mb-2 block">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              placeholder="Add any remarks about this update..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdateBooking} disabled={isLoading}>
            {isLoading ? "Processing..." : "Update Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
