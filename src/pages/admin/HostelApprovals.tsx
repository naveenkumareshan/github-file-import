
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { hostelService } from '@/api/hostelService';
import { Check, X, Building, Clock, Users, TrendingUp, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const HostelApprovals = () => {
  const [hostels, setHostels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHostel, setSelectedHostel] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [commission, setCommission] = useState('10');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  const fetchHostels = async () => {
    try {
      setLoading(true);
      const allHostels = await hostelService.getAllHostels();
      setHostels(allHostels || []);

      const total = allHostels?.length || 0;
      const pending = allHostels?.filter((h: any) => !h.is_approved && h.is_active).length || 0;
      const approved = allHostels?.filter((h: any) => h.is_approved).length || 0;
      setStats({ total, pending, approved, rejected: total - pending - approved });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHostels(); }, []);

  const handleAction = async () => {
    if (!selectedHostel) return;
    setProcessing(true);
    try {
      await hostelService.approveHostel(selectedHostel.id, actionType === 'approve');
      if (actionType === 'approve' && commission) {
        await hostelService.setCommission(selectedHostel.id, parseFloat(commission));
      }
      toast({ title: `Hostel ${actionType === 'approve' ? 'approved' : 'rejected'} successfully` });
      setSelectedHostel(null);
      setActionType(null);
      setNotes('');
      fetchHostels();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const pendingHostels = hostels.filter(h => !h.is_approved && h.is_active);
  const approvedHostels = hostels.filter(h => h.is_approved);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hostel Approvals</h1>
        <p className="text-sm text-muted-foreground mt-1">Review and approve partner hostel listings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Building className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Hostels</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Check className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.approved}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.approved}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Pending Approvals ({pendingHostels.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : pendingHostels.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending approvals</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hostel</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Stay Type</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingHostels.map(hostel => (
                  <TableRow key={hostel.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{hostel.name}</p>
                        <p className="text-xs text-muted-foreground">{hostel.serial_number}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{hostel.location || `${hostel.cities?.name || ''}, ${hostel.states?.name || ''}`}</TableCell>
                    <TableCell><Badge variant="outline">{hostel.gender}</Badge></TableCell>
                    <TableCell className="text-sm">{hostel.stay_type}</TableCell>
                    <TableCell className="text-sm">{format(new Date(hostel.created_at), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="default" onClick={() => { setSelectedHostel(hostel); setActionType('approve'); setCommission(String(hostel.commission_percentage)); }}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => { setSelectedHostel(hostel); setActionType('reject'); }}>
                        <X className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approved Hostels with Commission */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            Approved Hostels ({approvedHostels.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvedHostels.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No approved hostels yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hostel</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Commission %</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedHostels.map(hostel => (
                  <TableRow key={hostel.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{hostel.name}</p>
                        <p className="text-xs text-muted-foreground">{hostel.serial_number}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{hostel.location || `${hostel.cities?.name || ''}`}</TableCell>
                    <TableCell><Badge variant="outline">{hostel.gender}</Badge></TableCell>
                    <TableCell>
                      <span className="font-medium">{hostel.commission_percentage}%</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={hostel.is_active ? 'default' : 'secondary'}>
                        {hostel.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approve/Reject Dialog */}
      <Dialog open={!!selectedHostel && !!actionType} onOpenChange={() => { setSelectedHostel(null); setActionType(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve' : 'Reject'} Hostel: {selectedHostel?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {actionType === 'approve' && (
              <div>
                <label className="text-sm font-medium">Commission Percentage</label>
                <Input
                  type="number"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  min="0"
                  max="100"
                  className="mt-1"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={actionType === 'approve' ? 'Approval notes...' : 'Reason for rejection...'}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedHostel(null); setActionType(null); }}>Cancel</Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              variant={actionType === 'approve' ? 'default' : 'destructive'}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HostelApprovals;
