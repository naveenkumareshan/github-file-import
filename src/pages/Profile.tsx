import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProfileManagement } from '../components/profile/ProfileManagement';
import { bookingsService } from '@/api/bookingsService';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, BookMarked } from 'lucide-react';
import { format } from 'date-fns';

const statusColor: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-muted text-muted-foreground',
};

const Profile = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await bookingsService.getUserBookings();
        if (res.success && Array.isArray(res.data)) {
          setBookings(res.data.slice(0, 2));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <ProfileManagement />

      {/* My Bookings summary */}
      <div className="max-w-lg mx-auto px-3 pb-6 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-foreground flex items-center gap-1.5">
            <BookMarked className="h-3.5 w-3.5 text-primary" /> My Bookings
          </p>
          <Link to="/student/bookings" className="text-[12px] text-primary flex items-center gap-0.5 font-medium">
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : bookings.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-2 border-muted bg-transparent">
            <CardContent className="py-6 text-center">
              <p className="text-[12px] text-muted-foreground">No bookings yet.</p>
              <Link to="/cabins" className="text-[12px] text-primary font-medium mt-1 block">
                Browse reading rooms →
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => (
              <Card key={b.id} className="rounded-2xl border-0 shadow-sm bg-card">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookMarked className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-foreground truncate">
                      {(b.cabins as any)?.name || 'Reading Room'} — Seat #{b.seat_number || '—'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {b.start_date ? format(new Date(b.start_date), 'd MMM') : '—'} → {b.end_date ? format(new Date(b.end_date), 'd MMM yyyy') : '—'}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor[b.payment_status] || 'bg-muted text-muted-foreground'}`}>
                    {b.payment_status}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
