import { Link, useLocation } from 'react-router-dom';
import { Scroll, LogIn, Shield, LayoutDashboard, Home as HomeIcon } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const path = location.pathname;
  const isActive = (p) => path === p ? 'nav-link active' : 'nav-link';

  // 1. Admin Navbar
  if (path.startsWith('/admin')) {
    return (
      <nav className="navbar" style={{ background: 'var(--brand-600)', borderBottom: 'none' }}>
        <div className="container">
          <div className="flex justify-between items-center w-full">
            <Link to="/admin/dashboard" className="nav-brand" style={{ color: 'white' }}>
              <div style={{ background: 'white', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', marginRight: '8px' }}>
                 <img src="/logo.png" alt="Logo" style={{ height: '32px', width: 'auto' }} />
              </div>
              <span>Admin Portal</span>
            </Link>
            
            <ul className="nav-links">
               {path === '/admin/login' ? (
                 <li>
                   <Link to="/" className="text-slate-300 hover:text-white flex items-center gap-2" style={{ textDecoration: 'none', fontSize: '0.9rem' }}>
                     <HomeIcon size={16} /> Back to Home
                   </Link>
                 </li>
               ) : (
                 // Dashboard links can go here if needed, currently Dashboard has its own logout
                 null
               )}
            </ul>
          </div>
        </div>
      </nav>
    );
  }

  // 2. Applicant Navbar
  if (path.startsWith('/applicant')) {
    return (
      <nav className="navbar" style={{ background: 'var(--brand-600)', borderBottom: 'none' }}>
        <div className="container">
          <div className="flex justify-between items-center w-full">
            <Link to="/applicant/dashboard" className="nav-brand" style={{ color: 'white' }}>
              <div style={{ background: 'white', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', marginRight: '8px' }}>
                 <img src="/logo.png" alt="Logo" style={{ height: '32px', width: 'auto' }} />
              </div>
              <span>Applicant Portal</span>
            </Link>

            <ul className="nav-links">
               {path === '/applicant/login' ? (
                 <li>
                   <Link to="/" className="nav-link flex items-center gap-2" style={{ color: 'white' }}>
                     <HomeIcon size={16} /> Back to Home
                   </Link>
                 </li>
               ) : (
                 // Logged in specific links could go here
                 null
               )}
            </ul>
          </div>
        </div>
      </nav>
    );
  }

  // 3. Public Navbar (Default)
  return (
    <nav className="navbar" style={{ background: 'var(--brand-600)', borderBottom: 'none' }}>
      <div className="container">
        <div className="flex justify-between items-center w-full">
          {/* Brand */}
          <Link to="/" className="nav-brand" style={{ color: 'white' }}>
            <div style={{ background: 'white', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
              <img src="/logo.png" alt="Logo" style={{ height: '32px', width: 'auto' }} />
            </div>
            <span>Jamiyat.org</span>
          </Link>

          {/* Navigation */}
          <ul className="nav-links" style={{ alignItems: 'center' }}>
            <li>
              <Link to="/" className={isActive('/')} style={{ color: 'white' }}>Home</Link>
            </li>
            <li>
              <Link to="/apply" className={isActive('/apply')} style={{ color: 'white' }}>Apply Online</Link>
            </li>
            <li style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', height: '24px', margin: '0 4px' }}></li>
            <li>
              <Link to="/applicant/login" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }}>
                <LogIn size={16} /> Applicant Login
              </Link>
            </li>
            <li>
              <Link to="/admin/login" className="btn btn-sm" style={{ background: 'white', color: 'var(--brand-600)' }}>
                <Shield size={16} /> Admin Portal
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
