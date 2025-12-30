import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ApplicantNavbar from '../components/ApplicantNavbar';
import Loader from '../components/Loader';
import { getApplicantDashboard, uploadReceipt as uploadReceiptAPI, requestBankDetails as requestBankDetailsAPI, createCheckoutSession, verifySession } from '../services/api';
import toast from 'react-hot-toast';
import { FileText, Calendar, CreditCard, Download, Upload, CheckCircle, LogOut, Landmark, AlertCircle, Clock } from 'lucide-react';


export default function ApplicantDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null); // 'online' | 'bank'
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/applicant/login');
      return;
    }
    fetchDashboard();
    checkPaymentStatus();
  }, []);

  const checkPaymentStatus = async () => {
      const success = searchParams.get('payment_success');
      const sessionId = searchParams.get('session_id');
      const cancelled = searchParams.get('payment_cancelled');

      if (success && sessionId) {
        setSearchParams({}); // Clear params
        const toastId = toast.loading('Verifying payment...');
        try {
          await verifySession(sessionId);
          toast.success('Payment verified successfully!', { id: toastId });
          fetchDashboard(); // Refresh data
        } catch (error) {
          toast.error('Payment verification failed: ' + (error.response?.data?.message || error.message), { id: toastId });
        }
      } else if (cancelled) {
          setSearchParams({});
          toast.error('Payment cancelled');
      }
  };

  const fetchDashboard = async () => {
    try {
      const response = await getApplicantDashboard();
      setData(response.data.data);
    } catch (error) {
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

  const handleOnlinePayment = async () => {
    // Check if documents are uploaded and verified

    
    const toastId = toast.loading('Redirecting to checkout...');
    try {
        const response = await createCheckoutSession();
        if(response.data.url) {
            window.location.href = response.data.url;
        }
    } catch (error) {
        toast.error('Failed to initiate payment: ' + (error.response?.data?.message || 'Server Error'), { id: toastId });
    }
  };
  
  const handleBankTransferClick = () => {
    // Check if documents are uploaded and verified

    
    setPaymentMethod('bank');
  };

  if (loading) return <Loader fullscreen />;
  const app = data?.application;

  const StatusPill = ({ status }) => {
    const styles = {
      submitted: { bg: '#e0f2fe', color: '#0369a1', label: 'Submitted' },
      admin_review: { bg: '#fff7ed', color: '#c2410c', label: 'Under Review' },
      payment_pending: { bg: '#fef3c7', color: '#b45309', label: 'Payment Pending' },
      payment_verified: { bg: '#dcfce7', color: '#15803d', label: 'Payment Verified' },
      appointment_scheduled: { bg: '#f0f9ff', color: '#0369a1', label: 'Scheduled' },
      completed: { bg: '#dcfce7', color: '#15803d', label: 'Completed' },
      cancelled: { bg: '#fee2e2', color: '#b91c1c', label: 'Cancelled' }
    };
    
    const style = styles[status] || styles.submitted;
    
    return (
      <span style={{ 
         backgroundColor: style.bg, 
         color: style.color, 
         padding: '4px 12px', 
         borderRadius: '999px',
         fontSize: '0.85rem',
         fontWeight: 600,
         display: 'inline-block'
      }}>
        {style.label}
      </span>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--slate-50)' }}>
      <ApplicantNavbar />
      
      <main className="container" style={{ maxWidth: '1200px', padding: '2rem 1rem' }}>
        <div className="mb-6">
           <h1 style={{ fontSize: '2rem', margin: 0 }}>My Application</h1>
           <p className="text-muted">Tracking Application #{app.application_number}</p>
        </div>


        <div className="stats-grid">
           {/* Application Status Card */}
           <div className="stat-card" style={{ display: 'block' }}>
              <div className="d-flex justify-between items-center mb-4">
                 <div className="stat-icon" style={{ backgroundColor: '#eff6ff' }}>
                    <FileText size={24} color="#2563eb" />
                 </div>
                 <StatusPill status={app.status} />
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--slate-500)' }}>Current Status</h3>
              <p style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>
                 {app.status === 'completed' ? 'Marriage Certified' : 'Processing'}
              </p>
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--slate-500)' }}>
                 Applied on {new Date(app.created_at).toLocaleDateString()}
              </div>
           </div>

           {/* Appointment Card */}
           <div className="stat-card" style={{ display: 'block' }}>
              <div className="d-flex justify-between items-center mb-4">
                 <div className="stat-icon" style={{ backgroundColor: '#ecfdf5' }}>
                    <Calendar size={24} color="#059669" />
                 </div>
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--slate-500)' }}>Nikah Date</h3>
              {app.appointment_date ? (
                 <>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--brand-900)' }}>
                       {new Date(app.appointment_date).toLocaleDateString()}
                    </p>
                    <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                       {app.appointment_time} at {app.appointment_location}
                    </p>
                 </>
              ) : (
                 <p style={{ color: 'var(--slate-400)', fontStyle: 'italic' }}>Not scheduled yet</p>
              )}
           </div>

           {/* Payment Summary */}
           <div className="stat-card" style={{ display: 'block' }}>
              <div className="d-flex justify-between items-center mb-4">
                 <div className="stat-icon" style={{ backgroundColor: '#fff7ed' }}>
                    <CreditCard size={24} color="#ea580c" />
                 </div>
                 {app.payment_status === 'verified' && (
                    <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                       <CheckCircle size={16} /> Paid
                    </span>
                 )}
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--slate-500)' }}>Payment Status</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                 {app.deposit_amount ? `PKR ${app.deposit_amount}` : 'Pending Quote'}
              </p>
           </div>
        </div>

        {/* Detailed Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2rem' }}>
           
           {/* Left Column: Details & Actions */}
           <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
               
               {/* Document Upload Action Card */}
               <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
                  <div className="d-flex justify-between items-start">
                     <div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <Upload size={20} className="text-blue-600" /> Upload Documents
                        </h3>
                        <p className="text-sm text-slate-600 mb-4" style={{ maxWidth: '90%' }}>
                           Please upload your ID proofs, address proof, and other required documents to proceed.
                        </p>
                     </div>
                  </div>
                  <button 
                     onClick={() => navigate('/applicant/upload-documents')} 
                     className="btn btn-primary"
                     style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                  >
                     <Upload size={18} /> Upload Documents
                  </button>
               </div>
               {/* Urgent Action Card (Payment) */}
               {app.status === 'payment_pending' && app.deposit_amount && !app.payment_verified_at && (
                 <div className="card" style={{ border: '1px solid #fcd34d', backgroundColor: '#fffbeb' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <AlertCircle size={20} /> Action Required: Payment
                    </h3>
                    <p className="text-sm text-slate-700 mb-4">
                       Please complete the payment of <strong>PKR {app.deposit_amount}</strong> to proceed with your application.
                    </p>
                    
                     {!paymentMethod && (
                        <div className="d-flex gap-3">
                           <button onClick={handleOnlinePayment} className="btn btn-primary" style={{ flex: 1 }}>
                              Pay Online Now
                           </button>
                           <button onClick={handleBankTransferClick} className="btn btn-secondary" style={{ flex: 1, backgroundColor: 'white' }}>
                              Bank Transfer
                           </button>
                        </div>
                     )}

                    {paymentMethod === 'online' && (
                       <div className="bg-white p-4 rounded border border-warning">
                          <p className="mb-4 text-sm">You will be redirected to our secure payment gateway.</p>
                          <button onClick={handleOnlinePayment} className="btn btn-primary w-full">Proceed to Pay</button>
                          <button onClick={() => setPaymentMethod(null)} className="btn btn-sm btn-link mt-2 text-muted">Cancel</button>
                       </div>
                    )}

                     {paymentMethod === 'bank' && (
                       <div className="bg-white p-4 rounded border border-warning">
                          <h4 className="font-bold text-sm mb-2">Bank Details</h4>
                          <ul className="text-sm text-slate-600 mb-4" style={{ listStyle: 'none', padding: 0 }}>
                             <li>Account Name: Jamiyat Tabligh-ul-Islam</li>
                             <li>Sort Code: 30-63-55</li>
                             <li>Account No: 77990060</li>
                             <li>Ref: {app.application_number}</li>
                          </ul>
                          <p className="text-xs text-muted mb-2">After transfer, upload receipt below.</p>
                          <label className="btn btn-secondary w-full cursor-pointer text-center block">
                             <input type="file" onChange={handleReceiptUpload} className="hidden" style={{ display: 'none' }} disabled={uploadingReceipt} />
                             {uploadingReceipt ? 'Uploading...' : 'Upload Receipt'}
                          </label>
                          <button onClick={() => setPaymentMethod(null)} className="btn btn-sm btn-link mt-2 text-muted w-full">Back</button>
                       </div>
                    )}
                 </div>
              )}

              {/* Application Info */}
              <div className="card">
                 <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Applicant Details</h3>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                       <label className="text-xs text-muted uppercase font-bold">Groom</label>
                       <p className="font-medium text-lg m-0 text-slate-800">{app.groom_full_name}</p>
                       <p className="text-sm text-muted">{app.groom_phone}</p>
                    </div>
                    <div>
                       <label className="text-xs text-muted uppercase font-bold">Bride</label>
                       <p className="font-medium text-lg m-0 text-slate-800">{app.bride_full_name}</p>
                       <p className="text-sm text-muted">{app.bride_phone}</p>
                    </div>
                 </div>
              </div>

               {/* Certificate Download */}
               {app.certificate_url && (
                  <div className="card" style={{ backgroundColor: '#ecfdf5', borderColor: '#6ee7b7' }}>
                     <div className="d-flex justify-between items-center">
                        <div>
                           <h3 style={{ color: '#065f46', margin: 0, fontSize: '1.2rem' }}>Certificate Ready</h3>
                           <p style={{ color: '#047857', marginTop: '0.25rem' }}>Your digital marriage certificate is available.</p>
                        </div>
                        <a href={`http://localhost:5000${app.certificate_url}`} target="_blank" className="btn btn-success text-white" style={{ backgroundColor: '#059669', border: 'none' }}>
                           <Download size={18} /> Download PDF
                        </a>
                     </div>
                  </div>
               )}
           </div>

           {/* Right Column: Timeline/Steps */}
           <div className="card" style={{ height: 'fit-content' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Application Progress</h3>
              <div className="timeline" style={{ position: 'relative', paddingLeft: '1rem', borderLeft: '2px solid #e2e8f0' }}>
                 
                 <div style={{ marginBottom: '2rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-21px', top: '0', width: '12px', height: '12px', borderRadius: '50%', background: '#2563eb', border: '2px solid white', boxShadow: '0 0 0 2px #2563eb' }}></div>
                    <h4 style={{ fontSize: '0.95rem', margin: 0, color: '#1e293b' }}>Application Submitted</h4>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>{new Date(app.created_at).toLocaleDateString()}</p>
                 </div>

                 <div style={{ marginBottom: '2rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-21px', top: '0', width: '12px', height: '12px', borderRadius: '50%', background: app.deposit_amount ? '#2563eb' : '#cbd5e1', border: '2px solid white', boxShadow: app.deposit_amount ? '0 0 0 2px #2563eb' : 'none' }}></div>
                    <h4 style={{ fontSize: '0.95rem', margin: 0, color: app.deposit_amount ? '#1e293b' : '#94a3b8' }}>Admin Review</h4>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                       {app.deposit_amount ? 'Quote Received' : 'Waiting for review'}
                    </p>
                 </div>

                 <div style={{ marginBottom: '2rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-21px', top: '0', width: '12px', height: '12px', borderRadius: '50%', background: app.payment_verified_at ? '#2563eb' : '#cbd5e1', border: '2px solid white', boxShadow: app.payment_verified_at ? '0 0 0 2px #2563eb' : 'none' }}></div>
                    <h4 style={{ fontSize: '0.95rem', margin: 0, color: app.payment_verified_at ? '#1e293b' : '#94a3b8' }}>Payment Verification</h4>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                       {app.payment_verified_at ? 'Verified' : 'Pending'}
                    </p>
                 </div>

                 <div style={{ marginBottom: '2rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-21px', top: '0', width: '12px', height: '12px', borderRadius: '50%', background: app.appointment_date ? '#2563eb' : '#cbd5e1', border: '2px solid white', boxShadow: app.appointment_date ? '0 0 0 2px #2563eb' : 'none' }}></div>
                    <h4 style={{ fontSize: '0.95rem', margin: 0, color: app.appointment_date ? '#1e293b' : '#94a3b8' }}>Nikkah Scheduled</h4>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                        {app.appointment_date ? 'Date Confirmed' : 'Pending'}
                    </p>
                 </div>

                 <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-21px', top: '0', width: '12px', height: '12px', borderRadius: '50%', background: app.status === 'completed' ? '#059669' : '#cbd5e1', border: '2px solid white', boxShadow: app.status === 'completed' ? '0 0 0 2px #059669' : 'none' }}></div>
                    <h4 style={{ fontSize: '0.95rem', margin: 0, color: app.status === 'completed' ? '#065f46' : '#94a3b8' }}>Certificate Wyd</h4>
                 </div>

              </div>
           </div>

        </div>

      </main>
    </div>
  );
}
