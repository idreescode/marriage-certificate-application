
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Settings, LogOut } from 'lucide-react';

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    navigate('/admin/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <img src="/logo.svg" alt="Logo" style={{ height: '32px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--brand-400)', fontFamily: 'var(--font-heading)' }}>Jamiyat</span>
      </div>

      <nav className="sidebar-nav">
        <Link to="/admin/dashboard" className={`sidebar-link ${isActive('/admin/dashboard') ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>
        
        <Link to="/admin/applications" className={`sidebar-link ${isActive('/admin/applications') ? 'active' : ''}`}>
          <Users size={20} />
          <span>Applications</span>
        </Link>

        <Link to="/admin/payments" className={`sidebar-link ${isActive('/admin/payments') ? 'active' : ''}`}>
          <CreditCard size={20} />
          <span>Payments</span>
        </Link>

        <Link to="/admin/settings" className={`sidebar-link ${isActive('/admin/settings') ? 'active' : ''}`}>
          <Settings size={20} />
          <span>Settings</span>
        </Link>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="sidebar-link" style={{ width: '100%', justifyContent: 'flex-start', color: '#fca5a5' }}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
