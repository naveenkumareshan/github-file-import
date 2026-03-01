import React, { useState, useEffect } from "react";
import { getImageUrl } from "@/lib/utils";
import { getPublicAppUrl } from "@/utils/appUrl";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, Edit, KeyRound, Eye, Link2, Building2, Copy, Check, Unlink, ShieldCheck, ShieldOff } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
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
  alternatePhone?: string;
  city?: string;
  state?: string;
  pincode?: string;
  dateOfBirth?: string;
  coursePreparingFor?: string;
  serialNumber?: string;
}

const ALL_ROLE_TABS = [
  { label: "Students", value: "student" },
  { label: "Partners", value: "vendor" },
  { label: "Admins", value: "admin" },
  { label: "Employees", value: "vendor_employee" },
] as const;

const PARTNER_ROLE_TABS = [
  { label: "Students", value: "student" },
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
  const isMobile = useIsMobile();

  // Property linking state
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkType, setLinkType] = useState<'cabin' | 'hostel'>('cabin');
  const [linkPartnerId, setLinkPartnerId] = useState('');
  const [linkPartnerName, setLinkPartnerName] = useState('');
  const [availableProperties, setAvailableProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [linkingInProgress, setLinkingInProgress] = useState(false);

  // Partner properties in details
  const [partnerProperties, setPartnerProperties] = useState<{ cabins: any[]; hostels: any[] }>({ cabins: [], hostels: [] });
  const [loadingPartnerProps, setLoadingPartnerProps] = useState(false);
  const [copiedLogin, setCopiedLogin] = useState(false);
  const [toggleStatusUser, setToggleStatusUser] = useState<Student | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

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

  const fetchPartnerProperties = async (userId: string) => {
    try {
      setLoadingPartnerProps(true);
      const res = await adminUsersService.getPartnerProperties(userId);
      if (res.success) {
        setPartnerProperties({ cabins: res.cabins, hostels: res.hostels });
      }
    } catch {
      // silent
    } finally {
      setLoadingPartnerProps(false);
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
    if (s.role === 'vendor') {
      fetchPartnerProperties(s._id);
    } else {
      setPartnerProperties({ cabins: [], hostels: [] });
    }
  };

  const handleOpenLinkDialog = async (partner: Student, type: 'cabin' | 'hostel') => {
    setLinkType(type);
    setLinkPartnerId(partner._id);
    setLinkPartnerName(partner.name);
    setSelectedPropertyId('');
    setIsLinkDialogOpen(true);
    setLoadingProperties(true);

    try {
      const res = type === 'cabin'
        ? await adminUsersService.getAllCabins()
        : await adminUsersService.getAllHostels();
      setAvailableProperties(res.data || []);
    } catch {
      setAvailableProperties([]);
    } finally {
      setLoadingProperties(false);
    }
  };

  const handleLinkProperty = async () => {
    if (!selectedPropertyId || !linkPartnerId) return;
    setLinkingInProgress(true);
    try {
      const res = linkType === 'cabin'
        ? await adminUsersService.linkCabinToPartner(selectedPropertyId, linkPartnerId)
        : await adminUsersService.linkHostelToPartner(selectedPropertyId, linkPartnerId);

      if (res.success) {
        toast({ title: "Linked!", description: `${linkType === 'cabin' ? 'Reading Room' : 'Hostel'} linked to ${linkPartnerName}.` });
        setIsLinkDialogOpen(false);
      } else {
        toast({ title: "Error", description: "Failed to link property.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to link property.", variant: "destructive" });
    } finally {
      setLinkingInProgress(false);
    }
  };

  const handleUnlinkProperty = async (type: 'cabin' | 'hostel', propertyId: string) => {
    try {
      const res = await adminUsersService.unlinkProperty(type, propertyId);
      if (res.success) {
        toast({ title: "Unlinked", description: "Property unlinked from partner." });
        if (selectedStudent) fetchPartnerProperties(selectedStudent._id);
      }
    } catch {
      toast({ title: "Error", description: "Failed to unlink.", variant: "destructive" });
    }
  };

  const handleCopyLoginInfo = (email: string) => {
    const loginUrl = `${getPublicAppUrl()}/partner/login`;
    const text = `Login URL: ${loginUrl}\nEmail: ${email}`;
    navigator.clipboard.writeText(text);
    setCopiedLogin(true);
    setTimeout(() => setCopiedLogin(false), 2000);
    toast({ title: "Copied!", description: "Partner login info copied." });
  };

  const handleToggleUserStatus = async () => {
    if (!toggleStatusUser) return;
    setTogglingStatus(true);
    try {
      const newStatus = !toggleStatusUser.isActive;
      const res = await adminUsersService.toggleUserActive(toggleStatusUser._id, newStatus);
      if (res.success) {
        toast({ title: newStatus ? "Activated" : "Deactivated", description: `${toggleStatusUser.name} has been ${newStatus ? 'activated' : 'deactivated'}.` });
        fetchStudents();
      } else {
        toast({ title: "Error", description: "Failed to update user status.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update user status.", variant: "destructive" });
    } finally {
      setTogglingStatus(false);
      setToggleStatusUser(null);
    }
  };

  const ROLE_TABS = user?.role === 'admin' ? ALL_ROLE_TABS : PARTNER_ROLE_TABS;
  const currentTabLabel = ROLE_TABS.find(t => t.value === role)?.label || "Users";
  const isPartnerTab = role === 'vendor';

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
            {isMobile ? (
              <div className="space-y-3">
                {students.map((s) => (
                  <div key={s._id} className="border rounded-lg p-3 bg-card space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-xs truncate">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground">{s.email}</p>
                        <p className="text-[10px] text-muted-foreground">{s.phone || '—'}</p>
                      </div>
                      <Badge variant={s.isActive ? 'success' : 'destructive'} className="text-[9px]">
                        {s.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Joined: {s.joinedAt ? new Date(s.joinedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                      {(role === "student" || role === "vendor_employee") && <span>Gender: {s.gender || '—'}</span>}
                    </div>
                    <div className="flex items-center gap-1 pt-1 border-t flex-wrap">
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 gap-1" onClick={() => handleViewDetails(s)}>
                        <Eye className="h-3 w-3" /> View
                      </Button>
                      {user.role === "admin" && (
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 gap-1" onClick={() => { setSelectedStudent(s); setIsEditOpen(true); }}>
                          <Edit className="h-3 w-3" /> Edit
                        </Button>
                      )}
                      {user?.role === "admin" && (
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 gap-1" onClick={() => { setSelectedStudent(s); setIsResetPasswordOpen(true); }}>
                          <KeyRound className="h-3 w-3" /> Reset
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-2 px-3 font-medium w-12">S.No.</th>
                      <th className="text-left py-2 px-3 font-medium">Name</th>
                      {(role === "student" || role === "vendor_employee") && (
                        <th className="text-left py-2 px-3 font-medium">Gender</th>
                      )}
                      <th className="text-left py-2 px-3 font-medium">Status</th>
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
                        <td className="py-1.5 px-3">
                          <Badge variant={s.isActive ? 'success' : 'destructive'} className="text-[9px]">
                            {s.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-1.5 px-3 text-muted-foreground">
                          {s.joinedAt ? new Date(s.joinedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="py-1.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 gap-1" onClick={() => handleViewDetails(s)}>
                              <Eye className="h-3 w-3" /> View
                            </Button>
                            {user.role === "admin" && (
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 gap-1" onClick={() => { setSelectedStudent(s); setIsEditOpen(true); }}>
                                <Edit className="h-3 w-3" /> Edit
                              </Button>
                            )}
                            {isPartnerTab && user.role === "admin" && (
                              <>
                                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 gap-1" onClick={() => handleOpenLinkDialog(s, 'cabin')}>
                                  <Link2 className="h-3 w-3" /> Room
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 gap-1" onClick={() => handleOpenLinkDialog(s, 'hostel')}>
                                  <Building2 className="h-3 w-3" /> Hostel
                                </Button>
                              </>
                            )}
                            {user?.role === "admin" && (
                              <>
                                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 gap-1" onClick={() => { setSelectedStudent(s); setIsResetPasswordOpen(true); }}>
                                  <KeyRound className="h-3 w-3" /> Reset
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-6 text-[10px] px-2 gap-1 ${s.isActive ? 'text-destructive hover:text-destructive' : 'text-green-600 hover:text-green-700'}`}
                                  onClick={() => setToggleStatusUser(s)}
                                >
                                  {s.isActive ? <ShieldOff className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                                  {s.isActive ? 'Deactivate' : 'Activate'}
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

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
                    <h4 className="font-medium text-xs mb-1.5">Personal</h4>
                    <p><span className="text-muted-foreground">Gender:</span> {selectedStudent.gender || '—'}</p>
                    <p><span className="text-muted-foreground">Date of Birth:</span> {selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
                    <p><span className="text-muted-foreground">Bio:</span> {selectedStudent.bio || '—'}</p>
                    <p><span className="text-muted-foreground">Serial No:</span> {selectedStudent.serialNumber || '—'}</p>
                    <p><span className="text-muted-foreground">Status:</span> <Badge variant={selectedStudent.isActive ? 'success' : 'destructive'} className="text-[9px]">{selectedStudent.isActive ? 'Active' : 'Inactive'}</Badge></p>
                  </div>
                  <div className="p-3 border rounded-lg space-y-1">
                    <h4 className="font-medium text-xs mb-1.5">Contact</h4>
                    <p><span className="text-muted-foreground">Email:</span> {selectedStudent.email}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {selectedStudent.phone || '—'}</p>
                    <p><span className="text-muted-foreground">Alt Phone:</span> {selectedStudent.alternatePhone || '—'}</p>
                    <p><span className="text-muted-foreground">Parent Phone:</span> {selectedStudent.parentMobileNumber || '—'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border rounded-lg space-y-1">
                    <h4 className="font-medium text-xs mb-1.5">Address</h4>
                    <p><span className="text-muted-foreground">Address:</span> {selectedStudent.address || '—'}</p>
                    <p><span className="text-muted-foreground">City:</span> {selectedStudent.city || '—'}</p>
                    <p><span className="text-muted-foreground">State:</span> {selectedStudent.state || '—'}</p>
                    <p><span className="text-muted-foreground">Pincode:</span> {selectedStudent.pincode || '—'}</p>
                  </div>
                  <div className="p-3 border rounded-lg space-y-1">
                    <h4 className="font-medium text-xs mb-1.5">Academic</h4>
                    <p><span className="text-muted-foreground">Course Studying:</span> {selectedStudent.courseStudying || '—'}</p>
                    <p><span className="text-muted-foreground">Preparing For:</span> {selectedStudent.coursePreparingFor || '—'}</p>
                    <p><span className="text-muted-foreground">College:</span> {selectedStudent.collegeStudied || '—'}</p>
                  </div>
                </div>

                {/* Partner Login Info & Properties */}
                {selectedStudent.role === 'vendor' && (
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg space-y-2">
                      <h4 className="font-medium text-xs mb-1.5">Partner Login Info</h4>
                      <p><span className="text-muted-foreground">Login URL:</span> <span className="font-mono text-[10px]">{getPublicAppUrl()}/partner/login</span></p>
                      <p><span className="text-muted-foreground">Email:</span> {selectedStudent.email}</p>
                      <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={() => handleCopyLoginInfo(selectedStudent.email)}>
                        {copiedLogin ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedLogin ? "Copied!" : "Copy Login Info"}
                      </Button>
                    </div>

                    <div className="p-3 border rounded-lg space-y-2">
                      <h4 className="font-medium text-xs mb-1.5">Linked Properties</h4>
                      {loadingPartnerProps ? (
                        <div className="flex justify-center py-2">
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                      ) : (
                        <>
                          {partnerProperties.cabins.length === 0 && partnerProperties.hostels.length === 0 ? (
                            <p className="text-muted-foreground text-[11px]">No properties linked yet.</p>
                          ) : (
                            <div className="space-y-1">
                              {partnerProperties.cabins.map((c: any) => (
                                <div key={c.id} className="flex items-center justify-between py-1 px-2 bg-muted/30 rounded text-[11px]">
                                  <span><Badge variant="secondary" className="text-[9px] mr-1.5">Room</Badge>{c.name} {c.city ? `(${c.city})` : ''}</span>
                                  <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1.5 text-destructive hover:text-destructive" onClick={() => handleUnlinkProperty('cabin', c.id)}>
                                    <Unlink className="h-2.5 w-2.5" />
                                  </Button>
                                </div>
                              ))}
                              {partnerProperties.hostels.map((h: any) => (
                                <div key={h.id} className="flex items-center justify-between py-1 px-2 bg-muted/30 rounded text-[11px]">
                                  <span><Badge variant="secondary" className="text-[9px] mr-1.5">Hostel</Badge>{h.name} {h.location ? `(${h.location})` : ''}</span>
                                  <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1.5 text-destructive hover:text-destructive" onClick={() => handleUnlinkProperty('hostel', h.id)}>
                                    <Unlink className="h-2.5 w-2.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

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

        {/* Link Property Dialog */}
        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm">
                Link {linkType === 'cabin' ? 'Reading Room' : 'Hostel'} to {linkPartnerName}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {loadingProperties ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : availableProperties.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No {linkType === 'cabin' ? 'reading rooms' : 'hostels'} found.</p>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Select {linkType === 'cabin' ? 'Reading Room' : 'Hostel'}</label>
                    <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder={`Choose a ${linkType === 'cabin' ? 'room' : 'hostel'}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProperties.map((p: any) => (
                          <SelectItem key={p.id} value={p.id} className="text-xs">
                            {p.name} {p.created_by ? `(linked)` : ''} {p.city ? `- ${p.city}` : p.location ? `- ${p.location}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full h-8 text-xs"
                    disabled={!selectedPropertyId || linkingInProgress}
                    onClick={handleLinkProperty}
                  >
                    {linkingInProgress ? "Linking..." : "Link Property"}
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Toggle Status Confirmation */}
        <AlertDialog open={!!toggleStatusUser} onOpenChange={(open) => { if (!open) setToggleStatusUser(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-sm">
                {toggleStatusUser?.isActive ? 'Deactivate' : 'Activate'} User
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                {toggleStatusUser?.isActive
                  ? `Are you sure you want to deactivate ${toggleStatusUser?.name}? They will no longer be able to log in.`
                  : `Are you sure you want to activate ${toggleStatusUser?.name}? They will be able to log in again.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-8 text-xs" disabled={togglingStatus}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className={`h-8 text-xs ${toggleStatusUser?.isActive ? 'bg-destructive hover:bg-destructive/90' : ''}`}
                onClick={handleToggleUserStatus}
                disabled={togglingStatus}
              >
                {togglingStatus ? 'Processing...' : toggleStatusUser?.isActive ? 'Deactivate' : 'Activate'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
