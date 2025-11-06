import mongoose from 'mongoose';

const { Schema } = mongoose;

const RiderProfileSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  phone: { type: String, unique: true, required: true },
  vehicleNumber: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Inactive' },
  currentAssignment: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
}, { timestamps: true });

export const RiderProfile = mongoose.model('RiderProfile', RiderProfileSchema);
