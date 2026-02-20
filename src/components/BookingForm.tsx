
import React, { useState, useEffect } from 'react';
import { Cabin, calculatePrice } from '../data/cabinsData';
import { Seat, BookingPlan, bookingPlans } from '../data/bookingData';
import { CustomerForm } from './CustomerForm';
import { PricingSummary } from './PricingSummary';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface BookingFormProps {
  cabin: Cabin;
  selectedSeat: Seat | null;
  onBookingComplete: (bookingData: BookingData) => void;
}

export interface BookingData {
  cabinId: number;
  seatId: number;
  date: string;
  bookingPlanId: number;
  months: number;
  customerName: string;
  customerEmail: string;
  totalPrice: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentMethod?: string;
  paymentDate?: string;
}

export function BookingForm({ cabin, selectedSeat, onBookingComplete }: BookingFormProps) {
  const { user } = useAuth();
  const [date, setDate] = useState<string>(getTodayDate());
  const [selectedPlanId, setSelectedPlanId] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Use authenticated user data if available
  useEffect(() => {
    if (user) {
      setCustomerName(user.name);
      setCustomerEmail(user.email);
    }
  }, [user]);
  
  function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
  
  const getSelectedPlan = (): BookingPlan | undefined => {
    return bookingPlans.find(plan => plan.id === selectedPlanId);
  };
  
  const getPricingDetails = () => {
    if (!selectedSeat || !getSelectedPlan()) return null;
    
    return calculatePrice(
      selectedSeat.price,
      getSelectedPlan()?.months || 1,
      date
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSeat) {
      toast({
        title: "Error",
        description: "Please select a seat",
        variant: "destructive"
      });
      return;
    }
    
    const plan = getSelectedPlan();
    if (!plan) {
      toast({
        title: "Error",
        description: "Please select a subscription plan",
        variant: "destructive"
      });
      return;
    }
    
    // Show payment options
    setShowPaymentOptions(true);
  };
  
  const handlePayment = async (paymentMethod: string) => {
    setProcessingPayment(true);
    
    const pricing = getPricingDetails();
    if (!pricing) return;
    
    const plan = getSelectedPlan();
    if (!plan) return;
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate success/failure (90% success rate for demo)
      const paymentSuccess = Math.random() < 0.9;
      
      if (!paymentSuccess) {
        throw new Error("Payment failed");
      }
      
      const cabinId = typeof cabin.id === 'string' ? parseInt(cabin.id, 10) : cabin.id;
      const seatId = typeof selectedSeat!.id === 'string' ? parseInt(selectedSeat!.id, 10) : selectedSeat!.id;
      
      const bookingData: BookingData = {
        cabinId: cabinId,
        seatId: seatId,
        date,
        bookingPlanId: selectedPlanId,
        months: plan.months,
        customerName,
        customerEmail,
        totalPrice: pricing.total,
        paymentStatus: 'completed',
        paymentMethod: paymentMethod,
        paymentDate: new Date().toISOString()
      };
      
      toast({
        title: "Payment Successful",
        description: "Your booking has been confirmed",
        variant: "default"
      });
      
      onBookingComplete(bookingData);
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "There was an issue processing your payment",
        variant: "destructive"
      });
      
      // Still proceed with booking but mark as failed payment
      const cabinId = typeof cabin.id === 'string' ? parseInt(cabin.id, 10) : cabin.id;
      const seatId = typeof selectedSeat!.id === 'string' ? parseInt(selectedSeat!.id, 10) : selectedSeat!.id;
      
      const bookingData: BookingData = {
        cabinId: cabinId,
        seatId: seatId,
        date,
        bookingPlanId: selectedPlanId,
        months: plan.months,
        customerName,
        customerEmail,
        totalPrice: pricing.total,
        paymentStatus: 'failed',
        paymentMethod: paymentMethod,
        paymentDate: new Date().toISOString()
      };
      
      onBookingComplete(bookingData);
    } finally {
      setProcessingPayment(false);
      setShowPaymentOptions(false);
    }
  };
  
  const selectedPlan = getSelectedPlan();
  const pricingDetails = getPricingDetails();
  
  return (
    <div className="max-w-xl mx-auto mt-8">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
        <h3 className="text-xl font-serif font-semibold mb-4 text-cabin-dark">Complete Your Booking</h3>
        
        {!showPaymentOptions ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <CustomerForm
                cabin={cabin}
                selectedSeat={selectedSeat}
                selectedPlan={selectedPlan!}
                date={date}
                customerName={customerName}
                customerEmail={customerEmail}
                onDateChange={setDate}
                onNameChange={setCustomerName}
                onEmailChange={setCustomerEmail}
                disableNameEmail={!!user} // Disable editing if user is authenticated
              />
              
              <div>
                <label className="block text-sm font-medium mb-1">Subscription Plan</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {bookingPlans.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      className={`p-3 text-sm rounded-md border transition-colors ${
                        selectedPlanId === plan.id 
                          ? 'bg-cabin-wood text-white border-cabin-wood' 
                          : 'bg-white text-cabin-dark border-border hover:bg-cabin-wood/10'
                      }`}
                      onClick={() => setSelectedPlanId(plan.id)}
                    >
                      <div className="font-medium mb-1">{plan.description}</div>
                      <div className="text-xs">{plan.months} {plan.months === 1 ? 'month' : 'months'}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {selectedSeat && pricingDetails && (
                <div>
                  <h4 className="font-medium mb-2">Pricing Summary</h4>
                  <PricingSummary 
                    pricingDetails={pricingDetails}
                    selectedSeat={selectedSeat}
                  />
                </div>
              )}
              
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-cabin-wood text-white py-2 rounded-md hover:bg-cabin-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedSeat || !customerName || !customerEmail}
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-4">Select Payment Method</h4>
              <div className="space-y-3">
                <button
                  onClick={() => handlePayment('Credit Card')}
                  disabled={processingPayment}
                  className="w-full flex items-center justify-between border p-3 rounded-md hover:bg-gray-50"
                >
                  <span className="flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                    </svg>
                    Credit Card
                  </span>
                  <span>Visa, Mastercard, Amex</span>
                </button>
                
                <button
                  onClick={() => handlePayment('UPI')}
                  disabled={processingPayment}
                  className="w-full flex items-center justify-between border p-3 rounded-md hover:bg-gray-50"
                >
                  <span className="flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                    </svg>
                    UPI
                  </span>
                  <span>Google Pay, PhonePe, Paytm</span>
                </button>
                
                <button
                  onClick={() => handlePayment('Net Banking')}
                  disabled={processingPayment}
                  className="w-full flex items-center justify-between border p-3 rounded-md hover:bg-gray-50"
                >
                  <span className="flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                    </svg>
                    Net Banking
                  </span>
                  <span>All Major Banks</span>
                </button>
              </div>
            </div>
            
            {processingPayment && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cabin-dark mb-2"></div>
                <p>Processing payment...</p>
              </div>
            )}
            
            <button
              onClick={() => setShowPaymentOptions(false)}
              disabled={processingPayment}
              className="w-full py-2 border border-cabin-dark text-cabin-dark rounded-md hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
