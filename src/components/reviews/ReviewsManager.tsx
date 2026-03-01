
import React, { useState, useEffect } from 'react';
import { ReviewsList } from './ReviewsList';
import { reviewsService, Review } from '@/api/reviewsService';
import { useToast } from '@/hooks/use-toast';

interface ReviewsManagerProps {
  entityType: 'Cabin' | 'Hostel';
  entityId: string;
  showForm?: boolean;
}

export const ReviewsManager: React.FC<ReviewsManagerProps> = ({
  entityType,
  entityId,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewsService.getApprovedReviews(entityId);
      if (response.success) {
        setReviews(response.data as unknown as Review[]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [entityId]);

  return (
    <div className="space-y-6">
      <ReviewsList
        reviews={reviews}
        isLoading={loading}
      />
    </div>
  );
};
