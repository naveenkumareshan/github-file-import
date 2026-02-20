import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { adminBookingsService } from "../api/adminBookingsService";
import { useToast } from "@/hooks/use-toast";
import { BookingFilters } from "@/types/BookingTypes";
import { CheckCircle2, XCircle, Eye, Search, Filter, BookOpen } from "lucide-react";

type BookingStatus = "pending" | "completed" | "failed";

const AdminBookings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<BookingStatus | "">("");

  useEffect(() => {
    fetchBookings();
  }, [currentPage, searchQuery, status]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const filters: BookingFilters = {
        page: currentPage,
        limit: 10,
        search: searchQuery,
      };
      if (status as BookingStatus) {
        filters.status = status as BookingStatus;
      }
      const response = await adminBookingsService.getAllBookings(filters);
      if (response.success) {
        setBookings(response.data || []);
        const calculatedTotalPages = Math.ceil((response.count || 0) / 10);
        setTotalPages(response.totalPages || calculatedTotalPages || 1);
      } else {
        toast({
          title: "Error fetching bookings",
          description: response.error || "Failed to load bookings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value === "all" ? "" : value as BookingStatus);
    setCurrentPage(1);
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      const response = await adminBookingsService.updateBooking(bookingId, { status: newStatus });
      if (response.success) {
        toast({ title: "Status Updated", description: `Booking status updated to ${newStatus}` });
        setBookings((prev) =>
          prev.map((b) => (b._id === bookingId ? { ...b, status: newStatus } : b))
        );
      } else {
        toast({ title: "Error", description: response.error || "Failed to update booking status", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update booking status", variant: "destructive" });
    }
  };

  const getStatusBadgeVariant = (s: string): "default" | "secondary" | "destructive" | "outline" | "success" => {
    switch (s) {
      case "completed": return "success";
      case "failed": return "destructive";
      case "pending": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span>Admin Panel</span>
          <span>/</span>
          <span className="text-foreground font-medium">Bookings Management</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Bookings Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          View and manage all seat reservations across reading rooms.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-1 gap-2">
              <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-sm">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button type="submit" size="sm">Search</Button>
              </form>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={status || "all"} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <BookOpen className="h-10 w-10 opacity-30" />
              <p className="text-sm">No bookings found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-semibold">Booking ID</TableHead>
                      <TableHead className="font-semibold">Student</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Room / Seat</TableHead>
                      <TableHead className="font-semibold">Booked On</TableHead>
                      <TableHead className="font-semibold">Duration</TableHead>
                      <TableHead className="font-semibold">Amount</TableHead>
                      <TableHead className="font-semibold">Booking Status</TableHead>
                      <TableHead className="font-semibold">Payment Status</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking, idx) => (
                      <TableRow key={booking._id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                        <TableCell className="font-mono text-xs">
                          {booking.bookingId ? booking.bookingId : booking._id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{booking.userId?.name || "N/A"}</div>
                            <div className="text-xs text-muted-foreground">{booking.userId?.email || "N/A"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{booking.type || "Seat"}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {booking.roomNumber ||
                            (booking.cabinId?.name && booking.seatId?.number
                              ? `${booking.cabinId.name} / Seat ${booking.seatId.number}`
                              : "N/A")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(booking.startDate).toLocaleDateString()} →{" "}
                            {new Date(booking.endDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {booking.bookingDuration === "daily"
                              ? `${booking.durationCount || 1} day(s)`
                              : booking.bookingDuration === "weekly"
                              ? `${booking.durationCount || 1} week(s)`
                              : `${booking.durationCount || 1} month(s)`}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">₹{booking.totalPrice}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(booking.status || "pending")}>
                            {booking.status || "pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(booking.paymentStatus)}>
                            {booking.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            {booking.status !== "completed" && booking.status !== "cancelled" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => handleUpdateStatus(booking._id, "completed")}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Complete
                              </Button>
                            )}
                            {booking.status !== "failed" && booking.status !== "completed" && booking.status !== "cancelled" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50"
                                onClick={() => handleUpdateStatus(booking._id, "failed")}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => navigate(`/admin/bookings/${booking._id}`)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="p-4 border-t">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(currentPage - 1); }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                      .map((page, index, array) => {
                        const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                        const showEllipsisAfter = index < array.length - 1 && array[index + 1] !== page + 1;
                        return (
                          <React.Fragment key={page}>
                            {showEllipsisBefore && <PaginationItem><PaginationLink href="#" onClick={(e) => e.preventDefault()}>...</PaginationLink></PaginationItem>}
                            <PaginationItem>
                              <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(page); }} isActive={page === currentPage}>{page}</PaginationLink>
                            </PaginationItem>
                            {showEllipsisAfter && <PaginationItem><PaginationLink href="#" onClick={(e) => e.preventDefault()}>...</PaginationLink></PaginationItem>}
                          </React.Fragment>
                        );
                      })}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBookings;
