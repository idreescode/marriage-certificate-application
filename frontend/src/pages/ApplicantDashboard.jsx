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
                  value={app.payment_verified_at ? 'Verified' : app.deposit_amount ? `£${app.deposit_amount}` : 'Pending'}
                  icon={CreditCard}
                  color="white"
                  bg="rgba(255,255,255,0.15)"
                  variant={app.payment_verified_at ? 'teal' : 'purple'}
                  subtitle={app.payment_verified_at ? 'Payment confirmed' : app.deposit_amount ? 'Payment due' : 'Awaiting quote'}
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

                           <div style={{ position: 'relative' }}>
                              <div style={{ position: 'absolute', left: '-26px', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: app.appointment_date ? '#2563eb' : '#cbd5e1', border: '3px solid white', boxShadow: app.appointment_date ? '0 0 0 3px #2563eb' : 'none' }}></div>
                              <h4 style={{ fontSize: '0.95rem', margin: 0, color: app.appointment_date ? '#1e293b' : '#94a3b8', fontWeight: 600 }}>Nikkah Scheduled</h4>
                              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, marginTop: '0.25rem' }}>
                                 {app.appointment_date ? new Date(app.appointment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Awaiting Confirmation'}
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
