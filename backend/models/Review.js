
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  entityType: {
    type: String,
    enum: ['Cabin', 'Hostel'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'entityType'
  },
  rating: {
    type: Number,
    required: [true, 'Please add a rating between 1-5'],
    min: 1,
    max: 5
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Please add a comment'],
    maxlength: [500, 'Comment cannot be more than 500 characters']
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent user from submitting more than one review per cabin/hostel
ReviewSchema.index({ userId: 1, entityId: 1 }, { unique: true });
ReviewSchema.statics.getAverageRating = async function (entityId) {
  const result = await this.aggregate([
    { $match: { entityId: mongoose.Types.ObjectId(entityId) } },
    {
      $group: {
        _id: '$entityId',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  return result[0] || { averageRating: 0, reviewCount: 0 };
};


module.exports = mongoose.model('Review', ReviewSchema);
