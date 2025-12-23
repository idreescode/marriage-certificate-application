import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { submitApplication } from '../services/api';
import toast from 'react-hot-toast';
import { User, Calendar, MapPin, Phone, Mail, FileText, Users, ArrowRight, Save } from 'lucide-react';

export default function ApplicationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    groomFullName: '', groomDateOfBirth: '', groomAddress: '', groomPhone: '', groomEmail: '', groomIdNumber: '',
    brideFullName: '', brideDateOfBirth: '', brideAddress: '', bridePhone: '', brideEmail: '', brideIdNumber: '',
    witness1Name: '', witness1Phone: '', witness1Email: '',
    witness2Name: '', witness2Phone: '', witness2Email: '',
    preferredDate: '', specialRequests: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        witnesses: [
          { name: formData.witness1Name, phone: formData.witness1Phone, email: formData.witness1Email },
          { name: formData.witness2Name, phone: formData.witness2Phone, email: formData.witness2Email }
        ]
      };

      const response = await submitApplication(data);
      toast.success(`Application submitted successfully!\nRef: ${response.data.data.applicationNumber}`, { duration: 5000 });
      navigate('/');
    } catch (error) {
      toast.error('Failed to submit application: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
      <Icon className="text-brand-600" size={24} style={{ color: 'var(--brand-600)' }} />
      <h3 className="m-0 text-slate-800" style={{ margin: 0, fontSize: '1.25rem' }}>{title}</h3>
    </div>
  );

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <Navbar />
      <div className="container" style={{ maxWidth: '98%', marginTop: '2rem' }}>
        <div className="card">
          <div className="text-center mb-6">
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Marriage Certificate Application</h1>
            <p className="text-slate-500">Please fill out the form accurately. ID cards will be verified at the appointment.</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Groom Section */}
            <div className="mb-8" style={{ marginBottom: '2rem' }}>
              <SectionHeader icon={User} title="Groom Information" />
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" name="groomFullName" value={formData.groomFullName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">ID Number (CNIC) *</label>
                  <input className="form-input" name="groomIdNumber" value={formData.groomIdNumber} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth *</label>
                  <input type="date" className="form-input" name="groomDateOfBirth" value={formData.groomDateOfBirth} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone *</label>
                  <input className="form-input" name="groomPhone" value={formData.groomPhone} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" className="form-input" name="groomEmail" value={formData.groomEmail} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Full Address *</label>
                  <input className="form-input" name="groomAddress" value={formData.groomAddress} onChange={handleChange} required />
                </div>
              </div>
            </div>

            {/* Bride Section */}
            <div className="mb-8" style={{ marginBottom: '2rem' }}>
              <SectionHeader icon={User} title="Bride Information" />
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" name="brideFullName" value={formData.brideFullName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">ID Number (CNIC) *</label>
                  <input className="form-input" name="brideIdNumber" value={formData.brideIdNumber} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth *</label>
                  <input type="date" className="form-input" name="brideDateOfBirth" value={formData.brideDateOfBirth} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone *</label>
                  <input className="form-input" name="bridePhone" value={formData.bridePhone} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" className="form-input" name="brideEmail" value={formData.brideEmail} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Full Address *</label>
                  <input className="form-input" name="brideAddress" value={formData.brideAddress} onChange={handleChange} required />
                </div>
              </div>
            </div>

            {/* Witnesses Section */}
            <div className="mb-8" style={{ marginBottom: '2rem' }}>
              <SectionHeader icon={Users} title="Witnesses" />
              
              <div style={{ background: 'var(--slate-50)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--slate-700)', marginBottom: '1rem' }}>Witness 1</h4>
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input className="form-input" name="witness1Name" value={formData.witness1Name} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input className="form-input" name="witness1Phone" value={formData.witness1Phone} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email (Optional)</label>
                    <input type="email" className="form-input" name="witness1Email" value={formData.witness1Email} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--slate-50)', padding: '1.5rem', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--slate-700)', marginBottom: '1rem' }}>Witness 2</h4>
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input className="form-input" name="witness2Name" value={formData.witness2Name} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input className="form-input" name="witness2Phone" value={formData.witness2Phone} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email (Optional)</label>
                    <input type="email" className="form-input" name="witness2Email" value={formData.witness2Email} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="mb-8" style={{ marginBottom: '2rem' }}>
              <SectionHeader icon={FileText} title="Additional Details" />
              <div className="form-group">
                <label className="form-label">Preferred Date</label>
                <input type="date" className="form-input" name="preferredDate" value={formData.preferredDate} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Special Requests</label>
                <textarea className="form-textarea" name="specialRequests" value={formData.specialRequests} onChange={handleChange} />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                {loading ? 'Submitting...' : <span className="flex items-center gap-2">Submit Application <ArrowRight size={20} /></span>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
