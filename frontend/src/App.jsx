import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
// import Home from './pages/Home';
import ApplicationPage from './pages/ApplicationPage';

import LoginPage from './pages/LoginPage';
// import ApplicantLogin from './pages/ApplicantLogin';
import ApplicantDashboard from './pages/ApplicantDashboard';
// import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DocumentUpload from './pages/DocumentUpload';
import AdminLayout from './layouts/AdminLayout';
import AdminApplications from './pages/AdminApplications';
import AdminApplicationDetails from './pages/AdminApplicationDetails';
const basename =
  import.meta.env.PROD ? '/marriage_frontend' : '/';

function App() {
  return (
    <BrowserRouter basename={basename}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#334155',
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
            padding: '16px',
            fontSize: '0.95rem'
          },
          success: {
            style: {
              background: '#059669',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#059669',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/apply" element={<ApplicationPage />} />


        <Route path="/login" element={<LoginPage />} />
        {/* <Route path="/applicant/login" element={<ApplicantLogin />} /> */}
        <Route path="/applicant/dashboard" element={<ApplicantDashboard />} />

        {/* Applicant Auth */}
        <Route path="/applicant/forgot-password" element={<ForgotPassword type="applicant" />} />
        <Route path="/applicant/reset-password" element={<ResetPassword type="applicant" />} />
        <Route path="/applicant/upload-documents" element={<DocumentUpload />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="applications" element={<AdminApplications />} />
          <Route path="applications/:id" element={<AdminApplicationDetails />} />
          {/* Fallback for now */}
          <Route path="payments" element={<div className="p-8 text-center text-slate-500">Payments Module Coming Soon</div>} />
          <Route path="settings" element={<div className="p-8 text-center text-slate-500">Settings Module Coming Soon</div>} />
        </Route>

        {/* <Route path="/admin/login" element={<AdminLogin />} /> */}
        <Route path="/admin/login" element={<LoginPage />} /> {/* Redirect old admin link to new login */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
