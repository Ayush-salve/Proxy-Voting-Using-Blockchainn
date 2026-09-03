# 🌐 Netlify Deployment Guide for BlockProxy Frontend

This guide explains how to successfully deploy and configure the **BlockProxy React Frontend** on [Netlify](https://www.netlify.com/).

---

## ❓ Why the 404 "Page Not Found" Happened

1. **Monorepo Structure**: Netlify looked at the root folder instead of the `client/` subdirectory where the React Vite application is located.
2. **Missing Single Page App (SPA) Redirects**: React Router requires all paths (e.g., `/login`, `/dashboard`) to rewrite to `/index.html`.

We have added:
- [`netlify.toml`](./netlify.toml) in the root repository.
- [`client/netlify.toml`](./client/netlify.toml).
- [`client/public/_redirects`](./client/public/_redirects) (which compiles into `client/dist/_redirects`).

---

## 🚀 Quick Fix: 2 Easy Deployment Methods

### Method 1: Push Changes to GitHub (Automatic Continuous Deployment)

If your Netlify site is already linked to your GitHub repository:

1. **Push the new configuration files to GitHub**:
   ```bash
   git add .
   git commit -m "Add Netlify configuration and SPA redirects"
   git push origin main
   ```
2. Netlify will detect the new [`netlify.toml`](./netlify.toml) and trigger a new deployment automatically.

---

### Method 2: Update Existing Site Settings on Netlify Dashboard

If your Netlify site is already created (e.g. `vermillion-chebakia-a75424.netlify.app`), ensure the build settings match:

1. Open your site on [Netlify Dashboard](https://app.netlify.com/).
2. Go to **Site configuration** > **Build & deploy** > **Continuous configuration** > **Build settings**.
3. Set the following:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist` (or `dist` if Base directory is set to `client`)
4. Go to **Site configuration** > **Environment variables**:
   - Add variable: `VITE_API_URL`
   - Value: `https://<your-backend-api-name>.onrender.com/api` (your backend URL)
5. Go to **Deploys** > Click **Trigger deploy** > **Deploy site**.

---

## ⚙️ Environment Variables on Netlify

| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://blockproxy-api.onrender.com/api` | Base URL pointing to your backend Express API |

---

## 🔍 Verification

Once the deployment finishes:
1. Open your Netlify URL: `https://vermillion-chebakia-a75424.netlify.app`
2. You will see the BlockProxy corporate governance landing page and login screen.
3. Test direct deep links (e.g., `/login`, `/dashboard`) and page refresh — all routes will load cleanly without 404 errors.
