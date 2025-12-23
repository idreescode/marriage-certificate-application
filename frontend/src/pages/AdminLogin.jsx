import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminLogin } from '../services/api';
import toast from 'react-hot-toast';
import { Shield, Lock, Mail, ArrowLeft } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await adminLogin(formData);
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('userType', 'admin');
      toast.success('Admin access granted');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '60fr 40fr' }}>
      {/* Left Panel - Branding */}
      <div className="hidden-mobile" style={{ 
        background: 'linear-gradient(135deg, var(--brand-700), var(--brand-900))', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: '6rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Grid */}
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', 
          backgroundSize: '30px 30px', 
          opacity: 0.2 
        }}></div>

        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', width: 'fit-content', padding: '0.5rem 1rem', borderRadius: '100px', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.05em' }}>
            RESTRICTED ACCESS
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '1.5rem', lineHeight: 1.1, color: 'white' }}>
            Administrative<br/>Control Panel
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.7, maxWidth: '600px', lineHeight: 1.6, color: 'var(--slate-300)' }}>
            Authorized personnel only. Securely manage marriage applications, verify payments, and issue certificates.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem', background: 'var(--slate-50)' }}>
        <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--slate-500)', textDecoration: 'none', marginBottom: '2rem', fontSize: '0.9rem' }}>
            <ArrowLeft size={16} /> Back to Home
          </Link>

          <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <img src="/logo.png" alt="Official Logo" style={{ height: '140px', width: 'auto' }} />
            </div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--slate-900)', textAlign: 'center' }}>Admin Portal</h2>
            <p className="text-slate-500" style={{ textAlign: 'center' }}>Secure staff authentication</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} className="text-slate-400" style={{ position: 'absolute', left: '16px', top: '19px', color: 'var(--slate-400)' }} />
                <input 
                  type="email" 
                  className="form-input"
                  style={{ paddingLeft: '48px', height: '56px', fontSize: '1.25rem', fontWeight: 500 }}
                  placeholder="admin@jamiyat.org"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} className="text-slate-400" style={{ position: 'absolute', left: '16px', top: '19px', color: 'var(--slate-400)' }} />
                <input 
                  type="password" 
                  className="form-input"
                  style={{ paddingLeft: '48px', height: '56px', fontSize: '1.25rem', fontWeight: 500 }}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading} style={{ background: 'var(--brand-600)', border: 'none' }}>
              {loading ? 'Authenticating...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
      
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
          .hidden-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
