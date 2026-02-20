import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React, { lazy, Suspense } from "react";
const HomePage = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const Login = lazy(() => import("./pages/StudentLogin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Register = lazy(() => import("./pages/StudentRegister"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const BookConfirmation = lazy(() => import("./pages/Confirmation"));
const HostelBookConfirmation = lazy(() => import("./pages/HostelConfirmation"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
import AdminHostels from "./pages/hotelManager/HostelManagement"; // Changed from named import to default import
const SeatManagement = lazy(() => import("./pages/SeatManagement"));
import PageNotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
const StudentLayout = lazy(() => import("./components/StudentLayout"));
const AdminLayout = lazy(() => import("./components/AdminLayout"));
const CabinDetails = lazy(() => import("./pages/Cabins"));
import { AuthProvider } from "./contexts/AuthContext";
const Hostels = lazy(() => import("./pages/Hostels"));
import HostelDetails from "./pages/HostelRoomDetails"; // Using Hostels as placeholder
import HostelRooms from "./pages/HostelRooms";
import HostelRoomView from "./pages/HostelRoomView";
import BookSharedRoom from "./pages/BookSharedRoom";
import HostelBooking from "./pages/HostelBooking"; // Added new HostelBooking page
import Laundry from "./pages/Laundry";
import LaundryRequest from "./pages/LaundryRequest";
import LaundryAgentPage from "./pages/LaundryAgentPage";
const ChatbotButton = lazy(() => import("./components/JiyaChatbot/ChatbotButton"));
const Booking = lazy(() => import("./pages/Booking"));
const AdminBookingView = lazy(() => import("./pages/AdminBookingView"));
const StudentBookings = lazy(() => import("./pages/StudentBookings"));
const StudentBookingView = lazy(() => import("./pages/students/StudentBookingView"));
const BookingReportsPage = lazy(() => import("./components/admin/reports/BookingReportsPage"));
const ManualBookingManagement = lazy(() => import("./pages/admin/ManualBookingManagement"));
const BookingTransactions = lazy(() => import("./pages/students/BookingTransactions"));
const EmailJobManagement = lazy(() => import("./components/admin/email_reports/EmailJobManagement"));
const EmailTemplatesManagement = lazy(() => import("./components/admin/EmailTemplatesManagement"));
const AdminCoupons = lazy(() => import("./pages/AdminCoupons"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminSettingsNew = lazy(() => import("./pages/admin/AdminSettingsNew"));
const AdminBookingsList = lazy(() => import("./components/admin/AdminBookingsList"));
const StudentExcelImport = lazy(() => import("./components/admin/StudentExcelImport"));
const CreateStudentForm = lazy(() => import("./components/admin/CreateStudentForm"));
const VendorLogin = lazy(() => import("./pages/vendor/VendorLogin"));
const VendorRegister = lazy(() => import("./pages/vendor/VendorRegister"));
const VendorEmployees = lazy(() => import("./pages/vendor/VendorEmployees"));
const VendorPayouts = lazy(() => import("./components/vendor/VendorPayouts"));
const AdminPayouts = lazy(() => import("./pages/admin/AdminPayouts"));
const VendorApproval = lazy(() => import("./components/admin/VendorApproval"));
const SeatTransferManagementPage = lazy(() => import("./pages/admin/SeatTransferManagement"));
const DepositAndRestrictionManagement = lazy(() => import("./pages/admin/DepositAndRestrictionManagement"));
const LocationManagement = lazy(() => import("./components/admin/LocationManagement"));
const NotificationManagement = lazy(() => import("./components/admin/NotificationManagement"));
const AdminRooms = lazy(() => import("./pages/RoomManagement"));
const VendorProfilePage = lazy(() => import("./pages/vendor/VendorProfile"));
const AdminHostelBookings = lazy(() => import("./pages/hotelManager/AdminHostelBookings"));
const VendorAutoPayoutSettings = lazy(() => import("./components/admin/VendorAutoPayoutSettings"));
const VendorSeats = lazy(() => import("./pages/vendor/VendorSeats"));
const AdminBookingDetail = lazy(() => import("./pages/AdminBookingDetail"));
const CabinSearch = lazy(() => import("./pages/CabinSearch"));
const BookSeat = lazy(() => import("./pages/BookSeat"));
const AdminStudents = lazy(() => import("./pages/AdminStudents"));
const ReviewsManagement = lazy(() => import("./pages/admin/ReviewsManagement"));
const ErrorLogManagement = lazy(() => import("./components/admin/ErrorLogManagement"));
import ScrollToTop from "./components/ScrollToTop";
import { LazyWrapper } from './components/LazyWrapper';
function App() {
  return (
    <AuthProvider>
      <LazyWrapper>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<About />} />
          {/* <Route path="/cabins" element={<Cabins />} /> */}
          <Route path="/cabins" element={<CabinSearch />} />
          <Route path="/cabin/:id" element={
            <Suspense fallback={<div className="p-6 text-center">Loading cabin...</div>}>
              <CabinDetails />
            </Suspense>
          } />
          <Route path="/hostels" element={<Hostels />} />
          <Route path="/hostels/:roomId" element={<HostelDetails />} />
          <Route path="/hostels/:id/rooms" element={<HostelRooms />} />
          <Route
            path="/book-shared-room/:roomId"
            element={<BookSharedRoom />}
          />
          <Route
            path="/hostel-booking/:hostelId/:roomId"
            element={<HostelBooking />}
          />
          <Route path="/booking-confirmation/:bookingId" element={<HostelBookConfirmation />} />

          {/* Add Laundry Routes */}
          <Route path="/laundry" element={<Laundry />} />
          <Route path="/laundry-request" element={<LaundryRequest />} />
          <Route
            path="/laundry-agent"
            element={
              <ProtectedRoute requiredRole="admin">
                <LaundryAgentPage />
              </ProtectedRoute>
            }
          />

          <Route path="/booking/:cabinId" element={<Booking />} />
          <Route path="/book-seat/:cabinId" element={<BookSeat />} />
          <Route path="/book-confirmation/:bookingId" element={<BookConfirmation />} />

          {/* Admin login - outside of admin layout */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/login" element={<Login />} />

          {/* Student routes */}
          <Route path="/student" element={<StudentLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password/:token" element={<ResetPassword />} />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  {/* <Dashboard /> */}
                  <StudentBookings />
                </ProtectedRoute>
              }
            />

            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="bookings"
              element={
                <ProtectedRoute>
                  <StudentBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="bookings/:bookingId/transactions/:bookingType"
              element={
                <ProtectedRoute>
                  <BookingTransactions />
                </ProtectedRoute>
              }
            />
            bookings
            <Route path="bookings/:bookingId"  element={
                <ProtectedRoute>
                  <StudentBookingView />
                </ProtectedRoute>
              }/>
          </Route>

          <Route path="/vendor/login" element={<VendorLogin />} />
          <Route path="/vendor/register" element={<VendorRegister />} />

          <Route path="/host/login" element={<VendorLogin />} />
          <Route path="/host/register" element={<VendorRegister />} />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <Suspense fallback={<div className="p-6 text-center">Loading admin panel...</div>}>
                  <AdminLayout />
                </Suspense>
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="bookings" element={<AdminBookingsList />} />
            <Route path="bookings/:bookingId/:type" element={<AdminBookingDetail />} />
            <Route path="seat-transfer" element={<SeatTransferManagementPage />} />
            {/* <Route path="seat-transfer-history" element={<SeatTransferManagementHistoryPage />} /> */}
            <Route path="hostel-bookings" element={<AdminHostelBookings />} />
            <Route path="rooms" element={<AdminRooms />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="students-create" element={<CreateStudentForm />} />
            <Route path="students-import" element={<StudentExcelImport />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="settings" element={<AdminSettingsNew />} />
            <Route path="cabins/:cabinId/seats" element={<SeatManagement />} />
            <Route path="rooms/:cabinId/seats" element={<SeatManagement />} />
            <Route path="hostels" element={<AdminHostels />} />
            <Route path="employees" element={<VendorEmployees />} />
            <Route path="payouts" element={<AdminPayouts />} />
            <Route path="vendorpayouts" element={<VendorPayouts />} />
            <Route path="vendors" element={<VendorApproval />} />
            <Route path="deposits-restrictions" element={<DepositAndRestrictionManagement />} />
            <Route path="locations" element={<LocationManagement />} />
            <Route path="vendor-auto-payout" element={<VendorAutoPayoutSettings />} />
            <Route path="seats-available-map" element={<VendorSeats />} />

            <Route
              path="hostels/:hostelId/rooms"
              element={<HostelRoomView />}
            />
            <Route path="bookings/:bookingId" element={<AdminBookingView />} />
            <Route path="reports" element={<BookingReportsPage />} />
            <Route path="email-reports" element={<EmailJobManagement />} />
            <Route path="email-templates" element={<EmailTemplatesManagement />} />
            <Route path="notifications" element={<NotificationManagement />} />
            <Route path="reviews" element={<ReviewsManagement />} />
            <Route path="error-logs" element={<ErrorLogManagement />} />
            <Route
              path="manual-bookings"
              element={<ManualBookingManagement />}
            />
            <Route
              path="/admin/manual-bookings/:type/:bookingId"
              element={<ManualBookingManagement />}
            />
             <Route
              path="profile"
              element={<VendorProfilePage />}
            />

          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
        <Toaster />
        <ChatbotButton />
      </Router>
      </LazyWrapper>
    </AuthProvider>
  );
}

export default App;
