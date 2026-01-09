import { useState, useEffect } from 'react';
import { Lock, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resetPassword } from '../services/api';

export default function ResetPassword({ type = 'applicant' }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast.error('Invalid link');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword({
        token,
        newPassword: password,
        type
      });

      if (response.data.success) {
        setSuccess(true);
        toast.success('Password reset successfully!');
      } else {
        toast.error(response.data.message || 'Failed to reset password');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error occurred. Link might be expired.');
    } finally {
      setLoading(false);
    }
  };

  const loginLink = type === 'admin' ? '/admin/login' : '/login';
  const isApplicant = type === 'applicant';

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--slate-50)', padding: '1rem' }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem', textAlign: 'center', border: 'none', boxShadow: 'var(--shadow-md)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '1rem' }}>Invalid Link</h2>
          <p style={{ color: 'var(--slate-600)', marginBottom: '1.5rem' }}>This password reset link is invalid or missing.</p>
          <Link to={loginLink} className="btn btn-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--slate-50)', padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '0', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', border: 'none' }}>
        <div style={{ padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--slate-800)' }}>Set New Password</h1>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.95rem' }}>
              Please create a new secure password for your account.
            </p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--slate-400)' }}>
                    <Lock size={20} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '40px' }}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--slate-400)' }}>
                    <Lock size={20} />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '40px' }}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
                style={{ background: isApplicant ? 'var(--brand-600)' : 'var(--slate-800)' }}
              >
                {loading ? 'Reseting...' : (
                  <>
                    Reset Password <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <CheckCircle color="var(--success)" size={48} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '0.5rem' }}>Password Reset!</h3>
              <p style={{ color: 'var(--slate-500)', marginBottom: '2rem' }}>
                Your password has been successfully updated. You can now login.
              </p>
              <Link
                to={loginLink}
                className="btn btn-primary w-full"
                style={{ background: isApplicant ? 'var(--brand-600)' : 'var(--slate-800)' }}
              >
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
