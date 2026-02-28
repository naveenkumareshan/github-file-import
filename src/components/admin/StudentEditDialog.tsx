
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { adminUsersService } from '@/api/adminUsersService';

interface Student {
  _id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  isActive: boolean;
  address?: string;
  bio?: string;
  courseStudying?: string;
  collegeStudied?: string;
  parentMobileNumber?: string;
  alternatePhone?: string;
  city?: string;
  state?: string;
  pincode?: string;
  dateOfBirth?: string;
  coursePreparingFor?: string;
}

interface StudentEditDialogProps {
  student: Student | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StudentEditDialog({ student, open, onClose, onSuccess }: StudentEditDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    gender: '',
    dateOfBirth: '',
    courseStudying: '',
    coursePreparingFor: '',
    collegeStudied: '',
    parentMobileNumber: '',
    city: '',
    state: '',
    pincode: '',
    address: '',
    bio: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        email: student.email || '',
        phone: student.phone || '',
        alternatePhone: student.alternatePhone || '',
        gender: student.gender || '',
        dateOfBirth: student.dateOfBirth || '',
        courseStudying: student.courseStudying || '',
        coursePreparingFor: student.coursePreparingFor || '',
        collegeStudied: student.collegeStudied || '',
        parentMobileNumber: student.parentMobileNumber || '',
        city: student.city || '',
        state: student.state || '',
        pincode: student.pincode || '',
        address: student.address || '',
        bio: student.bio || '',
        isActive: student.isActive ?? true,
      });
    }
  }, [student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    try {
      setLoading(true);
      await adminUsersService.updateUser(student._id, formData);
      toast({ title: "Success", description: "User details updated successfully" });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({ title: "Error", description: "Failed to update user details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">Edit User Details</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Full Name</Label>
              <Input className="h-8 text-xs" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input className="h-8 text-xs" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} required />
            </div>

            <div>
              <Label className="text-xs">Phone</Label>
              <Input className="h-8 text-xs" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Alternate Phone</Label>
              <Input className="h-8 text-xs" value={formData.alternatePhone} onChange={(e) => handleInputChange('alternatePhone', e.target.value)} />
            </div>

            <div>
              <Label className="text-xs">Gender</Label>
              <Select value={formData.gender} onValueChange={(v) => handleInputChange('gender', v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Date of Birth</Label>
              <Input className="h-8 text-xs" type="date" value={formData.dateOfBirth} onChange={(e) => handleInputChange('dateOfBirth', e.target.value)} />
            </div>

            <div>
              <Label className="text-xs">Course Studying</Label>
              <Input className="h-8 text-xs" value={formData.courseStudying} onChange={(e) => handleInputChange('courseStudying', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Course Preparing For</Label>
              <Input className="h-8 text-xs" value={formData.coursePreparingFor} onChange={(e) => handleInputChange('coursePreparingFor', e.target.value)} />
            </div>

            <div>
              <Label className="text-xs">College/University</Label>
              <Input className="h-8 text-xs" value={formData.collegeStudied} onChange={(e) => handleInputChange('collegeStudied', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Parent Mobile Number</Label>
              <Input className="h-8 text-xs" value={formData.parentMobileNumber} onChange={(e) => handleInputChange('parentMobileNumber', e.target.value)} />
            </div>

            <div>
              <Label className="text-xs">City</Label>
              <Input className="h-8 text-xs" value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">State</Label>
              <Input className="h-8 text-xs" value={formData.state} onChange={(e) => handleInputChange('state', e.target.value)} />
            </div>

            <div>
              <Label className="text-xs">Pincode</Label>
              <Input className="h-8 text-xs" value={formData.pincode} onChange={(e) => handleInputChange('pincode', e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Address</Label>
            <Input className="h-8 text-xs" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} />
          </div>

          <div>
            <Label className="text-xs">Bio</Label>
            <Textarea className="text-xs min-h-[60px]" value={formData.bio} onChange={(e) => handleInputChange('bio', e.target.value)} />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="isActive" checked={formData.isActive} onCheckedChange={(checked) => handleInputChange('isActive', checked)} />
            <Label htmlFor="isActive" className="text-xs">Active Status</Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" size="sm" className="h-7 text-xs" disabled={loading}>{loading ? 'Updating...' : 'Update User'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
