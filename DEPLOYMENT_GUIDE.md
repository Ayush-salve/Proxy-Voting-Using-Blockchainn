# 🚀 Render Deployment Guide for BlockProxy

This guide provides step-by-step instructions to deploy the complete **BlockProxy** Corporate Governance platform (Managed PostgreSQL Database, Express Node.js Backend API, and React Vite Frontend) onto [Render](https://render.com).

---

## 🏗️ Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │          Render Cloud Platform         │
                      │                                        │
                      │   ┌────────────────────────────────┐   │
                      │   │       Render Static Site       │   │
                      │   │   (React + Vite + Tailwind)    │   │
                      │   │  https://blockproxy-ui...      │   │
                      │   └───────────────┬────────────────┘   │
                      │                   │                    │
                      │             API Requests               │
                      │             (Bearer JWT)               │
                      │                   │                    │
                      │                   ▼                    │
                      │   ┌────────────────────────────────┐   │
                      │   │       Render Web Service       │   │
                      │   │      (Express / Node.js)       │   │
                      │   │  https://blockproxy-api...     │   │
                      │   └───────────────┬────────────────┘   │
                      │                   │                    │
                      │               Prisma ORM               │
                      │              (PostgreSQL)              │
                      │                   │                    │
                      │                   ▼                    │
                      │   ┌────────────────────────────────┐   │
                      │   │      Render PostgreSQL DB      │   │
                      │   │         (blockproxy-db)        │   │
                      │   └────────────────────────────────┘   │
                      └────────────────────────────────────────┘
```

---

## ⚡ Option 1: 1-Click Blueprint Deployment (Recommended)

Render Blueprints use the [`render.yaml`](./render.yaml) file in the root directory to provision all 3 services automatically with all environment variables pre-linked.

### Step 1: Push Your Code to GitHub
Ensure all recent changes are committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "Configure Render deployment and PostgreSQL schema"
git push origin main
```

### Step 2: Deploy on Render
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click the **"New +"** button at the top right and select **"Blueprint"**.
3. Connect your GitHub repository (`Ayush-salve/Proxy-Voting-Using-Blockchain` or your repo).
4. Render will scan `render.yaml` and display the 3 resources:
   - 🗄️ `blockproxy-db` (Managed PostgreSQL Database)
   - ⚙️ `blockproxy-api` (Backend Express Web Service)
   - 💻 `blockproxy-ui` (Frontend React Static Site)
5. Click **"Apply"** / **"Create Blueprint"**.

Render will automatically build the services, create the PostgreSQL database tables, run the initial seed with governance demo data, and deploy both URLs!

---

## 🛠️ Option 2: Manual Dashboard Setup

If you prefer to configure each service manually via the Render Web UI:

### Step 1: Create the Managed PostgreSQL Database
1. In Render Dashboard, click **New +** → **PostgreSQL**.
2. Fill in:
   - **Name**: `blockproxy-db`
   - **Database**: `blockproxy`
   - **User**: `blockproxy_user`
   - **Region**: `Oregon (US West)` (or closest to you)
   - **Plan**: `Free`
3. Click **Create Database**.
4. Once created, copy the **Internal Database URL** (e.g. `postgresql://blockproxy_user:...@dpg-...-a/blockproxy`).

---

### Step 2: Create the Backend Web Service (API)
1. Click **New +** → **Web Service**.
2. Select your GitHub repository.
3. Configure the service settings:
   - **Name**: `blockproxy-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Region**: Same as PostgreSQL (e.g. `Oregon`)
   - **Branch**: `main`
   - **Build Command**:
     ```bash
     npm install && npm run render:build
     ```
   - **Start Command**:
     ```bash
     npm run start
     ```
   - **Plan**: `Free`
4. Under **Environment Variables**, add:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production environment mode |
   | `DATABASE_URL` | *(Paste the Internal Database URL from Step 1)* | Database connection string |
   | `JWT_SECRET` | `super_secure_jwt_secret_blockproxy_2026_prod` | 32+ characters secret |
   | `JWT_REFRESH_SECRET` | `super_secure_refresh_secret_blockproxy_2026_prod` | Long-lived refresh secret |
   | `JWT_EXPIRES_IN` | `15m` | Token expiry |
   | `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token expiry |
   | `CLIENT_URL` | `https://<your-frontend-name>.onrender.com` | Frontend origin for CORS |
5. Click **Create Web Service**.

---

### Step 3: Create the Frontend Static Site (UI)
1. Click **New +** → **Static Site**.
2. Select your GitHub repository.
3. Configure the settings:
   - **Name**: `blockproxy-ui`
   - **Root Directory**: `client`
   - **Branch**: `main`
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Publish Directory**: `dist`
4. Under **Redirects/Rewrites**, add a Single Page App (SPA) rewrite rule:
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
5. Under **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://<your-backend-api-name>.onrender.com/api` |
6. Click **Create Static Site**.

---

## 🔑 Pre-Seeded Demo Accounts (Available Upon Deployment)

The automated build command runs `node prisma/seed.js` to initialize the database with ready-to-test governance accounts:

| Role | Email | Password | Permissions & Overview |
| :--- | :--- | :--- | :--- |
| **Company Admin** | `admin@blockproxy.com` | `Admin@12345` | Governance controls, meeting management, proposals |
| **Shareholder (Ayush)** | `ayush@blockproxy.com` | `Shareholder@12345` | 2,500 Shares, active voting rights |
| **Shareholder (Sarah)** | `sarah@blockproxy.com` | `Shareholder@12345` | 5,000 Shares, 1,000 delegated to proxy |
| **Proxy Representative** | `rahul@blockproxy.com` | `Proxy@12345` | Delegated voting management & representation |
| **Auditor** | `auditor@blockproxy.com` | `Auditor@12345` | Audit logs, anomaly alerts, zero-trust verification |

---

## 🔍 Verification & Health Checks

Once deployed, you can verify your deployment by checking:
1. **Backend Health**: `https://<your-backend>.onrender.com/api/health`
   - Expected JSON Response:
     ```json
     {
       "success": true,
       "status": "ONLINE",
       "platform": "BlockProxy Corporate Governance Engine",
       "version": "1.1.0-PROD"
     }
     ```
2. **Frontend UI**: Open `https://<your-frontend>.onrender.com` and log in with any of the demo accounts above.
