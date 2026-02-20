
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Info, X, ChevronDown } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { vendorService } from '@/api/vendorService';
import { useToast } from '@/hooks/use-toast';

interface InstantSettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  onSettlementSuccess: () => void;
}

export const InstantSettlementDialog: React.FC<InstantSettlementDialogProps> = ({
  open,
  onOpenChange,
  availableBalance,
  onSettlementSuccess
}) => {
  const [amount, setAmount] = useState(availableBalance.toString());
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const feeRate = 0.0015; // 0.15%
  const fee = parseFloat(amount) * feeRate;
  const netAmount = parseFloat(amount) - fee;

  const handleConfirmSettlement = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid settlement amount",
        variant: "destructive"
      });
      return;
    }

    if (parseFloat(amount) > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: "Settlement amount cannot exceed available balance",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessing(true);
      const response = await vendorService.requestPayout({
        amount: parseFloat(amount)
      });

      if (response.success) {
        toast({
          title: "Settlement Requested",
          description: "Your instant settlement has been processed successfully"
        });
        onSettlementSuccess();
        onOpenChange(false);
      } else {
        throw new Error(response.error?.message || 'Settlement failed');
      }
    } catch (error) {
      toast({
        title: "Settlement Failed",
        description: error.message || "Failed to process settlement",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <DialogTitle className="text-xl font-semibold">Instant Settlements</DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              Settle to your bank account instantly, even on holidays!
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onOpenChange(false)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Available Balance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Available balance</span>
              <Info className="h-4 w-4 text-gray-400" />
            </div>
            <span className="text-lg font-semibold">
              {formatCurrency(availableBalance)}
            </span>
          </div>

          {/* Early Access Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                <Info className="h-3 w-3 text-blue-600" />
              </div>
              <div className="text-sm">
                <span className="font-medium text-blue-900">Early Access:</span>
                <span className="text-blue-800 ml-1">
                  Withdraw upto 60% of your balance upto ₹50,000.
                </span>
                <button className="text-blue-600 font-medium ml-1 hover:underline">
                  Learn More
                </button>
              </div>
            </div>
          </div>

          {/* Settlement Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              How much do you want to settle now?
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                ₹
              </span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 text-lg font-medium h-12"
                placeholder="Enter amount"
                max={availableBalance}
              />
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">0.15% fees</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="text-blue-600 hover:text-blue-700 p-0 h-auto"
            >
              Show breakup
              <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {showBreakdown && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Settlement Amount</span>
                <span>{formatCurrency(parseFloat(amount) || 0)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Processing Fee (0.15%)</span>
                <span>-{formatCurrency(fee)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Net Amount</span>
                <span>{formatCurrency(netAmount)}</span>
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <Button
            onClick={handleConfirmSettlement}
            disabled={processing || !amount || parseFloat(amount) <= 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium"
          >
            {processing ? 'Processing...' : 'Confirm Settlement'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
