
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { User, Building, CreditCard, Phone, Mail, MapPin, Calendar, Check, X, AlertTriangle, Clock, Edit, Save } from 'lucide-react';
import { Vendor } from '@/api/vendorApprovalService';

interface VendorDetailsDialogProps {
  vendor: Vendor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: (vendorId: string, action: 'approve' | 'reject' | 'suspend', additionalData?: any) => Promise<void>;
  onVendorUpdate: (vendorId: string, updatedData: Partial<Vendor>) => Promise<void>;
}

export const VendorDetailsDialog: React.FC<VendorDetailsDialogProps> = ({
  vendor,
  open,
  onOpenChange,
  onStatusUpdate,
  onVendorUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedVendor, setEditedVendor] = useState(vendor);
  const [rejectionReason, setRejectionReason] = useState('');
  const [commissionRate, setCommissionRate] = useState(vendor.commission_settings?.value || 10);
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    setEditedVendor(vendor);
    setCommissionRate(vendor.commission_settings?.value || 10);
  }, [vendor]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApprove = async () => {
    await onStatusUpdate(vendor.id, 'approve', { commissionRate, notes });
    onOpenChange(false);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    await onStatusUpdate(vendor.id, 'reject', { rejectionReason, notes });
    onOpenChange(false);
  };

  const handleSuspend = async () => {
    await onStatusUpdate(vendor.id, 'suspend', { notes });
    onOpenChange(false);
  };

  const handleSaveChanges = async () => {
    await onVendorUpdate(vendor.id, editedVendor);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedVendor(vendor);
    setIsEditing(false);
  };

  const updateEditedVendor = (field: string, value: any) => {
    const fieldParts = field.split('.');
    if (fieldParts.length === 1) {
      setEditedVendor(prev => ({ ...prev, [field]: value }));
    } else if (fieldParts.length === 2) {
      setEditedVendor(prev => {
        const parentField = fieldParts[0] as keyof Vendor;
        const parentValue = prev[parentField];
        if (typeof parentValue === 'object' && parentValue !== null) {
          return {
            ...prev,
            [fieldParts[0]]: {
              ...parentValue,
              [fieldParts[1]]: value
            }
          };
        }
        return prev;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Partner Details</DialogTitle>
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(vendor.status)} border-0`}>
                <span className="capitalize">{vendor.status}</span>
              </Badge>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveChanges}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="bank">Bank Details</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Partner ID</Label>
                    <p className="font-mono text-sm bg-muted p-2 rounded">{vendor.serial_number || vendor.id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Business Name</Label>
                    {isEditing ? (
                      <Input
                        value={editedVendor.business_name}
                        onChange={(e) => updateEditedVendor('business_name', e.target.value)} />
                    ) : (
                      <p className="text-sm p-2">{vendor.business_name}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Contact Person</Label>
                    {isEditing ? (
                      <Input
                        value={editedVendor.contact_person}
                        onChange={(e) => updateEditedVendor('contact_person', e.target.value)} />
                    ) : (
                      <p className="text-sm p-2">{vendor.contact_person}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Business Type</Label>
                    <Badge variant="outline" className="capitalize">{vendor.business_type}</Badge>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {isEditing ? (
                      <Input
                        value={editedVendor.email}
                        onChange={(e) => updateEditedVendor('email', e.target.value)}
                        type="email" />
                    ) : (
                      <span className="text-sm">{vendor.email}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {isEditing ? (
                      <Input
                        value={editedVendor.phone}
                        onChange={(e) => updateEditedVendor('phone', e.target.value)} />
                    ) : (
                      <span className="text-sm">{vendor.phone}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="text-sm flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          placeholder="Street"
                          value={editedVendor.address?.street || ''}
                          onChange={(e) => updateEditedVendor('address.street', e.target.value)} />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="City"
                            value={editedVendor.address?.city || ''}
                            onChange={(e) => updateEditedVendor('address.city', e.target.value)} />
                          <Input
                            placeholder="State"
                            value={editedVendor.address?.state || ''}
                            onChange={(e) => updateEditedVendor('address.state', e.target.value)} />
                        </div>
                        <Input
                          placeholder="Pincode"
                          value={editedVendor.address?.pincode || ''}
                          onChange={(e) => updateEditedVendor('address.pincode', e.target.value)} />
                      </div>
                    ) : (
                      <div>
                        <p>{vendor.address?.street}</p>
                        <p>{vendor.address?.city}, {vendor.address?.state} - {vendor.address?.pincode}</p>
                        <p>{vendor.address?.country}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Applied: {new Date(vendor.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Updated: {new Date(vendor.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Business Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">GST Number</Label>
                    {isEditing ? (
                      <Input
                        value={editedVendor.business_details?.gstNumber || ''}
                        onChange={(e) => updateEditedVendor('business_details.gstNumber', e.target.value)} />
                    ) : (
                      <p className="font-mono text-sm bg-muted p-2 rounded">{vendor.business_details?.gstNumber || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">PAN Number</Label>
                    {isEditing ? (
                      <Input
                        value={editedVendor.business_details?.panNumber || ''}
                        onChange={(e) => updateEditedVendor('business_details.panNumber', e.target.value)} />
                    ) : (
                      <p className="font-mono text-sm bg-muted p-2 rounded">{vendor.business_details?.panNumber || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Aadhar Number</Label>
                    {isEditing ? (
                      <Input
                        value={editedVendor.business_details?.aadharNumber || ''}
                        onChange={(e) => updateEditedVendor('business_details.aadharNumber', e.target.value)} />
                    ) : (
                      <p className="font-mono text-sm bg-muted p-2 rounded">{vendor.business_details?.aadharNumber || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Business License</Label>
                    {isEditing ? (
                      <Input
                        value={editedVendor.business_details?.businessLicense || ''}
                        onChange={(e) => updateEditedVendor('business_details.businessLicense', e.target.value)} />
                    ) : (
                      <p className="font-mono text-sm bg-muted p-2 rounded">{vendor.business_details?.businessLicense || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                {(vendor.business_details?.description || isEditing) && (
                  <div>
                    <Label className="text-sm font-medium">Business Description</Label>
                    {isEditing ? (
                      <Textarea
                        value={editedVendor.business_details?.description || ''}
                        onChange={(e) => updateEditedVendor('business_details.description', e.target.value)}
                        placeholder="Business description..." />
                    ) : (
                      <p className="text-sm p-3 bg-muted rounded">{vendor.business_details?.description}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bank" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Bank Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Account Holder Name</Label>
                    {isEditing ? (
                      <Input
                        value={editedVendor.bank_details?.accountHolderName || ''}
                        onChange={(e) => updateEditedVendor('bank_details.accountHolderName', e.target.value)} />
                    ) : (
                      <p className="text-sm bg-muted p-2 rounded">{vendor.bank_details?.accountHolderName || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Bank Name</Label>
                    {isEditing ? (
                      <Input
                        value={editedVendor.bank_details?.bankName || ''}
                        onChange={(e) => updateEditedVendor('bank_details.bankName', e.target.value)} />
                    ) : (
                      <p className="text-sm bg-muted p-2 rounded">{vendor.bank_details?.bankName || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Account Number</Label>
                    {isEditing ? (
                      <Input
                        value={editedVendor.bank_details?.accountNumber || ''}
                        onChange={(e) => updateEditedVendor('bank_details.accountNumber', e.target.value)} />
                    ) : (
                      <p className="font-mono text-sm bg-muted p-2 rounded">
                        {vendor.bank_details?.accountNumber ?
                          `****${vendor.bank_details.accountNumber.slice(-4)}` :
                          'Not provided'}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">IFSC Code</Label>
                    {isEditing ? (
                      <Input
                        value={editedVendor.bank_details?.ifscCode || ''}
                        onChange={(e) => updateEditedVendor('bank_details.ifscCode', e.target.value)} />
                    ) : (
                      <p className="font-mono text-sm bg-muted p-2 rounded">{vendor.bank_details?.ifscCode || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                {(vendor.bank_details?.upiId || isEditing) && (
                  <div>
                    <Label className="text-sm font-medium">UPI ID</Label>
                    {isEditing ? (
                      <Input
                        value={editedVendor.bank_details?.upiId || ''}
                        onChange={(e) => updateEditedVendor('bank_details.upiId', e.target.value)} />
                    ) : (
                      <p className="font-mono text-sm bg-muted p-2 rounded">{vendor.bank_details?.upiId}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Partner Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vendor.status === 'pending' && (
                  <>
                    <div className="space-y-4 p-4 border border-green-200 rounded-lg bg-green-50">
                      <h3 className="font-medium text-green-800">Approve Partner</h3>
                      <div>
                        <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                        <Input
                          id="commissionRate"
                          type="number"
                          value={commissionRate}
                          onChange={(e) => setCommissionRate(Number(e.target.value))}
                          min="0"
                          max="50" />
                      </div>
                      <div>
                        <Label htmlFor="approvalNotes">Approval Notes</Label>
                        <Textarea
                          id="approvalNotes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Optional notes for approval..." />
                      </div>
                      <Button onClick={handleApprove} className="w-full bg-green-600 hover:bg-green-700">
                        <Check className="h-4 w-4 mr-2" />
                        Approve Partner
                      </Button>
                    </div>

                    <div className="space-y-4 p-4 border border-red-200 rounded-lg bg-red-50">
                      <h3 className="font-medium text-red-800">Reject Partner</h3>
                      <div>
                        <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                        <Textarea
                          id="rejectionReason"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Please provide a reason for rejection..."
                          required />
                      </div>
                      <Button
                        onClick={handleReject}
                        className="w-full"
                        variant="destructive"
                        disabled={!rejectionReason.trim()}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject Application
                      </Button>
                    </div>
                  </>
                )}

                {vendor.status === 'suspended' && (
                  <div className="space-y-4 p-4 border border-green-200 rounded-lg bg-green-50">
                    <h3 className="font-medium text-green-800">Activate Partner</h3>
                    <div>
                      <Label htmlFor="approvalNotes">Notes</Label>
                      <Textarea
                        id="approvalNotes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Optional notes..." />
                    </div>
                    <Button onClick={handleApprove} className="w-full bg-green-600 hover:bg-green-700">
                      <Check className="h-4 w-4 mr-2" />
                      Activate Partner
                    </Button>
                  </div>
                )}

                {vendor.status === 'approved' && (
                  <div className="space-y-4 p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                    <h3 className="font-medium text-yellow-800">Suspend Partner</h3>
                    <div>
                      <Label htmlFor="suspendNotes">Suspension Notes</Label>
                      <Textarea
                        id="suspendNotes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Optional notes for suspension..." />
                    </div>
                    <Button onClick={handleSuspend} className="w-full bg-yellow-600 hover:bg-yellow-700">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Suspend Partner
                    </Button>
                  </div>
                )}

                {vendor.status === 'rejected' && (
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <p className="text-center text-muted-foreground">This Partner application has been rejected.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
