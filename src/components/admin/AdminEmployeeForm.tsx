import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { adminEmployeeService, AdminEmployeeData } from '@/api/adminEmployeeService';
import { supabase } from '@/integrations/supabase/client';

interface AdminEmployeeFormProps {
  employee?: AdminEmployeeData;
  onSubmit: () => void;
  onCancel: () => void;
}

interface PermissionModule {
  label: string;
  viewKey: string;
  editKey: string;
}

interface PermissionGroup {
  group: string;
  modules: PermissionModule[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    group: 'General',
    modules: [
      { label: 'Dashboard', viewKey: 'view_dashboard', editKey: 'manage_dashboard' },
      { label: 'Operations', viewKey: 'view_operations', editKey: 'manage_operations' },
    ]
  },
  {
    group: 'Reading Rooms',
    modules: [
      { label: 'Seat Map', viewKey: 'view_seat_map', editKey: 'manage_seat_map' },
      { label: 'Due Management', viewKey: 'view_due_management', editKey: 'manage_due_management' },
      { label: 'Bookings', viewKey: 'view_bookings', editKey: 'manage_bookings' },
      { label: 'Receipts', viewKey: 'view_receipts', editKey: 'manage_receipts' },
      { label: 'Key Deposits', viewKey: 'view_key_deposits', editKey: 'manage_key_deposits' },
      { label: 'Manage Rooms', viewKey: 'view_rooms', editKey: 'manage_rooms' },
      { label: 'Reviews', viewKey: 'view_reviews', editKey: 'manage_reviews' },
    ]
  },
  {
    group: 'Hostels',
    modules: [
      { label: 'Bed Map', viewKey: 'view_bed_map', editKey: 'manage_bed_map' },
      { label: 'Due Management', viewKey: 'view_hostel_dues', editKey: 'manage_hostel_dues' },
      { label: 'Bookings', viewKey: 'view_hostel_bookings', editKey: 'manage_hostel_bookings' },
      { label: 'Receipts', viewKey: 'view_hostel_receipts', editKey: 'manage_hostel_receipts' },
      { label: 'Deposits', viewKey: 'view_hostel_deposits', editKey: 'manage_hostel_deposits' },
      { label: 'Manage Hostels', viewKey: 'view_hostels', editKey: 'manage_hostels' },
      { label: 'Reviews', viewKey: 'view_hostel_reviews', editKey: 'manage_hostel_reviews' },
    ]
  },
  {
    group: 'Laundry',
    modules: [
      { label: 'Laundry Management', viewKey: 'view_laundry', editKey: 'manage_laundry' },
    ]
  },
  {
    group: 'Users',
    modules: [
      { label: 'All Users', viewKey: 'view_users', editKey: 'manage_users' },
      { label: 'Create User', viewKey: 'view_create_user', editKey: 'manage_create_user' },
      { label: 'Import Users', viewKey: 'view_import_users', editKey: 'manage_import_users' },
      { label: 'Coupons', viewKey: 'view_coupons', editKey: 'manage_coupons' },
    ]
  },
  {
    group: 'Partners',
    modules: [
      { label: 'All Partners', viewKey: 'view_partners', editKey: 'manage_partners' },
      { label: 'Property Approvals', viewKey: 'view_property_approvals', editKey: 'manage_property_approvals' },
      { label: 'Settlements', viewKey: 'view_settlements', editKey: 'manage_settlements' },
      { label: 'Payouts', viewKey: 'view_payouts', editKey: 'manage_payouts' },
    ]
  },
  {
    group: 'Finance',
    modules: [
      { label: 'Reconciliation', viewKey: 'view_reconciliation', editKey: 'manage_reconciliation' },
      { label: 'Banks', viewKey: 'view_banks', editKey: 'manage_banks' },
    ]
  },
  {
    group: 'Other',
    modules: [
      { label: 'Reports', viewKey: 'view_reports', editKey: 'manage_reports' },
      { label: 'Messaging', viewKey: 'view_messaging', editKey: 'manage_messaging' },
      { label: 'Locations', viewKey: 'view_locations', editKey: 'manage_locations' },
      { label: 'Banners', viewKey: 'view_banners', editKey: 'manage_banners' },
      { label: 'Complaints', viewKey: 'view_complaints', editKey: 'manage_complaints' },
      { label: 'Support Tickets', viewKey: 'view_support', editKey: 'manage_support' },
      { label: 'Sponsored Listings', viewKey: 'view_sponsored', editKey: 'manage_sponsored' },
      { label: 'Subscriptions', viewKey: 'view_subscriptions', editKey: 'manage_subscriptions' },
    ]
  },
];

export const AdminEmployeeForm: React.FC<AdminEmployeeFormProps> = ({
  employee,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    password: '',
    role: employee?.role || 'staff',
    permissions: employee?.permissions || [] as string[],
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
    if (!employee && !formData.password) {
      toast({ title: "Error", description: "Password is required for new employees", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (employee) {
        const res = await adminEmployeeService.updateEmployee(employee.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          permissions: formData.permissions,
          status: formData.status,
        });
        if (res.success) {
          toast({ title: "Success", description: "Employee updated successfully" });
          onSubmit();
        } else {
          throw new Error(res.error);
        }
      } else {
        // Create auth user first via edge function
        const { data: createData, error: createError } = await supabase.functions.invoke('admin-create-user', {
          body: {
            email: formData.email,
            password: formData.password,
            name: formData.name,
            phone: formData.phone,
            role: 'admin',
          },
        });
        if (createError) throw createError;
        if (createData?.error) throw new Error(createData.error);

        const employeeUserId = createData?.userId || createData?.user?.id;

        const res = await adminEmployeeService.createEmployee({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          permissions: formData.permissions,
        }, employeeUserId);

        if (res.success) {
          toast({ title: "Success", description: "Employee created successfully. They can login at /admin/login" });
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

  let rowIndex = 0;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-sm">{employee ? 'Edit Admin Employee' : 'Add New Admin Employee'}</CardTitle>
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
              <Input className="h-8 text-xs" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} required disabled={!!employee} />
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
                </SelectContent>
              </Select>
            </div>
            {!employee && (
              <div>
                <Label className="text-xs">Password *</Label>
                <Input className="h-8 text-xs" type="password" value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} required />
              </div>
            )}
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

          <div className="bg-muted/30 border rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">
              Login URL: <span className="font-mono text-foreground">/admin/login</span>
            </p>
          </div>

          <div>
            <Label className="text-xs font-medium">Admin Sidebar Permissions</Label>
            <p className="text-[10px] text-muted-foreground mb-2">Control which admin sidebar modules this employee can access</p>
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
                  {PERMISSION_GROUPS.map((group) => (
                    <React.Fragment key={group.group}>
                      <tr className="bg-muted/60">
                        <td colSpan={3} className="py-1 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {group.group}
                        </td>
                      </tr>
                      {group.modules.map((mod) => {
                        const idx = rowIndex++;
                        return (
                          <tr key={mod.label} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}>
                            <td className="py-1.5 px-3 text-[11px] font-medium">{mod.label}</td>
                            <td className="py-1.5 px-3 text-center">
                              <Checkbox
                                checked={formData.permissions.includes(mod.viewKey)}
                                onCheckedChange={() => handlePermissionChange(mod.viewKey)}
                              />
                            </td>
                            <td className="py-1.5 px-3 text-center">
                              <Checkbox
                                checked={formData.permissions.includes(mod.editKey)}
                                onCheckedChange={() => handlePermissionChange(mod.editKey)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
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