import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
} from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [role, setRole] = useState(() => localStorage.getItem('role'));
  const login = (t, r) => {
    localStorage.setItem('token', t);
    localStorage.setItem('role', r);
    setToken(t);
    setRole(r);
  };
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setRole(null);
  };
  return { token, role, login, logout };
}

function useApi(token) {
  return useMemo(() => ({
    async get(path) {
      const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async post(path, body) {
      const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    async put(path, body) {
      const res = await fetch(`${API_BASE}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  }), [token]);
}

function ProtectedRoute({ children, allow }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" replace />;
  if (allow && role !== allow) return <Navigate to={role === 'admin' ? '/admin' : '/rider'} replace />;
  return children;
}

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Login failed');
      const data = await res.json();
      login(data.token, data.role);
      navigate(data.role === 'admin' ? '/admin' : '/rider', { replace: true });
    } catch (e) {
      setError(typeof e.message === 'string' ? e.message : 'Login error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-semibold mb-4 text-center">Rider Fleet Login</h1>
        {error ? <div className="mb-3 text-red-600 text-sm">{error}</div> : null}
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input className="w-full border rounded px-3 py-2 focus:outline-none focus:ring" value={username} onChange={(e)=>setUsername(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input type="password" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring" value={password} onChange={(e)=>setPassword(e.target.value)} />
          </div>
          <button className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">Login</button>
        </form>
      </div>
    </div>
  );
}

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Admin Portal</div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/admin" className="hover:underline">Dashboard</Link>
            <Link to="/admin/riders" className="hover:underline">Riders</Link>
            <Link to="/admin/companies" className="hover:underline">Companies</Link>
            <Link to="/admin/progress" className="hover:underline">Add Progress</Link>
            <button className="text-red-600" onClick={()=>{ logout(); navigate('/login'); }}>Logout</button>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const api = useApi(localStorage.getItem('token'));

  useEffect(() => {
    (async () => {
      try {
        const s = await api.get('/api/admin/stats');
        setStats(s);
      } catch (e) {
        setError('Failed to load stats');
      }
    })();
  }, []);

  if (error) return <div className="text-red-600 text-sm">{error}</div>;
  if (!stats) return <div>Loading...</div>;

  const maxCount = Math.max(1, ...stats.perCompany.map(x=>x.count));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm">Total Riders</div>
          <div className="text-2xl font-semibold">{stats.totalRiders}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm">Active Riders</div>
          <div className="text-2xl font-semibold text-green-600">{stats.activeRiders}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm">Inactive Riders</div>
          <div className="text-2xl font-semibold text-yellow-600">{stats.inactiveRiders}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <div className="font-semibold mb-4">Riders per Company</div>
        <div className="space-y-3">
          {stats.perCompany.length === 0 ? <div className="text-sm text-gray-500">No data</div> : null}
          {stats.perCompany.map((row) => (
            <div key={row.company}>
              <div className="flex justify-between text-sm mb-1">
                <span>{row.company}</span>
                <span>{row.count}</span>
              </div>
              <div className="w-full bg-gray-200 h-3 rounded">
                <div className="bg-indigo-600 h-3 rounded" style={{ width: `${(row.count/maxCount)*100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RidersPage() {
  const api = useApi(localStorage.getItem('token'));
  const [riders, setRiders] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', defaultPassword: 'rider123', fullName: '', phone: '', vehicleNumber: '', status: 'Inactive', currentAssignment: '' });
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setError('');
    try {
      const [rs, cs] = await Promise.all([
        api.get('/api/admin/riders'),
        api.get('/api/admin/companies'),
      ]);
      setRiders(rs);
      setCompanies(cs);
    } catch (e) {
      setError('Failed to load riders or companies');
    }
  };

  useEffect(() => { load(); }, []);

  const submitAdd = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, currentAssignment: form.currentAssignment || null };
      await api.post('/api/admin/riders', payload);
      setForm({ username: '', defaultPassword: 'rider123', fullName: '', phone: '', vehicleNumber: '', status: 'Inactive', currentAssignment: '' });
      await load();
    } catch (e) {
      setError('Failed to create rider');
    }
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      const payload = { fullName: editing.fullName, phone: editing.phone, vehicleNumber: editing.vehicleNumber, status: editing.status, currentAssignment: editing.currentAssignment?._id || editing.currentAssignment || null };
      await api.put(`/api/admin/riders/${editing._id}`, payload);
      setEditing(null);
      await load();
    } catch (e) {
      setError('Failed to update rider');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-4 rounded shadow">
        <div className="font-semibold mb-3">Add New Rider</div>
        <form className="space-y-3" onSubmit={submitAdd}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Username</label>
              <input className="w-full border rounded px-3 py-2" value={form.username} onChange={(e)=>setForm({...form, username: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Default Password</label>
              <input className="w-full border rounded px-3 py-2" value={form.defaultPassword} onChange={(e)=>setForm({...form, defaultPassword: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Full Name</label>
              <input className="w-full border rounded px-3 py-2" value={form.fullName} onChange={(e)=>setForm({...form, fullName: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Phone</label>
              <input className="w-full border rounded px-3 py-2" value={form.phone} onChange={(e)=>setForm({...form, phone: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Vehicle Number</label>
              <input className="w-full border rounded px-3 py-2" value={form.vehicleNumber} onChange={(e)=>setForm({...form, vehicleNumber: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Status</label>
              <select className="w-full border rounded px-3 py-2" value={form.status} onChange={(e)=>setForm({...form, status: e.target.value})}>
                <option>Inactive</option>
                <option>Active</option>
                <option>On Leave</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Current Assignment</label>
              <select className="w-full border rounded px-3 py-2" value={form.currentAssignment} onChange={(e)=>setForm({...form, currentAssignment: e.target.value})}>
                <option value="">Unassigned</option>
                {companies.map(c=> (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded">Create Rider</button>
        </form>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <div className="font-semibold mb-3">Riders</div>
        {error ? <div className="text-red-600 text-sm mb-2">{error}</div> : null}
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left bg-gray-100">
                <th className="p-2">Name</th>
                <th className="p-2">Phone</th>
                <th className="p-2">Status</th>
                <th className="p-2">Company</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {riders.map(r => (
                <tr key={r._id} className="border-t">
                  <td className="p-2">{r.fullName}</td>
                  <td className="p-2">{r.phone}</td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2">{r.currentAssignment?.name || 'Unassigned'}</td>
                  <td className="p-2">
                    <button className="text-indigo-600" onClick={()=> setEditing({ ...r })}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing ? (
        <div className="lg:col-span-2 bg-white p-4 rounded shadow">
          <div className="font-semibold mb-3">Edit Rider</div>
          <form className="grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={submitEdit}>
            <div>
              <label className="block text-sm mb-1">Full Name</label>
              <input className="w-full border rounded px-3 py-2" value={editing.fullName} onChange={(e)=>setEditing({...editing, fullName: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Phone</label>
              <input className="w-full border rounded px-3 py-2" value={editing.phone} onChange={(e)=>setEditing({...editing, phone: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Vehicle Number</label>
              <input className="w-full border rounded px-3 py-2" value={editing.vehicleNumber} onChange={(e)=>setEditing({...editing, vehicleNumber: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Status</label>
              <select className="w-full border rounded px-3 py-2" value={editing.status} onChange={(e)=>setEditing({...editing, status: e.target.value})}>
                <option>Inactive</option>
                <option>Active</option>
                <option>On Leave</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Current Assignment</label>
              <select className="w-full border rounded px-3 py-2" value={editing.currentAssignment?._id || editing.currentAssignment || ''} onChange={(e)=>setEditing({...editing, currentAssignment: e.target.value})}>
                <option value="">Unassigned</option>
                {companies.map(c=> (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3 flex gap-2">
              <button className="bg-indigo-600 text-white px-4 py-2 rounded">Save</button>
              <button type="button" className="px-4 py-2 rounded border" onClick={()=>setEditing(null)}>Cancel</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function CompaniesPage() {
  const api = useApi(localStorage.getItem('token'));
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({ name: '', logoUrl: '' });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const cs = await api.get('/api/admin/companies');
      setCompanies(cs);
    } catch (e) {
      setError('Failed to load companies');
    }
  };

  useEffect(() => { load(); }, []);

  const submitAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/companies', form);
      setForm({ name: '', logoUrl: '' });
      await load();
    } catch (e) {
      setError('Failed to create company');
    }
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/admin/companies/${editing._id}`, { name: editing.name, logoUrl: editing.logoUrl });
      setEditing(null);
      await load();
    } catch (e) {
      setError('Failed to update company');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-4 rounded shadow">
        <div className="font-semibold mb-3">Add Company</div>
        <form className="space-y-3" onSubmit={submitAdd}>
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input className="w-full border rounded px-3 py-2" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm mb-1">Logo URL</label>
            <input className="w-full border rounded px-3 py-2" value={form.logoUrl} onChange={(e)=>setForm({...form, logoUrl: e.target.value})} />
          </div>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded">Create</button>
        </form>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <div className="font-semibold mb-3">Companies</div>
        {error ? <div className="text-red-600 text-sm mb-2">{error}</div> : null}
        <div className="space-y-2">
          {companies.map(c => (
            <div key={c._id} className="border rounded p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {c.logoUrl ? <img alt={c.name} src={c.logoUrl} className="w-8 h-8 object-contain" /> : <div className="w-8 h-8 bg-gray-200 rounded" />}
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.logoUrl || 'No logo'}</div>
                </div>
              </div>
              <button className="text-indigo-600" onClick={()=>setEditing({ ...c })}>Edit</button>
            </div>
          ))}
        </div>
      </div>

      {editing ? (
        <div className="lg:col-span-2 bg-white p-4 rounded shadow">
          <div className="font-semibold mb-3">Edit Company</div>
          <form className="grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={submitEdit}>
            <div>
              <label className="block text-sm mb-1">Name</label>
              <input className="w-full border rounded px-3 py-2" value={editing.name} onChange={(e)=>setEditing({...editing, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Logo URL</label>
              <input className="w-full border rounded px-3 py-2" value={editing.logoUrl || ''} onChange={(e)=>setEditing({...editing, logoUrl: e.target.value})} />
            </div>
            <div className="md:col-span-3 flex gap-2">
              <button className="bg-indigo-600 text-white px-4 py-2 rounded">Save</button>
              <button type="button" className="px-4 py-2 rounded border" onClick={()=>setEditing(null)}>Cancel</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function ProgressFormPage() {
  const api = useApi(localStorage.getItem('token'));
  const [riders, setRiders] = useState([]);
  const [form, setForm] = useState({ riderId: '', date: '', deliveriesCompleted: 0, hoursWorked: 0, earnings: 0 });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const rs = await api.get('/api/admin/riders');
        setRiders(rs);
      } catch (e) {
        setError('Failed to load riders');
      }
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      const payload = { ...form, deliveriesCompleted: Number(form.deliveriesCompleted||0), hoursWorked: Number(form.hoursWorked||0), earnings: Number(form.earnings||0) };
      await api.post('/api/admin/progress', payload);
      setMsg('Progress added');
      setForm({ riderId: '', date: '', deliveriesCompleted: 0, hoursWorked: 0, earnings: 0 });
    } catch (e) {
      setError('Failed to add progress');
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow max-w-2xl">
      <div className="font-semibold mb-3">Add Rider Progress</div>
      {msg ? <div className="text-green-600 text-sm mb-2">{msg}</div> : null}
      {error ? <div className="text-red-600 text-sm mb-2">{error}</div> : null}
      <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={submit}>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Rider</label>
          <select className="w-full border rounded px-3 py-2" value={form.riderId} onChange={(e)=>setForm({...form, riderId: e.target.value})}>
            <option value="">Select Rider</option>
            {riders.map(r => <option key={r._id} value={r._id}>{r.fullName} • {r.phone}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Date</label>
          <input type="date" className="w-full border rounded px-3 py-2" value={form.date} onChange={(e)=>setForm({...form, date: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm mb-1">Deliveries Completed</label>
          <input type="number" className="w-full border rounded px-3 py-2" value={form.deliveriesCompleted} onChange={(e)=>setForm({...form, deliveriesCompleted: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm mb-1">Hours Worked</label>
          <input type="number" className="w-full border rounded px-3 py-2" value={form.hoursWorked} onChange={(e)=>setForm({...form, hoursWorked: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm mb-1">Earnings</label>
          <input type="number" className="w-full border rounded px-3 py-2" value={form.earnings} onChange={(e)=>setForm({...form, earnings: e.target.value})} />
        </div>
        <div className="md:col-span-2">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded">Add Progress</button>
        </div>
      </form>
    </div>
  );
}

function RiderLayout({ children }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Rider Portal</div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/rider" className="hover:underline">My Profile</Link>
            <Link to="/rider/progress" className="hover:underline">My Progress</Link>
            <button className="text-red-600" onClick={()=>{ logout(); navigate('/login'); }}>Logout</button>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}

function RiderProfilePage() {
  const api = useApi(localStorage.getItem('token'));
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const p = await api.get('/api/rider/me');
        setProfile(p);
      } catch (e) {
        setError('Failed to load profile');
      }
    })();
  }, []);
  if (error) return <div className="text-red-600 text-sm">{error}</div>;
  if (!profile) return <div>Loading...</div>;
  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="font-semibold mb-4">My Profile</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-gray-500">Full Name</div>
          <div className="font-medium">{profile.fullName}</div>
        </div>
        <div>
          <div className="text-gray-500">Phone</div>
          <div className="font-medium">{profile.phone}</div>
        </div>
        <div>
          <div className="text-gray-500">Vehicle Number</div>
          <div className="font-medium">{profile.vehicleNumber}</div>
        </div>
        <div>
          <div className="text-gray-500">Status</div>
          <div className="font-medium">{profile.status}</div>
        </div>
        <div className="md:col-span-2">
          <div className="text-gray-500">Current Assignment</div>
          <div className="font-medium">{profile.currentAssignment?.name || 'Unassigned'}</div>
        </div>
      </div>
    </div>
  );
}

function RiderProgressPage() {
  const api = useApi(localStorage.getItem('token'));
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const d = await api.get('/api/rider/progress');
        setData(d);
      } catch (e) {
        setError('Failed to load progress');
      }
    })();
  }, []);
  if (error) return <div className="text-red-600 text-sm">{error}</div>;
  if (!data) return <div>Loading...</div>;
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded shadow">
        <div className="font-semibold mb-2">Last 30 Days</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-gray-500 text-sm">Total Deliveries</div>
            <div className="text-2xl font-semibold">{data.summary.totalDeliveries}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Total Earnings</div>
            <div className="text-2xl font-semibold">₹{data.summary.totalEarnings}</div>
          </div>
        </div>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <div className="font-semibold mb-3">All Progress</div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left bg-gray-100">
                <th className="p-2">Date</th>
                <th className="p-2">Deliveries</th>
                <th className="p-2">Hours</th>
                <th className="p-2">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map(item => (
                <tr key={item._id} className="border-t">
                  <td className="p-2">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="p-2">{item.deliveriesCompleted}</td>
                  <td className="p-2">{item.hoursWorked}</td>
                  <td className="p-2">₹{item.earnings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RootRouter() {
  const role = localStorage.getItem('role');
  if (!role) return <Navigate to="/login" replace />;
  return <Navigate to={role === 'admin' ? '/admin' : '/rider'} replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RootRouter />} />
        <Route path="/admin" element={<ProtectedRoute allow="admin"><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/riders" element={<ProtectedRoute allow="admin"><AdminLayout><RidersPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/companies" element={<ProtectedRoute allow="admin"><AdminLayout><CompaniesPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/progress" element={<ProtectedRoute allow="admin"><AdminLayout><ProgressFormPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/rider" element={<ProtectedRoute allow="rider"><RiderLayout><RiderProfilePage /></RiderLayout></ProtectedRoute>} />
        <Route path="/rider/progress" element={<ProtectedRoute allow="rider"><RiderLayout><RiderProgressPage /></RiderLayout></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
