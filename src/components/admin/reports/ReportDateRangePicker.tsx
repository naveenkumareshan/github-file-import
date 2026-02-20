
import React, { useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { format, startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReportDateRangePickerProps {
  dateRange: DateRange | undefined;
  onChange: (range: DateRange) => void;
  onTypeChange: (type: string) => void;
  className?: string;
  dateFilterType?:string;
}

const ReportDateRangePickerComponent: React.FC<ReportDateRangePickerProps> = ({
  dateRange,
  onChange,
  onTypeChange,
  className,
  dateFilterType
}) => {
  // Predefined ranges
const handlePredefinedRange = (rangeType: string) => {
    const today = new Date();
    let from: Date;
    let to: Date;

    switch (rangeType) {
      case 'today':
        from = today;
        to = today;
        break;
      case 'yesterday':
        from = subDays(today, 1);
        to = subDays(today, 1);
        break;
      case '7':
        from = subDays(today, 6); // Last 7 days including today
        to = today;
        break;
      case '30':
        from = subDays(today, 29); // Last 30 days including today
        to = today;
        break;
      case 'thisMonth':
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
      case 'lastMonth':
        { const lastMonth = subMonths(today, 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
        break; }
      case '90':
        from = subDays(today, 89); // Last 90 days including today
        to = today;
        break;
      case '180':
        from = subDays(today, 179); // Last 6 months including today
        to = today;
        break;
      case '365':
        from = subDays(today, 364); // Last 1 year including today
        to = today;
        break;
      default:
        return;
    }
    
    onChange({ from, to });
    onTypeChange(rangeType)
  };

  useEffect(()=>{
    handlePredefinedRange(dateFilterType);
  },[dateFilterType])

  return (
    <div className={cn("grid gap-4", className)}>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="grid flex-1 items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left flex items-center h-11 hover:bg-muted/30",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, yyyy")} -{" "}
                      {format(dateRange.to, "LLL dd, yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, yyyy")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={onChange}
                numberOfMonths={2}
                className="overflow-hidden rounded-md border"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="grid gap-2">
          <Select
            onValueChange={(value) => handlePredefinedRange(value)} value={dateFilterType}
          >
            <SelectTrigger className="h-11 w-[180px] flex-shrink-0">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
               <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="thisMonth">This month</SelectItem>
              <SelectItem value="lastMonth">Last month</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
              <SelectItem value="365">Last 1 year</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
// ✅ Memoized export with custom comparison
const ReportDateRangePicker = React.memo(ReportDateRangePickerComponent);

export default ReportDateRangePicker;