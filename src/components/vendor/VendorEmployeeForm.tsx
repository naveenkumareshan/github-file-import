
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { vendorService } from '@/api/vendorService';
import { VendorEmployee } from '@/types/vendor';

interface VendorEmployeeFormProps {
  employee?: VendorEmployee;
  onSubmit: () => void;
  onCancel: () => void;
}

const PERMISSIONS = [
  
  { id: 'view_dashboard', label: 'Dashboard' },
  { id: 'view_bookings', label: 'View Bookings' },
  { id: 'manage_bookings', label: 'Manage Bookings' },
  { id: 'view_reading_rooms', label: 'View Reading Rooms' },
  { id: 'manage_reading_rooms', label: 'Manage Reading Rooms' },
  { id: 'view_students', label: 'View Students' },
  { id: 'manage_students', label: 'Manage Students' },
  { id: 'view_reports', label: 'View Reports' },
  { id: 'manage_employees', label: 'Manage Employees' },
  { id: 'seats_available_map', label: 'Seat Availability Map' },
  { id: 'seats_available_edit', label: 'Seat Availability Map > Update' },
  { id: 'manage_reviews', label: 'Manage Reviews' }
];

export const VendorEmployeeForm: React.FC<VendorEmployeeFormProps> = ({
  employee,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    role: employee?.role || 'staff' as 'manager' | 'staff' | 'admin',
    permissions: employee?.permissions || [],
    salary: employee?.salary || 0
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePermissionChange = (permissionId: string) => {
    const updatedPermissions = formData.permissions.includes(permissionId)
      ? formData.permissions.filter(p => p !== permissionId)
      : [...formData.permissions, permissionId];
    
    setFormData(prev => ({ ...prev, permissions: updatedPermissions }));
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      role: value as 'manager' | 'staff' | 'admin'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (employee) {
        await vendorService.updateEmployee(employee._id, formData);
        toast({
          title: "Success",
          description: "Employee updated successfully"
        });
      } else {
        await vendorService.createEmployee(formData);
        toast({
          title: "Success",
          description: "Employee created successfully"
        });
      }
      onSubmit();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save employee",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{employee ? 'Edit Employee' : 'Add New Employee'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="salary">Default Password : defaultPassword123</Label>
            {/* <Label htmlFor="salary">Salary (Monthly)</Label>
            <Input
              id="salary"
              type="number"
              value={formData.salary}
              onChange={(e) => setFormData(prev => ({ ...prev, salary: parseInt(e.target.value) || 0 }))}
            /> */}
          </div>

          <div>
            <Label>Permissions</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {PERMISSIONS.map((permission) => (
                <div key={permission.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={permission.id}
                    checked={formData.permissions.includes(permission.id)}
                    onCheckedChange={() => handlePermissionChange(permission.id)}
                  />
                  <Label htmlFor={permission.id} className="text-sm">
                    {permission.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : employee ? "Update Employee" : "Add Employee"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
