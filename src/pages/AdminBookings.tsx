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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminBookingsService } from "../api/adminBookingsService";
import { useToast } from "@/hooks/use-toast";
import { BookingFilters } from "@/types/BookingTypes";

// Define allowed status values to match the type
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

      // Only add status to filters if it's not empty and matches allowed values
      if (status as BookingStatus) {
        filters.status = status as BookingStatus;
      }

      const response = await adminBookingsService.getAllBookings(filters);

      if (response.success) {
        setBookings(response.data || []);
        // Calculate total pages if not provided by API
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
      console.error("Error fetching bookings:", error);
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
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value as BookingStatus | "");
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleUpdateStatus = async (
    bookingId: string,
    newStatus: BookingStatus
  ) => {
    try {
      const response = await adminBookingsService.updateBooking(bookingId, {
        status: newStatus,
      });

      if (response.success) {
        toast({
          title: "Status Updated",
          description: `Booking status updated to ${newStatus}`,
        });

        // Update the local state to reflect the change
        setBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking._id === bookingId
              ? { ...booking, status: newStatus }
              : booking
          )
        );
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update booking status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (bookingId: string) => {
    navigate(`/admin/bookings/${bookingId}`);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-center pb-2">
          <CardTitle className="text-2xl font-bold">
            Bookings Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
            <div className="flex-1">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Search by student name, email or booking ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
                <Button type="submit">Search</Button>
              </form>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="status" className="whitespace-nowrap">
                Filter by Status:
              </label>
              <select
                id="status"
                value={status}
                onChange={handleStatusChange}
                className="border rounded-md p-2"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-cabin-wood border-t-transparent rounded-full"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No bookings found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Room/Seat</TableHead>
                      <TableHead>Booked On</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking._id}>
                        <TableCell className="font-medium">
                          {booking.bookingId ? booking.bookingId : booking._id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {booking.userId?.name || "N/A"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {booking.userId?.email || "N/A"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{booking.type || "Seat"}</TableCell>
                        <TableCell>
                          {booking.roomNumber ||
                            (booking.cabinId?.name && booking.seatId?.number
                              ? `${booking.cabinId.name} / ${booking.seatId.number}`
                              : "N/A")}
                        </TableCell>
                        <TableCell>
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>
                              {new Date(booking.startDate).toLocaleDateString()}{" "}
                              to{" "}
                              {new Date(booking.endDate).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {booking.bookingDuration === "daily"
                                ? `${booking.durationCount || 1} day(s)`
                                : booking.bookingDuration === "weekly"
                                ? `${booking.durationCount || 1} week(s)`
                                : `${booking.durationCount || 1} month(s)`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>₹{booking.totalPrice}</TableCell>
                        <TableCell>
                          <Badge
                            className={getStatusBadgeColor(
                              booking.status || "pending"
                            )}
                          >
                            {booking.status || "pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getStatusBadgeColor(
                              booking.paymentStatus
                            )}
                          >
                            {booking.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {booking.status !== "completed" &&
                              booking.status !== "cancelled" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateStatus(booking._id, "completed")
                                  }
                                >
                                  Mark Complete
                                </Button>
                              )}
                            {booking.status !== "failed" &&
                              booking.status !== "completed" &&
                              booking.status !== "cancelled" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-500"
                                  onClick={() =>
                                    handleUpdateStatus(booking._id, "failed")
                                  }
                                >
                                  Cancel
                                </Button>
                              )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(booking._id)}
                            >
                              Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

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
                      // Show current page, first, last, and 1 page before and after current
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, index, array) => {
                      // Add ellipsis
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBookings;
