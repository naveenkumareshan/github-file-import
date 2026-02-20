
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { format, addMonths, isAfter, isBefore } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { adminManualBookingService } from '@/api/adminManualBookingService';
import { cn } from '@/lib/utils';
import { transactionService } from '@/api/transactionService';

interface BookingExtensionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  booking:any,
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
  const [newEndDate, setNewEndDate] = useState<Date | undefined>(addMonths(currentEndDate, 1));
  const [additionalAmount, setAdditionalAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [selectedDuration, setSelectedDuration] = useState(1);

  // eslint-disable-next-line no-constant-binary-expression
  const [startDate, setStartDate] = useState<Date>(new Date(booking.startDate));
  const [endDate, setEndDate] = useState<Date>(new Date(booking.endDate));

  const calculateNewEndDate = () => {
    const currentEndDate = new Date(booking.endDate);
    return addMonths(currentEndDate, selectedDuration);
  };
  
  const calculateAdditionalAmount = () => {
    const monthlyRate = booking.seatId?.price || 1000;
    return monthlyRate * selectedDuration;
  };

  const handleExtendBooking = async () => {
    
    try {
      setIsLoading(true);
      
      const extensionData = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        paymentMethod,
        remarks
      };



      const response = await adminManualBookingService.updateBookingData(
        bookingId, 
        extensionData, 
        bookingType
      );
      
      if (response.success) {
        toast({
          title: "Booking extended successfully",
          description: `Booking has been extended until ${format(newEndDate, 'PPP')}`,
        });
        
        onExtensionComplete();
        onOpenChange(false);
        // Reset form
        setNewEndDate(endDate);
        setRemarks('');
      } else {
        throw new Error(response.message || "Failed to extend booking");
      }
    } catch (error) {
      console.error("Extension error:", error);
      toast({
        title: "Extension failed",
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
            Update Booking Data start date and end date
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Start Date</Label>
            <div className="text-sm text-muted-foreground">
              {format(new Date(booking.startDate), 'PPP')}
            </div>
          </div>
        <div className="grid gap-2">
            <Label>End Date</Label>
            <div className="text-sm text-muted-foreground">
              {format(new Date(booking.endDate), 'PPP')}
            </div>
          </div>
          
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Start Date
              </label>
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
                    {startDate
                      ? format(startDate, "PPP")
                      : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={booking.startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                End Date
              </label>
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
                    selected={booking.endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="remarks">remarks (Optional)</Label>
            <Textarea
              id="remarks"
              placeholder="Add any remarks about this extension..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExtendBooking} disabled={isLoading}>
            {isLoading ? "Processing..." : "Update Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
