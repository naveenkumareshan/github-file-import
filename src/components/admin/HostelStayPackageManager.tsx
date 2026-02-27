
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { hostelStayPackageService, StayPackage, CreateStayPackageData, DurationType } from '@/api/hostelStayPackageService';
import { Plus, Trash2, Edit, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface HostelStayPackageManagerProps {
  hostelId: string;
}

export const HostelStayPackageManager: React.FC<HostelStayPackageManagerProps> = ({ hostelId }) => {
  const { toast } = useToast();
  const [packages, setPackages] = useState<StayPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<StayPackage | null>(null);
  const [formData, setFormData] = useState<CreateStayPackageData>({
    hostel_id: hostelId,
    name: '',
    min_months: 1,
    discount_percentage: 0,
    deposit_months: 1,
    lock_in_months: 0,
    notice_months: 1,
    description: '',
    duration_type: 'monthly',
  });

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const data = await hostelStayPackageService.getAllPackages(hostelId);
      setPackages(data);
    } catch (err) {
      console.error('Error fetching packages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [hostelId]);

  const resetForm = () => {
    setFormData({
      hostel_id: hostelId,
      name: '',
      min_months: 1,
      discount_percentage: 0,
      deposit_months: 1,
      lock_in_months: 0,
      notice_months: 1,
      description: '',
      duration_type: 'monthly',
    });
    setEditingPackage(null);
  };

  const handleOpenDialog = (pkg?: StayPackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        hostel_id: hostelId,
        name: pkg.name,
        min_months: pkg.min_months,
        discount_percentage: pkg.discount_percentage,
        deposit_months: pkg.deposit_months,
        lock_in_months: pkg.lock_in_months,
        notice_months: pkg.notice_months,
        description: pkg.description || '',
        duration_type: pkg.duration_type || 'monthly',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingPackage) {
        await hostelStayPackageService.updatePackage(editingPackage.id, formData);
        toast({ title: 'Package updated', description: `"${formData.name}" has been updated` });
      } else {
        await hostelStayPackageService.createPackage({ ...formData, display_order: packages.length });
        toast({ title: 'Package created', description: `"${formData.name}" has been created` });
      }
      setIsDialogOpen(false);
      resetForm();
      fetchPackages();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (pkg: StayPackage) => {
    if (!confirm(`Delete "${pkg.name}"?`)) return;
    try {
      await hostelStayPackageService.deletePackage(pkg.id);
      toast({ title: 'Package deleted' });
      fetchPackages();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleToggleActive = async (pkg: StayPackage) => {
    try {
      await hostelStayPackageService.updatePackage(pkg.id, { is_active: !pkg.is_active });
      fetchPackages();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-40"><div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Stay Duration Packages
        </CardTitle>
        <Button size="sm" onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-1" /> Add Package
        </Button>
      </CardHeader>
      <CardContent>
        {packages.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">No packages configured. Add your first stay package.</p>
        ) : (
          <div className="space-y-3">
            {packages.map((pkg) => (
              <div key={pkg.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{pkg.name}</span>
                    {!pkg.is_active && <Badge variant="outline" className="text-[10px]">Inactive</Badge>}
                    {pkg.discount_percentage > 0 && (
                      <Badge className="bg-green-600 text-white text-[10px]">{pkg.discount_percentage}% off</Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px] capitalize">{pkg.duration_type || 'monthly'}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Min {pkg.min_months}mo · Lock-in {pkg.lock_in_months}mo · Deposit {pkg.deposit_months}mo · Notice {pkg.notice_months}mo
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={pkg.is_active} onCheckedChange={() => handleToggleActive(pkg)} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(pkg)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(pkg)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPackage ? 'Edit Package' : 'Add Package'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Package Name</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. 3 Months or more" />
              </div>
              <div>
                <Label>Duration Type</Label>
                <select
                  value={formData.duration_type || 'monthly'}
                  onChange={e => setFormData({ ...formData, duration_type: e.target.value as DurationType })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Months</Label>
                <Input type="number" min={1} value={formData.min_months} onChange={e => setFormData({ ...formData, min_months: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Discount %</Label>
                <Input type="number" min={0} max={100} value={formData.discount_percentage} onChange={e => setFormData({ ...formData, discount_percentage: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Deposit (months)</Label>
                <Input type="number" min={0} step={0.5} value={formData.deposit_months} onChange={e => setFormData({ ...formData, deposit_months: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Lock-in (months)</Label>
                <Input type="number" min={0} value={formData.lock_in_months} onChange={e => setFormData({ ...formData, lock_in_months: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Notice (months)</Label>
                <Input type="number" min={0} value={formData.notice_months} onChange={e => setFormData({ ...formData, notice_months: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Short description..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formData.name.trim()}>{editingPackage ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
