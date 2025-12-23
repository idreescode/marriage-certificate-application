# Quick Start Guide - Marriage Certificate Application

## 🚀 Setup in 3 Steps

### 1️⃣ Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2️⃣ Configure Environment

**Backend** (`backend/.env`):
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=marriage_cert_db
JWT_SECRET=change_this_secret_key_in_production
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

### 3️⃣ Run Migrations

```bash
cd backend
npm run migrate
```

**Expected Output:**
```
╔══════════════════════════════════════════════════════╗
║   Marriage Certificate - Database Migrations        ║
╚══════════════════════════════════════════════════════╝

📋 Found 5 pending migration(s)

✅ Migration completed: 001_create_users_table
✅ Migration completed: 002_create_applications_table
✅ Migration completed: 003_create_witnesses_table
✅ Migration completed: 004_create_email_logs_table
✅ Migration completed: 005_seed_admin_user

🎉 All migrations completed successfully!
```

---

## ▶️ Start Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
→ Running on http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
→ Running on http://localhost:5173

---

## 🔐 Default Admin Login

```
URL: http://localhost:5173/admin/login
Email: admin@jamiyat.org
Password: Admin@123
```

**⚠️ Change password after first login!**

---

## 📋 Common Commands

```bash
# Run migrations
cd backend && npm run migrate

# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Check database
mysql -u root -p
USE marriage_cert_db;
SHOW TABLES;
```

---

## ✅ Verification Checklist

- [ ] MySQL server running
- [ ] Dependencies installed (both backend & frontend)
- [ ] `.env` files configured
- [ ] Migrations completed successfully
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Can login to admin portal
- [ ] Can access homepage

---

## 📁 Project Structure

```
MarriageCertification/
├── backend/
│   ├── migrations/          ✨ NEW: Proper migration system
│   │   ├── MigrationRunner.js
│   │   ├── migrate.js
│   │   ├── 001_create_users_table.js
│   │   ├── 002_create_applications_table.js
│   │   ├── 003_create_witnesses_table.js
│   │   ├── 004_create_email_logs_table.js
│   │   └── 005_seed_admin_user.js
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   └── styles/
    └── .env
```

---

## 🆘 Troubleshooting

**Migration fails:**
```bash
# Reset database
mysql -u root -p -e "DROP DATABASE IF EXISTS marriage_cert_db;"
npm run migrate
```

**Port already in use:**
```bash
# Backend (5000)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Frontend (5173)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**Email not working:**
- Gmail App Password use karen (not regular password)
- Settings > Security > 2-Step Verification > App Passwords

---

## 📚 Documentation

- **Full Guide**: README.md
- **Migrations**: DATABASE_SETUP.md
- **Implementation**: walkthrough.md
- **API Docs**: implementation_plan.md

---

**Ready! Ab jo system chalao! 🎉**
