import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Loader from '../components/Loader';
import { getApplicantDashboard, uploadReceipt as uploadReceiptAPI, requestBankDetails as requestBankDetailsAPI, createCheckoutSession, verifySession, getFileUrl } from '../services/api';
import toast from 'react-hot-toast';
import { FileText, Calendar, CreditCard, Download, Upload, CheckCircle, AlertCircle, FileCheck, User, TrendingUp, ChevronRight } from 'lucide-react';


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
         if (response.data.url) {
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
            padding: '6px 16px',
            borderRadius: '999px',
            fontSize: '0.875rem',
            fontWeight: 700,
            display: 'inline-block',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            border: '1px solid rgba(255, 255, 255, 0.3)'
         }}>
            {style.label}
         </span>
      );
   };

   // Check if all documents are uploaded
   const areAllDocumentsUploaded = () => {
      if (!app) return false;

      const basicDocs = app.groom_id_path && app.bride_id_path && app.witness1_id_path && app.witness2_id_path && app.mahr_declaration_path;
      if (!basicDocs) return false;

      // Conditional: Previously Married
      if (app.bride_previously_married) {
         if (app.bride_divorce_type === 'civil' && !app.civil_divorce_doc_path) return false;
         if (app.bride_divorce_type === 'islamic' && !app.islamic_divorce_doc_path) return false;
         if (app.bride_divorce_type === 'both' && (!app.civil_divorce_doc_path || !app.islamic_divorce_doc_path)) return false;
      }

      // Conditional: Ahle Kitab
      if (app.bride_ahle_kitab && !app.statutory_declaration_path) return false;

      return true;
   };

   const allDocumentsUploaded = areAllDocumentsUploaded();

   const StatCard = ({ title, value, icon: Icon, color, bg, variant, subtitle }) => (
      <div 
         className={`stat-card stat-card--${variant}`}
         style={{
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'default'
         }}
         onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
         }}
         onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
         }}
      >
         <div>
            <p style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.25rem', opacity: 0.9 }}>{title}</p>
            <h3 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{value}</h3>
            {subtitle && <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', margin: 0, opacity: 0.85 }}>{subtitle}</p>}
         </div>
         <div className="stat-icon" style={{ backgroundColor: bg }}>
            <Icon size={24} className={color} style={{ color: color }} />
         </div>
      </div>
   );

   return (
         <>
            {/* Hero Header */}
            <div style={{
               background: 'linear-gradient(135deg, #b05a33 0%, #8f4728 100%)',
               padding: '2rem 2.5rem',
               borderRadius: 'var(--radius-lg)',
               marginBottom: '1.5rem',
               boxShadow: '0 8px 24px rgba(176, 90, 51, 0.25)',
               position: 'relative',
               overflow: 'hidden'
            }}>
               <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '300px',
                  height: '300px',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                  borderRadius: '50%',
                  transform: 'translate(30%, -30%)'
               }}></div>
               <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                     <h1 style={{ fontSize: '2.1rem', margin: 0, color: 'white', fontWeight: 700, letterSpacing: '-0.02em' }}>My Application Dashboard</h1>
                     <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, marginTop: '0.5rem', fontSize: '1rem' }}>Track your marriage certificate application</p>
                     <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div>
                           <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Application ID</span>
                           <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: 0, marginTop: '0.25rem' }}>#{app.application_number}</p>
                        </div>
                        <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.2)' }}></div>
                        <div>
                           <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Submitted</span>
                           <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white', margin: 0, marginTop: '0.25rem' }}>{new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                     </div>
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                     <StatusPill status={app.status} />
                  </div>
               </div>
            </div>


            {/* Stats Grid */}
            <div className="stats-grid">
               <StatCard
                  title="Application Status"
                  value={app.status === 'completed' ? 'Certified' : 'Processing'}
                  icon={FileText}
                  color="white"
                  bg="rgba(255,255,255,0.15)"
                  variant="blue"
                  subtitle={new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
               />
               <StatCard
                  title="Documents Status"
                  value={allDocumentsUploaded ? 'Uploaded' : 'Pending'}
                  icon={FileCheck}
                  color="white"
                  bg="rgba(255,255,255,0.15)"
                  variant={allDocumentsUploaded ? 'green' : 'orange'}
                  subtitle={allDocumentsUploaded ? 'All documents received' : 'Action required'}
               />
               <StatCard
                  title="Payment Status"
                  value={app.payment_verified_at ? 'Verified' : app.deposit_amount ? `£${app.deposit_amount}` : 'Pending'}
                  icon={CreditCard}
                  color="white"
                  bg="rgba(255,255,255,0.15)"
                  variant={app.payment_verified_at ? 'green' : 'purple'}
                  subtitle={app.payment_verified_at ? 'Payment confirmed' : app.deposit_amount ? 'Payment due' : 'Awaiting quote'}
               />
               <StatCard
                  title="Nikah Date"
                  value={app.appointment_date ? new Date(app.appointment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBD'}
                  icon={Calendar}
                  color="white"
                  bg="rgba(255,255,255,0.15)"
                  variant="green"
                  subtitle={app.appointment_date ? `${app.appointment_time || ''}` : 'Not scheduled yet'}
               />
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2rem' }}>

               {/* Left Column: Actions & Details */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                  {/* Action Cards Section */}
                  {(!app.deposit_amount && !allDocumentsUploaded) && (
                     <div style={{
                        background: 'white',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                        border: '1px solid var(--slate-200)',
                        transition: 'box-shadow 0.3s ease'
                     }}
                     onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)'}
                     onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)'}
                     >
                        <div style={{
                           background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8f 100%)',
                           padding: '1rem 1.5rem',
                           display: 'flex',
                           alignItems: 'center',
                           gap: '0.5rem'
                        }}>
                           <AlertCircle size={18} color="white" />
                           <h3 style={{ fontSize: '1rem', margin: 0, color: 'white', fontWeight: 600 }}>Action Required</h3>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                           <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '1.25rem',
                              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid #e2e8f0',
                              marginBottom: '1rem',
                              transition: 'all 0.2s ease'
                           }}
                           onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#cbd5e1';
                              e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
                           }}
                           onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#e2e8f0';
                              e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
                           }}
                           >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                 <div style={{
                                    width: '52px',
                                    height: '52px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                                 }}>
                                    <Upload size={24} color="white" />
                                 </div>
                                 <div>
                                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--slate-800)', letterSpacing: '-0.01em' }}>Upload Documents</h4>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>Submit required ID proofs and documents</p>
                                 </div>
                              </div>
                              <button
                                 onClick={() => navigate('/applicant/upload-documents')}
                                 className="btn btn-primary"
                                 style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.5rem',
                                    boxShadow: '0 4px 12px rgba(176, 90, 51, 0.3)'
                                 }}
                              >
                                 Start <ChevronRight size={16} />
                              </button>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* Payment Receipt Submitted Confirmation */}
                  {app.status === 'payment_pending' && app.payment_receipt_url && !app.payment_verified_at && (
                     <div style={{
                        background: 'white',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.15)',
                        border: '1px solid #3b82f6',
                        transition: 'box-shadow 0.3s ease'
                     }}>
                        <div style={{
                           background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                           padding: '1rem 1.5rem',
                           display: 'flex',
                           alignItems: 'center',
                           gap: '0.5rem'
                        }}>
                           <CheckCircle size={18} color="white" />
                           <h3 style={{ fontSize: '1rem', margin: 0, color: 'white', fontWeight: 600 }}>Payment Receipt Submitted</h3>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                           <p style={{ fontSize: '0.95rem', color: 'var(--slate-700)', margin: 0 }}>
                              Thank you! Your payment receipt has been submitted successfully. Our admin team will verify your payment shortly and you'll be notified once approved.
                           </p>
                        </div>
                     </div>
                  )}

                  {/* Urgent Payment Action Card */}
                  {app.status === 'payment_pending' && app.deposit_amount && !app.payment_verified_at && !app.payment_receipt_url && (
                     <div style={{
                        background: 'white',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(245, 158, 11, 0.15)',
                        border: '1px solid #fbbf24',
                        transition: 'box-shadow 0.3s ease'
                     }}
                     onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 30px rgba(245, 158, 11, 0.25)'}
                     onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 20px rgba(245, 158, 11, 0.15)'}
                     >
                        <div style={{
                           background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                           padding: '1rem 1.5rem',
                           display: 'flex',
                           alignItems: 'center',
                           gap: '0.5rem'
                        }}>
                           <AlertCircle size={18} color="white" />
                           <h3 style={{ fontSize: '1rem', margin: 0, color: 'white', fontWeight: 600 }}>Payment Required</h3>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                           <p style={{ fontSize: '0.95rem', color: 'var(--slate-700)', marginBottom: '1rem' }}>
                              Please complete the payment of <strong style={{ fontSize: '1.1rem', color: 'var(--brand-600)' }}>£{app.deposit_amount}</strong> to proceed with your application.
                           </p>

                           {!paymentMethod && (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                 <button 
                                    onClick={handleOnlinePayment} 
                                    className="btn btn-primary" 
                                    style={{ 
                                       width: '100%',
                                       boxShadow: '0 4px 12px rgba(176, 90, 51, 0.3)',
                                       transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                       e.currentTarget.style.transform = 'translateY(-2px)';
                                       e.currentTarget.style.boxShadow = '0 6px 16px rgba(176, 90, 51, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                       e.currentTarget.style.transform = 'translateY(0)';
                                       e.currentTarget.style.boxShadow = '0 4px 12px rgba(176, 90, 51, 0.3)';
                                    }}
                                 >
                                    💳 Pay Online Now
                                 </button>
                                 <button 
                                    onClick={handleBankTransferClick} 
                                    className="btn" 
                                    style={{ 
                                       width: '100%', 
                                       background: 'white', 
                                       border: '1px solid var(--slate-300)',
                                       transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                       e.currentTarget.style.transform = 'translateY(-2px)';
                                       e.currentTarget.style.borderColor = 'var(--slate-400)';
                                       e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                       e.currentTarget.style.transform = 'translateY(0)';
                                       e.currentTarget.style.borderColor = 'var(--slate-300)';
                                       e.currentTarget.style.boxShadow = 'none';
                                    }}
                                 >
                                    🏦 Bank Transfer
                                 </button>
                              </div>
                           )}

                           {paymentMethod === 'bank' && (
                              <div style={{ 
                                 background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                                 padding: '1.5rem', 
                                 borderRadius: 'var(--radius-md)', 
                                 border: '1px solid #cbd5e1',
                                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                              }}>
                                 <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--slate-800)', letterSpacing: '-0.01em' }}>Bank Transfer Details</h4>
                                 <div style={{ 
                                    fontSize: '0.875rem', 
                                    color: 'var(--slate-700)', 
                                    marginBottom: '1.25rem',
                                    background: 'white',
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid #e2e8f0'
                                 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                       <strong style={{ color: 'var(--slate-600)' }}>Account Name:</strong> <span style={{ fontWeight: 500 }}>Jamiyat Tabligh-ul-Islam</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                       <strong style={{ color: 'var(--slate-600)' }}>Sort Code:</strong> <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>30-63-55</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                       <strong style={{ color: 'var(--slate-600)' }}>Account No:</strong> <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>77990060</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                                       <strong style={{ color: 'var(--slate-600)' }}>Reference:</strong> <span style={{ color: 'var(--brand-600)', fontWeight: 700, fontSize: '0.95rem' }}>{app.application_number}</span>
                                    </div>
                                 </div>
                                 <p style={{ 
                                    fontSize: '0.85rem', 
                                    color: 'var(--slate-600)', 
                                    marginBottom: '1rem',
                                    padding: '0.75rem',
                                    background: '#fffbeb',
                                    border: '1px solid #fcd34d',
                                    borderRadius: 'var(--radius-md)'
                                 }}>
                                    💡 After completing the transfer, upload your receipt below for verification.
                                 </p>
                                 <label style={{ display: 'block', width: '100%', marginBottom: '0.75rem' }}>
                                    <input type="file" onChange={handleReceiptUpload} style={{ display: 'none' }} disabled={uploadingReceipt} />
                                    <div className="btn btn-primary" style={{ 
                                       width: '100%', 
                                       textAlign: 'center', 
                                       cursor: 'pointer',
                                       boxShadow: '0 4px 12px rgba(176, 90, 51, 0.3)'
                                    }}>
                                       {uploadingReceipt ? '⏳ Uploading...' : '📎 Upload Receipt'}
                                    </div>
                                 </label>
                                 <button 
                                    onClick={() => setPaymentMethod(null)} 
                                    className="btn btn-sm" 
                                    style={{ 
                                       width: '100%', 
                                       background: 'white', 
                                       color: 'var(--slate-600)',
                                       border: '1px solid var(--slate-300)'
                                    }}
                                 >
                                    ← Back to Payment Options
                                 </button>
                              </div>
                           )}
                        </div>
                     </div>
                  )}

                  {/* Application Details Card */}
                  <div style={{
                     background: 'white',
                     borderRadius: 'var(--radius-lg)',
                     overflow: 'hidden',
                     boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                     border: '1px solid var(--slate-200)',
                     transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                     e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
                     e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                     e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                     e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  >
                     <div style={{
                        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8f 100%)',
                        padding: '1rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                     }}>
                        <User size={18} color="white" />
                        <h3 style={{ fontSize: '1rem', margin: 0, color: 'white', fontWeight: 600 }}>Applicant Details</h3>
                     </div>
                     <div style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                           <div>
                              <label style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>Groom</label>
                              <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: 'var(--slate-800)' }}>{app.groom_full_name}</p>
                              <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', margin: 0, marginTop: '0.25rem' }}>{app.groom_phone}</p>
                              {app.groom_email && <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', margin: 0 }}>{app.groom_email}</p>}
                           </div>
                           <div>
                              <label style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>Bride</label>
                              <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: 'var(--slate-800)' }}>{app.bride_full_name}</p>
                              <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', margin: 0, marginTop: '0.25rem' }}>{app.bride_phone}</p>
                              {app.bride_email && <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', margin: 0 }}>{app.bride_email}</p>}
                           </div>
                        </div>
                        {app.appointment_location && (
                           <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                              <label style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>Ceremony Location</label>
                              <p style={{ fontSize: '0.95rem', margin: 0, color: 'var(--slate-700)' }}>{app.appointment_location}</p>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Certificate Download */}
                  {app.certificate_url && (
                     <div style={{
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        boxShadow: '0 8px 24px rgba(5, 150, 105, 0.35)',
                        border: '1px solid #059669',
                        position: 'relative',
                        transition: 'all 0.3s ease'
                     }}
                     onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(5, 150, 105, 0.45)';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                     }}
                     onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(5, 150, 105, 0.35)';
                        e.currentTarget.style.transform = 'translateY(0)';
                     }}
                     >
                        <div style={{
                           position: 'absolute',
                           top: '-50px',
                           right: '-50px',
                           width: '200px',
                           height: '200px',
                           background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                           borderRadius: '50%'
                        }}></div>
                        <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                           <div>
                              <h3 style={{ color: 'white', margin: 0, fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
                                 <CheckCircle size={28} style={{ display: 'inline', marginRight: '0.75rem', verticalAlign: 'middle' }} />
                                 Certificate Ready
                              </h3>
                              <p style={{ color: 'rgba(255,255,255,0.95)', margin: 0, fontSize: '0.95rem', paddingLeft: '2.5rem' }}>Your digital nikkah certificate is available for download.</p>
                           </div>
                           <a 
                              href={getFileUrl(app.certificate_url)} 
                              target="_blank" 
                              className="btn" 
                              style={{ 
                                 backgroundColor: 'white', 
                                 color: '#059669', 
                                 border: 'none', 
                                 fontWeight: 600,
                                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                 transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                 e.currentTarget.style.transform = 'scale(1.05)';
                                 e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                 e.currentTarget.style.transform = 'scale(1)';
                                 e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                              }}
                           >
                              <Download size={18} /> Download PDF
                           </a>
                        </div>
                     </div>
                  )}
               </div>

               {/* Right Column: Progress & Info */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Application Progress Card */}
                  <div style={{
                     background: 'white',
                     borderRadius: 'var(--radius-lg)',
                     overflow: 'hidden',
                     boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                     border: '1px solid var(--slate-200)',
                     transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                     e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
                     e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                     e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                     e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  >
                     <div style={{
                        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8f 100%)',
                        padding: '1rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                     }}>
                        <TrendingUp size={18} color="white" />
                        <h3 style={{ fontSize: '1rem', margin: 0, color: 'white', fontWeight: 600 }}>Application Progress</h3>
                     </div>
                     <div style={{ padding: '1.5rem' }}>
                        <div className="timeline" style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '3px solid #e2e8f0' }}>

                           <div style={{ marginBottom: '1.75rem', position: 'relative' }}>
                              <div style={{ position: 'absolute', left: '-26px', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#2563eb', border: '3px solid white', boxShadow: '0 0 0 3px #2563eb' }}></div>
                              <h4 style={{ fontSize: '0.95rem', margin: 0, color: '#1e293b', fontWeight: 600 }}>Application Submitted</h4>
                              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, marginTop: '0.25rem' }}>{new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                           </div>

                           <div style={{ marginBottom: '1.75rem', position: 'relative' }}>
                              <div style={{ position: 'absolute', left: '-26px', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: (app.groom_id_path || app.bride_id_path) ? '#2563eb' : '#cbd5e1', border: '3px solid white', boxShadow: (app.groom_id_path || app.bride_id_path) ? '0 0 0 3px #2563eb' : 'none' }}></div>
                              <h4 style={{ fontSize: '0.95rem', margin: 0, color: (app.groom_id_path || app.bride_id_path) ? '#1e293b' : '#94a3b8', fontWeight: 600 }}>Documents Uploaded</h4>
                              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, marginTop: '0.25rem' }}>
                                 {(app.groom_id_path || app.bride_id_path) ? 'Submitted Successfully' : 'Pending Upload'}
                              </p>
                           </div>

                           <div style={{ marginBottom: '1.75rem', position: 'relative' }}>
                              <div style={{ position: 'absolute', left: '-26px', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: app.documents_verified ? '#2563eb' : '#cbd5e1', border: '3px solid white', boxShadow: app.documents_verified ? '0 0 0 3px #2563eb' : 'none' }}></div>
                              <h4 style={{ fontSize: '0.95rem', margin: 0, color: app.documents_verified ? '#1e293b' : '#94a3b8', fontWeight: 600 }}>Documents Verified</h4>
                              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, marginTop: '0.25rem' }}>
                                 {app.documents_verified ? (app.documents_verified_at ? new Date(app.documents_verified_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Verified') : 'Under Review'}
                              </p>
                           </div>

                           <div style={{ marginBottom: '1.75rem', position: 'relative' }}>
                              <div style={{ position: 'absolute', left: '-26px', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: app.deposit_amount ? '#2563eb' : '#cbd5e1', border: '3px solid white', boxShadow: app.deposit_amount ? '0 0 0 3px #2563eb' : 'none' }}></div>
                              <h4 style={{ fontSize: '0.95rem', margin: 0, color: app.deposit_amount ? '#1e293b' : '#94a3b8', fontWeight: 600 }}>Payment Quote Set</h4>
                              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, marginTop: '0.25rem' }}>
                                 {app.deposit_amount ? `Amount: £${app.deposit_amount}` : 'Awaiting Quote'}
                              </p>
                           </div>

                           <div style={{ marginBottom: '1.75rem', position: 'relative' }}>
                              <div style={{ position: 'absolute', left: '-26px', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: app.payment_verified_at ? '#2563eb' : '#cbd5e1', border: '3px solid white', boxShadow: app.payment_verified_at ? '0 0 0 3px #2563eb' : 'none' }}></div>
                              <h4 style={{ fontSize: '0.95rem', margin: 0, color: app.payment_verified_at ? '#1e293b' : '#94a3b8', fontWeight: 600 }}>Payment Verification</h4>
                              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, marginTop: '0.25rem' }}>
                                 {app.payment_verified_at ? new Date(app.payment_verified_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Pending Payment'}
                              </p>
                           </div>

                           <div style={{ marginBottom: '1.75rem', position: 'relative' }}>
                              <div style={{ position: 'absolute', left: '-26px', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: app.appointment_date ? '#2563eb' : '#cbd5e1', border: '3px solid white', boxShadow: app.appointment_date ? '0 0 0 3px #2563eb' : 'none' }}></div>
                              <h4 style={{ fontSize: '0.95rem', margin: 0, color: app.appointment_date ? '#1e293b' : '#94a3b8', fontWeight: 600 }}>Nikkah Scheduled</h4>
                              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, marginTop: '0.25rem' }}>
                                 {app.appointment_date ? new Date(app.appointment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Awaiting Confirmation'}
                              </p>
                           </div>

                           <div style={{ position: 'relative' }}>
                              <div style={{ position: 'absolute', left: '-26px', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: app.status === 'completed' ? '#059669' : '#cbd5e1', border: '3px solid white', boxShadow: app.status === 'completed' ? '0 0 0 3px #059669' : 'none' }}></div>
                              <h4 style={{ fontSize: '0.95rem', margin: 0, color: app.status === 'completed' ? '#065f46' : '#94a3b8', fontWeight: 600 }}>Certificate Issued</h4>
                              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, marginTop: '0.25rem' }}>
                                 {app.status === 'completed' ? 'Available for Download' : 'Pending Completion'}
                              </p>
                           </div>

                        </div>
                     </div>
                  </div>

               </div>

            </div>
      </>
   );
}
