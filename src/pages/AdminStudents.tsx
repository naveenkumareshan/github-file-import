import React, { useState, useEffect, useRef } from "react";
import { getImageUrl } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, User, ChevronLeft, ChevronRight, Edit, KeyRound } from "lucide-react";
import { adminUsersService } from "../api/adminUsersService";
import { toast } from "@/hooks/use-toast";
import ErrorBoundary from "../components/ErrorBoundary";
import { StudentEditDialog } from "@/components/admin/StudentEditDialog";
import { useAuth } from "@/contexts/AuthContext";
import { AdminResetPasswordDialog } from "@/components/admin/AdminResetPasswordDialog";

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

const AdminStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [studentBookings, setStudentBookings] = useState<any>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [role, setRole] = useState("student");
  const { user } = useAuth();

  useEffect(() => {
    fetchStudents();
  }, [currentPage, searchQuery, pageSize, includeInactive, role]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const usersResponse = await adminUsersService.getUsers({
        role: role,
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
        includeInactive: includeInactive,
      });

      if (usersResponse.success && Array.isArray(usersResponse.data)) {
        setStudents(usersResponse.data);
        setTotalPages(
          usersResponse.pagination?.totalPages ||
            Math.ceil(usersResponse.count / pageSize)
        );
        setTotalUsers(usersResponse.totalCount || usersResponse.count);
      } else {
        setError("Failed to load students");
        toast({
          title: "Error",
          description: "Failed to load students data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to load students");
      toast({
        title: "Error",
        description: "Failed to load students data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentBookings = async (studentId: string) => {
    try {
      setLoadingBookings(true);

      const bookingsResponse = await adminUsersService.getBookingsByUserId({
        userId: studentId,
      });

      if (bookingsResponse.success && Array.isArray(bookingsResponse.data)) {
        setStudentBookings(bookingsResponse.data);
      }
    } catch (error) {
      console.error("Error fetching student bookings:", error);
      toast({
        title: "Error",
        description: "Failed to load student bookings",
        variant: "destructive",
      });
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student);
    setIsDetailsOpen(true);
    fetchStudentBookings(student._id);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsEditOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1); // Reset to first page when changing page size
  };
  const handleRoleChange = (role: string) => {
    setRole(role);
  };
  const handleEditSuccess = () => {
    fetchStudents(); // Refresh the list after successful edit
  };

  const handleIncludeInactiveChange = (checked: boolean) => {
    setIncludeInactive(checked);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(
      1,
      currentPage - Math.floor(maxVisiblePages / 2)
    );
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              className={`cursor-pointer ${
                currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            />
          </PaginationItem>
          {pages}
          <PaginationItem>
            <PaginationNext
              onClick={() =>
                handlePageChange(Math.min(totalPages, currentPage + 1))
              }
              className={`cursor-pointer ${
                currentPage === totalPages
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <span>Admin Panel</span>
            <span>/</span>
            <span className="text-foreground font-medium">User Management</span>
          </div>
          <h1 className="text-lg font-semibold tracking-tight">User Management</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Manage student accounts, view booking history, and update user details.
          </p>
        </div>

        <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <div>
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {role === "student" ? "Students" : "Vendors"}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalUsers} {role === "student" ? "students" : "vendors"} total
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Label htmlFor="page-size" className="whitespace-nowrap">
                  Role:
                </Label>
                <Select
                  value={role.toString()}
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger className="w-20" id="page-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {user.role == "admin" && (
                      <SelectItem value="admin">Admin</SelectItem>
                    )}
                    {/* {user.role =='admin' && <SelectItem value="vendor">Vendor</SelectItem> } */}
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="vendor_employee">Employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search students by name, email, or phone..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="include-inactive"
                    checked={includeInactive}
                    onCheckedChange={handleIncludeInactiveChange}
                  />
                  <Label
                    htmlFor="include-inactive"
                    className="whitespace-nowrap"
                  >
                    Include Inactive
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="page-size" className="whitespace-nowrap">
                    Per page:
                  </Label>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={handlePageSizeChange}
                  >
                    <SelectTrigger className="w-20" id="page-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-7 w-7 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : error ? (
              <div className="text-center py-6 text-red-500">{error}</div>
            ) : students.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                {searchQuery
                  ? "No students found matching your search."
                  : "No students found."}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">ID</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Name</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Email</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Phone</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Gender</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Bookings</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, idx) => (
                        <TableRow key={student._id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                          <TableCell>
                            <div>
                              {student.userId}
                              {student.profilePicture && (
                                <a
                                  href={getImageUrl(student.profilePicture)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <img
                                    src={getImageUrl(student.profilePicture)}
                                    alt={student?.userId}
                                    className="w-8 h-8 rounded-full object-cover cursor-pointer mt-1"
                                  />
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {student.name}
                              {!student.isActive && (
                                <Badge variant="secondary" className="text-xs">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.phone || "N/A"}</TableCell>
                          <TableCell>
                            {student.gender || "Not specified"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                                {student.activeBookings} Active
                              </span>
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground border border-border w-fit">
                                {student.bookingsCount} Total
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {student.role == "student" &&
                                user.role == "admin" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditStudent(student)}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                )}
                              {user.role == "admin" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedStudent(student);
                                    setIsResetPasswordOpen(true);
                                  }}
                                >
                                  <KeyRound className="h-4 w-4 mr-1" />
                                  Reset Password
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(student)}
                              >
                                View Details
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && renderPagination()}
              </>
            )}
          </CardContent>
        </Card>

        {/* Student Edit Dialog */}
        <StudentEditDialog
          student={selectedStudent}
          open={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSuccess={handleEditSuccess}
        />

        {/* Student Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Student Details</DialogTitle>
            </DialogHeader>

            {selectedStudent && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center">
                    {/* <User  /> */}
                    {selectedStudent.profilePicture && (
                                <a
                                  href={getImageUrl(selectedStudent.profilePicture)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <img
                                    src={getImageUrl(selectedStudent.profilePicture)}
                                    alt={selectedStudent?.userId}
                                    className="w-20 h-20 object-contain cursor-pointer"
                                  />
                                </a>
                              )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {selectedStudent.name}
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedStudent.email}
                    </p>
                    <p className="text-muted-foreground">
                      {selectedStudent.userId}
                    </p>

                    {!selectedStudent.isActive && (
                      <Badge variant="secondary" className="mt-1">
                        Inactive User
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Contact Information</h4>
                    <p>
                      <span className="text-muted-foreground">Email:</span>{" "}
                      {selectedStudent.email}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Phone:</span>{" "}
                      {selectedStudent.phone}
                    </p>
                    <p>
                      <span className="text-muted-foreground">
                        Parent Mobile Number:
                      </span>{" "}
                      {selectedStudent.parentMobileNumber}
                    </p>
                    <p>
                      <span className="text-muted-foreground">
                        Course Studying:
                      </span>{" "}
                      {selectedStudent.courseStudying}
                    </p>
                    <p>
                      <span className="text-muted-foreground">
                        College Studied:
                      </span>{" "}
                      {selectedStudent.collegeStudied}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Student Information</h4>
                    <p>
                      <span className="text-muted-foreground">Gender:</span>{" "}
                      {selectedStudent.gender}
                    </p>
                    <p>
                      <span className="text-muted-foreground">
                        Total Bookings:
                      </span>
                      {selectedStudent.bookingsCount}
                    </p>
                    <p>
                      <span className="text-muted-foreground">
                        Active Bookings:
                      </span>
                      {selectedStudent.activeBookings}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Bio:</span>
                      {selectedStudent.bio}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Address:</span>
                      {selectedStudent.address}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Booking History</h4>
                  {loadingBookings ? (
                    <div className="flex justify-center py-6">
                      <div className="animate-spin h-6 w-6 border-4 border-cabin-wood border-t-transparent rounded-full"></div>
                    </div>
                  ) : studentBookings.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground">
                      No booking history found.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Room</TableHead>
                          <TableHead>Seat</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentBookings.map((booking) => (
                          <TableRow key={booking._id}>
                            <TableCell>
                              {booking.cabinId?.name || "N/A"}
                            </TableCell>
                            <TableCell>
                              #{booking.seatId?.number || "N/A"}
                            </TableCell>
                            <TableCell>
                              {new Date(booking.startDate).toLocaleDateString()}{" "}
                              -{new Date(booking.endDate).toLocaleDateString()}
                              <div className="text-xs text-muted-foreground">
                                {booking.months} months
                              </div>
                            </TableCell>
                            <TableCell>₹{booking.totalPrice}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  booking.paymentStatus === "completed"
                                    ? "bg-green-500"
                                    : booking.paymentStatus === "pending"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }
                              >
                                {booking.paymentStatus}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailsOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Admin Reset Password Dialog */}
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
