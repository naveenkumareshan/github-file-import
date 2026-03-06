import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UtensilsCrossed, MapPin, Clock, CalendarDays } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getMessPartners, getMealTimings, getMessPackages, getWeeklyMenu, createMessSubscription, createMessReceipt } from '@/api/messService';
import { calculateBookingEndDate } from '@/utils/dateCalculations';
import { formatCurrency } from '@/utils/currency';
import { format, addDays } from 'date-fns';

const MEAL_LABELS: Record<string, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };
const FOOD_LABELS: Record<string, string> = { veg: '🟢 Veg', non_veg: '🔴 Non-Veg', both: '🟡 Veg & Non-Veg' };

export default function MessMarketplace() {
  const { user, isAuthenticated } = useAuth();
  const [messes, setMesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMess, setSelectedMess] = useState<any>(null);
  const [messTimings, setMessTimings] = useState<any[]>([]);
  const [messPackages, setMessPackages] = useState<any[]>([]);
  const [messMenu, setMessMenu] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Subscribe form
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [startDate, setStartDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [subscribing, setSubscribing] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);

  useEffect(() => {
    loadMesses();
  }, []);

  const loadMesses = async () => {
    try {
      const data = await getMessPartners({ approved: true, active: true });
      setMesses(data);
    } catch { toast({ title: 'Failed to load mess partners', variant: 'destructive' }); }
    setLoading(false);
  };

  const openDetail = async (mess: any) => {
    setSelectedMess(mess);
    setDetailLoading(true);
    try {
      const [t, p, m] = await Promise.all([getMealTimings(mess.id), getMessPackages(mess.id), getWeeklyMenu(mess.id)]);
      setMessTimings(t); setMessPackages(p); setMessMenu(m);
    } catch {}
    setDetailLoading(false);
  };

  const handleSubscribe = async () => {
    if (!user || !selectedPackage || !selectedMess) return;
    setSubscribing(true);
    try {
      const start = new Date(startDate);
      const end = calculateBookingEndDate(start, selectedPackage.duration_type, selectedPackage.duration_count);
      const sub = await createMessSubscription({
        user_id: user.id,
        mess_id: selectedMess.id,
        package_id: selectedPackage.id,
        start_date: format(start, 'yyyy-MM-dd'),
        end_date: format(end, 'yyyy-MM-dd'),
        price_paid: selectedPackage.price,
        payment_status: 'completed',
        payment_method: 'cash',
        status: 'active',
      });
      await createMessReceipt({
        subscription_id: (sub as any).id,
        user_id: user.id,
        mess_id: selectedMess.id,
        amount: selectedPackage.price,
        payment_method: 'cash',
        transaction_id: `MESS-${Date.now()}`,
      });
      toast({ title: 'Subscribed successfully!', description: `${selectedPackage.name} from ${startDate}` });
      setShowSubscribe(false);
      setSelectedPackage(null);
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    setSubscribing(false);
  };

  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Food / Mess</h1>
      </div>
      <p className="text-muted-foreground">Browse mess partners, view menus, and subscribe to meal plans.</p>

      {messes.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No mess partners available yet.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {messes.map(m => (
            <Card key={m.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDetail(m)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{m.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" /> {m.location}</p>
                    {m.description && <p className="text-sm mt-2 line-clamp-2">{m.description}</p>}
                  </div>
                  <Badge variant="outline">{FOOD_LABELS[m.food_type] || m.food_type}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedMess} onOpenChange={o => { if (!o) setSelectedMess(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedMess && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5" /> {selectedMess.name}
                </DialogTitle>
              </DialogHeader>

              {detailLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : (
                <Tabs defaultValue="menu" className="mt-2">
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="menu">Menu</TabsTrigger>
                    <TabsTrigger value="packages">Packages</TabsTrigger>
                    <TabsTrigger value="timings">Timings</TabsTrigger>
                  </TabsList>

                  <TabsContent value="menu" className="mt-3">
                    {messMenu.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Menu not yet uploaded.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr><th className="text-left p-2">Day</th><th className="p-2">Breakfast</th><th className="p-2">Lunch</th><th className="p-2">Dinner</th></tr></thead>
                          <tbody>
                            {DAYS.map(day => (
                              <tr key={day} className="border-t">
                                <td className="p-2 capitalize font-medium">{day}</td>
                                {['breakfast', 'lunch', 'dinner'].map(meal => (
                                  <td key={meal} className="p-2 text-xs">{messMenu.find(m => m.day_of_week === day && m.meal_type === meal)?.menu_items || '—'}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="packages" className="mt-3 space-y-3">
                    {messPackages.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No packages available.</p>
                    ) : (
                      messPackages.map(p => (
                        <Card key={p.id}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(p.meal_types as string[])?.map(m => MEAL_LABELS[m]).join(', ')} · {p.duration_count} {p.duration_type}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg">{formatCurrency(p.price)}</span>
                              {isAuthenticated && (
                                <Button size="sm" onClick={e => { e.stopPropagation(); setSelectedPackage(p); setShowSubscribe(true); }}>
                                  Subscribe
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="timings" className="mt-3 space-y-2">
                    {messTimings.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Timings not set yet.</p>
                    ) : (
                      messTimings.map(t => (
                        <div key={t.id} className="flex items-center gap-3 p-2 border rounded">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline">{MEAL_LABELS[t.meal_type]}</Badge>
                          <span className="text-sm">{t.start_time} – {t.end_time}</span>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Subscribe Dialog */}
      <Dialog open={showSubscribe} onOpenChange={setShowSubscribe}>
        <DialogContent>
          <DialogHeader><DialogTitle>Subscribe to {selectedPackage?.name}</DialogTitle></DialogHeader>
          {selectedPackage && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded">
                <p className="font-medium">{selectedPackage.name}</p>
                <p className="text-sm text-muted-foreground">{(selectedPackage.meal_types as string[])?.map((m: string) => MEAL_LABELS[m]).join(', ')}</p>
                <p className="text-lg font-bold mt-1">{formatCurrency(selectedPackage.price)}</p>
              </div>
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} min={format(new Date(), 'yyyy-MM-dd')} />
              </div>
              {startDate && (
                <p className="text-sm text-muted-foreground">
                  End Date: {format(calculateBookingEndDate(new Date(startDate), selectedPackage.duration_type, selectedPackage.duration_count), 'dd MMM yyyy')}
                </p>
              )}
              <Button onClick={handleSubscribe} disabled={subscribing} className="w-full">
                {subscribing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm & Pay {formatCurrency(selectedPackage.price)}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
