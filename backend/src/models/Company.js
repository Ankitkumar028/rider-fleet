import mongoose from 'mongoose';

const { Schema } = mongoose;

const CompanySchema = new Schema({
  name: { type: String, required: true, unique: true },
  logoUrl: { type: String, default: '' },
}, { timestamps: true });

export const Company = mongoose.model('Company', CompanySchema);
