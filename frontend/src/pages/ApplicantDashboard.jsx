import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import { getApplicantDashboard, uploadReceipt as uploadReceiptAPI, requestBankDetails as requestBankDetailsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FileText, Calendar, CreditCard, Download, Upload, CheckCircle, LogOut, Landmark } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '../components/PaymentForm';

// Initialize Stripe outside of component
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function ApplicantDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null); // 'online' | 'bank'

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/applicant/login');
      return;
    }
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await getApplicantDashboard();
      setData(response.data.data);
    } catch (error) {
      // Silent redirect or specific error toast if needed. 
      // Usually auth error handles redirect in API interceptor, 
      // but if dashboard load fails for other reasons:
      toast.error('Failed to load dashboard data');
      navigate('/applicant/login');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('receipt', file);

    setUploadingReceipt(true);
    const toastId = toast.loading('Uploading receipt...');
    
    try {
      await uploadReceiptAPI(formData);
      toast.success('Receipt uploaded successfully!', { id: toastId });
      fetchDashboard();
      setPaymentMethod(null); // Reset selection
    } catch (error) {
      toast.error('Failed to upload receipt: ' + (error.response?.data?.message || error.message), { id: toastId });
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleBankTransferRequest = async () => {
      const toastId = toast.loading('Requesting bank details...');
      try {
        await requestBankDetailsAPI();
        toast.success('Request sent! Please check your email for bank details.', { id: toastId });
        setPaymentMethod('bank_details_sent'); // Move to upload state
      } catch (error) {
        toast.error('Failed to request bank details', { id: toastId });
      }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    navigate('/');
  };

  if (loading) return <Loader fullscreen />;
  const app = data?.application;

  const StatusBadge = ({ status }) => {
    const styles = {
      submitted: 'badge-info',
      admin_review: 'badge-warning',
      payment_pending: 'badge-warning',
      payment_verified: 'badge-info',
      appointment_scheduled: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-error'
    };
    return (
      <span className={`badge ${styles[status] || 'badge-info'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <Navbar />
      <div className="container" style={{ marginTop: '2rem' }}>
        <div className="flex justify-between items-center mb-8" style={{ marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.25rem', color: 'var(--brand-900)' }}>Dashboard</h1>
            <p className="text-slate-500" style={{ margin: 0, fontSize: '1.1rem' }}>Welcome back, {app.groom_full_name}</p>
          </div>
          <button onClick={handleLogout} className="btn btn-primary">
            <LogOut size={16} /> Logout
          </button>
        </div>

        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          
          {/* Main Application Card */}
          <div className="card h-full" style={{ borderTop: '4px solid var(--brand-600)' }}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-brand-50 rounded" style={{ background: 'var(--brand-50)', padding: '8px', borderRadius: '8px' }}>
                <FileText className="text-brand-600" size={24} style={{ color: 'var(--brand-600)' }} />
              </div>
              <StatusBadge status={app.status} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Application Details</h3>
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Ref Number</span>
                <span className="font-semibold text-slate-700">{app.application_number}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Groom</span>
                <span className="font-medium">{app.groom_full_name}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Bride</span>
                <span className="font-medium">{app.bride_full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submitted</span>
                <span className="font-medium">{new Date(app.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Card */}
          <div className="card h-full" style={{ borderTop: '4px solid var(--brand-600)' }}>
            <div className="flex justify-between items-start mb-4">
               <div className="p-2 bg-brand-50 rounded" style={{ background: 'var(--brand-50)', padding: '8px', borderRadius: '8px' }}>
                <CreditCard className="text-brand-600" size={24} style={{ color: 'var(--brand-600)' }} />
              </div>
              {app.payment_status === 'verified' && <span className="badge badge-success">Paid</span>}
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Payment Status</h3>
            
            {!app.deposit_amount ? (
              <p className="text-slate-500 text-sm">Please wait for admin to set the deposit amount.</p>
            ) : (
              <div className="mt-2">
                <div className="text-2xl font-bold text-slate-800 mb-4">PKR {app.deposit_amount}</div>
                
                {app.payment_status === 'amount_set' && (
                  <div className="bg-slate-50 p-4 rounded border border-slate-200" style={{ background: 'var(--slate-50)', padding: '1rem', borderRadius: '8px' }}>
                    
                    {!paymentMethod && (
                       <div className="grid gap-3">
                          <p className="text-sm text-slate-500 mb-2">Select how you would like to pay:</p>
                          <button onClick={() => setPaymentMethod('online')} className="btn btn-primary w-full flex items-center justify-center gap-2" style={{ justifyContent: 'center' }}>
                            <CreditCard size={18} /> Pay Online (Card)
                          </button>
                          <button onClick={() => setPaymentMethod('bank')} className="btn btn-secondary w-full flex items-center justify-center gap-2" style={{ justifyContent: 'center' }}>
                            <Landmark size={18} /> Bank Transfer
                          </button>
                       </div>
                    )}

                    {paymentMethod === 'online' && (
                      <div>
                        <div className="flex justify-between items-center mb-3">
                           <h4 className="font-semibold text-slate-700 m-0">Pay Online</h4>
                           <button onClick={() => setPaymentMethod(null)} className="text-xs text-brand-600 hover:underline">Change Method</button>
                        </div>
                        <Elements stripe={stripePromise}>
                          <PaymentForm onSuccess={fetchDashboard} />
                        </Elements>
                      </div>
                    )}

                    {paymentMethod === 'bank' && (
                       <div>
                          <div className="flex justify-between items-center mb-3">
                             <h4 className="font-semibold text-slate-700 m-0">Bank Transfer</h4>
                             <button onClick={() => setPaymentMethod(null)} className="text-xs text-brand-600 hover:underline">Change Method</button>
                          </div>
                          <p className="text-sm text-slate-600 mb-4">Click below to request official bank details from the admin. You will receive them via email.</p>
                          <button onClick={handleBankTransferRequest} className="btn btn-primary w-full">Request Bank Details</button>
                       </div>
                    )}
                    
                    {(paymentMethod === 'bank_details_sent' || app.payment_receipt_url) && !app.payment_verified_at && (
                       <div className="mt-4 pt-4 border-t border-slate-200">
                          <label className="form-label mb-2 block">Upload Payment Receipt</label>
                          <p className="text-xs text-slate-500 mb-3">Once you have transferred the amount, please upload the receipt/screenshot here.</p>
                          <label className="btn btn-secondary w-full cursor-pointer flex justify-center">
                            <input type="file" onChange={handleReceiptUpload} className="hidden" style={{ display: 'none' }} accept="image/*,application/pdf" disabled={uploadingReceipt} />
                            <Upload size={16} /> {uploadingReceipt ? 'Uploading...' : 'Select File'}
                          </label>
                       </div>
                    )}
                  </div>
                )}
                
                {app.payment_receipt_url && (
                  <div className="flex items-center gap-2 text-sm text-brand-600 bg-brand-50 p-3 rounded" style={{ background: 'var(--brand-50)', color: 'var(--brand-700)', padding: '0.75rem', borderRadius: '6px' }}>
                    <CheckCircle size={16} /> Receipt uploaded successfully
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Appointment Card */}
          <div className="card h-full" style={{ borderTop: '4px solid var(--brand-600)' }}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-brand-50 rounded" style={{ background: 'var(--brand-50)', padding: '8px', borderRadius: '8px' }}>
                <Calendar className="text-brand-600" size={24} style={{ color: 'var(--brand-600)' }} />
              </div>
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Appointment</h3>
            
            {app.appointment_date ? (
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Date</span>
                  <span className="font-semibold">{new Date(app.appointment_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Time</span>
                  <span className="font-semibold">{app.appointment_time}</span>
                </div>
                <div className="pt-2">
                  <span className="text-slate-500 block text-xs mb-1">Location</span>
                  <p className="font-medium text-slate-800 m-0">{app.appointment_location}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Appointment will be scheduled after payment verification.</p>
            )}
          </div>
        </div>

        {/* Certificate Action Area */}
        {app.certificate_url && (
          <div className="card mt-6 bg-brand-50 border-brand-200" style={{ marginTop: '1.5rem', background: 'var(--brand-50)', borderColor: 'var(--brand-200)', borderTop: '4px solid var(--brand-600)' }}>
             <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-brand-800 m-0" style={{ color: 'var(--brand-900)', marginBottom: '0.25rem' }}>Certificate Available</h3>
                  <p className="text-brand-600 m-0" style={{ color: 'var(--brand-700)', margin: 0 }}>Your official marriage certificate is ready.</p>
                </div>
                <a href={`http://localhost:5000${app.certificate_url}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  <Download size={18} /> Download PDF
                </a>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
