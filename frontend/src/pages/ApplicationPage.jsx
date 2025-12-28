import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { submitApplication } from '../services/api';
import toast from 'react-hot-toast';

// Helper Components (defined outside to prevent re-creation)
const SectionHeader = ({ title }) => (
  <div className="jam-section-header">
    <h3 className="jam-section-title">{title}</h3>
  </div>
);

const InputField = ({ label, name, value, onChange, required = false, type = "text", placeholder = "" }) => (
  <div className="mb-6">
    <label className="jam-label">
      {label} {required && <span className="required-star">*</span>}
    </label>
    <input 
      type={type} 
      className="jam-input" 
      name={name} 
      value={value || ''} 
      onChange={onChange} 
      required={required}
      placeholder={placeholder} 
    />
  </div>
);

export default function ApplicationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Groom
    groomName: '', groomFatherName: '',
    groomDateOfBirth: '', groomPlaceOfBirth: '',
    groomAddress: '',
    groomConfirm: false,
    groomPersonally: false,
    groomRepresentative: false,

    // Groom Representative
    groomRepName: '', groomRepFatherName: '',
    groomRepDateOfBirth: '', groomRepPlaceOfBirth: '',
    groomRepAddress: '',

    // Bride
    brideName: '', brideFatherName: '',
    brideDateOfBirth: '', bridePlaceOfBirth: '',
    brideAddress: '',
    brideConfirm: false,
    bridePersonally: false,
    brideRepresentative: false,

    // Bride Representative
    brideRepName: '', brideRepFatherName: '',
    brideRepDateOfBirth: '', brideRepPlaceOfBirth: '',
    brideRepAddress: '',

    // Witness 1
    witness1Name: '', witness1FatherName: '', 
    witness1DateOfBirth: '', witness1PlaceOfBirth: '',
    witness1Address: '',

    // Witness 2
    witness2Name: '', witness2FatherName: '',
    witness2DateOfBirth: '', witness2PlaceOfBirth: '',
    witness2Address: '',

    // Mahr
    mahrAmount: '',
    mahrType: '', // deferred | prompt

    // Solemnised Date & Place
    solemnisedDate: '',
    solemnisedPlace: '',
    solemnisedAddress: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Add missing required fields with defaults
      const payload = {
        ...formData,
        groomPhone: formData.groomPhone || '',
        groomEmail: formData.groomEmail || '',
        groomIdNumber: formData.groomIdNumber || '',
        bridePhone: formData.bridePhone || '',
        brideEmail: formData.brideEmail || '',
        brideIdNumber: formData.brideIdNumber || '',
        preferredDate: formData.preferredDate || null,
        specialRequests: formData.specialRequests || ''
      };

      const response = await submitApplication(payload);
      const applicationId = response.data.data.applicationId;
      
      toast.success(`Application submitted successfully!\nRef: ${response.data.data.applicationNumber}`, { duration: 5000 });
      
      // Redirect to dashboard (or login if not authenticated, but currently just showing success)
      navigate('/login');
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to submit application. Please check all fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 mt-8 pb-20" style={{ maxWidth: '1200px' }}>
        
        <form onSubmit={handleSubmit}>
          
          {/* BRIDEGROOM */}
          <div className="mb-12">
            <SectionHeader title="BRIDEGROOM" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <InputField label="Full Name" name="groomName" value={formData.groomName} onChange={handleChange} required />
              <InputField label="Father's Name" name="groomFatherName" value={formData.groomFatherName} onChange={handleChange} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <InputField type="date" label="Place Of Birth" name="groomDateOfBirth" value={formData.groomDateOfBirth} onChange={handleChange} />
              <InputField label="Place Of Birth" name="groomPlaceOfBirth" value={formData.groomPlaceOfBirth} onChange={handleChange} />
            </div>
            <InputField label="Present Address" name="groomAddress" value={formData.groomAddress} onChange={handleChange} />
            
            <div className="mb-6">
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  name="groomConfirm" 
                  checked={formData.groomConfirm} 
                  onChange={handleChange}
                  className="w-5 h-5 mt-1 accent-[#CA6C40]"
                  required
                />
                <label className="text-lg text-[#333] font-['Poppins']">
                  I can confirm that I have the power, fitness and capacity to marry in Islamic law and fulfil my duties in an Islamic marriage
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label className="jam-label mb-4">Personally/Representative</label>
              <div className="flex gap-8">
                <div className="jam-checkbox-wrapper">
                  <input 
                    type="checkbox" 
                    name="groomPersonally" 
                    checked={formData.groomPersonally} 
                    onChange={handleChange}
                    className="w-5 h-5 accent-[#CA6C40]"
                  />
                  <span className="jam-checkbox-label">Personally</span>
                </div>
                <div className="jam-checkbox-wrapper">
                  <input 
                    type="checkbox" 
                    name="groomRepresentative" 
                    checked={formData.groomRepresentative} 
                    onChange={handleChange}
                    className="w-5 h-5 accent-[#CA6C40]"
                  />
                  <span className="jam-checkbox-label">Representative</span>
                </div>
              </div>
            </div>
          </div>

          {/* BRIDE */}
          <div className="mb-12">
            <SectionHeader title="BRIDE" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <InputField label="Full Name" name="brideName" value={formData.brideName} onChange={handleChange} required />
              <InputField label="Father's Name" name="brideFatherName" value={formData.brideFatherName} onChange={handleChange} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <InputField type="date" label="Place Of Birth" name="brideDateOfBirth" value={formData.brideDateOfBirth} onChange={handleChange} />
              <InputField label="Place Of Birth" name="bridePlaceOfBirth" value={formData.bridePlaceOfBirth} onChange={handleChange} />
            </div>
            <InputField label="Present Address" name="brideAddress" value={formData.brideAddress} onChange={handleChange} />
            
            <div className="mb-6">
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  name="brideConfirm" 
                  checked={formData.brideConfirm} 
                  onChange={handleChange}
                  className="w-5 h-5 mt-1 accent-[#CA6C40]"
                  required
                />
                <label className="text-lg text-[#333] font-['Poppins']">
                  I can confirm that I have the power, fitness and capacity to marry in Islamic law and fulfil my duties in an Islamic marriage
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label className="jam-label mb-4">Personally/Representative</label>
              <div className="flex gap-8">
                <div className="jam-checkbox-wrapper">
                  <input 
                    type="checkbox" 
                    name="bridePersonally" 
                    checked={formData.bridePersonally} 
                    onChange={handleChange}
                    className="w-5 h-5 accent-[#CA6C40]"
                  />
                  <span className="jam-checkbox-label">Personally</span>
                </div>
                <div className="jam-checkbox-wrapper">
                  <input 
                    type="checkbox" 
                    name="brideRepresentative" 
                    checked={formData.brideRepresentative} 
                    onChange={handleChange}
                    className="w-5 h-5 accent-[#CA6C40]"
                  />
                  <span className="jam-checkbox-label">Representative</span>
                </div>
              </div>
            </div>
          </div>

          {/* GROOM REPRESENTATIVE */}
          <div className="mb-12">
              <SectionHeader title="REPRESENTATIVE OR GUARDIAN OF BRIDE GROOM" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <InputField label="Full Name" name="groomRepName" value={formData.groomRepName} onChange={handleChange} required />
                <InputField label="Father's Name" name="groomRepFatherName" value={formData.groomRepFatherName} onChange={handleChange} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <InputField type="date" label="Place Of Birth" name="groomRepDateOfBirth" value={formData.groomRepDateOfBirth} onChange={handleChange} />
                <InputField label="Place Of Birth" name="groomRepPlaceOfBirth" value={formData.groomRepPlaceOfBirth} onChange={handleChange} />
              </div>
              <InputField label="Present Address" name="groomRepAddress" value={formData.groomRepAddress} onChange={handleChange} />
          </div>

          {/* BRIDE REPRESENTATIVE */}
          <div className="mb-12">
              <SectionHeader title="REPRESENTATIVE OR GUARDIAN OF BRIDE" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <InputField label="Full Name" name="brideRepName" value={formData.brideRepName} onChange={handleChange} required />
                <InputField label="Father's Name" name="brideRepFatherName" value={formData.brideRepFatherName} onChange={handleChange} required />
              </div>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <InputField type="date" label="Place Of Birth" name="brideRepDateOfBirth" value={formData.brideRepDateOfBirth} onChange={handleChange} />
                <InputField label="Place Of Birth" name="brideRepPlaceOfBirth" value={formData.brideRepPlaceOfBirth} onChange={handleChange} />
              </div>
              <InputField label="Present Address" name="brideRepAddress" value={formData.brideRepAddress} onChange={handleChange} />
          </div>


          {/* WITNESS 1 */}
          <div className="mb-12">
            <SectionHeader title="WITNESS NO 1" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <InputField label="Full Name" name="witness1Name" value={formData.witness1Name} onChange={handleChange} required />
              <InputField label="Father's Name" name="witness1FatherName" value={formData.witness1FatherName} onChange={handleChange} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <InputField type="date" label="Place Of Birth" name="witness1DateOfBirth" value={formData.witness1DateOfBirth} onChange={handleChange} />
              <InputField label="Place Of Birth" name="witness1PlaceOfBirth" value={formData.witness1PlaceOfBirth} onChange={handleChange} />
            </div>
            <InputField label="Present Address" name="witness1Address" value={formData.witness1Address} onChange={handleChange} />
          </div>

          {/* WITNESS 2 */}
          <div className="mb-12">
             <SectionHeader title="WITNESS NO 2" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <InputField label="Full Name" name="witness2Name" value={formData.witness2Name} onChange={handleChange} required />
              <InputField label="Father's Name" name="witness2FatherName" value={formData.witness2FatherName} onChange={handleChange} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <InputField type="date" label="Place Of Birth" name="witness2DateOfBirth" value={formData.witness2DateOfBirth} onChange={handleChange} />
              <InputField label="Place Of Birth" name="witness2PlaceOfBirth" value={formData.witness2PlaceOfBirth} onChange={handleChange} />
            </div>
            <InputField label="Present Address" name="witness2Address" value={formData.witness2Address} onChange={handleChange} />
          </div>

          {/* MAHR */}
          <div className="mb-12">
            <SectionHeader title="MAHR" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputField label="Mahr Amount" name="mahrAmount" value={formData.mahrAmount} onChange={handleChange} />
              
              <div>
                <label className="jam-label mb-4">Deferred/Prompt</label>
                <div className="flex gap-4 mt-2">
                  <div className="jam-checkbox-wrapper">
                    <input 
                      type="checkbox" 
                      name="mahrDeferred"
                      checked={formData.mahrType === 'deferred'} 
                      onChange={() => setFormData(prev => ({ ...prev, mahrType: 'deferred' }))}
                      className="w-5 h-5 accent-[#CA6C40]"
                    />
                    <span className="jam-checkbox-label">Deferred</span>
                  </div>
                  <div className="jam-checkbox-wrapper">
                    <input 
                      type="checkbox" 
                      name="mahrPrompt"
                      checked={formData.mahrType === 'prompt'} 
                      onChange={() => setFormData(prev => ({ ...prev, mahrType: 'prompt' }))}
                      className="w-5 h-5 accent-[#CA6C40]"
                    />
                    <span className="jam-checkbox-label">Prompt</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SOLEMNISED DATE & PLACE */}
          <div className="mb-12">
            <SectionHeader title="SOLEMNISED DATE & PLACE" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <InputField type="date" label="Date" name="solemnisedDate" value={formData.solemnisedDate} onChange={handleChange} />
              <InputField label="Place" name="solemnisedPlace" value={formData.solemnisedPlace} onChange={handleChange} />
            </div>
            <InputField label="Address" name="solemnisedAddress" value={formData.solemnisedAddress} onChange={handleChange} />
          </div>

          <div className="flex justify-center mt-12 mb-20">
            <button 
              type="submit" 
              className="jam-submit-btn"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Button'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
