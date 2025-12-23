# Marriage Certificate Application System

Professional Marriage Certificate Application System for Jamiyat.org built with React, Node.js, Express, and MySQL.

## 🎨 Features

### Public Features
- **Landing Page** with comprehensive "How It Works" guide
- **Online Application Form** for marriage certificate requests
- **Status Tracking** system with real-time updates

### Applicant Portal
- Secure login with JWT authentication
- Dashboard showing application status
- Payment information display
- Payment receipt upload
- Certificate download (when ready)

### Admin Portal
- Secure admin authentication
- View all applications with filtering
- Set deposit amount for each application
- Verify payment receipts
- Schedule nikah appointments
- Generate marriage certificates
- Email notifications at each step

## 🚀 Technology Stack

### Backend
- Node.js + Express
- MySQL Database
- JWT Authentication
- Nodemailer (Email Service)
- Multer (File Uploads)
- bcryptjs (Password Hashing)

### Frontend
- React 18
- Vite (Build Tool)
- React Router DOM
- Axios (API Client)
- Professional Design System (Islamic Green Theme + Gold Accents)

## 📦 Installation

### Prerequisites
- Node.js (v16+)
- MySQL Server
- Git

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (`.env`):
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=marriage_cert_db
JWT_SECRET=your_super_secret_jwt_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
FRONTEND_URL=http://localhost:5173
```

4. Create MySQL database and run schema:
```bash
mysql -u root -p < database/schema.sql
```

5. Create default admin user:
```javascript
// Run this in Node.js to generate password hash
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('Admin@123', 10);
console.log(hash);
```

Then insert into database:
```sql
INSERT INTO users (email, password, role, full_name) VALUES
('admin@jamiyat.org', 'YOUR_HASH_HERE', 'super_admin', 'System Administrator');
```

6. Start backend server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (`.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start frontend development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## 🔐 Default Admin Credentials

```
Email: admin@jamiyat.org
Password: Admin@123
```

**⚠️ IMPORTANT:** Change these credentials after first login!

## 📋 Admin Workflow

1. **Login** to admin portal
2. **Review Applications** submitted by users
3. **Set Deposit Amount** for each application
4. **Wait for User Payment** - User receives email with bank details
5. **Verify Payment Receipt** uploaded by user
6. **Schedule Appointment** for nikah ceremony
7. **Generate Certificate** after ceremony completion
8. **Send Email Notifications** automatically at each step

## 💳 Payment Flow

This system uses **admin-controlled payment** (no online payment gateway):

1. User submits application
2. Admin sets deposit amount
3. User receives email with:
   - Payment amount
   - Bank account details
   - Upload instructions
4. User transfers money to bank
5. User uploads payment receipt in portal
6. Admin verifies receipt manually
7. Process continues to appointment scheduling

## 📧 Email Notifications

System automatically sends emails for:
1. Application Confirmation
2. Deposit Amount Set
3. Payment Receipt Uploaded (to admin)
4. Payment Verified
5. Appointment Scheduled
6. Certificate Ready

## 🎨 Design System

- **Primary Color**: Islamic Green (#22c55e)
- **Accent Color**: Gold (#f59e0b)
- **Typography**: Inter (body), Playfair Display (headings)
- **Effects**: Glassmorphism, smooth animations, modern cards
- **Responsive**: Mobile-first design

## 📁 Project Structure

```
MarriageCertification/
├── backend/
│   ├── database/
│   │   └── schema.sql
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── email.js
│   │   ├── controllers/
│   │   │   ├── adminController.js
│   │   │   ├── applicantController.js
│   │   │   └── applicationController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── upload.js
│   │   ├── routes/
│   │   │   ├── admin.js
│   │   │   ├── applicants.js
│   │   │   └── applications.js
│   │   ├── services/
│   │   │   └── emailService.js
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   └── server.js
│   ├── uploads/
│   │   ├── receipts/
│   │   └── certificates/
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── Loader.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── ApplicationPage.jsx
    │   │   ├── ApplicantLogin.jsx
    │   │   ├── ApplicantDashboard.jsx
    │   │   ├── AdminLogin.jsx
    │   │   └── AdminDashboard.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── styles/
    │   │   └── index.css
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 🔧 API Endpoints

### Public
- `POST /api/applications` - Submit application

### Applicant Portal
- `POST /api/applicants/login` - Login
- `GET /api/applicants/dashboard` - Get dashboard data
- `POST /api/applicants/upload-receipt` - Upload receipt
- `GET /api/applicants/certificate` - Download certificate

### Admin Portal
- `POST /api/admin/login` - Admin login
- `GET /api/admin/applications` - List applications
- `GET /api/admin/applications/:id` - Get application details
- `PUT /api/admin/applications/:id/set-deposit` - Set deposit amount
- `PUT /api/admin/applications/:id/verify-payment` - Verify payment
- `PUT /api/admin/applications/:id/schedule-appointment` - Schedule appointment
- `PUT /api/admin/applications/:id/complete` - Mark complete
- `POST /api/admin/applications/:id/generate-certificate` - Generate certificate

## 🧪 Testing

1. Submit a test application
2. Login as admin and set deposit amount
3. Login as applicant and upload a test receipt image
4. Verify payment as admin
5. Schedule appointment as admin
6. Generate certificate as admin
7. Download certificate as applicant

## 📝 Notes

- Email service requires valid SMTP credentials
- File uploads stored in `backend/uploads/`
- All passwords are hashed with bcrypt
- JWT tokens expire after 7 days (applicant) / 24 hours (admin)
- Database schema supports foreign key constraints

## 🎯 Next Steps

- Implement PDF certificate generation
- Add forgot password functionality
- Implement email templates with better styling
- Add application search and advanced filters
- Create admin statistics dashboard
- Add application cancellation feature

## 👨‍💻 Development

Built by Gemini AI Assistant for Jamiyat.org

---

**May Allah bless all marriages registered through this system!** 🤲
