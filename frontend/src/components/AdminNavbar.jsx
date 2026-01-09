
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, FileText } from 'lucide-react';

export default function AdminNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    navigate('/login');
  };

  const NavLink = ({ to, icon: Icon, label }) => {
    const isActive = path === to;
    return (
      <Link
        to={to}
        className="d-flex items-center gap-2"
        style={{
          textDecoration: 'none',
          padding: '0.5rem 1rem',
          fontSize: '0.95rem',
          fontWeight: isActive ? 700 : 500,
          color: isActive ? 'var(--brand-600)' : 'var(--brand-900)',
          borderBottom: isActive ? '2px solid var(--brand-600)' : '2px solid transparent',
          transition: 'all 0.2s ease',
          marginRight: '1rem'
        }}
      >
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <nav className="navbar" style={{ background: 'white', borderBottom: '1px solid #eee', height: '80px', padding: '0' }}>
      <div className="container" style={{ maxWidth: '1200px', height: '100%' }}>
        <div className="d-flex justify-between items-center w-full" style={{ height: '100%' }}>

          {/* Logo area */}
          <div className="d-flex items-center">
            <Link to="/admin/dashboard" className="nav-brand" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <img src="/logo.svg" alt="Jamiyat" style={{ height: '50px', width: 'auto' }} />
              <div style={{ height: '30px', width: '1px', background: '#e2e8f0', margin: '0 1rem' }}></div>
              <span style={{ color: '#64748b', fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>Nikkah Portal</span>
            </Link>
          </div>

          {/* Navigation Menu + Actions */}
          <div className="d-flex items-center">
            <div className="d-flex" style={{ marginRight: '2rem' }}>
              <NavLink to="/admin/dashboard" label="Dashboard" />
              <NavLink to="/admin/applications" label="Applications" />
              {/* <NavLink to="/admin/payments" label="Payments" /> */}
              {/* <NavLink to="/admin/settings" label="Settings" /> */}
            </div>

            {/* User Profile / Logout */}
            <div className="d-flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="btn btn-sm btn-outline-brand"
              >
                <LogOut size={16} /> <span className="hide-mobile">Logout</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
}
