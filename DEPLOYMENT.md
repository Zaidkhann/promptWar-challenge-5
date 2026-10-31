# 🚀 Free Deployment Guide — CelebraPlan AI

CelebraPlan AI is built as a unified full-stack application. In production, the Node.js Express server automatically serves both the **API backend** (`/api/*`) and the **React frontend** single-page application (`client/dist`).

This means you only need **one single free service** to host the entire application!

---

## 🏆 Option 1: Render (Recommended & 100% Free)

Render provides a completely free tier for Node.js web services and integrates seamlessly with GitHub.

### Step-by-Step Instructions:

1. **Sign up or Log in**:
   Go to [Render.com](https://render.com/) and sign in with your GitHub account.

2. **Create New Web Service**:
   - In the dashboard, click the **New +** button in the top right.
   - Select **Web Service**.
   - Connect your GitHub repository: `https://github.com/Zaidkhann/promptWar-challenge-5`.

3. **Configure the Service**:
   - **Name**: `celebraplan-ai` (or your preferred name)
   - **Region**: Choose the region closest to you (e.g., Singapore, Frankfurt, or Oregon)
   - **Branch**: `main`
   - **Root Directory**: Leave blank (root of repository)
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: Select **Free** ($0/month)

4. **Add Environment Variables**:
   Under the **Environment Variables** section, add:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Required |
   | `JWT_SECRET` | `celebraplan_super_secure_jwt_secret_2026` | Any secure random string |
   | `GEMINI_API_KEY` | `your_gemini_api_key_here` | Your active Google Gemini key |
   | `CORS_ORIGIN` | `*` | Allows all origins |
   | `DATABASE_PATH` | `./data/celebraplan.sqlite` | SQLite file path |

5. **Deploy**:
   - Click **Create Web Service**.
   - Render will automatically install dependencies, build the React frontend and Express backend, and start the service.
   - Once deployment completes (usually 2–3 minutes), your live URL will be ready at:
     **`https://celebraplan-ai.onrender.com`** (or your chosen subdomain).

---

## 🥈 Option 2: Koyeb (100% Free with Docker)

Koyeb offers a free nano instance that never sleeps.

1. Go to [Koyeb.com](https://www.koyeb.com/) and sign up.
2. Click **Create App** -> **GitHub**.
3. Select `Zaidkhann/promptWar-challenge-5`.
4. Select **Dockerfile** as the build method (the repository includes a ready-to-use production multi-stage [Dockerfile](Dockerfile)).
5. In **Environment Variables**, add:
   - `GEMINI_API_KEY`: `your_gemini_api_key_here`
   - `JWT_SECRET`: `celebraplan_super_secure_jwt_secret_2026`
   - `NODE_ENV`: `production`
6. Click **Deploy**.

---

## 🥉 Option 3: Railway (Free Trial Credits)

1. Go to [Railway.app](https://railway.app/).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select `promptWar-challenge-5`.
4. Under **Variables**, add:
   - `GEMINI_API_KEY`: `your_gemini_api_key_here`
   - `JWT_SECRET`: `celebraplan_super_secure_jwt_secret_2026`
   - `NODE_ENV`: `production`
5. Railway will automatically detect the build and deploy.
6. Under **Settings** -> **Networking**, click **Generate Domain** to get your public `.up.railway.app` URL.

---

## 🎯 Verification after Deployment
Once deployed, open your live URL in any browser:
1. Click **"Get Started with Demo Access"** -> **"One-Click Demo Access"** to immediately explore the pre-loaded events.
2. Go to **"AI Planner"** and test generating a plan with live Google Gemini 2.5 Flash.
3. Test recording an expense in **"Smart Budget"** and check real-time calculation updates.
