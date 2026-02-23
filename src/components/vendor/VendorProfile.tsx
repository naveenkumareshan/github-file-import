import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Building, 
  MapPin, 
  CreditCard, 
  FileText, 
  Phone, 
  Mail,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Upload
} from 'lucide-react';
import { VendorDocumentUpload } from './VendorDocumentUpload';
import { vendorProfileService, VendorProfileData, VendorProfileUpdateData } from '@/api/vendorProfileService';

export const VendorProfile: React.FC = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<VendorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<VendorProfileUpdateData>({});

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchProfile();
    }
  }, []);
  const fetchProfile = async () => {
    try {
      const response = await vendorProfileService.getProfile();
      if (response.success && response.data) {
        setProfile(response.data?.data);
        setFormData({
          businessName: response.data?.data.businessName,
          contactPerson: response.data?.data.contactPerson,
          phone: response.data?.data.phone,
          address: response.data?.data.address,
          businessDetails: response.data?.data.businessDetails,
          bankDetails: response.data?.data.bankDetails
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const response = await vendorProfileService.updateProfile(formData);
     if (response.success && response.data) {
        setProfile(response.data?.data);
        setEditMode(false);
        toast({
          title: "Success",
          description: "Profile updated successfully"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'suspended':
        return <Badge className="bg-orange-100 text-orange-800"><AlertCircle className="w-3 h-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading profile...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <p>Profile not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Building className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{profile.businessName}</CardTitle>
                <p className="text-muted-foreground">Partner ID: {profile.vendorId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(profile.status)}
              {/* <Button 
                variant={editMode ? "outline" : "default"}
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? 'Cancel' : 'Edit Profile'}
              </Button> */}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="business">Business Details</TabsTrigger>
          <TabsTrigger value="bank">Bank Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  {editMode ? (
                    <Input
                      id="businessName"
                      value={formData.businessName || ''}
                      onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    />
                  ) : (
                    <p className="mt-1 font-medium">{profile.businessName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  {editMode ? (
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson || ''}
                      onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                    />
                  ) : (
                    <p className="mt-1 font-medium">{profile.contactPerson}</p>
                  )}
                </div>

                <div>
                  <Label className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <p className="mt-1 font-medium text-muted-foreground">{profile.email}</p>
                </div>

                <div>
                  <Label className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  {editMode ? (
                    <Input
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  ) : (
                    <p className="mt-1 font-medium">{profile.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                {editMode ? (
                  <div className="mt-2 space-y-2">
                    <Input
                      placeholder="Street"
                      value={formData.address?.street || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: {...formData.address, street: e.target.value}
                      })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="City"
                        value={formData.address?.city || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: {...formData.address, city: e.target.value}
                        })}
                      />
                      <Input
                        placeholder="State"
                        value={formData.address?.state || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: {...formData.address, state: e.target.value}
                        })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Pincode"
                        value={formData.address?.pincode || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: {...formData.address, pincode: e.target.value}
                        })}
                      />
                      <Input
                        placeholder="Country"
                        value={formData.address?.country || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: {...formData.address, country: e.target.value}
                        })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-1">
                    <p className="font-medium">{profile.address?.street}</p>
                    <p className="text-muted-foreground">
                      {profile.address?.city}, {profile.address?.state} {profile.address?.pincode}
                    </p>
                    <p className="text-muted-foreground">{profile.address?.country}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Joined on {new Date(profile.createdAt).toLocaleDateString()}
              </div>

              {editMode && (
                <div className="flex gap-2">
                  <Button onClick={handleUpdate} disabled={updating}>
                    {updating ? 'Updating...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={() => setEditMode(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Business Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Business Type</Label>
                  <p className="mt-1 font-medium capitalize">{profile.businessType}</p>
                </div>

                <div>
                  <Label>GST Number</Label>
                  <p className="mt-1 font-medium">{profile.businessDetails?.gstNumber || 'Not provided'}</p>
                </div>

                <div>
                  <Label>PAN Number</Label>
                  <p className="mt-1 font-medium">{profile.businessDetails?.panNumber || 'Not provided'}</p>
                </div>

                <div>
                  <Label>Aadhar Number</Label>
                  <p className="mt-1 font-medium">{profile.businessDetails?.aadharNumber || 'Not provided'}</p>
                </div>
              </div>

              <div>
                <Label>Business Description</Label>
                {editMode ? (
                  <Textarea
                    value={formData.businessDetails?.description || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      businessDetails: {...formData.businessDetails, description: e.target.value}
                    })}
                    placeholder="Describe your business..."
                  />
                ) : (
                  <p className="mt-1 font-medium">{profile.businessDetails?.description || 'No description provided'}</p>
                )}
              </div>

              {editMode && (
                <div className="flex gap-2">
                  <Button onClick={handleUpdate} disabled={updating}>
                    {updating ? 'Updating...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={() => setEditMode(false)}>
                    Cancel
                  </Button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Account Holder Name</Label>
                  {editMode ? (
                    <Input
                      value={formData.bankDetails?.accountHolderName || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: {...formData.bankDetails, accountHolderName: e.target.value}
                      })}
                    />
                  ) : (
                    <p className="mt-1 font-medium">{profile.bankDetails?.accountHolderName || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <Label>Account Number</Label>
                  {editMode ? (
                    <Input
                      value={formData.bankDetails?.accountNumber || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: {...formData.bankDetails, accountNumber: e.target.value}
                      })}
                    />
                  ) : (
                    <p className="mt-1 font-medium">
                      {profile.bankDetails?.accountNumber ? 
                        `****${profile.bankDetails?.accountNumber.slice(-4)}` : 
                        'Not provided'
                      }
                    </p>
                  )}
                </div>

                <div>
                  <Label>Bank Name</Label>
                  {editMode ? (
                    <Input
                      value={formData.bankDetails?.bankName || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: {...formData.bankDetails, bankName: e.target.value}
                      })}
                    />
                  ) : (
                    <p className="mt-1 font-medium">{profile.bankDetails?.bankName || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <Label>IFSC Code</Label>
                  {editMode ? (
                    <Input
                      value={formData.bankDetails?.ifscCode || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: {...formData.bankDetails, ifscCode: e.target.value}
                      })}
                    />
                  ) : (
                    <p className="mt-1 font-medium">{profile.bankDetails?.ifscCode || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <Label>UPI ID</Label>
                  {editMode ? (
                    <Input
                      value={formData.bankDetails?.upiId || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: {...formData.bankDetails, upiId: e.target.value}
                      })}
                    />
                  ) : (
                    <p className="mt-1 font-medium">{profile.bankDetails?.upiId || 'Not provided'}</p>
                  )}
                </div>
              </div>

              {editMode && (
                <div className="flex gap-2">
                  <Button onClick={handleUpdate} disabled={updating}>
                    {updating ? 'Updating...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={() => setEditMode(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="documents" className="space-y-4">          
          <VendorDocumentUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
};