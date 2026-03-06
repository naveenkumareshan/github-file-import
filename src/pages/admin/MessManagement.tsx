import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Save, UtensilsCrossed, Clock, CalendarDays, Users } from 'lucide-react';
import {
  getMyMessPartner, upsertMessPartner,
  getMealTimings, upsertMealTiming, deleteMealTiming,
  getMessPackages, upsertMessPackage, deleteMessPackage,
  getWeeklyMenu, upsertWeeklyMenu, deleteWeeklyMenuItem,
  getMessSubscriptions, getMessAttendance, markAttendance,
} from '@/api/messService';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/currency';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const MEALS = ['breakfast', 'lunch', 'dinner'];
const MEAL_LABELS: Record<string, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };

export default function MessManagement() {
  const { user } = useAuth();
  const userId = user?.role === 'vendor_employee' && user.vendorId ? user.vendorId : user?.id;
  const [loading, setLoading] = useState(true);
  const [mess, setMess] = useState<any>(null);
  const [tab, setTab] = useState('profile');

  // Profile form
  const [form, setForm] = useState({ name: '', location: '', description: '', contact_number: '', food_type: 'both', capacity: '' });
  const [saving, setSaving] = useState(false);

  // Timings
  const [timings, setTimings] = useState<any[]>([]);
  // Packages
  const [packages, setPackages] = useState<any[]>([]);
  // Menu
  const [menu, setMenu] = useState<any[]>([]);
  // Subscriptions
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  // Attendance
  const [attendance, setAttendance] = useState<any[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    loadMess();
  }, [userId]);

  const loadMess = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const m = await getMyMessPartner(userId);
      setMess(m);
      if (m) {
        setForm({ name: m.name, location: m.location, description: m.description, contact_number: m.contact_number, food_type: m.food_type, capacity: m.capacity?.toString() || '' });
        const [t, p, mn, s] = await Promise.all([
          getMealTimings(m.id), getMessPackages(m.id), getWeeklyMenu(m.id), getMessSubscriptions(m.id)
        ]);
        setTimings(t); setPackages(p); setMenu(mn); setSubscriptions(s);
      }
    } catch { toast({ title: 'Error loading mess data', variant: 'destructive' }); }
    setLoading(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const payload = {
        ...(mess?.id ? { id: mess.id } : {}),
        user_id: userId,
        name: form.name,
        location: form.location,
        description: form.description,
        contact_number: form.contact_number,
        food_type: form.food_type,
        capacity: form.capacity ? parseInt(form.capacity) : null,
      };
      await upsertMessPartner(payload);
      toast({ title: 'Mess profile saved!' });
      await loadMess();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    setSaving(false);
  };

  // ── Timing CRUD ──
  const [timingForm, setTimingForm] = useState({ meal_type: 'breakfast', start_time: '07:00', end_time: '09:30' });
  const saveTiming = async () => {
    try {
      await upsertMealTiming({ mess_id: mess.id, ...timingForm });
      toast({ title: 'Timing saved!' });
      setTimings(await getMealTimings(mess.id));
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };
  const removeTiming = async (id: string) => {
    await deleteMealTiming(id);
    setTimings(await getMealTimings(mess.id));
  };

  // ── Package CRUD ──
  const [pkgForm, setPkgForm] = useState({ name: '', meal_types: ['breakfast', 'lunch', 'dinner'], duration_type: 'monthly', duration_count: '1', price: '' });
  const [mealCheckboxes, setMealCheckboxes] = useState({ breakfast: true, lunch: true, dinner: true });
  const savePackage = async () => {
    const meal_types = Object.entries(mealCheckboxes).filter(([, v]) => v).map(([k]) => k);
    try {
      await upsertMessPackage({
        mess_id: mess.id,
        name: pkgForm.name,
        meal_types,
        duration_type: pkgForm.duration_type,
        duration_count: parseInt(pkgForm.duration_count) || 1,
        price: parseFloat(pkgForm.price) || 0,
      });
      toast({ title: 'Package saved!' });
      setPackages(await getMessPackages(mess.id));
      setPkgForm({ name: '', meal_types: [], duration_type: 'monthly', duration_count: '1', price: '' });
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };
  const removePackage = async (id: string) => {
    await deleteMessPackage(id);
    setPackages(await getMessPackages(mess.id));
  };

  // ── Menu ──
  const getMenuValue = (day: string, meal: string) => menu.find(m => m.day_of_week === day && m.meal_type === meal)?.menu_items || '';
  const setMenuValue = (day: string, meal: string, value: string) => {
    setMenu(prev => {
      const existing = prev.find(m => m.day_of_week === day && m.meal_type === meal);
      if (existing) return prev.map(m => m === existing ? { ...m, menu_items: value } : m);
      return [...prev, { mess_id: mess.id, day_of_week: day, meal_type: meal, menu_items: value }];
    });
  };
  const saveMenu = async () => {
    try {
      const items = menu.filter(m => m.menu_items).map(m => ({
        ...(m.id ? { id: m.id } : {}),
        mess_id: mess.id,
        day_of_week: m.day_of_week,
        meal_type: m.meal_type,
        menu_items: m.menu_items,
      }));
      await upsertWeeklyMenu(items);
      toast({ title: 'Menu saved!' });
      setMenu(await getWeeklyMenu(mess.id));
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  // ── Attendance ──
  const loadAttendance = async () => {
    if (!mess?.id) return;
    setAttendance(await getMessAttendance(mess.id, attendanceDate));
  };
  useEffect(() => { if (mess?.id) loadAttendance(); }, [attendanceDate, mess?.id]);

  const handleMarkAttendance = async (subId: string, studentId: string, mealType: string) => {
    try {
      await markAttendance({ subscription_id: subId, user_id: studentId, mess_id: mess.id, date: attendanceDate, meal_type: mealType, status: 'consumed', marked_by: 'manual' });
      toast({ title: 'Attendance marked!' });
      loadAttendance();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Mess / Food Management</h1>
        {mess && (
          <Badge variant={mess.is_approved ? 'default' : 'secondary'}>
            {mess.is_approved ? 'Approved' : 'Pending Approval'}
          </Badge>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="timings" disabled={!mess}>Timings</TabsTrigger>
          <TabsTrigger value="packages" disabled={!mess}>Packages</TabsTrigger>
          <TabsTrigger value="menu" disabled={!mess}>Menu</TabsTrigger>
          <TabsTrigger value="subscriptions" disabled={!mess}>Subscribers</TabsTrigger>
        </TabsList>

        {/* ── PROFILE TAB ── */}
        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle>Mess Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Mess Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><Label>Location *</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
                <div><Label>Contact Number</Label><Input value={form.contact_number} onChange={e => setForm(f => ({ ...f, contact_number: e.target.value }))} /></div>
                <div>
                  <Label>Food Type</Label>
                  <Select value={form.food_type} onValueChange={v => setForm(f => ({ ...f, food_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="veg">Veg</SelectItem>
                      <SelectItem value="non_veg">Non-Veg</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Capacity (optional)</Label><Input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} /></div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
              <Button onClick={saveProfile} disabled={saving || !form.name || !form.location}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {mess ? 'Update Profile' : 'Create Mess Profile'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TIMINGS TAB ── */}
        <TabsContent value="timings">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" /> Meal Timings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {timings.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-2 border rounded">
                  <Badge>{MEAL_LABELS[t.meal_type]}</Badge>
                  <span className="text-sm">{t.start_time} – {t.end_time}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeTiming(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
              <Separator />
              <div className="flex items-end gap-3 flex-wrap">
                <div>
                  <Label>Meal</Label>
                  <Select value={timingForm.meal_type} onValueChange={v => setTimingForm(f => ({ ...f, meal_type: v }))}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{MEALS.map(m => <SelectItem key={m} value={m}>{MEAL_LABELS[m]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Start</Label><Input type="time" value={timingForm.start_time} onChange={e => setTimingForm(f => ({ ...f, start_time: e.target.value }))} className="w-32" /></div>
                <div><Label>End</Label><Input type="time" value={timingForm.end_time} onChange={e => setTimingForm(f => ({ ...f, end_time: e.target.value }))} className="w-32" /></div>
                <Button onClick={saveTiming}><Plus className="h-4 w-4 mr-1" /> Add</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PACKAGES TAB ── */}
        <TabsContent value="packages">
          <Card>
            <CardHeader><CardTitle>Meal Packages</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {packages.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(p.meal_types as string[])?.join(', ')} · {p.duration_count} {p.duration_type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{formatCurrency(p.price)}</span>
                    <Button variant="ghost" size="icon" onClick={() => removePackage(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>Package Name</Label><Input value={pkgForm.name} onChange={e => setPkgForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><Label>Price (₹)</Label><Input type="number" value={pkgForm.price} onChange={e => setPkgForm(f => ({ ...f, price: e.target.value }))} /></div>
                <div>
                  <Label>Duration Type</Label>
                  <Select value={pkgForm.duration_type} onValueChange={v => setPkgForm(f => ({ ...f, duration_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Duration Count</Label><Input type="number" value={pkgForm.duration_count} onChange={e => setPkgForm(f => ({ ...f, duration_count: e.target.value }))} /></div>
                <div className="col-span-full">
                  <Label>Meals Included</Label>
                  <div className="flex gap-4 mt-1">
                    {MEALS.map(m => (
                      <label key={m} className="flex items-center gap-1.5 text-sm">
                        <input type="checkbox" checked={mealCheckboxes[m as keyof typeof mealCheckboxes]} onChange={e => setMealCheckboxes(c => ({ ...c, [m]: e.target.checked }))} />
                        {MEAL_LABELS[m]}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <Button onClick={savePackage} disabled={!pkgForm.name || !pkgForm.price}><Plus className="h-4 w-4 mr-1" /> Add Package</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── MENU TAB ── */}
        <TabsContent value="menu">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Weekly Menu</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr><th className="text-left p-2">Day</th>{MEALS.map(m => <th key={m} className="text-left p-2">{MEAL_LABELS[m]}</th>)}</tr>
                  </thead>
                  <tbody>
                    {DAYS.map(day => (
                      <tr key={day} className="border-t">
                        <td className="p-2 capitalize font-medium">{day}</td>
                        {MEALS.map(meal => (
                          <td key={meal} className="p-2">
                            <Input
                              value={getMenuValue(day, meal)}
                              onChange={e => setMenuValue(day, meal, e.target.value)}
                              placeholder="e.g. Rice + Dal"
                              className="text-xs"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button onClick={saveMenu}><Save className="h-4 w-4 mr-1" /> Save Menu</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SUBSCRIBERS TAB ── */}
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Subscribers ({subscriptions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {subscriptions.length === 0 ? (
                <p className="text-muted-foreground text-sm">No subscriptions yet.</p>
              ) : (
                <div className="space-y-2">
                  {subscriptions.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{s.profiles?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{s.mess_packages?.name} · {s.start_date} → {s.end_date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={s.status === 'active' ? 'default' : 'secondary'}>{s.status}</Badge>
                        <span className="text-sm font-bold">{formatCurrency(s.price_paid)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance section */}
          {mess && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Mark Attendance</CardTitle>
                <Input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="w-48 mt-2" />
              </CardHeader>
              <CardContent>
                {subscriptions.filter(s => s.status === 'active').length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active subscribers.</p>
                ) : (
                  <div className="space-y-2">
                    {subscriptions.filter(s => s.status === 'active').map((s: any) => {
                      const studentAttendance = attendance.filter(a => a.subscription_id === s.id);
                      return (
                        <div key={s.id} className="p-3 border rounded">
                          <p className="font-medium text-sm">{s.profiles?.name}</p>
                          <div className="flex gap-2 mt-2">
                            {((s.mess_packages?.meal_types as string[]) || MEALS).map(meal => {
                              const marked = studentAttendance.find(a => a.meal_type === meal);
                              return (
                                <Button
                                  key={meal}
                                  variant={marked ? 'default' : 'outline'}
                                  size="sm"
                                  disabled={!!marked}
                                  onClick={() => handleMarkAttendance(s.id, s.user_id, meal)}
                                >
                                  {MEAL_LABELS[meal]} {marked ? '✓' : ''}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
