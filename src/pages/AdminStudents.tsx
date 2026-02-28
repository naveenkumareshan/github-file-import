import React, { useState, useEffect } from "react";
import { getImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, Edit, KeyRound, Eye } from "lucide-react";
import { adminUsersService } from "../api/adminUsersService";
import { toast } from "@/hooks/use-toast";
import ErrorBoundary from "../components/ErrorBoundary";
import { StudentEditDialog } from "@/components/admin/StudentEditDialog";
import { useAuth } from "@/contexts/AuthContext";
import { AdminResetPasswordDialog } from "@/components/admin/AdminResetPasswordDialog";
import { AdminTablePagination, getSerialNumber } from "@/components/admin/AdminTablePagination";

interface Student {
  _id: string;
  userId: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  role: string;
  bookingsCount: number;
  activeBookings: number;
  joinedAt: string;
  isActive: boolean;
  collegeStudied: string;
  courseStudying: string;
  parentMobileNumber: string;
  address: string;
  bio: string;
  profilePicture?: string;
}

const ROLE_TABS = [
  { label: "Students", value: "student" },
  { label: "Partners", value: "vendor" },
  { label: "Admins", value: "admin" },
  { label: "Employees", value: "vendor_employee" },
] as const;

const AdminStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [studentBookings, setStudentBookings] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [role, setRole] = useState("student");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchStudents();
  }, [currentPage, searchQuery, pageSize, includeInactive, role]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await adminUsersService.getUsers({
        role,
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
        includeInactive,
      });
      if (res.success && Array.isArray(res.data)) {
        setStudents(res.data);
        setTotalUsers(res.totalCount || res.count);
      } else {
        toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentBookings = async (studentId: string) => {
    try {
      setLoadingBookings(true);
      const res = await adminUsersService.getBookingsByUserId({ userId: studentId });
      if (res.success && Array.isArray(res.data)) setStudentBookings(res.data);
    } catch {
      toast({ title: "Error", description: "Failed to load bookings", variant: "destructive" });
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleTabChange = (val: string) => {
    setRole(val);
    setCurrentPage(1);
    setSearchQuery("");
  };

  const handleViewDetails = (s: Student) => {
    setSelectedStudent(s);
    setIsDetailsOpen(true);
    fetchStudentBookings(s._id);
  };

  const currentTabLabel = ROLE_TABS.find(t => t.value === role)?.label || "Users";

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h1 className="text-sm font-semibold">User Management</h1>
            <Badge variant="secondary" className="text-[10px]">{totalUsers} {currentTabLabel.toLowerCase()}</Badge>
          </div>
        </div>

        {/* Role Tabs */}
        <Tabs value={role} onValueChange={handleTabChange}>
          <TabsList className="h-8">
            {ROLE_TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs px-3 py-1">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone..."
              className="pl-8 h-8 text-xs"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Switch
              id="include-inactive"
              checked={includeInactive}
              onCheckedChange={(v) => { setIncludeInactive(v); setCurrentPage(1); }}
              className="scale-75"
            />
            <label htmlFor="include-inactive" className="text-[11px] text-muted-foreground whitespace-nowrap">Include Inactive</label>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-xs">
            {searchQuery ? "No users found matching your search." : `No ${currentTabLabel.toLowerCase()} found.`}
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-2 px-3 font-medium w-12">S.No.</th>
                    <th className="text-left py-2 px-3 font-medium">Name</th>
                    {(role === "student" || role === "vendor_employee") && (
                      <th className="text-left py-2 px-3 font-medium">Gender</th>
                    )}
                    {role === "student" && (
                      <>
                        <th className="text-left py-2 px-3 font-medium">Course</th>
                        <th className="text-left py-2 px-3 font-medium">College</th>
                      </>
                    )}
                    <th className="text-left py-2 px-3 font-medium">Joined</th>
                    <th className="text-right py-2 px-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, index) => (
                    <tr key={s._id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-1.5 px-3 text-muted-foreground">{getSerialNumber(index, currentPage, pageSize)}</td>
                      <td className="py-1.5 px-3">
                        <div>
                          <span className="font-medium">{s.name}</span>
                          <div className="text-[10px] text-muted-foreground">{s.phone || '—'}</div>
                          <div className="text-[10px] text-muted-foreground">{s.email}</div>
                        </div>
                      </td>
                      {(role === "student" || role === "vendor_employee") && (
                        <td className="py-1.5 px-3 text-muted-foreground">{s.gender || '—'}</td>
                      )}
                      {role === "student" && (
                        <>
                          <td className="py-1.5 px-3 text-muted-foreground">{s.courseStudying || '—'}</td>
                          <td className="py-1.5 px-3 text-muted-foreground">{s.collegeStudied || '—'}</td>
                        </>
                      )}
                      <td className="py-1.5 px-3 text-muted-foreground">
                        {s.joinedAt ? new Date(s.joinedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 gap-1" onClick={() => handleViewDetails(s)}>
                            <Eye className="h-3 w-3" /> View
                          </Button>
                          {s.role === "student" && user.role === "admin" && (
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 gap-1" onClick={() => { setSelectedStudent(s); setIsEditOpen(true); }}>
                              <Edit className="h-3 w-3" /> Edit
                            </Button>
                          )}
                          {user.role === "admin" && (
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 gap-1" onClick={() => { setSelectedStudent(s); setIsResetPasswordOpen(true); }}>
                              <KeyRound className="h-3 w-3" /> Reset
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AdminTablePagination
              currentPage={currentPage}
              totalItems={totalUsers}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
            />
          </>
        )}

        {/* Edit Dialog */}
        <StudentEditDialog
          student={selectedStudent}
          open={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSuccess={fetchStudents}
        />

        {/* Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-sm">User Details</DialogTitle>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3">
                  {selectedStudent.profilePicture ? (
                    <img src={getImageUrl(selectedStudent.profilePicture)} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">{selectedStudent.name}</p>
                    <p className="text-muted-foreground">{selectedStudent.email}</p>
                    <p className="text-muted-foreground">{selectedStudent.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border rounded-lg space-y-1">
                    <h4 className="font-medium text-xs mb-1.5">Contact</h4>
                    <p><span className="text-muted-foreground">Email:</span> {selectedStudent.email}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {selectedStudent.phone || '—'}</p>
                    <p><span className="text-muted-foreground">Parent Phone:</span> {selectedStudent.parentMobileNumber || '—'}</p>
                    <p><span className="text-muted-foreground">Address:</span> {selectedStudent.address || '—'}</p>
                  </div>
                  <div className="p-3 border rounded-lg space-y-1">
                    <h4 className="font-medium text-xs mb-1.5">Info</h4>
                    <p><span className="text-muted-foreground">Gender:</span> {selectedStudent.gender || '—'}</p>
                    <p><span className="text-muted-foreground">Course:</span> {selectedStudent.courseStudying || '—'}</p>
                    <p><span className="text-muted-foreground">College:</span> {selectedStudent.collegeStudied || '—'}</p>
                    <p><span className="text-muted-foreground">Bio:</span> {selectedStudent.bio || '—'}</p>
                  </div>
                </div>

                {/* Booking History */}
                <div>
                  <h4 className="font-medium text-xs mb-2">Booking History</h4>
                  {loadingBookings ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : studentBookings.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground text-[11px]">No bookings found.</p>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left py-1.5 px-2 font-medium">Room</th>
                            <th className="text-left py-1.5 px-2 font-medium">Seat</th>
                            <th className="text-left py-1.5 px-2 font-medium">Period</th>
                            <th className="text-left py-1.5 px-2 font-medium">Price</th>
                            <th className="text-left py-1.5 px-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentBookings.map((b: any) => (
                            <tr key={b._id} className="border-b last:border-0">
                              <td className="py-1 px-2">{b.cabinId?.name || '—'}</td>
                              <td className="py-1 px-2">#{b.seatId?.number || '—'}</td>
                              <td className="py-1 px-2">
                                {b.startDate && new Date(b.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – {b.endDate && new Date(b.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="py-1 px-2">₹{b.totalPrice}</td>
                              <td className="py-1 px-2">
                                <Badge variant={b.paymentStatus === 'completed' ? 'success' : b.paymentStatus === 'pending' ? 'secondary' : 'destructive'} className="text-[9px]">
                                  {b.paymentStatus}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        {selectedStudent && (
          <AdminResetPasswordDialog
            open={isResetPasswordOpen}
            onClose={() => setIsResetPasswordOpen(false)}
            userId={selectedStudent.id || selectedStudent._id}
            userName={selectedStudent.name}
            userEmail={selectedStudent.email}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default AdminStudents;
