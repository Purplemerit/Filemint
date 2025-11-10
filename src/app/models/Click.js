import mongoose from 'mongoose';

const ClickSchema = new mongoose.Schema({
  toolName: {
    type: String,
    required: true,
    index: true,
  },
  element: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  page: {
    type: String,
    required: true,
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
ClickSchema.index({ timestamp: -1 });
ClickSchema.index({ toolName: 1, timestamp: -1 });

export default mongoose.models.Click || mongoose.model('Click', ClickSchema);