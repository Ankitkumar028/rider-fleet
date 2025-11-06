import mongoose from 'mongoose';

const { Schema } = mongoose;

const PartnershipSchema = new Schema({
  name: { type: String, required: true, unique: true },
  url: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
}, { timestamps: true });

export const Partnership = mongoose.model('Partnership', PartnershipSchema);
