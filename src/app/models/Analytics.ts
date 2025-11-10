import mongoose from 'mongoose';

const AnalyticsSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  totalVisitors: { type: Number, default: 0 },
  pageViews: { type: Number, default: 0 },
  totalClicks: { type: Number, default: 0 },
  uniqueIps: [String],
}, { timestamps: true });

export default mongoose.models.Analytics || mongoose.model('Analytics', AnalyticsSchema);