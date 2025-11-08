# Rider Fleet Management (MERN)

Full-stack MERN app for managing riders and delivery partnerships with Admin and Rider portals.

## Features
- Admin: Riders CRUD, Companies CRUD, Partnerships CRUD, Progress entry, CSV export
- Rider: Profile, daily progress and 30-day summary
- Auth: JWT, role-based routes (admin/rider)
- UI: React + Tailwind, responsive layout, logo fallback, footer with partners

## Tech Stack
- Frontend: React (Vite), Tailwind, Nginx (container)
- Backend: Node.js, Express, Mongoose, JWT
- DB: MongoDB
- Container/Orchestration: Docker, Kubernetes (Docker Desktop)

## Prerequisites
- Windows 10/11
- Docker Desktop (Kubernetes enabled)
- kubectl in PATH

Optional (for alternative workflows)
- Helm (for MongoDB via charts)
- Node.js 18+ and npm (for local dev)

## Quick start: One-command Kubernetes provisioning (Windows PowerShell)
This builds Docker images locally and deploys MongoDB, backend, and frontend into the `fleet` namespace. Frontend will be exposed at NodePort `30080`.

1) Open PowerShell in the project root: `c:\Ankit\Project_Delivery`
2) Run:

```powershell
./provision.ps1
```

When it completes, open:
- Frontend: http://localhost:30080
- Backend health: http://localhost:30080/api/health (proxied by Nginx) or http://rider-backend.fleet.svc.cluster.local:4000 from inside the cluster

Default admin login:
- username: `admin`
- password: `admin123`

### What the script does
- Ensures `fleet` namespace exists
- Deploys MongoDB StatefulSet + Service
- Builds Docker images:
  - `rider-fleet-backend:local`
  - `rider-fleet-frontend:local`
- Applies backend and frontend Deployments + Services
- Waits for rollouts to complete and prints URLs

## Environment variables
Backend uses the following (set in Kubernetes manifests):
- `MONGO_URI` (cluster internal): `mongodb://mongodb:27017/rider_fleet_db`
- `JWT_SECRET`: `change_me_in_prod`
- `PORT`: `4000`

Frontend build uses Vite env:
- `VITE_API_BASE`: defaults to `http://rider-backend.fleet.svc.cluster.local:4000` via Nginx proxy config in container. For cloud hosting, set to your public backend URL.

## Local development (optional)
Backend:
```bash
cd backend
npm install
npm run start
# http://localhost:4000/api/health
```

Frontend:
```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

MongoDB (local alternatives):
- Use Docker Desktop Kubernetes via this repo manifests (recommended)
- Or MongoDB Atlas free tier (see Cloud hosting below)

## Kubernetes manifests
- Namespace: `k8s/namespace.yaml` (name: `fleet`)
- MongoDB: `k8s/mongo/service.yaml`, `k8s/mongo/statefulset.yaml`
  - Uses StorageClass `docker-desktop` (default on Docker Desktop). If different, update the PVC in the StatefulSet.
- Backend: `k8s/backend/deployment.yaml`, `k8s/backend/service.yaml`
- Frontend: `k8s/frontend/deployment.yaml`, `k8s/frontend/service.yaml` (NodePort 30080)

## Cloud hosting (free tiers)
Backend (Render):
- Connect GitHub repo, root: `backend`
- Start command: `node src/index.js`
- Env:
  - `MONGO_URI` = your MongoDB Atlas connection string
  - `JWT_SECRET` = long random string
  - `NODE_VERSION` = 18
- Verify: `https://<render-app>.onrender.com/api/health` -> `{"status":"ok"}`

Database (MongoDB Atlas):
- Create free cluster (M0), DB user, Network Access: allow your backend egress IPs
- Connection string example:
  `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/rider_fleet_db`

Frontend (Vercel or Netlify):
- Base dir: `frontend`
- Build: `npm run build`
- Output/Publish dir: `dist`
- Env: `VITE_API_BASE = https://<your-render-backend>.onrender.com`

## Useful commands
Kubernetes:
```bash
kubectl -n fleet get pods
kubectl -n fleet logs deploy/rider-backend --tail=100
kubectl -n fleet get svc rider-frontend
kubectl -n fleet rollout restart deploy/rider-backend
```

Docker images (local):
```bash
docker images | findstr rider-fleet
```

## Repository structure
- `backend/` Node/Express API
- `frontend/` React/Tailwind app
- `k8s/` Kubernetes manifests (namespace, mongo, backend, frontend)
- `frontend/nginx.conf` Nginx config proxying `/api` to backend service
- `provision.ps1` One-command provisioning script

## Security notes
- Do not commit real secrets. `.env` is ignored via `.gitignore`
- Change `JWT_SECRET` in production
- Restrict MongoDB Atlas IPs to your hosting provider egress where possible

## License
MIT (or your preferred license)
