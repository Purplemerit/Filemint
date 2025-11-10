import mongoose from 'mongoose';

const ToolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  totalVisits: {
    type: Number,
    default: 0,
  },
  totalUsers: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

export default mongoose.models.Tool || mongoose.model('Tool', ToolSchema);