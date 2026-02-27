
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { hostelStayPackageService, StayPackage } from '@/api/hostelStayPackageService';
import { formatCurrency } from '@/utils/currency';
import { CheckCircle, ChevronDown, ChevronUp, Tag } from 'lucide-react';

interface StayDurationPackagesProps {
  hostelId: string;
  monthlyPrice: number;
  selectedPackage: StayPackage | null;
  onSelectPackage: (pkg: StayPackage) => void;
}

export const StayDurationPackages: React.FC<StayDurationPackagesProps> = ({
  hostelId,
  monthlyPrice,
  selectedPackage,
  onSelectPackage,
}) => {
  const [packages, setPackages] = useState<StayPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await hostelStayPackageService.getPackages(hostelId);
        setPackages(data);
        // Auto-select base package
        if (data.length > 0 && !selectedPackage) {
          onSelectPackage(data[0]);
        }
      } catch (err) {
        console.error('Error fetching stay packages:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, [hostelId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (packages.length === 0) return null;

  const getDiscountedPrice = (pkg: StayPackage) => {
    return Math.round(monthlyPrice * (1 - pkg.discount_percentage / 100));
  };

  const getSavingsPerMonth = (pkg: StayPackage) => {
    return monthlyPrice - getDiscountedPrice(pkg);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Choose Your Stay Duration
      </h3>
      
      {packages.map((pkg) => {
        const isSelected = selectedPackage?.id === pkg.id;
        const discountedPrice = getDiscountedPrice(pkg);
        const savings = getSavingsPerMonth(pkg);
        const isExpanded = expandedId === pkg.id;

        return (
          <Card
            key={pkg.id}
            onClick={() => onSelectPackage(pkg)}
            className={`relative cursor-pointer transition-all p-4 ${
              isSelected
                ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                : 'hover:border-primary/50'
            }`}
          >
            {/* Savings badge */}
            {savings > 0 && (
              <Badge className="absolute -top-2 right-3 bg-green-600 text-white text-[10px] px-2">
                <Tag className="h-3 w-3 mr-1" />
                SAVE {formatCurrency(savings)}/MONTH
              </Badge>
            )}

            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                }`}>
                  {isSelected && <CheckCircle className="h-3.5 w-3.5 text-primary-foreground" />}
                </div>
                <div>
                  <p className="font-semibold text-sm">{pkg.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {pkg.min_months === 1 ? 'No minimum stay' : `Min ${pkg.min_months} months`}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold text-base">
                  {formatCurrency(discountedPrice)}
                  <span className="text-xs font-normal text-muted-foreground">/mo</span>
                </p>
                {savings > 0 && (
                  <p className="text-xs text-muted-foreground line-through">
                    {formatCurrency(monthlyPrice)}
                  </p>
                )}
              </div>
            </div>

            {/* Expandable details */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedId(isExpanded ? null : pkg.id);
              }}
              className="flex items-center gap-1 text-xs text-primary mt-2"
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {isExpanded ? 'Hide Details' : 'View Details'}
            </button>

            {isExpanded && (
              <div className="mt-3 pt-3 border-t space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Security Deposit</span>
                  <span className="font-medium text-foreground">
                    {pkg.deposit_months} month{pkg.deposit_months !== 1 ? 's' : ''} rent
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Lock-in Period</span>
                  <span className="font-medium text-foreground">
                    {pkg.lock_in_months === 0 ? 'None' : `${pkg.lock_in_months} months`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Notice Period</span>
                  <span className="font-medium text-foreground">
                    {pkg.notice_months} month{pkg.notice_months !== 1 ? 's' : ''}
                  </span>
                </div>
                {pkg.description && (
                  <p className="pt-1 text-muted-foreground italic">{pkg.description}</p>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};
