
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Home, LayoutDashboard, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function ApplicantNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const NavLink = ({ to, label }) => {
    const isActive = path === to;
    return (
      <Link 
        to={to} 
        className="d-flex items-center gap-2"
        onClick={() => setMobileMenuOpen(false)}
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
      <div className="container" style={{ width: '100%', height: '100%', padding: '0 2rem' }}>
         <div className="d-flex justify-between items-center w-full" style={{ height: '100%' }}>
            
            {/* Logo area */}
            <div className="d-flex items-center">
              <Link to="/applicant/dashboard" className="nav-brand" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <img src="/logo.svg" alt="Jamiyat" style={{ height: '80px', width: 'auto' }} />
                <div style={{ height: '30px', width: '1px', background: '#e2e8f0', margin: '0 1rem' }} className="hide-on-mobile"></div>
                <span style={{ color: '#64748b', fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }} className="hide-on-mobile">Applicant Portal</span>
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="nav-mobile-toggle" 
              onClick={toggleMobileMenu} 
              aria-label="Toggle menu"
              style={{ color: 'var(--brand-900)' }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Navigation Menu */}
            <div className={`d-flex items-center admin-nav-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
               <div className="d-flex admin-nav-links" style={{ marginRight: '2rem' }}>
                  <NavLink to="/applicant/dashboard" label="Dashboard" />
               </div>

               <div className="d-flex items-center gap-3">
                  <button 
                   onClick={handleLogout} 
                   className="btn btn-sm btn-outline-brand"
                  >
                     <LogOut size={16} /> <span>Logout</span>
                  </button>
               </div>
            </div>

         </div>
      </div>
    </nav>
  );
}
