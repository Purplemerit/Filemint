import mongoose from 'mongoose';

const PageViewSchema = new mongoose.Schema({
  page: {
    type: String,
    required: true,
    index: true,
  },
  ip: {
    type: String,
    default: 'unknown',
  },
  userAgent: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Index for faster queries
PageViewSchema.index({ timestamp: -1 });
PageViewSchema.index({ page: 1, timestamp: -1 });

export default mongoose.models.PageView || mongoose.model('PageView', PageViewSchema);