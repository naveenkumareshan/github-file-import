import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Search, Edit, Trash2, CheckCircle, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editForm, setEditForm] = useState({ title: '', comment: '', rating: 0 });
  const module = searchParams.get('module');
 
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const approved = statusFilter === 'approved' ? true : statusFilter === 'pending' ? false : undefined;
      let reviewmodule = 'Cabin';
      if (module == 'Hostel') {
        reviewmodule = 'Hostel';
      }
      const reviewsResponse = await reviewsService.getAdminReviews(
        reviewmodule, 
        selectedCabin !== 'all' ? selectedCabin : undefined, 
        approved,
        currentPage,
        itemsPerPage
      );
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
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      const response = await reviewsService.approveReview(reviewId);
      if (response.success) {
        toast({ title: "Review approved", description: "The review is now published" });
        fetchData();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to approve review", variant: "destructive" });
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      const response = await reviewsService.deleteReview(reviewId);
      if (response.success) {
        toast({ title: "Review deleted", description: "The review has been removed" });
        fetchData();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete review", variant: "destructive" });
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setEditForm({ title: review.title || '', comment: review.comment, rating: review.rating });
  };

  const handleUpdateReview = async () => {
    if (!editingReview) return;
    try {
      const response = await reviewsService.updateReview(editingReview._id, editForm);
      if (response.success) {
        toast({ title: "Review updated", description: "The review has been updated successfully" });
        setEditingReview(null);
        fetchData();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update review", variant: "destructive" });
    }
  };

  const getTabCount = (status: string) => totalCount;

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleItemsPerPageChange = (items: string) => {
    setItemsPerPage(parseInt(items));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{module} Reviews</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Moderate and manage customer reviews</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Search Reviews</label>
              <div className="relative">
                <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by name or comment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{module}</label>
              <Select value={selectedCabin} onValueChange={setSelectedCabin}>
                <SelectTrigger className="h-8 text-sm">
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
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-sm">
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
          <TabsTrigger value="all">All ({getTabCount('all')})</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-2/3" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <Star className="h-8 w-8 opacity-20" />
                  <p className="text-sm font-medium">No reviews found</p>
                  <p className="text-xs">Try adjusting your filters</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* Items per page selector */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Items per page:</span>
                  <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                    <SelectTrigger className="w-16 h-7 text-xs">
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
                <div className="text-xs text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
                </div>
              </div>

              {reviews.map((review) => (
                <Card key={review._id} className={`border-border/60 shadow-sm ${!review.isApproved ? "border-l-2 border-l-amber-400" : ""}`}>
                  <CardHeader className="py-2 px-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={review.userData?.profilePicture} alt={review.userData?.name} />
                          <AvatarFallback className="text-xs">
                            {review.userData?.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{review.userData?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                            />
                          ))}
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${
                          review.isApproved
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {review.isApproved ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          {review.isApproved ? 'Published' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="px-4 pb-3 pt-0">
                    {review.entityData && (
                      <p className="text-xs font-medium text-muted-foreground mb-1">{review.entityData?.name}</p>
                    )}
                    {review.title && (
                      <p className="text-sm font-medium mb-1">{review.title}</p>
                    )}
                    <p className="text-xs text-muted-foreground mb-3">{review.comment}</p>
                    
                    <div className="flex gap-1.5">
                      {!review.isApproved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(review._id)}
                          className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                      )}
                      
                      <Dialog>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(review)}
                          className="h-7 text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </Dialog>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(review._id)}
                        className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="h-7 text-xs">
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </Button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return (
                        <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => handlePageChange(page)} className="h-7 w-7 text-xs p-0">
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="h-7 text-xs">
                    Next <ChevronRight className="h-3.5 w-3.5" />
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
                    <button key={star} type="button" onClick={() => setEditForm(prev => ({ ...prev, rating: star }))} className="focus:outline-none">
                      <Star className={`h-6 w-6 ${star <= editForm.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" value={editForm.title} onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Review title" />
              </div>
              <div>
                <Label htmlFor="edit-comment">Comment</Label>
                <Textarea id="edit-comment" value={editForm.comment} onChange={(e) => setEditForm(prev => ({ ...prev, comment: e.target.value }))} placeholder="Review comment" rows={4} />
              </div>
              <Button onClick={handleUpdateReview} className="w-full">Update Review</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ReviewManagement;
