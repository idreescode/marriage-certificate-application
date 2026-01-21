
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import toast from 'react-hot-toast';

export default function AdminLayout() {
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

    // Check if user is admin
    if (userType !== 'admin' && userType !== 'super_admin') {
      toast.error('Unauthorized access');
      navigate('/applicant/dashboard');
      return;
    }
  }, [navigate, location]);

  return (
    <div className="admin-layout" style={{ flexDirection: 'column' }}>
      <AdminNavbar />
      <div className="admin-content" style={{ marginLeft: 0 }}>
         {/* Main Content */}
         <main className="admin-main" style={{ width: '100%', padding: '2rem' }}>
            <Outlet />
         </main>
      </div>
    </div>
  );
}
