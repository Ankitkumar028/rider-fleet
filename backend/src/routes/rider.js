import express from 'express';
import mongoose from 'mongoose';
import { authRequired, requireRole } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { RiderProgress } from '../models/RiderProgress.js';

const router = express.Router();

router.use(authRequired, requireRole('rider'));

router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'riderProfile',
      populate: { path: 'currentAssignment' },
    });
    if (!user || !user.riderProfile) return res.status(404).json({ message: 'Profile not found' });
    res.json(user.riderProfile);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to load profile' });
  }
});

router.get('/progress', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.riderProfile) return res.status(404).json({ message: 'Profile not found' });

    const items = await RiderProgress.find({ rider: user.riderProfile }).sort({ date: -1 });

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const recent = await RiderProgress.aggregate([
      { $match: { rider: new mongoose.Types.ObjectId(user.riderProfile), date: { $gte: since } } },
      { $group: { _id: null, totalDeliveries: { $sum: '$deliveriesCompleted' }, totalEarnings: { $sum: '$earnings' } } },
    ]);

    const summary = {
      totalDeliveries: recent[0]?.totalDeliveries || 0,
      totalEarnings: recent[0]?.totalEarnings || 0,
    };

    res.json({ items, summary });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to load progress' });
  }
});

export default router;
