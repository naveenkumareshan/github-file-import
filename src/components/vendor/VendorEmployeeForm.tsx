import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { vendorEmployeeService, VendorEmployeeData } from '@/api/vendorEmployeeService';

interface VendorEmployeeFormProps {
  employee?: VendorEmployeeData;
  onSubmit: () => void;
  onCancel: () => void;
}

const PERMISSION_MODULES = [
  { label: 'Dashboard', viewKey: 'view_dashboard', editKey: 'manage_dashboard' },
  { label: 'Bookings', viewKey: 'view_bookings', editKey: 'manage_bookings' },
  { label: 'Reading Rooms', viewKey: 'view_reading_rooms', editKey: 'manage_reading_rooms' },
  { label: 'Seat Map', viewKey: 'seats_available_map', editKey: 'seats_available_edit' },
  { label: 'Users / Students', viewKey: 'view_students', editKey: 'manage_students' },
  { label: 'Employees', viewKey: 'view_employees', editKey: 'manage_employees' },
  { label: 'Reports', viewKey: 'view_reports', editKey: 'manage_reports' },
  { label: 'Reviews', viewKey: 'view_reviews', editKey: 'manage_reviews' },
  { label: 'Payouts', viewKey: 'view_payouts', editKey: 'manage_payouts' },
  { label: 'Complaints', viewKey: 'view_complaints', editKey: 'manage_complaints' },
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
    role: employee?.role || 'staff',
    permissions: employee?.permissions || [] as string[],
    salary: employee?.salary || 0,
    status: employee?.status || 'active',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePermissionChange = (permissionId: string) => {
    const updated = formData.permissions.includes(permissionId)
      ? formData.permissions.filter(p => p !== permissionId)
      : [...formData.permissions, permissionId];
    setFormData(prev => ({ ...prev, permissions: updated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (employee) {
        const res = await vendorEmployeeService.updateEmployee(employee.id, formData);
        if (res.success) {
          toast({ title: "Success", description: "Employee updated successfully" });
          onSubmit();
        } else {
          throw new Error(res.error);
        }
      } else {
        const res = await vendorEmployeeService.createEmployee(formData);
        if (res.success) {
          toast({ title: "Success", description: "Employee added successfully" });
          onSubmit();
        } else {
          throw new Error(res.error);
        }
      }
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to save employee", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-sm">{employee ? 'Edit Employee' : 'Add New Employee'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Full Name *</Label>
              <Input className="h-8 text-xs" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
            </div>
            <div>
              <Label className="text-xs">Email *</Label>
              <Input className="h-8 text-xs" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} required />
            </div>
            <div>
              <Label className="text-xs">Phone *</Label>
              <Input className="h-8 text-xs" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} required />
            </div>
            <div>
              <Label className="text-xs">Role</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData(prev => ({ ...prev, role: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff" className="text-xs">Staff</SelectItem>
                  <SelectItem value="manager" className="text-xs">Manager</SelectItem>
                  <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Monthly Salary (₹)</Label>
              <Input className="h-8 text-xs" type="number" min="0" value={formData.salary} onChange={(e) => setFormData(prev => ({ ...prev, salary: parseInt(e.target.value) || 0 }))} />
            </div>
            {employee && (
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active" className="text-xs">Active</SelectItem>
                    <SelectItem value="inactive" className="text-xs">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs font-medium">Sidebar Permissions</Label>
            <p className="text-[10px] text-muted-foreground mb-2">Select View and/or Edit access for each module</p>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="text-left py-1.5 px-3 font-medium text-[10px] uppercase tracking-wider">Module</th>
                    <th className="text-center py-1.5 px-3 font-medium text-[10px] uppercase tracking-wider w-20">View</th>
                    <th className="text-center py-1.5 px-3 font-medium text-[10px] uppercase tracking-wider w-20">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_MODULES.map((mod, idx) => (
                    <tr key={mod.label} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}>
                      <td className="py-1.5 px-3 text-[11px] font-medium">{mod.label}</td>
                      <td className="py-1.5 px-3 text-center">
                        <Checkbox
                          id={mod.viewKey}
                          checked={formData.permissions.includes(mod.viewKey)}
                          onCheckedChange={() => handlePermissionChange(mod.viewKey)}
                        />
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <Checkbox
                          id={mod.editKey}
                          checked={formData.permissions.includes(mod.editKey)}
                          onCheckedChange={() => handlePermissionChange(mod.editKey)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={onCancel}>Cancel</Button>
            <Button type="submit" size="sm" className="h-7 text-xs" disabled={loading}>
              {loading ? "Saving..." : employee ? "Update Employee" : "Add Employee"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
