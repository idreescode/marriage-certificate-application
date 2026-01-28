import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import ApplicantNavbar from '../components/ApplicantNavbar';

export default function ApplicantLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');

    if (!token) {
      // Not logged in - redirect to login with return URL (no toast error to avoid showing errors on login page)
      const returnUrl = location.pathname + location.search;
      navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // Check if user is applicant
    if (userType === 'admin' || userType === 'super_admin') {
      navigate('/admin/dashboard');
      return;
    }
  }, [navigate, location]);

  return (
    <div className="applicant-layout" style={{ flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--slate-50)' }}>
      <ApplicantNavbar />
      <div className="applicant-content" style={{ marginLeft: 0 }}>
         {/* Main Content */}
         <main className="applicant-main" style={{ width: '100%', padding: '2rem' }}>
            <Outlet />
         </main>
      </div>
    </div>
  );
}

