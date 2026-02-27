
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Users, IndianRupee, Clock, BedDouble } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { hostelBookingService } from '@/api/hostelBookingService';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface HostelOption {
  id: string;
  name: string;
}

const HOSTEL_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#f59e0b',
  '#ef4444',
  '#6366f1',
  '#14b8a6',
];

const HOSTEL_BG_CLASSES = [
  'bg-[hsl(var(--chart-1))]',
  'bg-[hsl(var(--chart-2))]',
  'bg-[hsl(var(--chart-3))]',
  'bg-[hsl(var(--chart-4))]',
  'bg-[hsl(var(--chart-5))]',
  'bg-amber-500',
  'bg-red-500',
  'bg-indigo-500',
  'bg-teal-500',
];

export const HostelBookingCalendarDashboard: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<any[]>([]);
  const [hostels, setHostels] = useState<HostelOption[]>([]);
  const [selectedHostel, setSelectedHostel] = useState<string>('all');
  const [totalBeds, setTotalBeds] = useState(0);
  const [bedsByHostel, setBedsByHostel] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad the start of the calendar grid so day 1 aligns with correct weekday
  const startPadding = monthStart.getDay();

  useEffect(() => {
    fetchData();
  }, [currentDate, selectedHostel]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch hostels (RLS handles partner filtering)
      const { data: hostelData } = await supabase
        .from('hostels')
        .select('id, name')
        .order('name');
      setHostels(hostelData || []);

      // Fetch bookings
      const params: any = {};
      if (selectedHostel !== 'all') params.hostel_id = selectedHostel;
      const bookingData = await hostelBookingService.getAllBookings(params);
      setBookings(bookingData || []);

      // Fetch bed counts for occupancy
      const hostelIds = selectedHostel !== 'all'
        ? [selectedHostel]
        : (hostelData || []).map(h => h.id);

      if (hostelIds.length > 0) {
        const { data: beds } = await supabase
          .from('hostel_beds')
          .select('id, room_id')
          .eq('is_blocked', false);

        // Get rooms to map beds to hostels
        const { data: rooms } = await supabase
          .from('hostel_rooms')
          .select('id, hostel_id')
          .in('hostel_id', hostelIds);

        const roomToHostel: Record<string, string> = {};
        (rooms || []).forEach(r => { roomToHostel[r.id] = r.hostel_id; });

        const countsMap: Record<string, number> = {};
        let total = 0;
        (beds || []).forEach(b => {
          const hId = roomToHostel[b.room_id];
          if (hId && hostelIds.includes(hId)) {
            countsMap[hId] = (countsMap[hId] || 0) + 1;
            total++;
          }
        });
        setBedsByHostel(countsMap);
        setTotalBeds(total);
      }
    } catch (error: any) {
      console.error('Error fetching calendar data:', error);
      toast({ title: 'Error', description: error.message || 'Failed to load calendar data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Computed stats
  const stats = useMemo(() => {
    const now = new Date();
    const monthBookings = bookings.filter(b => {
      const start = parseISO(b.start_date);
      const end = parseISO(b.end_date);
      return isWithinInterval(monthStart, { start, end }) ||
        isWithinInterval(monthEnd, { start, end }) ||
        isWithinInterval(start, { start: monthStart, end: monthEnd });
    });

    const confirmed = monthBookings.filter(b => b.status === 'confirmed');
    const pending = monthBookings.filter(b => b.status === 'pending');
    const revenue = confirmed.reduce((sum, b) => sum + (b.total_price || 0), 0);
    const occupancyRate = totalBeds > 0 ? Math.round((confirmed.length / totalBeds) * 100) : 0;

    return { active: confirmed.length, pending: pending.length, revenue, occupancyRate };
  }, [bookings, totalBeds, monthStart, monthEnd]);

  // Occupancy chart data
  const chartData = useMemo(() => {
    return hostels.map(h => {
      const hBookings = bookings.filter(b =>
        b.hostel_id === h.id && b.status === 'confirmed' &&
        (() => {
          const start = parseISO(b.start_date);
          const end = parseISO(b.end_date);
          return isWithinInterval(monthStart, { start, end }) ||
            isWithinInterval(monthEnd, { start, end }) ||
            isWithinInterval(start, { start: monthStart, end: monthEnd });
        })()
      );
      const beds = bedsByHostel[h.id] || 0;
      return {
        name: h.name.length > 15 ? h.name.substring(0, 15) + '…' : h.name,
        occupancy: beds > 0 ? Math.round((hBookings.length / beds) * 100) : 0,
        beds,
        booked: hBookings.length,
      };
    }).filter(d => d.beds > 0);
  }, [hostels, bookings, bedsByHostel, monthStart, monthEnd]);

  const getBookingsForDay = (day: Date) => {
    return bookings.filter(b => {
      if (b.status === 'cancelled') return false;
      const start = parseISO(b.start_date);
      const end = parseISO(b.end_date);
      return isWithinInterval(day, { start, end });
    });
  };

  const getHostelColor = (hostelId: string) => {
    const idx = hostels.findIndex(h => h.id === hostelId);
    return HOSTEL_BG_CLASSES[idx % HOSTEL_BG_CLASSES.length];
  };

  const getHostelChartColor = (index: number) => HOSTEL_COLORS[index % HOSTEL_COLORS.length];

  const navigateMonth = (dir: 'prev' | 'next') => {
    setCurrentDate(prev => dir === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="h-3.5 w-3.5" /> Active Bookings
            </div>
            <p className="text-2xl font-bold">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <BedDouble className="h-3.5 w-3.5" /> Occupancy Rate
            </div>
            <p className="text-2xl font-bold">{stats.occupancyRate}%</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <IndianRupee className="h-3.5 w-3.5" /> Revenue
            </div>
            <p className="text-2xl font-bold">₹{stats.revenue.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Clock className="h-3.5 w-3.5" /> Pending
            </div>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Hostel Booking Calendar
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                <SelectTrigger className="w-48 h-8 text-sm">
                  <SelectValue placeholder="All Hostels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hostels</SelectItem>
                  {hostels.map(h => (
                    <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[110px] text-center">
                  {format(currentDate, 'MMMM yyyy')}
                </span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-1.5 text-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              {/* Empty cells for padding */}
              {Array.from({ length: startPadding }).map((_, i) => (
                <div key={`pad-${i}`} className="min-h-[80px]" />
              ))}
              {calendarDays.map((day, idx) => {
                const dayBookings = getBookingsForDay(day);
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={idx}
                    className={`min-h-[80px] p-1.5 border rounded relative ${
                      isToday ? 'border-primary bg-primary/5' : 'border-border/40'
                    }`}
                  >
                    <div className={`text-xs font-medium mb-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayBookings.slice(0, 5).map(booking => {
                        const start = parseISO(booking.start_date);
                        const end = parseISO(booking.end_date);
                        const isStart = isSameDay(day, start);
                        const isEnd = isSameDay(day, end);
                        let rounded = '';
                        if (isStart && isEnd) rounded = 'rounded';
                        else if (isStart) rounded = 'rounded-l';
                        else if (isEnd) rounded = 'rounded-r';
                        return (
                          <div
                            key={booking.id}
                            className={`h-1 ${getHostelColor(booking.hostel_id)} ${rounded}`}
                            title={`${booking.profiles?.name || 'Guest'} — ${booking.hostels?.name || ''} Room ${booking.hostel_rooms?.room_number || ''} Bed #${booking.hostel_beds?.bed_number || ''}`}
                          />
                        );
                      })}
                      {dayBookings.length > 5 && (
                        <span className="text-[10px] text-muted-foreground">+{dayBookings.length - 5}</span>
                      )}
                    </div>
                    {dayBookings.length > 0 && (
                      <Badge variant="secondary" className="absolute top-0.5 right-0.5 text-[10px] px-1 py-0">
                        {dayBookings.length}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Occupancy Chart + Legend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {chartData.length > 0 && (
          <Card className="border-border/60 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Bed Occupancy by Hostel</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value}%`, 'Occupancy']}
                    labelFormatter={(label) => `Hostel: ${label}`}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="occupancy" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={getHostelChartColor(i)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hostels.map((h, i) => (
                <div key={h.id} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-sm ${HOSTEL_BG_CLASSES[i % HOSTEL_BG_CLASSES.length]}`} />
                  <span className="text-xs">{h.name}</span>
                  {bedsByHostel[h.id] && (
                    <span className="text-[10px] text-muted-foreground ml-auto">{bedsByHostel[h.id]} beds</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
