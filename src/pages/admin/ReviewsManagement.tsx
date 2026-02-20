import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Star, Search, Filter, Edit, Trash2, CheckCircle, XCircle, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { reviewsService } from '@/api/reviewsService';
import { cabinsService } from '@/api/cabinsService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';
import { useSearchParams } from 'react-router-dom';

interface Review {
  _id: string;
  userId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  entityType: 'Cabin' | 'Hostel';
  entityId: string;
  rating: number;
  title?: string;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  userData?: {
    name: string;
    profilePicture?: string;
    [key: string]: unknown;
  };
  entityData?: {
    name: string;
    [key: string]: unknown;
  };
}

interface Cabin {
  _id: string;
  name: string;
  location: string;
}

const ReviewManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCabin, setSelectedCabin] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editForm, setEditForm] = useState({ title: '', comment: '', rating: 0 });
  const module = searchParams.get('module');
 
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, [selectedCabin, statusFilter, currentPage, itemsPerPage, module]);

  const hasFetched = useRef(false);

    // useEffect(() => {
    // if (hasFetched.current) return;
    // hasFetched.current = true;
    // fetchData();
    // }, [selectedCabin, statusFilter, currentPage, itemsPerPage, module]);


  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch reviews based on filters with pagination
      const approved = statusFilter === 'approved' ? true : statusFilter === 'pending' ? false : undefined;
      let reviewmodule = 'Cabin';

      if(module =='Hostel'){
        reviewmodule = 'Hostel'
      }
      const reviewsResponse = await reviewsService.getAdminReviews(
        reviewmodule, 
        selectedCabin !== 'all' ? selectedCabin : undefined, 
        approved,
        currentPage,
        itemsPerPage
      );
      
      // Fetch cabins for filter dropdown
      const cabinsResponse = await cabinsService.getAllCabinsWithOutFilter();
      
      
      if (reviewsResponse.success) {
        setReviews(reviewsResponse.data || []);
        setTotalCount(reviewsResponse.total || 0);
        setTotalPages(reviewsResponse.totalPages || 0);
      }
      
      if (cabinsResponse.success) {
        setCabins(cabinsResponse.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const handleApprove = async (reviewId: string) => {
    try {
      const response = await reviewsService.approveReview(reviewId);
      if (response.success) {
        toast({
          title: "Review approved",
          description: "The review is now published"
        });
        fetchData();
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

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    try {
      const response = await reviewsService.deleteReview(reviewId);
      if (response.success) {
        toast({
          title: "Review deleted",
          description: "The review has been removed"
        });
        fetchData();
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

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setEditForm({
      title: review.title || '',
      comment: review.comment,
      rating: review.rating
    });
  };

  const handleUpdateReview = async () => {
    if (!editingReview) return;
    
    try {
      const response = await reviewsService.updateReview(editingReview._id, editForm);
      if (response.success) {
        toast({
          title: "Review updated",
          description: "The review has been updated successfully"
        });
        setEditingReview(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating review:', error);
      toast({
        title: "Error",
        description: "Failed to update review",
        variant: "destructive"
      });
    }
  };

  const getTabCount = (status: string) => {
    switch (status) {
      default:
        return totalCount;
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: string) => {
    setItemsPerPage(parseInt(items));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Admin Panel / Reviews</p>
          <h1 className="text-lg font-semibold">{module} Reviews</h1>
          <p className="text-sm text-muted-foreground">Moderate and manage customer reviews</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Reviews</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by customer name, title, or comment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="cabin-filter">{module}</Label>
              <Select value={selectedCabin} onValueChange={setSelectedCabin}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cabin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reading Rooms</SelectItem>
                  {cabins.map(cabin => (
                    <SelectItem key={cabin._id} value={cabin._id}>
                      {cabin.name} - {(cabin.location as any)?.area?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">
            All Reviews ({getTabCount('all')})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No reviews found matching your criteria.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Items per page selector */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Label htmlFor="items-per-page">Items per page:</Label>
                  <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} reviews
                </div>
              </div>

              {reviews.map((review) => (
                <Card key={review._id} className={!review.isApproved ? "border-orange-200 bg-orange-50/50" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={review.userData?.profilePicture} alt={review.userData?.name} />
                          <AvatarFallback>
                            {review.userData?.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{review.userData?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
                        <Badge variant={review.isApproved ? "default" : "secondary"}>
                          {review.isApproved ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Published
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Pending
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>

                    {review.entityData && (
                      <h4 className="font-medium mb-2">{review.entityData?.name}</h4>
                    )}
                    {review.title && (
                      <h4 className="font-medium mb-2">{review.title}</h4>
                    )}
                    <p className="text-muted-foreground mb-4">{review.comment}</p>
                    
                    <div className="flex gap-2">
                      {!review.isApproved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(review._id)}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      )}
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(review)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Review</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Rating</Label>
                              <div className="flex items-center space-x-1 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setEditForm(prev => ({ ...prev, rating: star }))}
                                    className="focus:outline-none"
                                  >
                                    <Star
                                      className={`h-6 w-6 ${
                                        star <= editForm.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor="edit-title">Title</Label>
                              <Input
                                id="edit-title"
                                value={editForm.title}
                                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Review title"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="edit-comment">Comment</Label>
                              <Textarea
                                id="edit-comment"
                                value={editForm.comment}
                                onChange={(e) => setEditForm(prev => ({ ...prev, comment: e.target.value }))}
                                placeholder="Review comment"
                                rows={4}
                              />
                            </div>
                            
                            <Button onClick={handleUpdateReview} className="w-full">
                              Update Review
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(review._id)}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="w-10"
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {editingReview && (
        <Dialog open={!!editingReview} onOpenChange={() => setEditingReview(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Review</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Rating</Label>
                <div className="flex items-center space-x-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, rating: star }))}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= editForm.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Review title"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-comment">Comment</Label>
                <Textarea
                  id="edit-comment"
                  value={editForm.comment}
                  onChange={(e) => setEditForm(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Review comment"
                  rows={4}
                />
              </div>
              
              <Button onClick={handleUpdateReview} className="w-full">
                Update Review
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ReviewManagement;