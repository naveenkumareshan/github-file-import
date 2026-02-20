
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Settings, DollarSign, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminVendorService, VendorAutoPayoutConfig, VendorFilters } from '@/api/adminVendorService';
import { AutoPayoutSettings } from '@/api/vendorService';

const VendorAutoPayoutSettings: React.FC = () => {
  const [selectedVendor, setSelectedVendor] = useState<VendorAutoPayoutConfig | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedSettings, setEditedSettings] = useState<AutoPayoutSettings | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vendors, setVendors] = useState<VendorAutoPayoutConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  // Build filters object
  const filters: VendorFilters = {
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter as any : undefined
  };

  // Fetch vendors with auto payout settings
  const fetchVendors = async () => {
    setLoading(true);
    try {
      const result = await adminVendorService.getVendorsWithPayoutSettings(filters);
      if (result.success && result.data) {
        setVendors(result.data.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch vendors",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: "Error",
        description: "Failed to fetch vendors",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [searchTerm, statusFilter]);

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchVendors, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  const handleEditSettings = (vendor: VendorAutoPayoutConfig) => {
    setSelectedVendor(vendor);
    setEditedSettings({ ...vendor.autoPayoutSettings });
    setIsEditDialogOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!selectedVendor || !editedSettings) return;

    setUpdating(true);
    try {
      const result = await adminVendorService.updateVendorAutoPayoutSettings(
        selectedVendor._id,
        editedSettings
      );
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Auto payout settings updated successfully"
        });
        setIsEditDialogOpen(false);
        setSelectedVendor(null);
        setEditedSettings(null);
        fetchVendors();
      } else {
        toast({
          title: "Error",
          description: "Failed to update settings",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleAutoPayout = async (vendor: VendorAutoPayoutConfig) => {
    setUpdating(true);
    try {
      const result = await adminVendorService.toggleVendorAutoPayout(
        vendor._id,
        !vendor.autoPayoutSettings.enabled
      );
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Auto payout status updated successfully"
        });
        fetchVendors();
      } else {
        toast({
          title: "Error",
          description: "Failed to update auto payout status",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update auto payout status",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const updateEditedSettings = (field: string, value: any) => {
    if (!editedSettings) return;

    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditedSettings({
        ...editedSettings,
        [parent]: {
          ...(editedSettings as any)[parent],
          [child]: value
        }
      });
    } else {
      setEditedSettings({
        ...editedSettings,
        [field]: value
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vendor Auto Payout Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage automatic payout configurations for all vendors
          </p>
        </div>
        <Button onClick={fetchVendors}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label>Search Vendors</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or vendor ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendors ({vendors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Auto Payout</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Manual Charges</TableHead>
                  <TableHead>Min Amount</TableHead>
                  <TableHead>Next Payout</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor: VendorAutoPayoutConfig) => (
                  <TableRow key={vendor._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{vendor.businessName}</p>
                        <p className="text-sm text-muted-foreground">{vendor.vendorId}</p>
                        <p className="text-sm text-muted-foreground">{vendor.contactPerson}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(vendor.status)} border-0`}>
                        {vendor.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={vendor.autoPayoutSettings.enabled ? "default" : "secondary"}>
                          {vendor.autoPayoutSettings.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                        <Switch
                          checked={vendor.autoPayoutSettings.enabled}
                          onCheckedChange={() => handleToggleAutoPayout(vendor)}
                          disabled={updating}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {vendor.autoPayoutSettings.payoutFrequency} days
                    </TableCell>
                    <TableCell>
                      {vendor.autoPayoutSettings.manualRequestCharges.enabled ? (
                        <div className="text-sm">
                          {vendor.autoPayoutSettings.manualRequestCharges.chargeType === 'fixed' 
                            ? `₹${vendor.autoPayoutSettings.manualRequestCharges.chargeValue}`
                            : `${vendor.autoPayoutSettings.manualRequestCharges.chargeValue}%`
                          }
                        </div>
                      ) : (
                        <Badge variant="outline">Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell>₹{vendor.autoPayoutSettings.minimumPayoutAmount}</TableCell>
                    <TableCell>
                      {vendor.autoPayoutSettings.nextAutoPayout ? (
                        <div className="text-sm">
                          {new Date(vendor.autoPayoutSettings.nextAutoPayout).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSettings(vendor)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Settings Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Auto Payout Settings - {selectedVendor?.businessName}
            </DialogTitle>
          </DialogHeader>

          {editedSettings && (
            <div className="space-y-6">
              {/* Enable Auto Payout */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Enable Auto Payout</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically process payouts based on schedule
                  </p>
                </div>
                <Switch
                  checked={editedSettings.enabled}
                  onCheckedChange={(checked) => updateEditedSettings('enabled', checked)}
                />
              </div>

              <Separator />

              {/* Payout Frequency */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Payout Frequency</Label>
                <Select
                  value={editedSettings.payoutFrequency.toString()}
                  onValueChange={(value) => updateEditedSettings('payoutFrequency', parseInt(value))}
                  disabled={!editedSettings.enabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Every 3 days</SelectItem>
                    <SelectItem value="5">Every 5 days</SelectItem>
                    <SelectItem value="7">Every 7 days (Weekly)</SelectItem>
                    <SelectItem value="10">Every 10 days</SelectItem>
                    <SelectItem value="15">Every 15 days</SelectItem>
                    <SelectItem value="30">Every 30 days (Monthly)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Per Cabin Payout */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Per Cabin Payout</Label>
                  <p className="text-sm text-muted-foreground">
                    Create separate payouts for each cabin
                  </p>
                </div>
                <Switch
                  checked={editedSettings.perCabinPayout}
                  onCheckedChange={(checked) => updateEditedSettings('perCabinPayout', checked)}
                  disabled={!editedSettings.enabled}
                />
              </div>

              {/* Minimum Payout Amount */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Minimum Payout Amount (₹)</Label>
                <Input
                  type="number"
                  value={editedSettings.minimumPayoutAmount}
                  onChange={(e) => updateEditedSettings('minimumPayoutAmount', parseFloat(e.target.value) || 0)}
                  placeholder="Enter minimum amount"
                  disabled={!editedSettings.enabled}
                />
              </div>

              <Separator />

              {/* Manual Request Charges */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Manual Request Charges</Label>
                    <p className="text-sm text-muted-foreground">
                      Charge extra fees for manual payout requests
                    </p>
                  </div>
                  <Switch
                    checked={editedSettings.manualRequestCharges.enabled}
                    onCheckedChange={(checked) => updateEditedSettings('manualRequestCharges.enabled', checked)}
                  />
                </div>

                {editedSettings.manualRequestCharges.enabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-muted">
                    <div className="space-y-3">
                      <Label>Charge Type</Label>
                      <Select
                        value={editedSettings.manualRequestCharges.chargeType}
                        onValueChange={(value) => updateEditedSettings('manualRequestCharges.chargeType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>
                        Charge Value {editedSettings.manualRequestCharges.chargeType === 'percentage' ? '(%)' : '(₹)'}
                      </Label>
                      <Input
                        type="number"
                        value={editedSettings.manualRequestCharges.chargeValue}
                        onChange={(e) => updateEditedSettings('manualRequestCharges.chargeValue', parseFloat(e.target.value) || 0)}
                        placeholder={editedSettings.manualRequestCharges.chargeType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Description</Label>
                      <Input
                        value={editedSettings.manualRequestCharges.description}
                        onChange={(e) => updateEditedSettings('manualRequestCharges.description', e.target.value)}
                        placeholder="Enter description"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSaveSettings} 
                  disabled={updating} 
                  className="flex-1"
                >
                  {updating ? 'Saving...' : 'Save Settings'}
                </Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default VendorAutoPayoutSettings;