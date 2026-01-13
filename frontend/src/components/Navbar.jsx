import { Link, useLocation } from 'react-router-dom';
import { Scroll, LogIn, Shield, LayoutDashboard, Home as HomeIcon, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const location = useLocation();
  const path = location.pathname;
  const isActive = (p) => path === p ? 'nav-link active' : 'nav-link';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // 1. Admin Navbar
  if (path.startsWith('/admin')) {
    return (
      <nav className="navbar" style={{ background: 'var(--brand-900)', borderBottom: 'none' }}>
        <div className="container">
          <div className="flex justify-between items-center w-full">
            <Link to="/admin/dashboard" className="nav-brand" style={{ color: 'white' }} onClick={closeMobileMenu}>
              <div style={{ background: 'white', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', marginRight: '8px' }}>
                <img src="/logo.svg" alt="Logo" style={{ height: '40px', width: 'auto' }} />
              </div>
              <span>Nikkah Portal</span>
            </Link>

            <button className="nav-mobile-toggle" onClick={toggleMobileMenu} aria-label="Toggle menu">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <ul className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
              {path === '/admin/login' ? (
                <li>
                  <Link to="/" className="text-slate-300 hover:text-white flex items-center gap-2" style={{ textDecoration: 'none', fontSize: '0.9rem', color: 'var(--slate-700)' }} onClick={closeMobileMenu}>
                    <HomeIcon size={16} /> Back to Home
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </nav>
    );
  }

  // 2. Applicant Navbar
  if (path.startsWith('/applicant')) {
    return (
      <nav className="navbar" style={{ background: 'var(--brand-900)', borderBottom: 'none' }}>
        <div className="container">
          <div className="flex justify-between items-center w-full">
            <Link to="/applicant/dashboard" className="nav-brand" style={{ color: 'white' }} onClick={closeMobileMenu}>
              <div style={{ background: 'white', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', marginRight: '8px' }}>
                <img src="/logo.png" alt="Logo" style={{ height: '32px', width: 'auto' }} />
              </div>
              <span>Applicant Portal</span>
            </Link>

            <button className="nav-mobile-toggle" onClick={toggleMobileMenu} aria-label="Toggle menu">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <ul className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
              {path === '/applicant/login' ? (
                <li>
                  <Link to="/" className="nav-link flex items-center gap-2" style={{ color: 'var(--slate-700)' }} onClick={closeMobileMenu}>
                    <HomeIcon size={16} /> Back to Home
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </nav>
    );
  }

  // 3. Public Navbar (Default)
  return (
    <nav className="navbar" style={{ background: 'var(--brand-900)', borderBottom: 'none' }}>
      <div className="container">
        <div className="flex justify-between items-center w-full">
          {/* Brand */}
          <Link to="/" className="nav-brand" style={{ color: 'white' }} onClick={closeMobileMenu}>
            <div style={{ background: 'white', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
              <img src="/logo.png" alt="Logo" style={{ height: '32px', width: 'auto' }} />
            </div>
            <span>Jamiyat.org</span>
          </Link>

          <button className="nav-mobile-toggle" onClick={toggleMobileMenu} aria-label="Toggle menu">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Navigation */}
          <ul className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`} style={{ alignItems: 'center' }}>
            <li>
              <Link to="/" className={isActive('/')} style={{ color: mobileMenuOpen ? 'var(--slate-700)' : 'white' }} onClick={closeMobileMenu}>Application</Link>
            </li>
            <li style={{ borderLeft: '1px solid rgba(0,0,0,0.1)', height: '24px', margin: '0 4px' }}></li>
            <li>
              <Link to="/login" className="btn btn-sm" style={{ background: 'var(--brand-600)', color: 'white', border: 'none' }} onClick={closeMobileMenu}>
                <LogIn size={16} /> Login
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
