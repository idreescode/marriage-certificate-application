import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import { getAllApplications, setDepositAmount as setDepositAPI, verifyPayment as verifyPaymentAPI, scheduleAppointment as scheduleAPI, generateCertificate as generateCertAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Search, Filter, LogOut, CheckCircle, Clock, Banknote, Calendar } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  
  // Modal States
  const [activeModal, setActiveModal] = useState(null); // 'deposit', 'verify', 'schedule'
  const [selectedAppId, setSelectedAppId] = useState(null);
  
  // Form States
  const [depositAmount, setDepositAmount] = useState('');
  const [appointmentData, setAppointmentData] = useState({ date: '', time: '', location: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await getAllApplications();
      setApplications(response.data.data.applications);
    } catch (error) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  // Open Handlers
  const openSetDeposit = (id) => {
    setSelectedAppId(id);
    setDepositAmount('');
    setActiveModal('deposit');
  };

  const openVerifyPayment = (id) => {
    setSelectedAppId(id);
    setActiveModal('verify');
  };

  const openSchedule = (id) => {
    setSelectedAppId(id);
    setAppointmentData({ date: '', time: '', location: '' });
    setActiveModal('schedule');
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedAppId(null);
  };

  // Action Handlers
  const handleSetDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount) return;

    const toastId = toast.loading('Setting deposit...');
    try {
      await setDepositAPI(selectedAppId, { depositAmount: parseFloat(depositAmount) });
      toast.success('Deposit amount set successfully!', { id: toastId });
      closeModal();
      fetchApplications();
    } catch (error) {
      toast.error('Failed to set deposit amount', { id: toastId });
    }
  };

  const handleVerifyPayment = async () => {
    const toastId = toast.loading('Verifying payment...');
    try {
      await verifyPaymentAPI(selectedAppId);
      toast.success('Payment verified successfully!', { id: toastId });
      closeModal();
      fetchApplications();
    } catch (error) {
      toast.error('Failed to verify payment', { id: toastId });
    }
  };

  const handleScheduleAppointment = async (e) => {
    e.preventDefault();
    const { date, time, location } = appointmentData;
    if (!date || !time || !location) return;

    const toastId = toast.loading('Scheduling appointment...');
    try {
      await scheduleAPI(selectedAppId, { 
        appointmentDate: date, 
        appointmentTime: time, 
        appointmentLocation: location 
      });
      toast.success('Appointment scheduled successfully!', { id: toastId });
      closeModal();
      fetchApplications();
    } catch (error) {
      toast.error('Failed to schedule appointment', { id: toastId });
    }
  };

  const handleGenerateCertificate = async (appId) => {
    const toastId = toast.loading('Generating certificate...');
    try {
      await generateCertAPI(appId);
      toast.success('Certificate generated successfully!', { id: toastId });
      fetchApplications();
    } catch (error) {
      toast.error('Failed to generate certificate', { id: toastId });
    }
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      submitted: 'badge-info',
      admin_review: 'badge-warning',
      payment_pending: 'badge-warning',
      payment_verified: 'badge-info',
      appointment_scheduled: 'badge-info',
      completed: 'badge-success'
    };
    return (
      <span className={`badge ${styles[status] || 'badge-info'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    navigate('/');
  };

  if (loading) return <Loader fullscreen />;

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <Navbar />
      <div className="container" style={{ marginTop: '2rem' }}>
        <div className="flex justify-between items-center mb-6" style={{ marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.25rem', color: 'var(--brand-900)' }}>Admin Dashboard</h1>
            <p className="text-slate-500" style={{ margin: 0, fontSize: '1.1rem' }}>Manage marriage applications</p>
          </div>
          <button onClick={handleLogout} className="btn btn-primary">
            <LogOut size={16} /> Logout
          </button>
        </div>

        <div className="card" style={{ padding: '0', borderTop: '4px solid var(--brand-600)' }}>
          <div className="card-header" style={{ padding: '1.5rem', marginBottom: '0' }}>
            <div className="flex justify-between items-center">
              <h2 style={{ fontSize: '1.1rem', margin: '0' }}>Recent Applications</h2>
              <div className="flex gap-2">
                <button className="btn btn-sm btn-secondary"><Filter size={14} /> Filter</button>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--slate-400)' }} />
                  <input className="form-input" placeholder="Search..." style={{ padding: '0.4rem 0.5rem 0.4rem 2rem', fontSize: '0.875rem' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Ref #</th>
                  <th>Groom / Bride</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id}>
                    <td>
                      <span className="text-slate-500 text-sm font-mono">{app.application_number}</span>
                    </td>
                    <td>
                      <div className="font-medium text-slate-900">{app.groom_full_name}</div>
                      <div className="text-xs text-slate-500">{app.bride_full_name}</div>
                    </td>
                    <td><StatusBadge status={app.status} /></td>
                    <td>
                      {app.deposit_amount ? (
                        <div className="text-sm">
                          <span className="font-medium">PKR {app.deposit_amount}</span>
                          {app.payment_receipt_url && !app.payment_verified_at && (
                            <span className="block text-xs text-brand-600 mt-1 flex items-center gap-1">
                              <CheckCircle size={10} /> Receipt
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2 flex-wrap">
                        {app.status === 'admin_review' && (
                          <button onClick={() => openSetDeposit(app.id)} className="btn btn-sm btn-primary">
                            <Banknote size={14} /> Set Deposit
                          </button>
                        )}
                        {app.status === 'payment_pending' && app.payment_receipt_url && (
                          <button onClick={() => openVerifyPayment(app.id)} className="btn btn-sm btn-primary">
                            <CheckCircle size={14} /> Verify
                          </button>
                        )}
                        {app.status === 'payment_verified' && (
                          <button onClick={() => openSchedule(app.id)} className="btn btn-sm btn-secondary">
                            <Calendar size={14} /> Schedule
                          </button>
                        )}
                        {app.status === 'appointment_scheduled' && (
                          <button onClick={() => handleGenerateCertificate(app.id)} className="btn btn-sm btn-success text-white" style={{ background: 'var(--success)', color: 'white', border: 'none' }}>
                            <CheckCircle size={14} /> Finish
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals */}
        <Modal 
          isOpen={activeModal === 'deposit'} 
          onClose={closeModal} 
          title="Set Deposit Amount"
        >
          <form onSubmit={handleSetDeposit}>
            <div className="form-group">
              <label className="form-label">Amount (PKR)</label>
              <input 
                type="number" 
                className="form-input" 
                value={depositAmount} 
                onChange={(e) => setDepositAmount(e.target.value)} 
                placeholder="e.g. 5000"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary">Set Amount</button>
            </div>
          </form>
        </Modal>

        <Modal 
          isOpen={activeModal === 'verify'} 
          onClose={closeModal} 
          title="Verify Payment"
        >
          <p className="text-slate-600 mb-6">Are you sure you want to verify the payment receipt for this application? This will confirm the payment and allow scheduling.</p>
          <div className="flex justify-end gap-2">
            <button onClick={closeModal} className="btn btn-secondary">Cancel</button>
            <button onClick={handleVerifyPayment} className="btn btn-primary">Confirm Verification</button>
          </div>
        </Modal>

        <Modal 
          isOpen={activeModal === 'schedule'} 
          onClose={closeModal} 
          title="Schedule Appointment"
        >
          <form onSubmit={handleScheduleAppointment}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={appointmentData.date} 
                onChange={(e) => setAppointmentData({...appointmentData, date: e.target.value})} 
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Time</label>
              <input 
                type="time" 
                className="form-input" 
                value={appointmentData.time} 
                onChange={(e) => setAppointmentData({...appointmentData, time: e.target.value})} 
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input 
                type="text" 
                className="form-input" 
                value={appointmentData.location} 
                onChange={(e) => setAppointmentData({...appointmentData, location: e.target.value})} 
                placeholder="e.g. Main Hall, Jamiyat Center"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary">Schedule Event</button>
            </div>
          </form>
        </Modal>

      </div>
    </div>
  );
}
