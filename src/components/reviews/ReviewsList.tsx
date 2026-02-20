
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';

interface Review {
  _id: string;
  userId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  rating: number;
  title?: string;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

interface ReviewsListProps {
  reviews: Review[];
  isLoading: boolean;
  onApprove?: (reviewId: string) => void;
  onDelete?: (reviewId: string) => void;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({
  reviews,
  isLoading,
  onApprove,
  onDelete
}) => {
  const { user } = useAuth();
  
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
      <div style={{height:'30rem', overflow:"scroll"}}>

        {reviews.map((review) => (
          <Card key={review._id} className={!review.isApproved ? "border-dashed opacity-75" : ""}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={review?.userId?.avatar} alt={review.userId?.name} />
                    <AvatarFallback>
                      {review?.userId?.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{review?.userId?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(review?.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review?.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  {!review.isApproved && (
                    <Badge variant="outline" className="ml-2 text-muted-foreground">
                      Pending Approval
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {review?.title && <p className="font-medium mb-1">{review?.title}</p>}
              <p className="text-sm text-muted-foreground">{review?.comment}</p>
              
              {/* Admin or Hostel Manager Controls */}
              {(user?.role === 'admin' || user?.role === 'hostel_manager') && (
                <div className="flex gap-2 mt-4">
                  {!review?.isApproved && onApprove && (
                    <Button size="sm" variant="outline" onClick={() => onApprove(review._id)}>
                      Approve
                    </Button>
                  )}
                  {onDelete && (
                    <Button size="sm" variant="outline" className="text-red-500" onClick={() => onDelete(review._id)}>
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
