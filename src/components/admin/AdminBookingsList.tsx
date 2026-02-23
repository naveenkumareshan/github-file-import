import React, { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { adminBookingsService } from "@/api/adminBookingsService";
import { useToast } from "@/hooks/use-toast";
import { Filter, Download, FileSpreadsheet, Eye, TicketPercent } from "lucide-react";
import { format } from "date-fns";

interface Booking {
  _id: string;
  bookingId: string;
  userId: {
    name: string;
    email: string;
    userId: string;
    profilePicture:string;
  };
  cabinId?: {
    name: string;
    cabinCode: string;
  };
  hostelId?: {
    name: string;
  };
  seatId?: {
    number: number;
  };
  bedId?: {
    number: number;
  };
  startDate: string;
  endDate: string;
  originalPrice?: number;
  totalPrice: number;
  seatPrice:number;
  appliedCoupon?: {
    couponCode: string;
    discountAmount: number;
    couponType: string;
    couponValue: number;
  };
  paymentStatus: string;
  status: string;
  durationCount?: number;
  createdAt: string;
  payoutStatus:string;
}

interface FilterState {
  status: string;
  paymentStatus: string;
  search: string;
  startDate: string;
  endDate: string;
  cabinId: string;
  userId: string;
  sortBy: string;
  order: "asc" | "desc";
}

const AdminBookingsList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState<FilterState>({
    status: "completed",
    paymentStatus: "",
    search: "",
    startDate: "",
    endDate: "",
    cabinId: "",
    userId: "",
    sortBy: "createdAt",
    order: "desc",
  });

  useEffect(() => {
    fetchBookings();
  }, [currentPage, filters]);

  const fetchBookings = async () => {
    try {
      // setLoading(true);

      // Prepare filters for API call
      const apiFilters: any = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: filters.sortBy,
        order: filters.order,
      };

      // Add filters only if they have values
      if (filters.status)
        apiFilters.status = filters.status as
          | "pending"
          | "completed"
          | "cancelled";
      if (filters.paymentStatus)
        apiFilters.paymentStatus = filters.paymentStatus as
          | "pending"
          | "completed"
          | "failed";
      if (filters.search) apiFilters.search = filters.search;
      if (filters.startDate) apiFilters.startDate = filters.startDate;
      if (filters.endDate) apiFilters.endDate = filters.endDate;
      if (filters.cabinId) apiFilters.cabinId = filters.cabinId;
      if (filters.userId) apiFilters.userId = filters.userId;

      const response = await adminBookingsService.getAllBookings(apiFilters);

      if (response.success) {
        setBookings(response.data || []);
        setTotalCount(response.count || 0);
        setTotalPages(
          response.totalPages || Math.ceil((response.count || 0) / itemsPerPage)
        );
      } else {
        throw new Error(response.error || "Failed to fetch bookings");
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      status: "completed",
      paymentStatus: "",
      search: "",
      startDate: "",
      endDate: "",
      cabinId: "",
      userId: "",
      sortBy: "createdAt",
      order: "desc",
    });
    setCurrentPage(1);
  };

  const exportData = async (format: "csv" | "xlsx") => {
    try {
      // Get all data for export (without pagination)
      const exportFilters: any = { limit: 1000 }; // Large limit for export

      if (filters.status) exportFilters.status = filters.status;
      if (filters.paymentStatus)
        exportFilters.paymentStatus = filters.paymentStatus;
      if (filters.search) exportFilters.search = filters.search;
      if (filters.startDate) exportFilters.startDate = filters.startDate;
      if (filters.endDate) exportFilters.endDate = filters.endDate;
      if (filters.cabinId) exportFilters.cabinId = filters.cabinId;
      if (filters.userId) exportFilters.userId = filters.userId;

      const response = await adminBookingsService.getAllBookings(exportFilters);

      if (!response.success) {
        throw new Error(response.error);
      }

      const dataToExport = response.data || [];

      const csvContent = [
        [
          "Booking ID",
          "Student Name",
          "Email",
          "Room/Seat",
          "Start Date",
          "End Date",
          "Original Price",
          "Discount",
          "Final Amount",
          "Coupon Code",
          "Status",
          "Payment Status",
          "Created At",
        ].join(","),
        ...dataToExport.map((booking: Booking) =>
          [
            booking.bookingId || booking._id,
            booking.userId?.name || "",
            booking.userId?.email || "",
            (booking.cabinId?.name || "") +
              (booking.seatId ? ` - Seat ${booking.seatId.number}` : ""),
            new Date(booking.startDate).toLocaleDateString(),
            new Date(booking.endDate).toLocaleDateString(),
            booking.originalPrice || booking.totalPrice,
            booking.appliedCoupon?.discountAmount || 0,
            booking.totalPrice,
            booking.appliedCoupon?.couponCode || "",
            booking.status,
            booking.paymentStatus,
            new Date(booking.createdAt).toLocaleDateString(),
          ]
            .map((field) => `"${field}"`)
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bookings-${
        new Date().toISOString().split("T")[0]
      }.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `${
          dataToExport.length
        } bookings exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "pending":
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-500">
            Pending
          </Badge>
        );
      case "failed":
      case "cancelled":
        return (
          <Badge variant="outline" className="border-red-500 text-red-500">
            {status}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSettlementBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "included":
        return <Badge className="bg-green-500">Done</Badge>;
      default:
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-500">
            Pending
          </Badge>
        );
    }
  };

  const handleViewDetails = (booking: Booking) => {
    const bookingType = booking.cabinId ? "cabin" : "hostel";
    navigate(`/admin/bookings/${booking._id}/${bookingType}`);
  };


  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
     <div  className="min-w-[100px]">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Booking ID, student name..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="status">Booking Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sortBy">Sort By</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) => handleFilterChange("sortBy", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="startDate">Start Date</SelectItem>
                  <SelectItem value="endDate">End Date</SelectItem>
                  <SelectItem value="totalPrice">Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Select
                value={filters.order}
                onValueChange={(value) =>
                  handleFilterChange("order", value as "asc" | "desc")
                }
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">↓</SelectItem>
                  <SelectItem value="asc">↑</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => exportData("csv")}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => exportData("xlsx")}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bookings found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Booked On</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Coupon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Settlement</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking._id}>
                    <TableCell className="font-medium">
                      {booking.bookingId || booking._id.substring(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {booking.userId?.name || "N/A"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {booking.userId?.email || "N/A"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {booking.userId?.userId || "N/A"}
                          { booking.userId.profilePicture && <a
                              href={import.meta.env.VITE_BASE_URL + booking.userId.profilePicture}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={import.meta.env.VITE_BASE_URL + booking.userId.profilePicture}
                                alt={booking.userId?.userId}
                                className="w-10 h-10 object-contain cursor-pointer"
                              />
                            </a>
                          }
                          </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {booking.cabinId?.name ||
                            booking.hostelId?.name ||
                            "N/A"}
                        </div>

                        <div className="text-sm text-muted-foreground">
                          {booking.cabinId?.cabinCode &&
                            `cabinCode #${booking.cabinId?.cabinCode || "N/A"}`}
                          {booking.cabinId
                            ? `Seat #${booking.seatId?.number || "N/A"}`
                            : `Bed #${booking.bedId?.number || "N/A"}`}
                        </div>
                      </div>
                    </TableCell>
                    
                     <TableCell>
                          {format(new Date(booking.createdAt), "dd MMM yyyy h:I:s a")}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>
                          {format(new Date(booking.startDate), "dd MMM yyyy")}
                        </div>
                        <div className="text-muted-foreground">to</div>
                        <div>
                          {format(new Date(booking.endDate), "dd MMM yyyy")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {booking.originalPrice && booking.appliedCoupon ? (
                          <>
                            <div className="text-sm text-muted-foreground line-through">
                              ₹{booking.originalPrice}
                            </div>
                            <div className="font-medium text-green-600">
                              ₹{booking.totalPrice}
                            </div>
                            <div className="text-xs text-green-600">
                              Saved ₹{booking.appliedCoupon.discountAmount}
                            </div>
                          </>
                        ) : (
                          <div className="font-medium">₹{booking.totalPrice}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.appliedCoupon &&  booking.appliedCoupon?.couponCode? (
                        <div className="flex items-center gap-1">
                          <TicketPercent className="h-3 w-3 text-green-600" />
                          <div>
                            <div className="text-sm font-medium text-green-600">
                              {booking.appliedCoupon.couponCode}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {booking.appliedCoupon.couponType === 'percentage' 
                                ? `${booking.appliedCoupon.couponValue}% off`
                                : `₹${booking.appliedCoupon.couponValue} off`
                              }
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No coupon</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(booking.status || "pending")}
                    </TableCell>
                    <TableCell>
                      {getSettlementBadge(booking.payoutStatus)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(booking)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {bookings.length > 0 && (
        <Card>
          <CardContent>
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, index, array) => {
                    const showEllipsisBefore =
                      index > 0 && array[index - 1] !== page - 1;
                    const showEllipsisAfter =
                      index < array.length - 1 &&
                      array[index + 1] !== page + 1;

                    return (
                      <React.Fragment key={page}>
                        {showEllipsisBefore && (
                          <PaginationItem>
                            <PaginationLink
                              href="#"
                              onClick={(e) => e.preventDefault()}
                            >
                              ...
                            </PaginationLink>
                          </PaginationItem>
                        )}

                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                            isActive={page === currentPage}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>

                        {showEllipsisAfter && (
                          <PaginationItem>
                            <PaginationLink
                              href="#"
                              onClick={(e) => e.preventDefault()}
                            >
                              ...
                            </PaginationLink>
                          </PaginationItem>
                        )}
                      </React.Fragment>
                    );
                  })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages)
                        setCurrentPage(currentPage + 1);
                    }}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
export default AdminBookingsList;
