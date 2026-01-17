import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Loader from '../components/Loader';
import { getApplicantDashboard, uploadReceipt as uploadReceiptAPI, requestBankDetails as requestBankDetailsAPI, getFileUrl, getCertificate } from '../services/api';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FileText, Calendar, CreditCard, Upload, CheckCircle, AlertCircle, FileCheck, User, TrendingUp, ChevronRight, Download } from 'lucide-react';


export default function ApplicantDashboard() {
   const navigate = useNavigate();
   const [searchParams, setSearchParams] = useSearchParams();
   const [loading, setLoading] = useState(true);
   const [data, setData] = useState(null);
   const [uploadingReceipt, setUploadingReceipt] = useState(false);
   const [currentView, setCurrentView] = useState('dashboard');

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
      if (!file) return;

      const formData = new FormData();
      formData.append('receipt', file);

      setUploadingReceipt(true);
      const toastId = toast.loading('Uploading receipt...');

      try {
         await uploadReceiptAPI(formData);
         toast.success('Receipt uploaded successfully!', { id: toastId });
         fetchDashboard();
      } catch (error) {
         toast.error('Failed to upload receipt: ' + (error.response?.data?.message || error.message), { id: toastId });
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
               {app.status === 'completed' && app.certificate_url && (
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
                  variant={app.payment_verified_at ? 'teal' : 'purple'}
                  subtitle={
                     app.payment_verified_at 
                        ? 'Payment confirmed' 
                        : app.status === 'payment_pending' && app.deposit_amount 
                           ? 'Payment due' 
                           : 'Awaiting quote'
                  }
               />
               <StatCard
                  title="Nikah Date"
                  value={app.appointment_date ? new Date(app.appointment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBD'}
                  icon={Calendar}
                  color="white"
                  bg="rgba(255,255,255,0.15)"
                  variant={app.appointment_date ? 'indigo' : 'orange'}
                  subtitle={app.appointment_date ? `${app.appointment_time || ''}` : 'Not scheduled yet'}
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

                  {/* Action Cards Section */}
                  {app.approved_at && !allDocumentsUploaded && (
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

                  {/* Certificate Generation Awaiting Card */}
                  {app.status === 'payment_verified' && !app.certificate_url && (
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

                  {/* Nikah Scheduled Information Card */}
                  {app.appointment_date && (
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
                           <CheckCircle size={18} color="white" />
                           <h3 style={{ fontSize: '1rem', margin: 0, color: 'white', fontWeight: 600 }}>Nikah Scheduled</h3>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                           <div style={{
                              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                              padding: '1.5rem',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid #a7f3d0'
                           }}>
                              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--slate-800)', letterSpacing: '-0.01em' }}>📅 Nikah Appointment Details</h4>
                              <div style={{
                                 background: 'white',
                                 padding: '1.25rem',
                                 borderRadius: 'var(--radius-md)',
                                 border: '1px solid #6ee7b7',
                                 display: 'grid',
                                 gap: '1rem'
                              }}>
                                 <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.75rem', alignItems: 'center' }}>
                                    <strong style={{ color: 'var(--slate-600)', fontSize: '0.875rem' }}>📅 Date:</strong>
                                    <span style={{ fontWeight: 600, fontSize: '1rem', color: '#059669' }}>
                                       {new Date(app.appointment_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                 </div>
                                 {app.appointment_time && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.75rem', alignItems: 'center' }}>
                                       <strong style={{ color: 'var(--slate-600)', fontSize: '0.875rem' }}>🕐 Time:</strong>
                                       <span style={{ fontWeight: 600, fontSize: '1rem', color: '#059669' }}>
                                          {app.appointment_time.substring(0, 5)}
                                       </span>
                                    </div>
                                 )}
                                 {app.appointment_location && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.75rem', alignItems: 'start' }}>
                                       <strong style={{ color: 'var(--slate-600)', fontSize: '0.875rem' }}>📍 Location:</strong>
                                       <span style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--slate-700)', lineHeight: '1.5' }}>
                                          {app.appointment_location}
                                       </span>
                                    </div>
                                 )}
                              </div>
                              <p style={{
                                 fontSize: '0.875rem',
                                 color: 'var(--slate-600)',
                                 margin: 0,
                                 marginTop: '1rem',
                                 padding: '0.875rem',
                                 background: '#fffbeb',
                                 border: '1px solid #fde68a',
                                 borderRadius: 'var(--radius-md)'
                              }}>
                                 💡 Please arrive on time with all required documents and witnesses. Contact us if you need to reschedule.
                              </p>
                           </div>
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
                           <p style={{ fontSize: '0.95rem', color: 'var(--slate-700)', marginBottom: '1.5rem' }}>
                              Please complete the payment of <strong style={{ fontSize: '1.1rem', color: 'var(--brand-600)' }}>£{app.deposit_amount}</strong> via bank transfer to proceed with your application.
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
                                 color: 'var(--slate-600)', 
                                 marginBottom: '1rem',
                                 padding: '0.75rem',
                                 background: '#fffbeb',
                                 border: '1px solid #fcd34d',
                                 borderRadius: 'var(--radius-md)'
                              }}>
                                 💡 After completing the transfer, upload your receipt below for verification.
                              </p>
                              <label style={{ display: 'block', width: '100%' }}>
                                 <input type="file" onChange={handleReceiptUpload} accept="image/*,.pdf" style={{ display: 'none' }} disabled={uploadingReceipt} />
                                 <div className="btn btn-primary" style={{ 
                                    width: '100%', 
                                    textAlign: 'center', 
                                    cursor: uploadingReceipt ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 4px 12px rgba(176, 90, 51, 0.3)',
                                    opacity: uploadingReceipt ? 0.7 : 1
                                 }}>
                                    {uploadingReceipt ? '⏳ Uploading...' : '📎 Upload Receipt'}
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
                        {app.appointment_location && (
                           <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                              <label style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>Ceremony Location</label>
                              <p style={{ fontSize: '0.95rem', margin: 0, color: 'var(--slate-700)' }}>{app.appointment_location}</p>
                           </div>
                        )}
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
                              const isApproved = app.approved_at != null || ['payment_pending', 'payment_verified', 'appointment_scheduled', 'completed'].includes(app.status);
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

                           {/* Step 3: Documents Uploaded (by User) */}
                           {(() => {
                              const docsUploaded = allDocumentsUploaded;
                              const isActive = app.approved_at != null && app.status === 'admin_review';
                              return (
                                 <div style={{ marginBottom: '1.75rem', position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '-26px', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: docsUploaded ? '#2563eb' : (isActive ? '#f59e0b' : '#cbd5e1'), border: '3px solid white', boxShadow: docsUploaded ? '0 0 0 3px #2563eb' : (isActive ? '0 0 0 3px #f59e0b' : 'none') }}></div>
                                    <h4 style={{ fontSize: '0.95rem', margin: 0, color: docsUploaded ? '#1e293b' : (isActive ? '#d97706' : '#94a3b8'), fontWeight: 600 }}>Documents Uploaded</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, marginTop: '0.25rem' }}>
                                       {docsUploaded ? 'All documents submitted' : (isActive ? 'Action required - Upload documents' : 'Waiting for approval')}
                                    </p>
                                 </div>
                              );
                           })()}

                           {/* Step 4: Documents Verified (by Admin) */}
                           {(() => {
                              // Handle both boolean true and numeric 1 from MySQL
                              const isVerified = app.documents_verified === true || app.documents_verified === 1 || app.documents_verified === '1';
                              const isActive = allDocumentsUploaded && !isVerified && (app.status === 'admin_review' || app.status === 'payment_pending');
                              return (
                                 <div style={{ marginBottom: '1.75rem', position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '-26px', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: isVerified ? '#2563eb' : (isActive ? '#f59e0b' : '#cbd5e1'), border: '3px solid white', boxShadow: isVerified ? '0 0 0 3px #2563eb' : (isActive ? '0 0 0 3px #f59e0b' : 'none') }}></div>
                                    <h4 style={{ fontSize: '0.95rem', margin: 0, color: isVerified ? '#1e293b' : (isActive ? '#d97706' : '#94a3b8'), fontWeight: 600 }}>Documents Verified</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, marginTop: '0.25rem' }}>
                                       {isVerified ? (app.documents_verified_at ? `Verified ${new Date(app.documents_verified_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'Verified by admin') : (isActive ? 'Waiting for admin verification' : 'Not yet')}
                                    </p>
                                 </div>
                              );
                           })()}

                           {/* Step 5: Payment (by User) */}
                           {(() => {
                              const paymentDone = app.payment_receipt_url != null;
                              const isActive = app.documents_verified && app.deposit_amount != null && app.status === 'payment_pending';
                              return (
                                 <div style={{ marginBottom: '1.75rem', position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '-26px', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: paymentDone ? '#2563eb' : (isActive ? '#f59e0b' : '#cbd5e1'), border: '3px solid white', boxShadow: paymentDone ? '0 0 0 3px #2563eb' : (isActive ? '0 0 0 3px #f59e0b' : 'none') }}></div>
                                    <h4 style={{ fontSize: '0.95rem', margin: 0, color: paymentDone ? '#1e293b' : (isActive ? '#d97706' : '#94a3b8'), fontWeight: 600 }}>Payment Made</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, marginTop: '0.25rem' }}>
                                       {paymentDone ? `Receipt uploaded` : (isActive ? `Action required - Pay £${app.deposit_amount}` : (app.deposit_amount ? `£${app.deposit_amount} required` : 'Not yet'))}
                                    </p>
                                 </div>
                              );
                           })()}

                           {/* Step 6: Payment Verified (by Admin) */}
                           {(() => {
                              const isVerified = app.payment_verified_at != null || app.status === 'payment_verified';
                              const isActive = app.payment_receipt_url && !app.payment_verified_at && app.status === 'payment_pending';
                              return (
                                 <div style={{ marginBottom: '1.75rem', position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '-26px', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: isVerified ? '#2563eb' : (isActive ? '#f59e0b' : '#cbd5e1'), border: '3px solid white', boxShadow: isVerified ? '0 0 0 3px #2563eb' : (isActive ? '0 0 0 3px #f59e0b' : 'none') }}></div>
                                    <h4 style={{ fontSize: '0.95rem', margin: 0, color: isVerified ? '#1e293b' : (isActive ? '#d97706' : '#94a3b8'), fontWeight: 600 }}>Payment Verified</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, marginTop: '0.25rem' }}>
                                       {isVerified ? (app.payment_verified_at ? `Verified ${new Date(app.payment_verified_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'Verified by admin') : (isActive ? 'Waiting for admin verification' : 'Pending')}
                                    </p>
                                 </div>
                              );
                           })()}

                           {/* Step 7: Certificate Generated (by Admin) */}
                           {(() => {
                              const isCompleted = app.status === 'completed' || (app.certificate_url != null);
                              const isActive = app.status === 'payment_verified' || app.status === 'appointment_scheduled';
                              return (
                                 <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '-26px', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: isCompleted ? '#10b981' : (isActive ? '#f59e0b' : '#cbd5e1'), border: '3px solid white', boxShadow: isCompleted ? '0 0 0 3px #10b981' : (isActive ? '0 0 0 3px #f59e0b' : 'none') }}></div>
                                    <h4 style={{ fontSize: '0.95rem', margin: 0, color: isCompleted ? '#059669' : (isActive ? '#d97706' : '#94a3b8'), fontWeight: 600 }}>Certificate Generated</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, marginTop: '0.25rem' }}>
                                       {isCompleted ? (app.certificate_generated_at ? `Generated ${new Date(app.certificate_generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'Certificate ready') : (isActive ? 'Waiting for admin to generate' : 'Not yet')}
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
