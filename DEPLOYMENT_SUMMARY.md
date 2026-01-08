# 🚀 Deployment Summary

## 📁 Your Workflows

You have **2 deployment workflows**:

```
.github/workflows/
├── frontend_deploy.yml  ← Frontend deployment
└── backend_deploy.yml   ← Backend deployment
```

---

## 🎨 Frontend Deployment (`frontend_deploy.yml`)

### Triggers:
- Pushes to `main` branch

### What it does:
1. ✅ Installs Node.js 18
2. ✅ Installs frontend dependencies
3. ✅ Builds React app with `VITE_API_URL`
4. ✅ Verifies build succeeded
5. ✅ Deploys to `/nikkahapp` via SFTP

### Required Secrets:
| Secret | Purpose |
|--------|---------|
| `FRONTEND_FTPSERVER` | SFTP server address |
| `FRONTEND_USERNAME` | SFTP username |
| `FRONTEND_PASSWORD` | SFTP password |
| `VITE_API_URL` | Backend API URL (e.g., `https://api.nikahapp.jamiyat.org`) |

### Deployment:
- **From:** `frontend/dist/*`
- **To:** `/nikkahapp`
- **URL:** `https://nikahapp.jamiyat.org/`

---

## 🔧 Backend Deployment (`backend_deploy.yml`)

### Triggers:
- Pushes to `main` branch that change `backend/` folder
- Manual trigger (workflow_dispatch)

### What it does:
1. ✅ Installs Node.js 20
2. ✅ Installs backend dependencies (production only)
3. ✅ Creates `.env` file from GitHub secrets
4. ✅ Verifies backend structure
5. ✅ Deploys to `/nikkahapp-backend` via SFTP
6. ✅ Excludes: node_modules, .git, logs, uploads

### Required Secrets:
| Secret | Example Value | Purpose |
|--------|---------------|---------|
| `BACKEND_FTPSERVER` | `access-5017128307.webspace-host.com` | SFTP server |
| `BACKEND_USERNAME` | `a2216336` | SFTP username |
| `BACKEND_PASSWORD` | Your password | SFTP password |
| `BACKEND_PORT` | `5000` | Express server port |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_USER` | `db_user` | MySQL username |
| `DB_PASSWORD` | `db_password` | MySQL password |
| `DB_NAME` | `marriage_cert` | Database name |
| `JWT_SECRET` | `random-secret-key` | JWT token secret |
| `EMAIL_HOST` | `smtp.gmail.com` | Email SMTP host |
| `EMAIL_PORT` | `587` | Email SMTP port |
| `EMAIL_USER` | `your@email.com` | Email account |
| `EMAIL_PASSWORD` | `email-password` | Email password |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe secret |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Stripe public key |
| `CLIENT_URL` | `https://nikahapp.jamiyat.org` | Frontend URL for CORS |

### Deployment:
- **From:** `backend/*`
- **To:** `/nikkahapp-backend`
- **Note:** After deployment, SSH to server and run `npm install` and `npm run migrate`

---

## 🎯 Complete Setup Checklist

### ✅ GitHub Secrets to Add:

**Frontend (4 secrets):**
- [ ] `FRONTEND_FTPSERVER`
- [ ] `FRONTEND_USERNAME`
- [ ] `FRONTEND_PASSWORD`
- [ ] `VITE_API_URL`

**Backend (13 secrets):**
- [ ] `BACKEND_FTPSERVER`
- [ ] `BACKEND_USERNAME`
- [ ] `BACKEND_PASSWORD`
- [ ] `BACKEND_PORT`
- [ ] `DB_HOST`
- [ ] `DB_USER`
- [ ] `DB_PASSWORD`
- [ ] `DB_NAME`
- [ ] `JWT_SECRET`
- [ ] `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`
- [ ] `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
- [ ] `CLIENT_URL`

---

## 🚀 Deploy Now:

```bash
git add .github/workflows/
git commit -m "Setup frontend and backend deployment workflows"
git push
```

Both workflows will run automatically!

---

## 📂 Server Structure After Deployment:

```
Your Server:
├── /nikkahapp/              ← Frontend (React)
│   ├── index.html
│   ├── assets/
│   ├── logo.png
│   └── logo.svg
│
└── /nikkahapp-backend/      ← Backend (Node.js API)
    ├── src/
    ├── migrations/
    ├── uploads/
    ├── package.json
    ├── .env
    └── node_modules/
```

---

## 🌐 Your URLs:

- **Frontend:** `https://nikahapp.jamiyat.org/`
- **Backend API:** Configure web server to proxy `/api` or use subdomain

---

## ⚠️ After First Backend Deployment:

SSH into your server and run:

```bash
cd /nikkahapp-backend
npm install --production
npm run migrate
pm2 start src/server.js --name nikkahapp-api
pm2 save
```

---

## 📝 Notes:

- Both workflows use **SFTP** (port 22) ✅
- Frontend deploys on any push to main
- Backend deploys only when `backend/` files change
- Backend can be manually triggered from GitHub Actions
- Remember to restart backend after deployment: `pm2 restart nikkahapp-api`

---

**You're all set!** 🎉

