import mongoose from 'mongoose';

const { Schema } = mongoose;

const UserSchema = new Schema({
  username: { type: String, unique: true, required: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'rider'], required: true, default: 'rider' },
  riderProfile: { type: Schema.Types.ObjectId, ref: 'RiderProfile', default: null },
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);
