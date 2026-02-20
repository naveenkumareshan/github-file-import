
import React, { useState, useEffect } from 'react';
import { ReviewForm } from './ReviewForm';
import { ReviewsList } from './ReviewsList';
import { reviewsService } from '@/api/reviewsService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '../ui/button';

interface ReviewsManagerProps {
  entityType: 'Cabin' | 'Hostel';
  entityId: string;
  showForm?: boolean;
}

export const ReviewsManager: React.FC<ReviewsManagerProps> = ({
  entityType,
  entityId,
  showForm = true
}) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [writeReview, setWriteReview] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("approved");
  const { toast } = useToast();
  const { user } = useAuth();
  
  const fetchReviews = async () => {
    try {
      setLoading(true);
      
      // Determine if we should show pending reviews
      const isManager = user?.role === 'admin' || user?.role === 'hostel_manager';
      const approved = activeTab === "approved" ? true : undefined;
      
      // If not manager, only show approved reviews
      const queryApproved = isManager ? approved : true;
      
      const response = await reviewsService.getReviews(entityType, entityId, queryApproved);
      
      if (response.success) {
        setReviews(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to fetch reviews');
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
  }, [entityId, activeTab]);

  const handleReviewSubmitted = () => {
    setWriteReview(false)
    fetchReviews();
  };

  const handleApproveReview = async (reviewId: string) => {
    try {
      const response = await reviewsService.approveReview(reviewId);
      
      if (response.success) {
        toast({
          title: "Review approved",
          description: "The review is now published"
        });
        fetchReviews();
      } else {
        throw new Error(response.message || 'Failed to approve review');
      }
    } catch (error) {
      console.error('Error approving review:', error);
      toast({
        title: "Error",
        description: "Failed to approve review",
        variant: "destructive"
      });
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }
    
    try {
      const response = await reviewsService.deleteReview(reviewId);
      
      if (response.success) {
        toast({
          title: "Review deleted",
          description: "The review has been removed"
        });
        fetchReviews();
      } else {
        throw new Error(response.message || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive"
      });
    }
  };

  const isManagerView = user?.role === 'admin' || user?.role === 'hostel_manager';
  
  return (
    <div className="space-y-6">
      {writeReview && user && (
        <ReviewForm 
          entityType={entityType} 
          entityId={entityId}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    {!writeReview && user && (
        <Button onClick={()=>setWriteReview(true)}>Give Feedback</Button>
      )}
      <div>
        {isManagerView && (
          <Tabs defaultValue="approved" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        
        <div className="mt-4">
          <ReviewsList
            reviews={reviews}
            isLoading={loading}
            onApprove={isManagerView ? handleApproveReview : undefined}
            onDelete={isManagerView ? handleDeleteReview : undefined}
          />
        </div>
      </div>
    </div>
  );
};
