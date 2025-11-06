import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import { MONGO_URI, PORT } from './config/env.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import riderRoutes from './routes/rider.js';
import publicRoutes from './routes/public.js';
import { ensureSeedData } from './seed.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rider', riderRoutes);
app.use('/api/public', publicRoutes);

async function start() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'rider_fleet_db' });
    console.log('MongoDB connected');
    await ensureSeedData();
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } catch (e) {
    console.error('Startup error', e);
    process.exit(1);
  }
}

start();
