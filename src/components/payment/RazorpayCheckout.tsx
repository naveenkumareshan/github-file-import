
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { razorpayService, RazorpayOrderParams, RazorpayOptions } from '@/api/razorpayService';
import { useAuth } from '@/hooks/use-auth';
import { transactionService } from '@/api/transactionService';
import { format } from 'date-fns';

export interface RazorpayCheckoutProps {
  amount: number;
  appliedCoupon?:any;
  bookingId: string;
  endDate: Date,
  bookingType: 'cabin' | 'hostel' | 'laundry';
  bookingDuration?: 'daily' | 'weekly' | 'monthly';
  durationCount?: number;
  onSuccess: (response: any) => void;
  onError?: (error: any) => void;
  onFailure?: (error: any) => void;  // Add backward compatibility
  buttonText?: string;
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  buttonDisabled?: boolean;
  className?: string;
  createOrder?: () => Promise<any>;  // New prop for custom order creation
  buttonProps?: Record<string, any>; // For additional button props
}

export function RazorpayCheckout({
  amount,
  appliedCoupon,
  bookingId,
  bookingType,
  endDate,
  bookingDuration = 'monthly',
  durationCount = 1,
  onSuccess,
  onError,
  onFailure,
  buttonText = "Pay Now",
  buttonVariant = "default",
  buttonDisabled = false,
  className = '',
  createOrder,
  buttonProps = {},
}: RazorpayCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
  
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to continue with payment",
        variant: "destructive"
      });
      return;
    }
  
    setIsLoading(true);
  
    try {
      // Load the Razorpay script first
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast({
          title: "Payment Failed",
          description: "Unable to load Razorpay SDK. Please try again later.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Create order - use custom function if provided, otherwise use default implementation
      let order;
      if (createOrder) {
        order = await createOrder();
        if (!order) {
          throw new Error('Failed to create order');
        }
      } else {
              // Create transaction first
        const transactionData = {
          bookingId: bookingId,
          bookingType: 'cabin' as const,
          transactionType: 'booking' as const,
          amount: amount,
          currency: 'INR',
          additionalMonths: Number(durationCount),
          newEndDate: format(endDate, 'yyyy-MM-dd'),
          appliedCoupon: appliedCoupon ? {
            couponId: appliedCoupon.coupon?._id,
            couponCode: appliedCoupon.coupon?.code,
            discountAmount: appliedCoupon.discountAmount,
            couponType: appliedCoupon.coupon?.type,
            couponValue: appliedCoupon.coupon?.value,
            appliedAt: new Date()
          } : null
        };
  
        const transactionResponse = await transactionService.createTransaction(transactionData);
        setCurrentTransaction(transactionResponse.data.data);
        const orderParams: RazorpayOrderParams = {
          amount,
          currency: 'INR',
          bookingId,
          bookingType,
          bookingDuration,
          durationCount,
          notes: {
            transactionId: transactionResponse.data.data._id
          }
        };
        
        const response = await razorpayService.createOrder(orderParams);
        
        if (!response.success || !response.data) {
          throw new Error(response.error?.message || 'Failed to create order');
        }
        
        order = response.data;

        // Update transaction with Razorpay order ID
        await transactionService.updateTransactionStatus(transactionResponse.data.data._id, 'pending', {
          razorpay_order_id: order.id,
          bookingId : transactionResponse.data.data.transactionId, 
          transactionId : transactionResponse.data.data._id, 
        });
      }

      // Step 2: Prepare Razorpay options
      const options = {
        key: order.KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Inhalestays",
        description: `Payment for ${bookingType} booking (${getDurationText(bookingDuration, durationCount)})`,
        order_id: order.id,
        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || ''
        },
        theme: {
          color: "#1fa763"
        },
        handler: async (paymentResponse: any) => {
          try {
            // Verify the payment on server
            const verifyResponse = await razorpayService.verifyPayment({
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_signature: paymentResponse.razorpay_signature,
              bookingId,
              bookingType,
              bookingDuration,
              durationCount
            });
            
            if (verifyResponse.success) {
                // Update transaction status to completed
              await transactionService.updateTransactionStatus(bookingId, 'completed', {
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                paymentResponse: paymentResponse,
                bookingId : bookingId, 
                transactionId : currentTransaction ? currentTransaction._id : '', 
              });
              toast({
                title: "Payment successful",
                description: "Your booking has been confirmed!"
              });
              
              onSuccess(paymentResponse);
            } else {
              throw new Error(verifyResponse.error?.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast({
              title: "Payment verification failed",
              description: "Your payment was successful but we couldn't verify it. Please contact support.",
              variant: "destructive"
            });
            
            if (onError) {
              onError(error);
            } else if (onFailure) {
              onFailure(error);
            }
          } finally {
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            toast({
              title: "Payment Cancelled",
              description: "You cancelled the Razorpay payment",
              variant: "destructive"
            });
          }
        }
      };
  
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
  
    } catch (error) {
      console.error("Payment initialization error:", error);
      toast({
        title: "Payment initialization failed",
        description: error instanceof Error ? error.message : "Could not start the payment process",
        variant: "destructive"
      });
      if (onError) onError(error);
      else if (onFailure) onFailure(error);
      setIsLoading(false);
    }
  };

  const getDurationText = (duration: string, count: number) => {
    if (duration === 'daily') {
      return `${count} day${count > 1 ? 's' : ''}`;
    } else if (duration === 'weekly') {
      return `${count} week${count > 1 ? 's' : ''}`;
    } else {
      return `${count} month${count > 1 ? 's' : ''}`;
    }
  };
  
  return (
    <Button 
      variant={buttonVariant} 
      onClick={handlePayment} 
      disabled={isLoading || buttonDisabled}
      className={className}
      {...buttonProps}
    >
      {isLoading ? "Processing..." : buttonText}
    </Button>
  );
}
