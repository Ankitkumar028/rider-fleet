import express from 'express';
import { Partnership } from '../models/Partnership.js';

const router = express.Router();

router.get('/partnerships', async (req, res) => {
  try {
    const ps = await Partnership.find().sort({ createdAt: -1 });
    res.json(ps);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to load partnerships' });
  }
});

export default router;
