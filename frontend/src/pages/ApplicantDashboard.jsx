import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Loader from '../components/Loader';
import {
  getApplicantDashboard,
  uploadReceipt as uploadReceiptAPI,
  createCheckoutSession,
  verifySession,
} from '../services/api';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  FileText,
  Calendar,
  CreditCard,
  Upload,
  CheckCircle,
  AlertCircle,
  FileCheck,
  User,
  TrendingUp,
  ChevronRight,
  Download,
} from 'lucide-react';


export default function ApplicantDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [showBankTransfer, setShowBankTransfer] = useState(false);

  // Handle Stripe redirect query params (payment_success / payment_cancelled)
  useEffect(() => {
    const success = searchParams.get('payment_success');
    const cancelled = searchParams.get('payment_cancelled');
    const sessionId = searchParams.get('session_id');

    const clearParams = () => {
      // Remove query params from URL after handling
      navigate('/applicant/dashboard', { replace: true });
    };

    const handleVerification = async () => {
      if (success === 'true' && sessionId) {
        const toastId = toast.loading('Verifying online payment...');
        try {
          await verifySession(sessionId);
          toast.success('Payment verified successfully.', { id: toastId });
          fetchDashboard();
        } catch (error) {
          console.error('Error verifying payment session:', error);
          toast.error(
            error.response?.data?.message ||
              'Failed to verify payment. Please contact support.',
            { id: toastId }
          );
        } finally {
          clearParams();
        }
      } else if (cancelled === 'true') {
        toast('Online payment was cancelled.', { icon: '⚠️' });
        clearParams();
      }
    };

    handleVerification();
  }, [searchParams, navigate]);

  useEffect(() => {
     // Auth check is handled by ApplicantLayout, but we still check here as a safety measure
     const token = localStorage.getItem("token");
     const userType = localStorage.getItem("userType");

     if (!token) {
       const returnUrl = "/applicant/dashboard";
       navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`);
       return;
     }

     // Redirect admin users to admin dashboard
     if (userType === "admin" || userType === "super_admin") {
       navigate("/admin/dashboard");
       return;
     }

     fetchDashboard();
   }, [navigate]);

   const fetchDashboard = async () => {
     try {
       const response = await getApplicantDashboard();
       setData(response.data.data);
     } catch (error) {
       // Only show error if it's not a 401 (unauthorized) - auth errors are handled by redirect
       if (error.response?.status !== 401) {
         console.error("Error fetching dashboard:", error);
         const errorMessage =
           error.response?.data?.message || "Failed to load dashboard data";
         toast.error(errorMessage);
       }
       // For 401, redirect is handled by ApplicantLayout
     } finally {
       setLoading(false);
     }
   };

   const handleReceiptUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) {
         toast.error('Please select a receipt file');
         return;
      }

      const formData = new FormData();
      formData.append('receipt', file);

      setUploadingReceipt(true);
      const toastId = toast.loading('Uploading receipt...');

      try {
        await uploadReceiptAPI(formData);
        toast.success('Receipt uploaded successfully!', { id: toastId });
        fetchDashboard();
      } catch (error) {
        toast.error(
          'Failed to upload receipt: ' +
            (error.response?.data?.message || error.message),
          { id: toastId }
        );
      } finally {
        setUploadingReceipt(false);
      }
   };

   const handleDownloadCertificate = async () => {
      if (!app || !app.certificate_url || app.status !== 'completed') {
         toast.error('Certificate not yet available');
         return;
      }

      const toastId = toast.loading('Preparing certificate download...');
      try {
         // Fetch the certificate file as a blob
         const response = await api.get('/applicants/certificate', {
            responseType: 'blob'
         });
         
         // Create a blob URL and trigger download
         const blob = new Blob([response.data], { type: 'application/pdf' });
         const url = window.URL.createObjectURL(blob);
         const link = document.createElement('a');
         link.href = url;
         link.download = `marriage-certificate-${app.application_number || 'certificate'}.pdf`;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         window.URL.revokeObjectURL(url);
         
         toast.success('Certificate downloaded successfully!', { id: toastId });
      } catch (error) {
         console.error('Error downloading certificate:', error);
         // Try to parse error message from blob response
         if (error.response?.data instanceof Blob) {
            const text = await error.response.data.text();
            try {
               const errorData = JSON.parse(text);
               toast.error('Failed to download certificate: ' + (errorData.message || 'Unknown error'), { id: toastId });
            } catch {
               toast.error('Failed to download certificate', { id: toastId });
            }
         } else {
            toast.error('Failed to download certificate: ' + (error.response?.data?.message || error.message), { id: toastId });
         }
      }
   };

   const handlePayOnline = async () => {
      const toastId = toast.loading('Redirecting to secure payment...');
      try {
        const response = await createCheckoutSession();
        const url = response.data?.url;
        if (url) {
          window.location.href = url;
        } else {
          toast.error('Failed to start online payment. Please try bank transfer.', { id: toastId });
        }
      } catch (error) {
        console.error('Error starting online payment:', error);
        toast.error(
          error.response?.data?.message ||
            'Failed to start online payment. Please try bank transfer.',
          { id: toastId }
        );
      }
   };

   if (loading) return <Loader fullscreen />;
   
   // Check if data is available
   if (!data || !data.application) {
      return (
         <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--slate-600)', fontSize: '1.1rem' }}>No application data available.</p>
            <button 
               onClick={() => navigate('/applicant/login')}
               className="btn btn-primary"
               style={{ marginTop: '1rem' }}
            >
               Return to Login
            </button>
         </div>
      );
   }

   const app = data.application;

   const StatusPill = ({ status }) => {
      const styles = {
         submitted: { bg: '#dbeafe', color: '#1e40af', label: 'Submitted', borderColor: '#93c5fd' },
         admin_review: { bg: '#fed7aa', color: '#9a3412', label: 'Under Review', borderColor: '#fdba74' },
         payment_pending: { bg: '#fde68a', color: '#92400e', label: 'Payment Pending', borderColor: '#fcd34d' },
         payment_verified: { bg: '#bbf7d0', color: '#166534', label: 'Payment Verified', borderColor: '#86efac' },
         completed: { bg: '#bbf7d0', color: '#166534', label: 'Completed', borderColor: '#86efac' },
         cancelled: { bg: '#fecaca', color: '#991b1b', label: 'Cancelled', borderColor: '#fca5a5' }
      };

      const style = styles[status] || styles.submitted;

      return (
         <span style={{
            backgroundColor: style.bg,
            color: style.color,
            padding: '8px 18px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 600,
            display: 'inline-block',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            border: `1.5px solid ${style.borderColor}`,
            transition: 'all 0.2s ease'
         }}>
            {style.label}
         </span>
      );
   };


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
            <div className="applicant-dashboard-hero" style={{
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
               }} className="hide-mobile"></div>
               <div style={{ 
                  position: 'relative', 
                  zIndex: 1, 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '1rem'
               }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                     <h1 style={{ 
                        fontSize: 'clamp(1.5rem, 4vw, 2.1rem)', 
                        margin: 0, 
                        color: 'white', 
                        fontWeight: 700, 
                        letterSpacing: '-0.02em' 
                     }}>
                        My Application Dashboard
                     </h1>
                     <p style={{ 
                        color: 'rgba(255,255,255,0.9)', 
                        margin: 0, 
                        marginTop: '0.5rem', 
                        fontSize: 'clamp(0.9rem, 2vw, 1rem)' 
                     }}>
                        Track your marriage application
                     </p>
                     <div style={{ 
                        marginTop: '1rem', 
                        display: 'flex', 
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '1rem' 
                     }}>
                        <div>
                           <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Application ID</span>
                           <p style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)', fontWeight: 700, color: 'white', margin: 0, marginTop: '0.25rem' }}>#{app.application_number}</p>
                        </div>
                        <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.2)' }} className="hide-mobile"></div>
                        <div>
                           <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Submitted</span>
                           <p style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', fontWeight: 600, color: 'white', margin: 0, marginTop: '0.25rem' }}>
                              {new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                           </p>
                        </div>
                     </div>
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                     <StatusPill status={app.status} />
                  </div>
               </div>
               {/* Certificate download button disabled - hidden from users */}
               {false && app.status === 'completed' && app.certificate_url && (
                  <button
                     onClick={handleDownloadCertificate}
                     className="btn btn-primary"
                     style={{
                        position: 'absolute',
                        bottom: '1.5rem',
                        right: '1.5rem',
                        background: 'rgba(255,255,255,0.95)',
                        color: '#b05a33',
                        border: 'none',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                        transition: 'all 0.2s ease',
                        zIndex: 2
                     }}
                     onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
                     }}
                     onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                     }}
                  >
                     <Download size={18} />
                     Download Certificate
                  </button>
               )}
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
                  title="Payment Status"
                  value={
                     app.payment_verified_at 
                        ? 'Verified' 
                        : app.status === 'payment_pending' && app.deposit_amount 
                           ? `£${app.deposit_amount}` 
                           : 'Pending'
                  }
                  icon={CreditCard}
                  color="white"
                  bg="rgba(255,255,255,0.15)"
                  variant={
                     app.payment_verified_at 
                        ? 'teal' 
                        : 'purple'
                  }
                  subtitle={
                     app.payment_verified_at 
                        ? 'Payment confirmed' 
                        : app.status === 'payment_pending' && app.deposit_amount 
                           ? 'Payment due' 
                           : 'Pending'
                  }
               />
               <StatCard
                  title="Nikah Date"
                  value={app.solemnised_date ? new Date(app.solemnised_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
                  icon={Calendar}
                  color="white"
                  bg="rgba(255,255,255,0.15)"
                  variant={app.solemnised_date ? 'indigo' : 'orange'}
                  subtitle={app.solemnised_time ? (() => {
                    const [hours, minutes] = app.solemnised_time.substring(0, 5).split(':');
                    const hour12 = parseInt(hours) % 12 || 12;
                    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
                    return `${hour12}:${minutes} ${ampm}`;
                  })() : (app.solemnised_date ? 'Time not set' : 'Not set yet')}
               />
            </div>

            {/* Main Content Grid */}
            <div className="applicant-content-grid" style={{ 
               display: 'grid', 
               gridTemplateColumns: '2fr 1fr', 
               gap: '2rem', 
               marginTop: '2rem' 
            }}>

               {/* Left Column: Actions & Details */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Payment Required Card - shown when payment is pending and no receipt uploaded */}
              {app.status === 'payment_pending' && app.deposit_amount && !app.payment_receipt_url && (
                     <div style={{
                        background: 'white',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.15)',
                        border: '2px solid #3b82f6',
                        transition: 'box-shadow 0.3s ease'
                     }}>
                        <div style={{
                           background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                           padding: '1.5rem',
                           display: 'flex',
                           alignItems: 'center',
                           gap: '0.75rem'
                        }}>
                           <AlertCircle size={20} color="white" />
                           <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'white', fontWeight: 600 }}>
                              Payment Required
                           </h3>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                           <p style={{
                              fontSize: '1rem',
                              color: 'var(--slate-700)',
                              marginBottom: '1.5rem',
                              lineHeight: '1.6'
                           }}>
                              Your application has been approved. To continue, you must pay the deposit amount of <strong style={{ color: 'var(--brand-600)', fontSize: '1.2rem' }}>£{app.deposit_amount}</strong>.
                           </p>
                           <p style={{
                              fontSize: '0.95rem',
                              color: 'var(--slate-600)',
                              marginBottom: '2rem'
                           }}>
                              Please choose one of the options below to complete your payment.
                           </p>
                           <div style={{
                              display: 'flex',
                              gap: '1rem',
                              flexWrap: 'wrap'
                           }}>
                              <button
                                 onClick={handlePayOnline}
                                 className="btn btn-primary"
                                 style={{
                                    flex: 1,
                                    minWidth: '150px',
                                    padding: '0.875rem 1.5rem',
                                    fontSize: '1rem',
                                    fontWeight: 600
                                 }}
                              >
                                 Pay Online
                              </button>
                              <button
                                 onClick={() => setShowBankTransfer(true)}
                                 className="btn btn-secondary"
                                 style={{
                                    flex: 1,
                                    minWidth: '150px',
                                    padding: '0.875rem 1.5rem',
                                    fontSize: '1rem',
                                    fontWeight: 600
                                 }}
                              >
                                 Pay by Bank
                              </button>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* Bank Transfer: Payment Receipt Submitted Confirmation */}
                  {app.payment_receipt_url && app.status === 'payment_pending' && (
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

                  {/* Certificate Generation Awaiting Card - DISABLED */}
                  {/* Certificate generation is disabled - card hidden from users */}
                  {false && (app.status === 'payment_verified' || app.status === 'appointment_scheduled') && !app.certificate_url && (
                     <div style={{
                        background: 'white',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)',
                        border: '1px solid #10b981',
                        transition: 'box-shadow 0.3s ease'
                     }}
                     onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 30px rgba(16, 185, 129, 0.25)'}
                     onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.15)'}
                     >
                        <div style={{
                           background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                           padding: '1rem 1.5rem',
                           display: 'flex',
                           alignItems: 'center',
                           gap: '0.5rem'
                        }}>
                           <FileCheck size={18} color="white" />
                           <h3 style={{ fontSize: '1rem', margin: 0, color: 'white', fontWeight: 600 }}>Certificate Generation</h3>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                           <p style={{ fontSize: '0.95rem', color: 'var(--slate-700)', marginBottom: '1rem' }}>
                              <strong style={{ color: '#059669' }}>Excellent!</strong> Your payment has been verified. Our admin team will now generate your marriage certificate.
                           </p>
                           <div style={{
                              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                              padding: '1.25rem',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid #a7f3d0',
                              marginBottom: '1rem'
                           }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                 <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                 }}>
                                    <FileCheck size={20} color="white" />
                                 </div>
                                 <div>
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--slate-800)', letterSpacing: '-0.01em' }}>Next Step: Certificate Generation</h4>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--slate-600)', marginTop: '0.25rem' }}>You'll receive an email once ready</p>
                                 </div>
                              </div>
                              <div style={{
                                 padding: '1rem',
                                 background: 'white',
                                 borderRadius: 'var(--radius-sm)',
                                 border: '1px solid #6ee7b7',
                                 marginTop: '0.75rem'
                              }}>
                                 <p style={{ fontSize: '0.875rem', color: 'var(--slate-700)', margin: 0, lineHeight: '1.6' }}>
                                    <strong style={{ color: '#059669' }}>What happens next?</strong><br />
                                    Our admin team will generate your marriage certificate. Once ready, you'll receive an email notification and can download it from your dashboard.
                                 </p>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* Application Completed Card - Show when status is completed */}
                  {app.status === 'completed' && (
                     <div style={{
                        background: 'white',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                        border: '1px solid var(--slate-200)',
                        transition: 'all 0.3s ease'
                     }}>
                        <div style={{
                           background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                           padding: '1rem 1.5rem',
                           display: 'flex',
                           alignItems: 'center',
                           gap: '0.5rem'
                        }}>
                           <CheckCircle size={18} color="white" />
                           <h3 style={{ fontSize: '1rem', margin: 0, color: 'white', fontWeight: 600 }}>Application Completed</h3>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                           <p style={{ fontSize: '0.95rem', color: 'var(--slate-700)', marginBottom: '1rem' }}>
                              <strong style={{ color: '#059669' }}>Congratulations!</strong> Your application has been completed successfully.
                           </p>
                           <div style={{
                              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                              padding: '1.25rem',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid #a7f3d0',
                              marginBottom: '1rem'
                           }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                 <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                 }}>
                                    <CheckCircle size={20} color="white" />
                                 </div>
                                 <div>
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--slate-800)', letterSpacing: '-0.01em' }}>Application Completed</h4>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--slate-600)', marginTop: '0.25rem' }}>Your marriage certificate application is complete</p>
                                 </div>
                              </div>
                              <div style={{
                                 padding: '1rem',
                                 background: 'white',
                                 borderRadius: 'var(--radius-sm)',
                                 border: '1px solid #6ee7b7',
                                 marginTop: '0.75rem'
                              }}>
                                 <p style={{ fontSize: '0.875rem', color: 'var(--slate-700)', margin: 0, lineHeight: '1.6' }}>
                                    <strong style={{ color: '#059669' }}>Thank you!</strong><br />
                                    Your application has been processed successfully. If you have any questions, please contact our support team.
                                 </p>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* Bank Transfer Payment Action Card - shown when user chooses Pay by Bank and no receipt uploaded */}
                  {showBankTransfer && app.status === 'payment_pending' && app.deposit_amount && !app.payment_receipt_url && (
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
                           <p style={{ fontSize: '0.95rem', color: 'var(--slate-700)', marginBottom: '1.5rem' }}>
                              Please complete the payment of <strong style={{ fontSize: '1.1rem', color: 'var(--brand-600)' }}>£{app.deposit_amount}</strong> via bank transfer. <strong style={{ color: '#dc2626' }}>Receipt upload is required</strong> to proceed.
                           </p>

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
                                 color: '#dc2626', 
                                 marginBottom: '1rem',
                                 padding: '0.75rem',
                                 background: '#fef2f2',
                                 border: '1px solid #fca5a5',
                                 borderRadius: 'var(--radius-md)',
                                 fontWeight: 600
                              }}>
                                 ⚠️ Receipt upload is mandatory. Please complete the bank transfer and upload your receipt below.
                              </p>
                              <label style={{ display: 'block', width: '100%' }}>
                                 <input 
                                    type="file" 
                                    onChange={handleReceiptUpload} 
                                    accept="image/*,.pdf" 
                                    id="receipt-upload"
                                    style={{ display: 'none' }} 
                                    disabled={uploadingReceipt} 
                                 />
                                 <div 
                                    onClick={() => document.getElementById('receipt-upload')?.click()}
                                    className="btn btn-primary" 
                                    style={{ 
                                       width: '100%', 
                                       textAlign: 'center', 
                                       cursor: uploadingReceipt ? 'not-allowed' : 'pointer',
                                       boxShadow: '0 4px 12px rgba(176, 90, 51, 0.3)',
                                       opacity: uploadingReceipt ? 0.7 : 1
                                    }}
                                 >
                                    {uploadingReceipt ? '⏳ Uploading...' : '📎 Upload Receipt (Required)'}
                                 </div>
                              </label>
                           </div>
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
                           </div>
                           <div>
                              <label style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>Bride</label>
                              <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: 'var(--slate-800)' }}>{app.bride_full_name}</p>
                           </div>
                        </div>
                     </div>
                  </div>

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

                           {/* Step 1: Application Submitted */}
                           <div style={{ marginBottom: '1.75rem', position: 'relative' }}>
                              <div style={{ position: 'absolute', left: '-26px', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#2563eb', border: '3px solid white', boxShadow: '0 0 0 3px #2563eb' }}></div>
                              <h4 style={{ fontSize: '0.95rem', margin: 0, color: '#1e293b', fontWeight: 600 }}>Application Submitted</h4>
                              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, marginTop: '0.25rem' }}>{new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                           </div>

                           {/* Step 2: Admin Approves */}
                           {(() => {
                              const isApproved = app.approved_at != null || ['payment_pending', 'payment_verified', 'completed'].includes(app.status);
                              const isActive = app.status === 'admin_review' || app.status === 'submitted';
                              return (
                                 <div style={{ marginBottom: '1.75rem', position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '-26px', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: isApproved ? '#2563eb' : (isActive ? '#f59e0b' : '#cbd5e1'), border: '3px solid white', boxShadow: isApproved ? '0 0 0 3px #2563eb' : (isActive ? '0 0 0 3px #f59e0b' : 'none') }}></div>
                                    <h4 style={{ fontSize: '0.95rem', margin: 0, color: isApproved ? '#1e293b' : (isActive ? '#d97706' : '#94a3b8'), fontWeight: 600 }}>Admin Approved</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, marginTop: '0.25rem' }}>
                                       {isApproved ? (app.approved_at ? `Approved ${new Date(app.approved_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'Approved') : (isActive ? 'Waiting for admin approval' : 'Pending')}
                                    </p>
                                 </div>
                              );
                           })()}

                           {/* Step 3: Payment (by User) - Show when status is payment_pending */}
                           {app.status === 'payment_pending' && app.deposit_amount && (() => {
                              const paymentDone = app.payment_receipt_url != null || app.payment_status === 'verified';
                              const isActive = app.approved_at != null && app.deposit_amount != null;
                              return (
                                 <div style={{ marginBottom: '1.75rem', position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '-26px', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: paymentDone ? '#2563eb' : (isActive ? '#f59e0b' : '#cbd5e1'), border: '3px solid white', boxShadow: paymentDone ? '0 0 0 3px #2563eb' : (isActive ? '0 0 0 3px #f59e0b' : 'none') }}></div>
                                    <h4 style={{ fontSize: '0.95rem', margin: 0, color: paymentDone ? '#1e293b' : (isActive ? '#d97706' : '#94a3b8'), fontWeight: 600 }}>Payment</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, marginTop: '0.25rem' }}>
                                       {paymentDone ? (app.payment_receipt_url ? 'Receipt uploaded' : 'Payment completed') : (isActive ? `Pay £${app.deposit_amount}` : 'Pending')}
                                    </p>
                                 </div>
                              );
                           })()}

                           {/* Step 4: Payment Verified (by Admin) - Show when payment is verified */}
                           {(app.payment_verified_at != null || app.status === 'payment_verified' || app.status === 'completed') && (() => {
                              const isVerified = app.payment_verified_at != null || app.status === 'payment_verified' || app.status === 'completed';
                              const isCompleted = app.status === 'completed';
                              return (
                                 <div style={{ marginBottom: '1.75rem', position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '-26px', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: isCompleted ? '#10b981' : '#10b981', border: '3px solid white', boxShadow: '0 0 0 3px #10b981' }}></div>
                                    <h4 style={{ fontSize: '0.95rem', margin: 0, color: isCompleted ? '#059669' : '#059669', fontWeight: 600 }}>Payment Verified</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, marginTop: '0.25rem' }}>
                                       {isCompleted ? 'Payment verified' : (app.payment_verified_at ? `Verified ${new Date(app.payment_verified_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'Verified by admin')}
                                    </p>
                                 </div>
                              );
                           })()}

                           {/* Step 5: Application Completed - Show when status is completed */}
                           {app.status === 'completed' && (() => {
                              return (
                                 <div style={{ marginBottom: '1.75rem', position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '-26px', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#10b981', border: '3px solid white', boxShadow: '0 0 0 3px #10b981' }}></div>
                                    <h4 style={{ fontSize: '0.95rem', margin: 0, color: '#059669', fontWeight: 600 }}>Application Completed</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, marginTop: '0.25rem' }}>
                                       Your application has been completed successfully
                                    </p>
                                 </div>
                              );
                           })()}

                        </div>
                     </div>
                  </div>

               </div>

            </div>
      </>
   );
}
