
import { Outlet } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';

export default function AdminLayout() {
  return (
    <div className="admin-layout" style={{ flexDirection: 'column' }}>
      <AdminNavbar />
      <div className="admin-content" style={{ marginLeft: 0 }}>
         {/* Main Content */}
         <main className="admin-main" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '2rem' }}>
            <Outlet />
         </main>
      </div>
    </div>
  );
}
