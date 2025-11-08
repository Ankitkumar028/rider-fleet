import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { authRequired, requireRole } from '../middleware/auth.js';
import { RiderProfile } from '../models/RiderProfile.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { RiderProgress } from '../models/RiderProgress.js';
import { Partnership } from '../models/Partnership.js';

const router = express.Router();

// Apply admin role guard
router.use(authRequired, requireRole('admin'));

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalRiders = await RiderProfile.countDocuments();
    const activeRiders = await RiderProfile.countDocuments({ status: 'Active' });
    const inactiveRiders = await RiderProfile.countDocuments({ status: 'Inactive' });

    const perCompanyAgg = await RiderProfile.aggregate([
      { $group: { _id: '$currentAssignment', count: { $sum: 1 } } },
    ]);

    const companyIds = perCompanyAgg.map(x => x._id).filter(Boolean);
    const companies = await Company.find({ _id: { $in: companyIds } });
    const companyMap = companies.reduce((acc, c) => { acc[c._id] = c.name; return acc; }, {});
    const unassignedCount = perCompanyAgg.find(x => x._id === null)?.count || 0;

    const perCompany = [];
    for (const row of perCompanyAgg) {
      if (row._id) perCompany.push({ company: companyMap[row._id] || 'Unknown', count: row.count });
    }
    if (unassignedCount > 0) perCompany.push({ company: 'Unassigned', count: unassignedCount });

    res.json({ totalRiders, activeRiders, inactiveRiders, perCompany });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to load stats' });
  }
});

// Riders CRUD
router.get('/riders', async (req, res) => {
  try {
    const riders = await RiderProfile.find().populate('currentAssignment').populate('user');
    res.json(riders);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch riders' });
  }
});

router.post('/riders', async (req, res) => {
  try {
    const { username, defaultPassword = 'rider123', fullName, phone, vehicleNumber, status = 'Inactive', currentAssignment } = req.body;
    if (!username || !fullName || !phone || !vehicleNumber) return res.status(400).json({ message: 'Missing required fields' });

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: 'Username already exists' });

    const hashed = await bcrypt.hash(defaultPassword, 10);
    const user = await User.create({ username, password: hashed, role: 'rider' });

    const rider = await RiderProfile.create({
      user: user._id,
      fullName,
      phone,
      vehicleNumber,
      status,
      currentAssignment: currentAssignment || null,
    });

    await User.updateOne({ _id: user._id }, { $set: { riderProfile: rider._id } });

    const populated = await RiderProfile.findById(rider._id).populate('currentAssignment').populate('user');
    res.status(201).json(populated);
  } catch (e) {
    console.error(e);
    if (e.code === 11000) return res.status(400).json({ message: 'Duplicate key error (username or phone)' });
    res.status(500).json({ message: 'Failed to create rider' });
  }
});

router.put('/riders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, vehicleNumber, status, currentAssignment } = req.body;
    const update = { };
    if (fullName !== undefined) update.fullName = fullName;
    if (phone !== undefined) update.phone = phone;
    if (vehicleNumber !== undefined) update.vehicleNumber = vehicleNumber;
    if (status !== undefined) update.status = status;
    if (currentAssignment !== undefined) update.currentAssignment = currentAssignment || null;

    const rider = await RiderProfile.findByIdAndUpdate(id, update, { new: true }).populate('currentAssignment').populate('user');
    if (!rider) return res.status(404).json({ message: 'Rider not found' });
    res.json(rider);
  } catch (e) {
    console.error(e);
    if (e.code === 11000) return res.status(400).json({ message: 'Duplicate key error (phone)' });
    res.status(500).json({ message: 'Failed to update rider' });
  }
});

// Companies CRUD
router.get('/companies', async (req, res) => {
  try {
    const companies = await Company.find().sort({ name: 1 });
    res.json(companies);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch companies' });
  }
});

router.post('/companies', async (req, res) => {
  try {
    const { name, logoUrl = '' } = req.body;
    if (!name) return res.status(400).json({ message: 'name required' });
    const c = await Company.create({ name, logoUrl });
    res.status(201).json(c);
  } catch (e) {
    console.error(e);
    if (e.code === 11000) return res.status(400).json({ message: 'Company name must be unique' });
    res.status(500).json({ message: 'Failed to create company' });
  }
});

router.put('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, logoUrl } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (logoUrl !== undefined) update.logoUrl = logoUrl;
    const c = await Company.findByIdAndUpdate(id, update, { new: true });
    if (!c) return res.status(404).json({ message: 'Company not found' });
    res.json(c);
  } catch (e) {
    console.error(e);
    if (e.code === 11000) return res.status(400).json({ message: 'Company name must be unique' });
    res.status(500).json({ message: 'Failed to update company' });
  }
});

// Progress add
router.post('/progress', async (req, res) => {
  try {
    const { riderId, date, deliveriesCompleted = 0, hoursWorked = 0, earnings = 0 } = req.body;
    if (!riderId) return res.status(400).json({ message: 'riderId required' });
    const progress = await RiderProgress.create({
      rider: riderId,
      date: date ? new Date(date) : new Date(),
      deliveriesCompleted,
      hoursWorked,
      earnings,
    });
    const populated = await RiderProgress.findById(progress._id).populate('rider');
    res.status(201).json(populated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to add progress' });
  }
});

// Partnerships CRUD
router.get('/partnerships', async (req, res) => {
  try {
    const ps = await Partnership.find().sort({ createdAt: -1 });
    res.json(ps);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to fetch partnerships' }); }
});

router.post('/partnerships', async (req, res) => {
  try {
    const { name, url = '', logoUrl = '', visible = true, order = 0 } = req.body;
    if (!name) return res.status(400).json({ message: 'name required' });
    const p = await Partnership.create({ name, url, logoUrl, visible, order });
    res.status(201).json(p);
  } catch (e) {
    console.error(e);
    if (e.code === 11000) return res.status(400).json({ message: 'Partnership already exists' });
    res.status(500).json({ message: 'Failed to create partnership' });
  }
});

router.delete('/partnerships/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const p = await Partnership.findByIdAndDelete(id);
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to delete partnership' }); }
});

router.put('/partnerships/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, logoUrl, visible, order } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (url !== undefined) update.url = url;
    if (logoUrl !== undefined) update.logoUrl = logoUrl;
    if (visible !== undefined) update.visible = !!visible;
    if (order !== undefined) update.order = Number(order) || 0;
    const p = await Partnership.findByIdAndUpdate(id, update, { new: true });
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json(p);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to update partnership' });
  }
});

// Riders CSV export
router.get('/riders/export', async (req, res) => {
  try {
    const riders = await RiderProfile.find().populate('currentAssignment').populate('user');
    const header = ['Full Name','Phone','Vehicle Number','Status','Company','Username'];
    const rows = riders.map(r => [
      r.fullName,
      r.phone,
      r.vehicleNumber,
      r.status,
      r.currentAssignment?.name || 'Unassigned',
      r.user?.username || ''
    ]);
    const esc = (v) => {
      if (v == null) return '';
      const s = String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g,'""') + '"';
      return s;
    };
    const csv = [header, ...rows].map(row => row.map(esc).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="riders.csv"');
    res.send(csv);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to export riders' });
  }
});

export default router;
