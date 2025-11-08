import mongoose from 'mongoose';

const { Schema } = mongoose;

const PartnershipSchema = new Schema({
  name: { type: String, required: true, unique: true },
  url: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  visible: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

export const Partnership = mongoose.model('Partnership', PartnershipSchema);
