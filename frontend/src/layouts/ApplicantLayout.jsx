import { Outlet } from 'react-router-dom';
import ApplicantNavbar from '../components/ApplicantNavbar';

export default function ApplicantLayout() {
  return (
    <div className="applicant-layout" style={{ flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--slate-50)' }}>
      <ApplicantNavbar />
      <div className="applicant-content" style={{ marginLeft: 0 }}>
         {/* Main Content */}
         <main className="applicant-main" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '2rem' }}>
            <Outlet />
         </main>
      </div>
    </div>
  );
}

