import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import ApplicationPage from './pages/ApplicationPage';
import ApplicantLogin from './pages/ApplicantLogin';
import ApplicantDashboard from './pages/ApplicantDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
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
        <Route path="/" element={<Home />} />
        <Route path="/apply" element={<ApplicationPage />} />
        <Route path="/applicant/login" element={<ApplicantLogin />} />
        <Route path="/applicant/dashboard" element={<ApplicantDashboard />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
