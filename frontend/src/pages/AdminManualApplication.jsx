import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createManualApplication } from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, UploadCloud, FileText, Trash2, CheckCircle2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import Loader from '../components/Loader';

// Move FormSection outside component
const FormSection = ({ title, children }) => (
  <div style={{
    background: 'var(--brand-50)',
    borderRadius: '10px',
    marginBottom: '1.5rem',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0'
  }}>
    <div style={{
      background: 'rgba(116, 116, 116, 0.11)',
      padding: '15px 0px 15px 64px',
      borderRadius: '23px 23px 0px 0px',
      marginBottom: '30px'
    }}>
      <h2 style={{ 
        margin: 0, 
        fontFamily: 'Montserrat, sans-serif',
        fontSize: 'clamp(20px, 4vw, 31px)',
        fontWeight: 600, 
        color: '#575757',
        textTransform: 'uppercase',
        lineHeight: '1.2'
      }}>
        {title}
      </h2>
    </div>
    <div style={{ padding: '1.5rem' }}>
      {children}
    </div>
  </div>
);

// Move FormRow outside component
const FormRow = ({ children }) => (
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: 'repeat(2, 1fr)', 
    gap: '1rem', 
    marginBottom: '1rem' 
  }}>
    {children}
  </div>
);

// Move FormField outside component - receives formData and handleChange as props
const FormField = ({ label, name, type = 'text', required = false, span = 1, formData, handleChange, ...props }) => (
  <div style={{ gridColumn: span === 2 ? 'span 2' : 'span 1' }}>
    <label style={{ 
      display: 'block', 
      marginBottom: '10px', 
      fontFamily: 'Montserrat, sans-serif',
      fontSize: 'clamp(16px, 3vw, 25px)',
      fontWeight: 400, 
      color: '#2E2E2E' 
    }}>
      {label} {required && <span style={{ color: '#FF0000' }}>*</span>}
    </label>
    {type === 'textarea' ? (
      <textarea
        name={name}
        value={formData[name] || ''}
        onChange={handleChange}
        required={required}
        style={{
          width: '100%',
          height: '54px',
          padding: '15px',
          border: '2.7px solid #CA6C41',
          borderRadius: '10px',
          fontSize: '16px',
          fontFamily: 'Montserrat, sans-serif',
          color: '#333',
          background: '#FFFFFF',
          outline: 'none',
          resize: 'vertical',
          minHeight: '80px',
          transition: 'box-shadow 0.2s'
        }}
        onFocus={(e) => {
          e.target.style.boxShadow = '0 0 0 4px rgba(202, 108, 65, 0.2)';
        }}
        onBlur={(e) => {
          e.target.style.boxShadow = 'none';
        }}
        rows={3}
        {...props}
      />
    ) : (
      <input
        type={type}
        name={name}
        value={formData[name] || ''}
        onChange={handleChange}
        required={required}
        style={{
          width: '100%',
          height: '54px',
          padding: '15px',
          border: '2.7px solid #CA6C41',
          borderRadius: '10px',
          fontSize: '16px',
          fontFamily: 'Montserrat, sans-serif',
          color: '#333',
          background: '#FFFFFF',
          outline: 'none',
          transition: 'box-shadow 0.2s'
        }}
        onFocus={(e) => {
          e.target.style.boxShadow = '0 0 0 4px rgba(202, 108, 65, 0.2)';
        }}
        onBlur={(e) => {
          e.target.style.boxShadow = 'none';
        }}
        {...props}
      />
    )}
  </div>
);

export default function AdminManualApplication() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Application Number
    applicationNumber: '',
    // Document Files
    groomIdFile: null,
    brideIdFile: null,
    witness1IdFile: null,
    witness2IdFile: null,
    mahrDeclarationFile: null,
    civilDivorceDocFile: null,
    islamicDivorceDocFile: null,
    groomConversionCertFile: null,
    brideConversionCertFile: null,
    statutoryDeclarationFile: null,
    // Groom Information
    groomName: '',
    groomFatherName: '',
    groomDateOfBirth: '',
    groomPlaceOfBirth: '',
    groomAddress: '',
    groomPhone: '',
    groomEmail: '',
    groomIdNumber: '',
    groomConfirm: false,
    groomPersonally: false,
    groomRepresentative: false,
    // Groom Representative
    groomRepName: '',
    groomRepFatherName: '',
    groomRepDateOfBirth: '',
    groomRepPlaceOfBirth: '',
    groomRepAddress: '',
    // Bride Information
    brideName: '',
    brideFatherName: '',
    brideDateOfBirth: '',
    bridePlaceOfBirth: '',
    brideAddress: '',
    bridePhone: '',
    brideEmail: '',
    brideIdNumber: '',
    brideConfirm: false,
    bridePersonally: false,
    brideRepresentative: false,
    // Bride Representative
    brideRepName: '',
    brideRepFatherName: '',
    brideRepDateOfBirth: '',
    brideRepPlaceOfBirth: '',
    brideRepAddress: '',
    // Witnesses
    witness1Name: '',
    witness1FatherName: '',
    witness1DateOfBirth: '',
    witness1PlaceOfBirth: '',
    witness1Address: '',
    witness1Phone: '',
    witness2Name: '',
    witness2FatherName: '',
    witness2DateOfBirth: '',
    witness2PlaceOfBirth: '',
    witness2Address: '',
    witness2Phone: '',
    // Mahr
    mahrAmount: '',
    mahrDeferred: false,
    mahrPrompt: false,
    // Solemnisation
    solemnisedDate: '',
    solemnisedPlace: '',
    solemnisedAddress: '',
    // Contact & Status
    email: '',
    contactNumber: '',
    status: 'completed',
    depositAmount: '',
    paymentStatus: 'verified',
    appointmentDate: '',
    appointmentTime: '',
    appointmentLocation: '',
    preferredDate: '',
    specialRequests: ''
  });

  const [showAdditional, setShowAdditional] = useState(false);
  const [hasConversionCertificate, setHasConversionCertificate] = useState(false);
  const [groomConverted, setGroomConverted] = useState(false);
  const [brideConverted, setBrideConverted] = useState(false);
  const [bridePreviouslyMarried, setBridePreviouslyMarried] = useState(false);
  const [brideDivorceType, setBrideDivorceType] = useState(null);
  const [brideAhleKitab, setBrideAhleKitab] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files && files[0] ? files[0] : null
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  }, []);

  const handleFileChange = (e, name) => {
    if (e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        [name]: e.target.files[0]
      }));
    }
  };

  const removeFile = (name) => {
    setFormData(prev => ({
      ...prev,
      [name]: null
    }));
  };

  const handleMahrTypeChange = (type) => {
    setFormData(prev => {
      // Toggle the clicked one, uncheck the other
      const newDeferred = type === 'deferred' ? !prev.mahrDeferred : false;
      const newPrompt = type === 'prompt' ? !prev.mahrPrompt : false;
      
      return {
        ...prev,
        mahrDeferred: newDeferred,
        mahrPrompt: newPrompt,
        mahrType: newDeferred ? 'deferred' : (newPrompt ? 'prompt' : '')
      };
    });
  };

  const handlePersonallyChange = (field, value) => {
    if (field === 'groom') {
      setFormData(prev => ({
        ...prev,
        groomPersonally: value === 'personally',
        groomRepresentative: value === 'representative'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        bridePersonally: value === 'personally',
        brideRepresentative: value === 'representative'
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Convert mahr checkboxes to mahrType
    let mahrType = '';
    if (formData.mahrDeferred) mahrType = 'deferred';
    else if (formData.mahrPrompt) mahrType = 'prompt';

    // Create FormData for file uploads
    const submitFormData = new FormData();
    
    // Add all text fields
    Object.keys(formData).forEach(key => {
      if (key.endsWith('File')) {
        // Handle file fields separately
        if (formData[key]) {
          const fieldName = key.replace('File', '');
          // Map to backend field names
          const fileFieldMap = {
            groomIdFile: 'groomId',
            brideIdFile: 'brideId',
            witness1IdFile: 'witness1Id',
            witness2IdFile: 'witness2Id',
            mahrDeclarationFile: 'mahrDeclaration',
            civilDivorceDocFile: 'civilDivorceDoc',
            islamicDivorceDocFile: 'islamicDivorceDoc',
            groomConversionCertFile: 'groomConversionCert',
            brideConversionCertFile: 'brideConversionCert',
            statutoryDeclarationFile: 'statutoryDeclaration'
          };
          submitFormData.append(fileFieldMap[key] || fieldName, formData[key]);
        }
      } else if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '' && !key.endsWith('File')) {
        submitFormData.append(key, formData[key]);
      }
    });

    // Add computed fields
    submitFormData.append('mahrType', mahrType);
    submitFormData.append('groomEmail', formData.groomEmail || formData.email);
    submitFormData.append('brideEmail', formData.brideEmail || formData.email);
    submitFormData.append('groomPhone', formData.groomPhone || formData.contactNumber);
    submitFormData.append('bridePhone', formData.bridePhone || formData.contactNumber);

    try {
      const response = await createManualApplication(submitFormData);
      if (response.data.success) {
        toast.success('Application created successfully!');
        // Navigate to applications list page after successful creation
        setTimeout(() => {
          navigate('/admin/applications');
        }, 1000);
      }
    } catch (error) {
      console.error('Error creating application:', error);
      toast.error(error.response?.data?.message || 'Failed to create application');
    } finally {
      setLoading(false);
    }
  };


  // UploadCard Component (same as applicant page)
  const UploadCard = ({ title, subtitle, name, required = false }) => {
    const file = formData[name];
    return (
      <div style={{ 
        background: 'var(--brand-50)', 
        borderRadius: '0.5rem', 
        padding: '1.5rem', 
        border: '1px solid var(--slate-200)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <h4 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: 'var(--slate-800)', fontSize: '0.9rem', marginBottom: '0.25rem', margin: 0 }}>
                {title} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
              </h4>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: 'var(--slate-500)', margin: 0 }}>{subtitle}</p>
            </div>
          </div>

          {file ? (
            <div style={{ backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)', borderRadius: '0.5rem', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                <div style={{ backgroundColor: 'var(--brand-50)', width: '2rem', height: '2rem', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={16} style={{ color: 'var(--brand-600)' }} />
                </div>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', fontWeight: 500, color: 'var(--slate-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </span>
              </div>
              <button
                onClick={() => removeFile(name)}
                style={{ padding: '0.375rem', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--danger)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--slate-400)';
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <label
              style={{
                borderColor: 'var(--slate-300)',
                backgroundColor: 'var(--slate-50)',
                borderWidth: '2px',
                borderStyle: 'dashed',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--brand-400)';
                e.currentTarget.style.backgroundColor = 'var(--brand-50)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--slate-300)';
                e.currentTarget.style.backgroundColor = 'var(--slate-50)';
              }}
            >
              <input 
                type="file" 
                onChange={(e) => handleFileChange(e, name)} 
                accept=".pdf,.jpg,.jpeg,.png" 
                style={{ display: 'none' }} 
              />
              <div style={{ backgroundColor: 'var(--slate-100)', width: '2.5rem', height: '2.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <UploadCloud size={20} color="var(--slate-500)" />
              </div>
              <span style={{ fontFamily: 'Montserrat, sans-serif', color: 'var(--brand-600)', fontSize: '0.9rem', fontWeight: 500 }}>Click to upload</span>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}>PDF or Image</span>
            </label>
          )}
        </div>
        {file && (
          <div style={{ fontFamily: 'Montserrat, sans-serif', color: 'var(--success)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 600 }}>
            <CheckCircle2 size={14} />
            <span>Ready to upload</span>
          </div>
        )}
      </div>
    );
  };


  if (loading) return <Loader fullscreen />;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', background: 'var(--brand-50)', minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          background: 'var(--brand-600)',
          padding: '1.5rem 2rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '1.5rem',
          position: 'relative'
        }}
      >
        {/* Top Row with Back Button and SR No */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          {/* Back Button - Top Left Corner */}
          <button
            onClick={() => navigate('/admin/applications')}
            className="btn-back-nav"
          >
            <ArrowLeft size={16} />
            <span>Back to Applications</span>
          </button>
          
          {/* SR No - Top Right Corner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ 
              color: 'rgba(255,255,255,0.9)', 
              fontSize: '0.875rem', 
              fontWeight: 500,
              whiteSpace: 'nowrap'
            }}>
              SR No:
            </label>
            <input
              type="text"
              name="applicationNumber"
              value={formData.applicationNumber || ''}
              onChange={handleChange}
              placeholder="Enter SR No"
              style={{
                fontFamily: 'monospace',
                color: 'white',
                fontSize: '0.875rem',
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                width: '150px',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.25)';
                e.target.style.borderColor = 'rgba(255,255,255,0.4)';
              }}
              onBlur={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.15)';
                e.target.style.borderColor = 'rgba(255,255,255,0.25)';
              }}
            />
            <style>{`
              input[name="applicationNumber"]::placeholder {
                color: rgba(255, 255, 255, 0.7) !important;
                opacity: 1 !important;
              }
              input[name="applicationNumber"]::-webkit-input-placeholder {
                color: rgba(255, 255, 255, 0.7) !important;
                opacity: 1 !important;
              }
              input[name="applicationNumber"]::-moz-placeholder {
                color: rgba(255, 255, 255, 0.7) !important;
                opacity: 1 !important;
              }
              input[name="applicationNumber"]:-ms-input-placeholder {
                color: rgba(255, 255, 255, 0.7) !important;
                opacity: 1 !important;
              }
            `}</style>
          </div>
        </div>
        
        <h1 style={{ fontSize: '2rem', margin: 0, color: 'white' }}>
          Add Manual Application
        </h1>
        <p
          style={{
            color: 'rgba(255,255,255,0.85)',
            margin: 0,
            marginTop: '0.25rem',
          }}
        >
          Enter all information for completed nikkah records
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* BRIDEGROOM Section */}
        <FormSection title="BRIDEGROOM">
          <FormRow>
            <FormField label="Groom's Full Name" name="groomName" required formData={formData} handleChange={handleChange} />
            <FormField label="Father's full Name" name="groomFatherName" required formData={formData} handleChange={handleChange} />
          </FormRow>
          <FormRow>
            <FormField label="Date of Birth" name="groomDateOfBirth" type="date" required formData={formData} handleChange={handleChange} />
            <FormField label="Place of Birth" name="groomPlaceOfBirth" required formData={formData} handleChange={handleChange} />
          </FormRow>
          <FormRow>
            <FormField label="Address" name="groomAddress" type="textarea" span={2} formData={formData} handleChange={handleChange} />
          </FormRow>
          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="groomConfirm"
                checked={formData.groomConfirm}
                onChange={handleChange}
                style={{ 
                  width: '18px', 
                  height: '18px', 
                  marginTop: '2px',
                  border: '2.7px solid #CA6C41',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  accentColor: '#CA6C41'
                }}
              />
              <span style={{ fontSize: '0.875rem', color: '#334155', lineHeight: '1.5' }}>
                I can confirm that I have the power, fitness and capacity to marry in Islamic law and fulfil my duties in an Islamic marriage
              </span>
            </label>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ 
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 'clamp(16px, 3vw, 25px)', 
              fontWeight: 600, 
              marginBottom: '0.75rem', 
              color: '#2E2E2E' 
            }}>
              Personally/Representative
            </h3>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="groomPersonallyRep"
                  checked={formData.groomPersonally}
                  onChange={() => handlePersonallyChange('groom', 'personally')}
                  style={{ 
                    width: '18px', 
                    height: '18px',
                    border: '2.7px solid #CA6C41',
                    cursor: 'pointer',
                    accentColor: '#CA6C41'
                  }}
                />
                <span style={{ 
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: 'clamp(16px, 3vw, 25px)', 
                  color: '#2E2E2E' 
                }}>Personally</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="groomPersonallyRep"
                  checked={formData.groomRepresentative}
                  onChange={() => handlePersonallyChange('groom', 'representative')}
                  style={{ 
                    width: '18px', 
                    height: '18px',
                    border: '2.7px solid #CA6C41',
                    cursor: 'pointer',
                    accentColor: '#CA6C41'
                  }}
                />
                <span style={{ 
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: 'clamp(16px, 3vw, 25px)', 
                  color: '#2E2E2E' 
                }}>Representative</span>
              </label>
            </div>
          </div>
        </FormSection>

        {/* BRIDE Section */}
        <FormSection title="BRIDE">
          <FormRow>
            <FormField label="Bride's Full Name" name="brideName" required formData={formData} handleChange={handleChange} />
            <FormField label="Father's full Name" name="brideFatherName" required formData={formData} handleChange={handleChange} />
          </FormRow>
          <FormRow>
            <FormField label="Date of Birth" name="brideDateOfBirth" type="date" required formData={formData} handleChange={handleChange} />
            <FormField label="Place of Birth" name="bridePlaceOfBirth" required formData={formData} handleChange={handleChange} />
          </FormRow>
          <FormRow>
            <FormField label="Address" name="brideAddress" type="textarea" span={2} formData={formData} handleChange={handleChange} />
          </FormRow>
          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="brideConfirm"
                checked={formData.brideConfirm}
                onChange={handleChange}
                style={{ 
                  width: '18px', 
                  height: '18px', 
                  marginTop: '2px',
                  border: '2.7px solid #CA6C41',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  accentColor: '#CA6C41'
                }}
              />
              <span style={{ fontSize: '0.875rem', color: '#334155', lineHeight: '1.5' }}>
                I can confirm that I have the power, fitness and capacity to marry in Islamic law and fulfil my duties in an Islamic marriage
              </span>
            </label>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ 
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 'clamp(16px, 3vw, 25px)', 
              fontWeight: 600, 
              marginBottom: '0.75rem', 
              color: '#2E2E2E' 
            }}>
              Personally/Representative
            </h3>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="bridePersonallyRep"
                  checked={formData.bridePersonally}
                  onChange={() => handlePersonallyChange('bride', 'personally')}
                  style={{ 
                    width: '18px', 
                    height: '18px',
                    border: '2.7px solid #CA6C41',
                    cursor: 'pointer',
                    accentColor: '#CA6C41'
                  }}
                />
                <span style={{ 
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: 'clamp(16px, 3vw, 25px)', 
                  color: '#2E2E2E' 
                }}>Personally</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="bridePersonallyRep"
                  checked={formData.brideRepresentative}
                  onChange={() => handlePersonallyChange('bride', 'representative')}
                  style={{ 
                    width: '18px', 
                    height: '18px',
                    border: '2.7px solid #CA6C41',
                    cursor: 'pointer',
                    accentColor: '#CA6C41'
                  }}
                />
                <span style={{ 
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: 'clamp(16px, 3vw, 25px)', 
                  color: '#2E2E2E' 
                }}>Representative</span>
              </label>
            </div>
          </div>
        </FormSection>

        {/* REPRESENTATIVE OR GUARDIAN OF BRIDE GROOM */}
        <FormSection title="REPRESENTATIVE OR GUARDIAN OF BRIDE GROOM">
          <FormRow>
            <FormField label="Full Name" name="groomRepName" required formData={formData} handleChange={handleChange} />
            <FormField label="Father's Name" name="groomRepFatherName" required formData={formData} handleChange={handleChange} />
          </FormRow>
          <FormRow>
            <FormField label="Date of Birth" name="groomRepDateOfBirth" type="date" formData={formData} handleChange={handleChange} />
            <FormField label="Place of Birth" name="groomRepPlaceOfBirth" formData={formData} handleChange={handleChange} />
          </FormRow>
          <FormRow>
            <FormField label="Present Address" name="groomRepAddress" type="textarea" span={2} formData={formData} handleChange={handleChange} />
          </FormRow>
        </FormSection>

        {/* REPRESENTATIVE OR GUARDIAN OF BRIDE */}
        <FormSection title="REPRESENTATIVE OR GUARDIAN OF BRIDE">
          <FormRow>
            <FormField label="Full Name" name="brideRepName" required formData={formData} handleChange={handleChange} />
            <FormField label="Father's Name" name="brideRepFatherName" required formData={formData} handleChange={handleChange} />
          </FormRow>
          <FormRow>
            <FormField label="Date of Birth" name="brideRepDateOfBirth" type="date" formData={formData} handleChange={handleChange} />
            <FormField label="Place of Birth" name="brideRepPlaceOfBirth" formData={formData} handleChange={handleChange} />
          </FormRow>
          <FormRow>
            <FormField label="Present Address" name="brideRepAddress" type="textarea" span={2} formData={formData} handleChange={handleChange} />
          </FormRow>
        </FormSection>

        {/* WITNESS NO 1 */}
        <FormSection title="WITNESS NO 1">
          <FormRow>
            <FormField label="Witness's Full Name" name="witness1Name" required formData={formData} handleChange={handleChange} />
            <FormField label="Witness's father's full Name" name="witness1FatherName" required formData={formData} handleChange={handleChange} />
          </FormRow>
          <FormRow>
            <FormField label="Date of Birth" name="witness1DateOfBirth" type="date" formData={formData} handleChange={handleChange} />
            <FormField label="Place of Birth" name="witness1PlaceOfBirth" formData={formData} handleChange={handleChange} />
          </FormRow>
          <FormRow>
            <FormField label="Witness residence" name="witness1Address" type="textarea" span={2} formData={formData} handleChange={handleChange} />
          </FormRow>
        </FormSection>

        {/* WITNESS NO 2 */}
        <FormSection title="WITNESS NO 2">
          <FormRow>
            <FormField label="Witness's Full Name" name="witness2Name" required formData={formData} handleChange={handleChange} />
            <FormField label="Witness's father's full Name" name="witness2FatherName" required formData={formData} handleChange={handleChange} />
          </FormRow>
          <FormRow>
            <FormField label="Date of Birth" name="witness2DateOfBirth" type="date" formData={formData} handleChange={handleChange} />
            <FormField label="Place of Birth" name="witness2PlaceOfBirth" formData={formData} handleChange={handleChange} />
          </FormRow>
          <FormRow>
            <FormField label="Witness residence" name="witness2Address" type="textarea" span={2} formData={formData} handleChange={handleChange} />
          </FormRow>
        </FormSection>

        {/* MAHR Section */}
        <FormSection title="MAHR">
          <FormRow>
            <FormField label="Mahar agreed amount" name="mahrAmount" required formData={formData} handleChange={handleChange} />
          </FormRow>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ 
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 'clamp(16px, 3vw, 25px)', 
              fontWeight: 400, 
              color: '#2E2E2E', 
              marginBottom: '10px', 
              display: 'block' 
            }}>
              Deferred/Prompt
            </label>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.mahrDeferred}
                  onChange={() => handleMahrTypeChange('deferred')}
                  style={{ 
                    width: '18px', 
                    height: '18px',
                    border: '2.7px solid #CA6C41',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    accentColor: '#CA6C41'
                  }}
                />
                <span style={{ 
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: 'clamp(16px, 3vw, 25px)', 
                  color: '#2E2E2E' 
                }}>Deferred</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.mahrPrompt}
                  onChange={() => handleMahrTypeChange('prompt')}
                  style={{ 
                    width: '18px', 
                    height: '18px',
                    border: '2.7px solid #CA6C41',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    accentColor: '#CA6C41'
                  }}
                />
                <span style={{ 
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: 'clamp(16px, 3vw, 25px)', 
                  color: '#2E2E2E' 
                }}>Prompt</span>
              </label>
            </div>
          </div>
        </FormSection>

        {/* NIKAH DATE AND PLACE Section */}
        <FormSection title="NIKAH DATE AND PLACE">
          <FormRow>
            <FormField label="Date" name="solemnisedDate" type="date" formData={formData} handleChange={handleChange} />
            <FormField label="Place" name="solemnisedPlace" formData={formData} handleChange={handleChange} />
          </FormRow>
          <FormRow>
            <FormField label="Address" name="solemnisedAddress" type="textarea" span={2} formData={formData} handleChange={handleChange} />
          </FormRow>
        </FormSection>

        {/* CONTACT INFORMATION Section */}
        <FormSection title="CONTACT INFORMATION">
          <FormRow>
            <FormField label="Email" name="email" type="email" formData={formData} handleChange={handleChange} />
            <FormField label="Contact Number" name="contactNumber" formData={formData} handleChange={handleChange} />
          </FormRow>
        </FormSection>

        {/* DOCUMENTS Section - Same as Applicant Upload Page */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '2rem' }}>
          {/* Section: Identification */}
          <FormSection title="IDENTIFICATION DOCUMENTS">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <UploadCard
                title="Groom's ID Proof"
                subtitle="Passport or Driving Licence"
                name="groomIdFile"
                required
              />
              <UploadCard
                title="Bride's ID Proof"
                subtitle="Passport or Driving Licence"
                name="brideIdFile"
                required
              />
            </div>
          </FormSection>

          {/* Section: Witnesses */}
          <FormSection title="WITNESSES">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <UploadCard
                title="Witness 1 ID"
                subtitle="Muslim Male Witness ID"
                name="witness1IdFile"
                required
              />
              <UploadCard
                title="Witness 2 ID"
                subtitle="Muslim Male Witness ID"
                name="witness2IdFile"
                required
              />
            </div>
          </FormSection>

          {/* Section: Wedding Details */}
          <FormSection title="WEDDING DETAILS">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <UploadCard
                title="Mahr Declaration"
                subtitle="Signed by both parties"
                name="mahrDeclarationFile"
                required
              />
            </div>
          </FormSection>

          {/* Section 4: Additional Requirements (Collapsible) */}
          <div style={{ backgroundColor: 'white', border: '1px solid var(--slate-200)', borderRadius: '0.75rem', boxShadow: 'var(--shadow-sm)' }}>
            <div 
              onClick={() => setShowAdditional(!showAdditional)} 
              style={{ padding: '1rem', backgroundColor: 'var(--slate-50)', borderBottom: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={18} style={{ color: 'var(--brand-600)' }} />
                <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1rem', fontWeight: 600, color: 'var(--slate-800)', margin: 0 }}>Additional Circumstances</h3>
              </div>
              <button style={{ border: 'none', background: 'transparent', color: 'var(--slate-400)', cursor: 'pointer' }}>
                {showAdditional ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>

            <div style={{ display: showAdditional ? 'block' : 'none', padding: '1.5rem' }}>
              {/* Conversion To Islam */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <input
                    type="checkbox"
                    checked={hasConversionCertificate}
                    onChange={(e) => {
                      setHasConversionCertificate(e.target.checked);
                      if (!e.target.checked) {
                        setGroomConverted(false);
                        setBrideConverted(false);
                        setFormData(prev => ({ ...prev, groomConversionCertFile: null, brideConversionCertFile: null }));
                      }
                    }}
                    style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--brand-500)', cursor: 'pointer' }}
                  />
                  <label style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: 'var(--slate-800)', cursor: 'pointer' }}>
                    Do you have a certificate of conversion to Islam?
                  </label>
                </div>

                {hasConversionCertificate && (
                  <div style={{ borderLeft: '2px solid var(--slate-100)', paddingLeft: '2rem', marginLeft: '0.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Groom Conversion */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <input
                            type="checkbox"
                            checked={groomConverted}
                            onChange={(e) => {
                              setGroomConverted(e.target.checked);
                              if (!e.target.checked) {
                                setFormData(prev => ({ ...prev, groomConversionCertFile: null }));
                              }
                            }}
                            style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--brand-500)', cursor: 'pointer' }}
                          />
                          <label style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: 'var(--slate-800)', cursor: 'pointer' }}>
                            Has the Groom converted to Islam?
                          </label>
                        </div>
                        {groomConverted && (
                          <div style={{ paddingLeft: '2rem', marginLeft: '0.5rem' }}>
                            <UploadCard
                              title="Groom's Certificate"
                              subtitle="Certificate of Conversion"
                              name="groomConversionCertFile"
                              required
                            />
                          </div>
                        )}
                      </div>

                      {/* Bride Conversion */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <input
                            type="checkbox"
                            checked={brideConverted}
                            onChange={(e) => {
                              setBrideConverted(e.target.checked);
                              if (!e.target.checked) {
                                setFormData(prev => ({ ...prev, brideConversionCertFile: null }));
                              }
                            }}
                            style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--brand-500)', cursor: 'pointer' }}
                          />
                          <label style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: 'var(--slate-800)', cursor: 'pointer' }}>
                            Has the Bride converted to Islam?
                          </label>
                        </div>
                        {brideConverted && (
                          <div style={{ paddingLeft: '2rem', marginLeft: '0.5rem' }}>
                            <UploadCard
                              title="Bride's Certificate"
                              subtitle="Certificate of Conversion"
                              name="brideConversionCertFile"
                              required
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <hr style={{ borderTop: '1px solid var(--slate-100)', borderBottom: 'none', margin: '2rem 0' }} />

              {/* Ahle Kitab */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <input
                    type="checkbox"
                    checked={brideAhleKitab}
                    onChange={(e) => {
                      setBrideAhleKitab(e.target.checked);
                      if (!e.target.checked) {
                        setFormData(prev => ({ ...prev, statutoryDeclarationFile: null }));
                      }
                    }}
                    style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--brand-500)', cursor: 'pointer' }}
                  />
                  <label style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: 'var(--slate-800)', cursor: 'pointer' }}>
                    Is the bride from the People of the Book (Ahle Kitab)?
                  </label>
                </div>
                {brideAhleKitab && (
                  <div style={{ borderLeft: '2px solid var(--slate-100)', paddingLeft: '2rem', marginLeft: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: '#fffbeb', borderColor: '#fcd34d', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#92400e', border: '1px solid #fcd34d' }}>
                      <strong>Note:</strong> The Statutory Declaration (Affidavit) must be signed by a solicitor or a Commissioner of Oaths.
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                      <UploadCard
                        title="Statutory Declaration"
                        subtitle="Affidavit signed by Solicitor/Commissioner"
                        name="statutoryDeclarationFile"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              <hr style={{ borderTop: '1px solid var(--slate-100)', borderBottom: 'none', margin: '2rem 0' }} />

              {/* Previous Marriage */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <input
                    type="checkbox"
                    checked={bridePreviouslyMarried}
                    onChange={(e) => {
                      setBridePreviouslyMarried(e.target.checked);
                      if (!e.target.checked) {
                        setBrideDivorceType(null);
                        setFormData(prev => ({ ...prev, civilDivorceDocFile: null, islamicDivorceDocFile: null }));
                      }
                    }}
                    style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--brand-500)', cursor: 'pointer' }}
                  />
                  <label style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: 'var(--slate-800)', cursor: 'pointer' }}>
                    Was the bride previously married?
                  </label>
                </div>
                {bridePreviouslyMarried && (
                  <div style={{ borderLeft: '2px solid var(--slate-100)', paddingLeft: '2rem', marginLeft: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ backgroundColor: 'var(--slate-50)', padding: '1rem', borderRadius: '0.5rem' }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.75rem', marginTop: 0 }}>Type of Previous Marriage <span style={{ color: 'var(--danger)' }}>*</span></p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        {['civil', 'islamic', 'both'].map((type) => (
                          <label 
                            key={type} 
                            style={{
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem', 
                              padding: '0.5rem 1rem', 
                              borderRadius: '0.25rem', 
                              border: brideDivorceType === type ? '1px solid var(--brand-500)' : '1px solid transparent',
                              backgroundColor: brideDivorceType === type ? 'white' : 'transparent',
                              boxShadow: brideDivorceType === type ? 'var(--shadow-sm)' : 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <input
                              type="radio"
                              name="divorceType"
                              value={type}
                              checked={brideDivorceType === type}
                              onChange={(e) => {
                                setBrideDivorceType(e.target.value);
                                if (e.target.value !== 'civil') {
                                  setFormData(prev => ({ ...prev, civilDivorceDocFile: null }));
                                }
                                if (e.target.value !== 'islamic') {
                                  setFormData(prev => ({ ...prev, islamicDivorceDocFile: null }));
                                }
                              }}
                              style={{ accentColor: 'var(--brand-500)' }}
                            />
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.875rem', textTransform: 'capitalize' }}>
                              {type === 'both' ? 'Both Civil & Islamic' : `${type} Only`}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                      {(brideDivorceType === 'civil' || brideDivorceType === 'both') && (
                        <UploadCard
                          title="Civil Divorce Doc"
                          subtitle="Decree Absolute"
                          name="civilDivorceDocFile"
                          required
                        />
                      )}
                      {(brideDivorceType === 'islamic' || brideDivorceType === 'both') && (
                        <UploadCard
                          title="Islamic Divorce Doc"
                          subtitle="Talaq / Khula / Faskh"
                          name="islamicDivorceDocFile"
                          required
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Submit Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          padding: '1.5rem',
          background: 'var(--brand-50)',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          marginTop: '2rem'
        }}>
          <button
            type="button"
            onClick={() => navigate('/admin/applications')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--brand-50)',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#475569'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--brand-600)',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'var(--brand-700)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'var(--brand-600)';
              }
            }}
          >
            <Save size={16} />
            {loading ? 'Creating...' : 'Create Application'}
          </button>
        </div>
      </form>
    </div>
  );
}
