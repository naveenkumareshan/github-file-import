import { jobProcessingService } from './jobProcessingService';

interface BookingEmailData {
  userEmail: string;
  userName: string;
  bookingId: string;
  bookingType: 'cabin' | 'hostel';
  totalPrice?: number;
  startDate?: string;
  endDate?: string;
  location?: string;
  cabinName?: string;
  roomNumber?: string;
  seatNumber?: string;
}

export const bookingEmailService = {
  // Trigger booking confirmation email
  triggerBookingConfirmation: async (bookingData: BookingEmailData) => {    
    const bookingDetails = {
      id: bookingData.bookingId,
      type: bookingData.bookingType,
      totalPrice: bookingData.totalPrice,
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      location: bookingData.location || bookingData.cabinName || 'Your booking location',
      roomNumber: bookingData.roomNumber,
      seatNumber: bookingData.seatNumber
    };

    try {
      const result = await jobProcessingService.sendBookingConfirmationEmail(
        bookingData.userEmail,
        bookingData.userName,
        bookingDetails
      );
      
      return result;
    } catch (error) {
      console.error('Error triggering booking confirmation email:', error);
      return { success: false, error: error };
    }
  },

  // Trigger booking failed email
  triggerBookingFailed: async (bookingData: BookingEmailData, errorMessage: string) => {
    console.log('Triggering booking failed email for:', bookingData.userEmail);
    
    const bookingDetails = {
      id: bookingData.bookingId,
      type: bookingData.bookingType,
      totalPrice: bookingData.totalPrice,
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      location: bookingData.location || bookingData.cabinName || 'Your booking location',
      roomNumber: bookingData.roomNumber,
      seatNumber: bookingData.seatNumber,
      errorMessage: errorMessage
    };

    try {
      const result = await jobProcessingService.sendBookingFailedEmail(
        bookingData.userEmail,
        bookingData.userName,
        bookingDetails,
        errorMessage
      );
      
      console.log('Booking failed email job created:', result);
      return result;
    } catch (error) {
      console.error('Error triggering booking failed email:', error);
      return { success: false, error: error };
    }
  },

  // Trigger booking reminder email
  triggerBookingReminder: async (bookingData: BookingEmailData, daysUntilExpiry: number = 3) => {
    console.log('Triggering booking reminder email for:', bookingData.userEmail);
    
    const bookingDetails = {
      id: bookingData.bookingId,
      type: bookingData.bookingType,
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      location: bookingData.location || bookingData.cabinName || 'Your booking location',
      roomNumber: bookingData.roomNumber,
      seatNumber: bookingData.seatNumber,
      daysUntilExpiry: daysUntilExpiry
    };

    try {
      const result = await jobProcessingService.sendBookingReminderEmail(
        bookingData.userEmail,
        bookingData.userName,
        bookingDetails
      );
      
      console.log('Booking reminder email job created:', result);
      return result;
    } catch (error) {
      console.error('Error triggering booking reminder email:', error);
      return { success: false, error: error };
    }
  }
};