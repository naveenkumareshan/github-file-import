
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Review } from '@/api/reviewsService';

interface ReviewsListProps {
  reviews: Review[];
  isLoading: boolean;
  showActions?: boolean;
  onApprove?: (reviewId: string) => void;
  onReject?: (reviewId: string) => void;
  onDelete?: (reviewId: string) => void;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({
  reviews,
  isLoading,
  showActions = false,
  onApprove,
  onReject,
  onDelete
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          No reviews yet. Be the first to leave a review!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-medium mb-4">Customer Reviews</h3>
      <div style={{ height: '30rem', overflow: 'scroll' }}>
        {reviews.map((review) => (
          <Card key={review.id} className={review.status !== 'approved' ? "border-dashed opacity-75 mb-3" : "mb-3"}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={review.profiles?.profile_picture || undefined} alt={review.profiles?.name || ''} />
                    <AvatarFallback>
                      {(review.profiles?.name || '?').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{review.profiles?.name || 'Anonymous'}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  {review.status !== 'approved' && (
                    <Badge variant="outline" className="ml-2 text-muted-foreground capitalize">
                      {review.status}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {review.title && <p className="font-medium mb-1">{review.title}</p>}
              <p className="text-sm text-muted-foreground">{review.comment}</p>
              
              {showActions && (
                <div className="flex gap-2 mt-4">
                  {review.status !== 'approved' && onApprove && (
                    <Button size="sm" variant="outline" onClick={() => onApprove(review.id)}>
                      Approve
                    </Button>
                  )}
                  {review.status !== 'rejected' && onReject && (
                    <Button size="sm" variant="outline" onClick={() => onReject(review.id)}>
                      Reject
                    </Button>
                  )}
                  {onDelete && (
                    <Button size="sm" variant="outline" className="text-red-500" onClick={() => onDelete(review.id)}>
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
