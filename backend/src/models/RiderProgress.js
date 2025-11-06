import mongoose from 'mongoose';

const { Schema } = mongoose;

const RiderProgressSchema = new Schema({
  rider: { type: Schema.Types.ObjectId, ref: 'RiderProfile', required: true },
  date: { type: Date, required: true, default: Date.now },
  deliveriesCompleted: { type: Number, default: 0 },
  hoursWorked: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
}, { timestamps: true });

export const RiderProgress = mongoose.model('RiderProgress', RiderProgressSchema);
