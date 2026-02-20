import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Search, TicketPercent, Gift, Users } from 'lucide-react';
import { couponService, CouponData } from '@/api/couponService';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { vendorService } from '@/api/vendorService';
import { UserSelectionDialog } from './UserSelectionDialog';

interface VendorOption {
  _id: string;
  businessName: string;
  vendorId: string;
}

export function CouponManagement() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterScope, setFilterScope] = useState('all');
  const [filterApplicableFor, setFilterApplicableFor] = useState('cabin');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponData | null>(null);
  const [formData, setFormData] = useState<Partial<CouponData>>({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    maxDiscountAmount: 0,
    minOrderAmount: 0,
    applicableFor: ['cabin'],
    scope: user?.role === 'admin' ? 'global' : 'vendor',
    vendorId: user?.role === 'vendor' ? user.vendorId || user.vendorIds?.[0] : '',
    usageLimit: undefined,
    userUsageLimit: 1,
    startDate: '',
    endDate: '',
    isActive: true,
    firstTimeUserOnly: false,
    isReferralCoupon: false,
    referralType: undefined,
    specificUsers: [],
    excludeUsers: []
  });

  useEffect(() => {
    fetchCoupons();
    if (user?.role === 'admin') {
      fetchVendors();
    }
  }, [searchTerm, filterType, filterScope, filterApplicableFor]);

  const fetchVendors = async () => {
    try {
      const response = await vendorService.getAllVendors();
      if (response.success) {
        setVendors(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await couponService.getCoupons({
        search: searchTerm || undefined,
        type: filterType || undefined,
        scope: filterScope || undefined,
        applicableFor: filterApplicableFor || undefined
      });

      if (response.success) {
        setCoupons(response.data || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch coupons",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast({
        title: "Error",
        description: "Failed to fetch coupons",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCoupon = async () => {
    try {
      const response = await couponService.generateReferralCoupon();
      if (response.success) {
        toast({
          title: "Success",
          description: "Referral coupon generated successfully"
        });
        fetchCoupons();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to generate referral coupon",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error generating referral coupon:', error);
      toast({
        title: "Error",
        description: "Failed to generate referral coupon",
        variant: "destructive"
      });
    }
  };

  const handleCreateCoupon = async () => {
    try {
      if (!formData.code || !formData.name || !formData.startDate || !formData.endDate) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      // Validate vendor selection for vendor-specific coupons
      if (formData.scope === 'vendor' && user?.role === 'admin' && !formData.vendorId) {
        toast({
          title: "Error",
          description: "Please select a vendor for vendor-specific coupons",
          variant: "destructive"
        });
        return;
      }

      const response = await couponService.createCoupon(formData as any);

      if (response.success) {
        toast({
          title: "Success",
          description: "Coupon created successfully"
        });
        setIsDialogOpen(false);
        resetForm();
        fetchCoupons();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create coupon",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating coupon:', error);
      toast({
        title: "Error",
        description: "Failed to create coupon",
        variant: "destructive"
      });
    }
  };

  const handleUpdateCoupon = async () => {
    try {
      if (!editingCoupon) return;

      const response = await couponService.updateCoupon(editingCoupon._id!, formData);

      if (response.success) {
        toast({
          title: "Success",
          description: "Coupon updated successfully"
        });
        setIsDialogOpen(false);
        setEditingCoupon(null);
        resetForm();
        fetchCoupons();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update coupon",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating coupon:', error);
      toast({
        title: "Error",
        description: "Failed to update coupon",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const response = await couponService.deleteCoupon(id);

      if (response.success) {
        toast({
          title: "Success",
          description: "Coupon deleted successfully"
        });
        fetchCoupons();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete coupon",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast({
        title: "Error",
        description: "Failed to delete coupon",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      maxDiscountAmount: 0,
      minOrderAmount: 0,
      applicableFor: ['cabin'],
      scope: user?.role === 'admin' ? 'global' : 'vendor',
      vendorId: user?.role === 'vendor' ? user.vendorId || user.vendorIds?.[0] : '',
      usageLimit: undefined,
      userUsageLimit: 1,
      startDate: '',
      endDate: '',
      isActive: true,
      firstTimeUserOnly: false,
      isReferralCoupon: false,
      referralType: undefined,
      specificUsers: [],
      excludeUsers: []
    });
  };

  const openEditDialog = (coupon: CouponData) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      maxDiscountAmount: coupon.maxDiscountAmount,
      minOrderAmount: coupon.minOrderAmount,
      applicableFor: coupon.applicableFor,
      scope: coupon.scope,
      vendorId: coupon.vendorId,
      usageLimit: coupon.usageLimit,
      userUsageLimit: coupon.userUsageLimit,
      startDate: coupon.startDate?.split('T')[0],
      endDate: coupon.endDate?.split('T')[0],
      isActive: coupon.isActive,
      firstTimeUserOnly: coupon.firstTimeUserOnly,
      isReferralCoupon: coupon.isReferralCoupon,
      referralType: coupon.referralType,
      specificUsers: coupon.specificUsers,
      excludeUsers: coupon.excludeUsers
    });
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getVendorName = (vendor: VendorOption | string) => {
    if (typeof vendor === 'string') return vendor;
    return vendor ? `${vendor.businessName} (${vendor.vendorId})` : 'Unknown Vendor';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Coupon Management</h2>
          <p className="text-muted-foreground">
            {user?.role === 'vendor' ? 'Manage your coupon discounts' : 'Manage discount coupons for bookings'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingCoupon(null); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Coupon Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE20"
                    disabled={!!editingCoupon}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Coupon Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Save 20% Off"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description of the coupon"
                  />
                </div>
                <div>
                  <Label htmlFor="scope">Scope</Label>
                  <Select 
                    value={formData.scope} 
                    onValueChange={(value) => setFormData({ ...formData, scope: value as any })}
                    disabled={user?.role !== 'admin'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {user?.role === 'admin' && <SelectItem value="global">Global</SelectItem>}
                      <SelectItem value="vendor">Vendor Specific</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Vendor Selection - Only show for admins creating vendor-specific coupons */}
                {user?.role === 'admin' && formData.scope === 'vendor' && (
                  <div>
                    <Label htmlFor="vendorId">Select Vendor *</Label>
                    <Select 
                      value={formData.vendorId} 
                      onValueChange={(value) => setFormData({ ...formData, vendorId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor._id} value={vendor._id}>
                            {vendor.businessName} ({vendor.vendorId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="type">Discount Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as 'percentage' | 'fixed' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="value">
                    {formData.type === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'} *
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    min="0"
                    max={formData.type === 'percentage' ? "100" : undefined}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                {formData.type === 'percentage' && (
                  <div>
                    <Label htmlFor="maxDiscountAmount">Max Discount Amount (₹)</Label>
                    <Input
                      id="maxDiscountAmount"
                      type="number"
                      min="0"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="minOrderAmount">Min Order Amount (₹)</Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    min="0"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="applicableFor">Applicable For</Label>
                  <Select 
                    value={formData.applicableFor?.[0]} 
                    onValueChange={(value) => setFormData({ ...formData, applicableFor: [value] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cabin">Cabin Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="usageLimit">Total Usage Limit</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    min="0"
                    value={formData.usageLimit || ''}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <Label htmlFor="userUsageLimit">Per User Limit</Label>
                  <Input
                    id="userUsageLimit"
                    type="number"
                    min="1"
                    value={formData.userUsageLimit}
                    onChange={(e) => setFormData({ ...formData, userUsageLimit: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
                
                {/* User Assignment Section */}
                <div className="md:col-span-2 space-y-4">
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">User Assignment (Optional)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Specific Users Only</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Only selected users can use this coupon
                        </p>
                        <div className="h-60 overflow-y-auto border p-2 rounded">
                          {editingCoupon?.specificUsers?.map((user: any, index: number) => (
                            <div key={index} className="mb-2 p-2 border rounded shadow-sm">
                              <div><strong>Name:</strong> {typeof user === 'string' ? user : (user?.name || "Unknown User")}</div>
                              <div><strong>Email:</strong> {typeof user === 'string' ? '' : (user?.email || "Unknown Email")}</div>
                              <div><strong>Phone:</strong> {typeof user === 'string' ? '' : (user?.phone || "Unknown Phone")}</div>
                            </div>
                          ))}
                        </div>
                        <UserSelectionDialog
                          selectedUsers={formData.specificUsers || []}
                          onUsersChange={(userIds) => setFormData({ ...formData, specificUsers: userIds })}
                          trigger={
                            <Button variant="outline" type="button" className="w-full">
                              <Users className="h-4 w-4 mr-2" />
                              Select Users ({(formData.specificUsers || []).length})
                            </Button>
                          }
                          title="Select Specific Users"
                          description="Choose users who can use this coupon"
                        />
                      </div>
                      <div>
                        <Label>Exclude Users</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Selected users cannot use this coupon
                        </p>
                        <UserSelectionDialog
                          selectedUsers={formData.excludeUsers || []}
                          onUsersChange={(userIds) => setFormData({ ...formData, excludeUsers: userIds })}
                          trigger={
                            <Button variant="outline" type="button" className="w-full">
                              <Users className="h-4 w-4 mr-2" />
                              Exclude Users ({(formData.excludeUsers || []).length})
                            </Button>
                          }
                          title="Exclude Users"
                          description="Choose users who cannot use this coupon"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="firstTimeUserOnly"
                    checked={formData.firstTimeUserOnly}
                    onCheckedChange={(checked) => setFormData({ ...formData, firstTimeUserOnly: checked })}
                  />
                  <Label htmlFor="firstTimeUserOnly">First-time users only</Label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={editingCoupon ? handleUpdateCoupon : handleCreateCoupon}>
                  {editingCoupon ? 'Update' : 'Create'} Coupon
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by code or name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filterScope">Scope</Label>
              <Select value={filterScope} onValueChange={setFilterScope}>
                <SelectTrigger>
                  <SelectValue placeholder="All scopes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scopes</SelectItem>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="user_referral">Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterType">Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterApplicableFor">Applicable For</Label>
              <Select value={filterApplicableFor} onValueChange={setFilterApplicableFor}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cabin">Cabin Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TicketPercent className="h-5 w-5" />
            {user?.role === 'vendor' ? 'Your Coupons' : 'All Coupons'} ({coupons.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading coupons...</div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No coupons found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Scope</TableHead>
                  {user?.role === 'admin' && <TableHead>Vendor</TableHead>}
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon._id}>
                    <TableCell className="font-mono font-semibold">
                      {coupon.code}
                      {coupon.isReferralCoupon && (
                        <Badge variant="secondary" className="ml-2">
                          <Users className="h-3 w-3 mr-1" />
                          Referral
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{coupon.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {coupon.scope === 'global' ? 'Global' : 
                         coupon.scope === 'vendor' ? 'Vendor' : 'Referral'}
                      </Badge>
                    </TableCell>
                    {user?.role === 'admin' && (
                      <TableCell>
                        {coupon.scope === 'vendor' && coupon.vendorId ? (
                          <span className="text-sm">{getVendorName(coupon.vendorId)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="outline">
                        {coupon.type === 'percentage' ? 'Percentage' : 'Fixed'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                      {coupon.type === 'percentage' && coupon.maxDiscountAmount && (
                        <span className="text-sm text-muted-foreground">
                          {` (max ₹${coupon.maxDiscountAmount})`}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {(coupon.specificUsers?.length || 0) > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Specific: {coupon.specificUsers?.length}
                          </Badge>
                        )}
                        {(coupon.excludeUsers?.length || 0) > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            Excluded: {coupon.excludeUsers?.length}
                          </Badge>
                        )}
                        {(!coupon.specificUsers?.length && !coupon.excludeUsers?.length) && (
                          <span className="text-muted-foreground text-sm">All Users</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {coupon.usageCount || 0}
                      {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                    </TableCell>
                    <TableCell>{formatDate(coupon.endDate!)}</TableCell>
                    <TableCell>
                      <Badge variant={coupon.isActive ? 'default' : 'secondary'}>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(coupon)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteCoupon(coupon._id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
