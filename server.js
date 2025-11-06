// Rider Fleet Management System - Backend (server.js)
// Single-file Express + Mongoose + JWT backend

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ====== Configuration ======
const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rider_fleet_db';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_change_me';
const PORT = process.env.PORT || 4000;

// ====== Mongoose Models ======
const { Schema } = mongoose;

const UserSchema = new Schema({
  username: { type: String, unique: true, required: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'rider'], required: true, default: 'rider' },
  riderProfile: { type: Schema.Types.ObjectId, ref: 'RiderProfile', default: null },
}, { timestamps: true });

const RiderProfileSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  phone: { type: String, unique: true, required: true },
  vehicleNumber: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Inactive' },
  currentAssignment: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
}, { timestamps: true });

const CompanySchema = new Schema({
  name: { type: String, required: true, unique: true },
  logoUrl: { type: String, default: '' },
}, { timestamps: true });

const RiderProgressSchema = new Schema({
  rider: { type: Schema.Types.ObjectId, ref: 'RiderProfile', required: true },
  date: { type: Date, required: true, default: Date.now },
  deliveriesCompleted: { type: Number, default: 0 },
  hoursWorked: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const RiderProfile = mongoose.model('RiderProfile', RiderProfileSchema);
const Company = mongoose.model('Company', CompanySchema);
const RiderProgress = mongoose.model('RiderProgress', RiderProgressSchema);

// ====== Helpers ======
function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

async function ensureSeedData() {
  // Ensure default companies exist
  const defaultCompanies = [
    { name: 'Unassigned', logoUrl: '' },
    { name: 'Zomato', logoUrl: '' },
    { name: 'Swiggy', logoUrl: '' },
    { name: 'Blinkit', logoUrl: '' },
  ];
  for (const c of defaultCompanies) {
    await Company.updateOne({ name: c.name }, { $setOnInsert: c }, { upsert: true });
  }

  // Ensure an admin exists
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    const hashed = await bcrypt.hash('admin123', 10);
    await User.create({ username: 'admin', password: hashed, role: 'admin' });
    console.log('Seeded default admin -> username: admin, password: admin123');
  }
}

// ====== Auth Middleware ======
function authRequired(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, role }
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

// ====== Routes ======
// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'username and password required' });
    const user = await User.findOne({ username }).populate('riderProfile');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = signToken(user);
    res.json({ token, role: user.role });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Login error' });
  }
});

// ====== Admin Endpoints ======
// Dashboard stats
app.get('/api/admin/stats', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const totalRiders = await RiderProfile.countDocuments();
    const activeRiders = await RiderProfile.countDocuments({ status: 'Active' });
    const inactiveRiders = await RiderProfile.countDocuments({ status: 'Inactive' });

    const perCompanyAgg = await RiderProfile.aggregate([
      { $group: { _id: '$currentAssignment', count: { $sum: 1 } } },
    ]);

    // Bring company names
    const companyIds = perCompanyAgg.map(x => x._id).filter(Boolean);
    const companies = await Company.find({ _id: { $in: companyIds } });
    const companyMap = companies.reduce((acc, c) => { acc[c._id] = c.name; return acc; }, {});

    const unassignedCount = perCompanyAgg.find(x => x._id === null)?.count || 0;

    const perCompany = [];
    for (const row of perCompanyAgg) {
      if (row._id) {
        perCompany.push({ company: companyMap[row._id] || 'Unknown', count: row.count });
      }
    }
    if (unassignedCount > 0) {
      perCompany.push({ company: 'Unassigned', count: unassignedCount });
    }

    res.json({ totalRiders, activeRiders, inactiveRiders, perCompany });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to load stats' });
  }
});

// Riders CRUD (list, create, update)
app.get('/api/admin/riders', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const riders = await RiderProfile.find().populate('currentAssignment').populate('user');
    res.json(riders);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch riders' });
  }
});

app.post('/api/admin/riders', authRequired, requireRole('admin'), async (req, res) => {
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

app.put('/api/admin/riders/:id', authRequired, requireRole('admin'), async (req, res) => {
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

// Companies CRUD (list, add, update)
app.get('/api/admin/companies', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const companies = await Company.find().sort({ name: 1 });
    res.json(companies);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch companies' });
  }
});

app.post('/api/admin/companies', authRequired, requireRole('admin'), async (req, res) => {
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

app.put('/api/admin/companies/:id', authRequired, requireRole('admin'), async (req, res) => {
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
app.post('/api/admin/progress', authRequired, requireRole('admin'), async (req, res) => {
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

// ====== Rider Endpoints ======
// My profile
app.get('/api/rider/me', authRequired, requireRole('rider'), async (req, res) => {
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

// My progress list and 30-day summary
app.get('/api/rider/progress', authRequired, requireRole('rider'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.riderProfile) return res.status(404).json({ message: 'Profile not found' });

    const items = await RiderProgress.find({ rider: user.riderProfile }).sort({ date: -1 });

    // 30 day window
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

// ====== Startup ======
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
