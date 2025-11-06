import bcrypt from 'bcryptjs';
import { Company } from './models/Company.js';
import { User } from './models/User.js';
import { Partnership } from './models/Partnership.js';

export async function ensureSeedData() {
  const defaultCompanies = [
    { name: 'Unassigned', logoUrl: '' },
    { name: 'Zomato', logoUrl: '' },
    { name: 'Swiggy', logoUrl: '' },
    { name: 'Blinkit', logoUrl: '' },
  ];
  for (const c of defaultCompanies) {
    await Company.updateOne({ name: c.name }, { $setOnInsert: c }, { upsert: true });
  }

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    const hashed = await bcrypt.hash('admin123', 10);
    await User.create({ username: 'admin', password: hashed, role: 'admin' });
    console.log('Seeded default admin -> username: admin, password: admin123');
  }

  // Seed example partnership: Delhivery
  await Partnership.updateOne(
    { name: 'Delhivery' },
    { $setOnInsert: { name: 'Delhivery', url: 'https://www.delhivery.com', logoUrl: '' } },
    { upsert: true }
  );
}
