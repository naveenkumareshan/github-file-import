
import axios from './axiosConfig';

interface ReviewData {
  entityType: 'Cabin' | 'Hostel';
  entityId: string;
  rating: number;
  title?: string;
  comment: string;
}

interface ReviewResponse {
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
}

export const reviewsService = {
  getReviews: async (entityType?: string, entityId?: string, approved?: boolean, page?: number, limit?: number) => {
    const queryParams = new URLSearchParams();
    if (entityType) queryParams.append('entityType', entityType);
    if (entityId) queryParams.append('entityId', entityId);
    if (approved !== undefined) queryParams.append('approved', String(approved));
    if (page) queryParams.append('page', String(page));
    if (limit) queryParams.append('limit', String(limit));

    const response = await axios.get(`/reviews?${queryParams.toString()}`);
    return response.data;
  },

  getAdminReviews: async (entityType?: string, entityId?: string, approved?: boolean, page?: number, limit?: number) => {
    const queryParams = new URLSearchParams();
    if (entityType) queryParams.append('entityType', entityType);
    if (entityId) queryParams.append('entityId', entityId);
    if (approved !== undefined) queryParams.append('approved', String(approved));
    if (page) queryParams.append('page', String(page));
    if (limit) queryParams.append('limit', String(limit));

    const response = await axios.get(`/reviews/list/admin?${queryParams.toString()}`);
    return response.data;
  },
  
  
  getReview: async (reviewId: string) => {
    const response = await axios.get(`/reviews/${reviewId}`);
    return response.data;
  },
  
  createReview: async (reviewData: ReviewData) => {
    const response = await axios.post('/reviews', reviewData);
    return response.data;
  },
  
  updateReview: async (reviewId: string, reviewData: Partial<ReviewData>) => {
    const response = await axios.put(`/reviews/${reviewId}`, reviewData);
    return response.data;
  },
  
  deleteReview: async (reviewId: string) => {
    const response = await axios.delete(`/reviews/${reviewId}`);
    return response.data;
  },
  
  approveReview: async (reviewId: string) => {
    const response = await axios.put(`/reviews/${reviewId}/approve`);
    return response.data;
  },
  
  getEntityRating: async (entityType: string, entityId: string) => {
    const response = await axios.get(`/reviews/rating/${entityType}/${entityId}`);
    return response.data;
  },
  
  getUserReviews: async () => {
    const response = await axios.get('/reviews/user/me');
    return response.data;
  }
};
