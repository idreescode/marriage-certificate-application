import { useState } from 'react';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { forgotPassword } from '../services/api';

export default function ForgotPassword({ type = 'applicant' }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await forgotPassword({
        email,
        type
      });

      if (response.data.success) {
        setSent(true);
        toast.success('Reset link sent to your email');
      } else {
        toast.error(response.data.message || 'Failed to send reset link');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loginLink = type === 'admin' ? '/admin/login' : '/login';
  const isApplicant = type === 'applicant'; // Used for conditional specific styles if needed

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--slate-50)', padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '0', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', border: 'none' }}>
        <div style={{ padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--slate-800)' }}>Forgot Password?</h1>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.95rem' }}>
              Enter your registered email and we'll send you a link to reset your password.
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--slate-400)' }}>
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '40px' }}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
                style={{ background: isApplicant ? 'var(--brand-600)' : 'var(--slate-800)' }}
              >
                {loading ? 'Sending...' : (
                  <>
                    Send Reset Link <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '1.5rem', background: '#ecfdf5', color: '#047857', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Checks your inbox! We have sent a password reset link to <strong>{email}</strong>.
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--slate-500)', marginBottom: '1.5rem' }}>
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <button
                onClick={() => setSent(false)}
                style={{ background: 'none', border: 'none', color: 'var(--brand-600)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Try another email address
              </button>
            </div>
          )}
        </div>

        <div style={{ background: 'var(--slate-50)', padding: '1rem 2rem', borderTop: '1px solid var(--slate-100)', textAlign: 'center' }}>
          <Link to={loginLink} style={{ color: 'var(--slate-600)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
