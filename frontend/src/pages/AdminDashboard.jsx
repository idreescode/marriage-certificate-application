
import { useState, useEffect } from 'react';
import Loader from '../components/Loader';
import { getAllApplications } from '../services/api';
import { Users, CreditCard, Calendar, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    pendingPayment: 0,
    scheduled: 0,
    completed: 0,
    totalRevenue: 0
  });
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await getAllApplications();
      const apps = response.data.data.applications;
      
      const newApps = apps.filter(a => a.status === 'admin_review').length;
      const pending = apps.filter(a => a.status === 'payment_pending').length;
      const scheduled = apps.filter(a => a.status === 'appointment_scheduled').length;
      const completed = apps.filter(a => a.status === 'completed').length;
      
      const revenue = apps.reduce((acc, curr) => {
         if ((curr.status === 'payment_verified' || curr.status === 'appointment_scheduled' || curr.status === 'completed') && curr.deposit_amount) {
            return acc + Number(curr.deposit_amount);
         }
         return acc;
      }, 0);

      // Process Chart Data (Last 6 Months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const today = new Date();
      const last6Months = [];
      
      for (let i = 5; i >= 0; i--) {
         const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
         last6Months.push({
            name: months[d.getMonth()],
            monthIndex: d.getMonth(),
            year: d.getFullYear(),
            applications: 0
         });
      }

      apps.forEach(app => {
         const d = new Date(app.created_at);
         const monthIndex = d.getMonth();
         const year = d.getFullYear();
         
         const period = last6Months.find(p => p.monthIndex === monthIndex && p.year === year);
         if (period) {
            period.applications += 1;
         }
      });

      setChartData(last6Months);

      setStats({
        total: apps.length,
        new: newApps,
        pendingPayment: pending,
        scheduled: scheduled,
        completed: completed,
        totalRevenue: revenue
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, bg }) => (
    <div className="stat-card">
      <div>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.25rem' }}>{title}</p>
        <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--slate-800)', margin: 0 }}>{value}</h3>
      </div>
      <div className="stat-icon" style={{ backgroundColor: bg }}>
        <Icon size={24} className={color} style={{ color: color }} />
      </div>
    </div>
  );

  if (loading) return <Loader fullscreen />;

  return (
    <div>
      <div className="mb-6">
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Dashboard Overview</h1>
        <p className="text-muted">Welcome back, Administrator. Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard 
          title="Total Applications" 
          value={stats.total} 
          icon={Users} 
          color="#2563eb" 
          bg="#eff6ff" 
        />
        <StatCard 
          title="New Requests" 
          value={stats.new} 
          icon={AlertCircle} 
          color="#ea580c" 
          bg="#fff7ed" 
        />
        <StatCard 
          title="Pending Payments" 
          value={stats.pendingPayment} 
          icon={CreditCard} 
          color="#9333ea" 
          bg="#faf5ff" 
        />
        <StatCard 
          title="Scheduled Nikkahs" 
          value={stats.scheduled} 
          icon={Calendar} 
          color="#059669" 
          bg="#ecfdf5" 
        />
      </div>

      {/* Revenue Section */}
      <div className="revenue-section">
         {/* Main Chart Area */}
         <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
             <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Applications Overview</h3>
             <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis 
                     dataKey="name" 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fill: '#64748b', fontSize: 12 }} 
                     dy={10}
                   />
                   <YAxis 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fill: '#64748b', fontSize: 12 }} 
                   />
                   <Tooltip 
                     contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: 'none', 
                        borderRadius: '8px', 
                        color: 'white',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                     }}
                     itemStyle={{ color: 'white' }}
                     cursor={{ fill: '#f1f5f9' }}
                   />
                   <Bar 
                     dataKey="applications" 
                     fill="var(--brand-600)" 
                     radius={[4, 4, 0, 0]} 
                     barSize={40}
                   />
                 </BarChart>
               </ResponsiveContainer>
             </div>
         </div>

         {/* Side Stats */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
               <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Total Revenue</h3>
               <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--brand-900)' }}>PKR {stats.totalRevenue.toLocaleString()}</span>
               </div>
               <p style={{ marginTop: '0.5rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                  <TrendingUp size={14} /> +12% from last month
               </p>
            </div>

            <div className="card">
               <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Urgent Actions</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {stats.new > 0 ? (
                     <div style={{ padding: '0.75rem', background: '#fff7ed', color: '#c2410c', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={16} />
                        <span>{stats.new} new applications to review</span>
                     </div>
                  ) : (
                     <p className="text-muted text-sm">No pending reviews.</p>
                  )}
                  {stats.pendingPayment > 0 && (
                     <div style={{ padding: '0.75rem', background: '#eff6ff', color: '#1d4ed8', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={16} />
                        <span>{stats.pendingPayment} payments pending</span>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
