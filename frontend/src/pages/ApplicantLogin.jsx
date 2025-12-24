import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { applicantLogin } from '../services/api';
import toast from 'react-hot-toast';
import { LogIn, Lock, Mail, ArrowLeft } from 'lucide-react';

export default function ApplicantLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await applicantLogin(formData);
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('userType', 'applicant');
      toast.success('Welcome back!');
      navigate('/applicant/dashboard');
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
        {/* Decorative Circles */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>
        <div style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>

        <div style={{ position: 'relative', zIndex: 10 }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '1.5rem', lineHeight: 1.1, color: 'white' }}>
            Safe & Secure<br/>Marriage Records
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '600px', lineHeight: 1.6, color: 'var(--brand-100)' }}>
            Access your verified digital marriage certificate and track your application status in real-time.
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
               <img src="/logo.svg" alt="Official Logo" style={{ height: '140px', width: 'auto' }} />
            </div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--slate-900)', textAlign: 'center' }}>Applicant Login</h2>
            <p className="text-slate-500" style={{ textAlign: 'center' }}>Enter your credentials to access your portal</p>
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
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <div className="flex justify-between items-center mb-2">
                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                <Link to="/applicant/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--brand-600)', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</Link>
              </div>
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
              {loading ? 'Logging in...' : 'Sign In to Portal'}
            </button>
            
            <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--slate-600)' }}>
              Don't have an account? <Link to="/apply" style={{ color: 'var(--brand-600)', fontWeight: 600, textDecoration: 'none' }}>Start Application</Link>
            </p>
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
