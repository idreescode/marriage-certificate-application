
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplicationById, generateCertificate as generateCertAPI, getFileUrl } from '../services/api';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import {
    ArrowLeft, User, Calendar, Phone, Mail, MapPin,
    FileText, CheckCircle, Clock, Globe, Shield, Download,
    CreditCard, MoreVertical, ExternalLink, Printer
} from 'lucide-react';

export default function AdminApplicationDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    // Print functionality added

    const [loading, setLoading] = useState(true);
    const [application, setApplication] = useState(null);
    const [witnesses, setWitnesses] = useState([]);

    useEffect(() => {
        fetchApplicationDetails();
    }, [id]);

    const fetchApplicationDetails = async () => {
        try {
            const response = await getApplicationById(id);
            if (response.data.success) {
                setApplication(response.data.data.application);
                setWitnesses(response.data.data.witnesses);
            }
        } catch (error) {
            toast.error('Failed to load application details');
            navigate('/admin/applications');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateCertificate = async () => {
        const toastId = toast.loading('Generating certificate...');
        try {
            await generateCertAPI(id);
            toast.success('Certificate generated successfully!', { id: toastId });
            fetchApplicationDetails();
        } catch (error) {
            toast.error('Failed to generate certificate', { id: toastId });
        }
    };

    const handlePrint = () => {
        // Add application data to body for print header
        if (application) {
            document.body.setAttribute('data-app-number', application.application_number || '');
            document.body.setAttribute('data-app-date', application.created_at ? new Date(application.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '');
        }
        window.print();
    };

    const StatusBadge = ({ status }) => {
        const config = {
            submitted: { color: 'bg-blue-100 text-blue-700', label: 'Submitted' },
            admin_review: { color: 'bg-amber-100 text-amber-700', label: 'Admin Review' },
            payment_pending: { color: 'bg-orange-100 text-orange-700', label: 'Payment Pending' },
            payment_verified: { color: 'bg-indigo-100 text-indigo-700', label: 'Payment Verified' },
            appointment_scheduled: { color: 'bg-purple-100 text-purple-700', label: 'Appointment Set' },
            completed: { color: 'bg-emerald-100 text-emerald-700', label: 'Completed' },
            cancelled: { color: 'bg-red-100 text-red-700', label: 'Cancelled' }
        };

        const style = config[status] || { color: 'bg-gray-100 text-gray-700', label: status };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${style.color}`}>
                {style.label}
            </span>
        );
    };

    const InfoItem = ({ icon: Icon, label, value, subValue }) => (
        <div className="info-item-row">
            <div className="item-icon-circle">
                <Icon size={16} />
            </div>
            <div className="info-content">
                <p className="info-label">{label}</p>
                <p className="info-value">{value || 'N/A'}</p>
                {subValue && <p className="info-subvalue">{subValue}</p>}
            </div>
        </div>
    );

    const DocumentCard = ({ title, path }) => {
        if (!path) return null;

        return (
            <div className="doc-action-row">
                <div className="doc-row-left">
                    <div className="doc-icon-box">
                        <FileText size={18} />
                    </div>
                    <span className="doc-row-title">{title}</span>
                </div>
                <a
                    href={getFileUrl(path)}
                    target="_blank"
                    rel="noreferrer"
                    className="doc-view-btn"
                >
                    Open
                    <ExternalLink size={14} />
                </a>
            </div>
        );
    };

    if (loading) return <Loader fullscreen />;
    if (!application) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Application Not Found</h2>
                <button onClick={() => navigate('/admin/applications')} className="text-blue-600 hover:underline">
                    Return to Applications
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen pb-12">
            <div className="max-w-6xl mx-auto px-6" style={{ paddingTop: '2rem' }}>

                {/* Header Hero Section */}
                <div style={{
                    background: 'linear-gradient(135deg, var(--brand-600) 0%, var(--brand-800) 100%)',
                    padding: '2.5rem',
                    borderRadius: '20px',
                    marginBottom: '2rem',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}>
                    {/* Breadcrumb / Top Row */}
                    <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-2">
                        <button
                            onClick={() => navigate('/admin/applications')}
                            className="btn-back-nav"
                        >
                            <ArrowLeft size={16} /> Back to Applications
                        </button>
                        <span className="font-mono text-white/80 text-sm bg-white/10 px-3 py-1 rounded-full">
                            ID: #{application.application_number}
                        </span>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-6">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <h1 style={{ color: 'white', margin: 0 }} className="text-3xl font-bold tracking-tight">Nikkah Application</h1>
                                <div className="bg-white rounded-full px-2 py-1">
                                    <StatusBadge status={application.status} />
                                </div>
                            </div>
                            <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '1.125rem' }}>
                                <span className="font-semibold">{application.groom_full_name}</span>
                                <span className="mx-2">&</span>
                                <span className="font-semibold">{application.bride_full_name}</span>
                            </p>
                            <div className="flex items-center gap-6 mt-4 text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                <span className="flex items-center gap-1.5"><Clock size={16} /> Applied on {new Date(application.created_at).toLocaleDateString()}</span>
                                {application.preferred_date && (
                                    <span className="flex items-center gap-1.5"><Calendar size={16} /> Preferred Date: {new Date(application.preferred_date).toLocaleDateString()}</span>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', minWidth: '200px', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
                                {application.status === 'appointment_scheduled' && (
                                    <button onClick={handleGenerateCertificate} className="btn bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                                        <CheckCircle size={18} className="mr-2" /> Mark Completed
                                    </button>
                                )}
                                <button 
                                    onClick={handlePrint} 
                                    className="btn-back-nav print-button"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <Printer size={16} /> Print Application
                                </button>
                            </div>
                            {application.certificate_url && (
                                <a
                                    href={getFileUrl(application.certificate_url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn-back-nav"
                                    style={{ textDecoration: 'none', marginTop: 'auto' }}
                                >
                                    <Download size={16} /> Download Certificate
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3" style={{ gap: '2rem' }}>

                    {/* Main Info Column */}
                    <div className="xl:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Applicant Details */}
                        {/* Split Groom & Bride Cards */}
                        <div className="grid-2-cols">

                            {/* Groom Card */}
                            <div className="details-card bg-groom-card">
                                <div className="card-title-row">
                                    <div className="icon-box icon-box-blue">
                                        <User size={22} />
                                    </div>
                                    <h2 className="card-title-text">Groom’s Details</h2>
                                </div>
                                <div className="card-body">
                                    <InfoItem icon={User} label="Full Name" value={application.groom_full_name} />
                                    {application.groom_father_name && (
                                        <InfoItem icon={User} label="Father's Name" value={application.groom_father_name} />
                                    )}
                                    <InfoItem icon={Calendar} label="Date of Birth" value={new Date(application.groom_date_of_birth).toLocaleDateString(undefined, { dateStyle: 'long' })} />
                                    {application.groom_place_of_birth && (
                                        <InfoItem icon={MapPin} label="Place of Birth" value={application.groom_place_of_birth} />
                                    )}
                                    <InfoItem icon={MapPin} label="Residential Address" value={application.groom_address} />
                                </div>
                            </div>

                            {/* Bride Card */}
                            <div className="details-card bg-bride-card">
                                <div className="card-title-row">
                                    <div className="icon-box icon-box-rose">
                                        <User size={22} />
                                    </div>
                                    <h2 className="card-title-text">Bride’s Details</h2>
                                </div>
                                <div className="card-body">
                                    <InfoItem icon={User} label="Full Name" value={application.bride_full_name} />
                                    {application.bride_father_name && (
                                        <InfoItem icon={User} label="Father's Name" value={application.bride_father_name} />
                                    )}
                                    <InfoItem icon={Calendar} label="Date of Birth" value={new Date(application.bride_date_of_birth).toLocaleDateString(undefined, { dateStyle: 'long' })} />
                                    {application.bride_place_of_birth && (
                                        <InfoItem icon={MapPin} label="Place of Birth" value={application.bride_place_of_birth} />
                                    )}
                                    <InfoItem icon={MapPin} label="Residential Address" value={application.bride_address} />
                                </div>
                            </div>
                        </div>

                        {/* Representatives Section - Side by Side */}
                        {(application.groom_rep_name || application.bride_rep_name) && (
                            <div className="grid-2-cols">
                                {/* Groom Representative */}
                                {application.groom_rep_name && (
                                    <div className="details-card bg-witness-card">
                                        <div className="card-title-row">
                                            <div className="icon-box icon-box-blue">
                                                <User size={22} />
                                            </div>
                                            <h2 className="card-title-text">Groom's Representative</h2>
                                        </div>
                                        <div className="card-body">
                                            <InfoItem icon={User} label="Full Name" value={application.groom_rep_name} />
                                            {application.groom_rep_father_name && (
                                                <InfoItem icon={User} label="Father's Name" value={application.groom_rep_father_name} />
                                            )}
                                            {application.groom_rep_date_of_birth && (
                                                <InfoItem icon={Calendar} label="Date of Birth" value={new Date(application.groom_rep_date_of_birth).toLocaleDateString(undefined, { dateStyle: 'long' })} />
                                            )}
                                            {application.groom_rep_place_of_birth && (
                                                <InfoItem icon={MapPin} label="Place of Birth" value={application.groom_rep_place_of_birth} />
                                            )}
                                            {application.groom_rep_address && (
                                                <InfoItem icon={MapPin} label="Residential Address" value={application.groom_rep_address} />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Bride Representative */}
                                {application.bride_rep_name && (
                                    <div className="details-card bg-witness-card">
                                        <div className="card-title-row">
                                            <div className="icon-box icon-box-rose">
                                                <User size={22} />
                                            </div>
                                            <h2 className="card-title-text">Bride's Representative</h2>
                                        </div>
                                        <div className="card-body">
                                            <InfoItem icon={User} label="Full Name" value={application.bride_rep_name} />
                                            {application.bride_rep_father_name && (
                                                <InfoItem icon={User} label="Father's Name" value={application.bride_rep_father_name} />
                                            )}
                                            {application.bride_rep_date_of_birth && (
                                                <InfoItem icon={Calendar} label="Date of Birth" value={new Date(application.bride_rep_date_of_birth).toLocaleDateString(undefined, { dateStyle: 'long' })} />
                                            )}
                                            {application.bride_rep_place_of_birth && (
                                                <InfoItem icon={MapPin} label="Place of Birth" value={application.bride_rep_place_of_birth} />
                                            )}
                                            {application.bride_rep_address && (
                                                <InfoItem icon={MapPin} label="Residential Address" value={application.bride_rep_address} />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {witnesses.length > 0 ? (
                            <div className="grid-2-cols">
                                {witnesses.map((witness, i) => {
                                    const variants = [
                                        { bg: 'bg-witness-amber', icon: 'icon-box-amber' },
                                        { bg: 'bg-witness-emerald', icon: 'icon-box-emerald' },
                                        { bg: 'bg-witness-violet', icon: 'icon-box-violet' },
                                        { bg: 'bg-witness-orange', icon: 'icon-box-orange' },
                                        { bg: 'bg-witness-slate', icon: 'icon-box-slate' },
                                        { bg: 'bg-witness-lime', icon: 'icon-box-lime' }
                                    ];
                                    const variant = variants[i % variants.length];

                                    return (
                                        <div key={witness.id} className={`details-card ${variant.bg}`}>
                                            <div className="card-title-row">
                                                <div className={`icon-box ${variant.icon}`}>
                                                    <User size={22} />
                                                </div>
                                                <h2 className="card-title-text">Witness {i + 1}</h2>
                                            </div>
                                            <div className="card-body">
                                                <InfoItem icon={User} label="Full Name" value={witness.witness_name} />
                                                {witness.witness_father_name && (
                                                    <InfoItem icon={User} label="Father Name" value={witness.witness_father_name} />
                                                )}
                                                {witness.witness_date_of_birth && (
                                                    <InfoItem icon={Calendar} label="Date of Birth" value={new Date(witness.witness_date_of_birth).toLocaleDateString(undefined, { dateStyle: 'long' })} />
                                                )}
                                                {witness.witness_place_of_birth && (
                                                    <InfoItem icon={MapPin} label="Place of Birth" value={witness.witness_place_of_birth} />
                                                )}
                                                {witness.witness_address && (
                                                    <InfoItem icon={MapPin} label="Residential Address" value={witness.witness_address} />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="details-card bg-white border-dashed text-center py-12">
                                <p className="text-slate-400 font-medium">No witness information available for this application.</p>
                            </div>
                        )}

                        {/* Mahr Details Section */}
                        {(application.mahr_amount || application.mahr_type) && (
                            <div className="details-card bg-payment-card">
                                <div className="card-title-row">
                                    <div className="icon-box icon-box-green">
                                        <CreditCard size={22} />
                                    </div>
                                    <h2 className="card-title-text">Mahr (Dower) Details</h2>
                                </div>
                                <div className="card-body">
                                    {application.mahr_amount && (
                                        <InfoItem icon={CreditCard} label="Mahr Amount" value={application.mahr_amount} />
                                    )}
                                    {application.mahr_type && (
                                        <InfoItem icon={FileText} label="Mahr Type" value={application.mahr_type === 'prompt' ? 'Prompt (Immediate)' : 'Deferred'} />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Solemnisation Details Section */}
                        {(application.solemnised_date || application.solemnised_place || application.solemnised_address) && (
                            <div className="details-card bg-appointment-card">
                                <div className="card-title-row">
                                    <div className="icon-box icon-box-purple">
                                        <Calendar size={22} />
                                    </div>
                                    <h2 className="card-title-text">Solemnisation Details</h2>
                                </div>
                                <div className="card-body">
                                    {application.solemnised_date && (
                                        <InfoItem 
                                            icon={Calendar} 
                                            label="Date of Solemnisation" 
                                            value={new Date(application.solemnised_date).toLocaleDateString(undefined, { dateStyle: 'long' })} 
                                        />
                                    )}
                                    {application.solemnised_place && (
                                        <InfoItem icon={MapPin} label="Place of Solemnisation" value={application.solemnised_place} />
                                    )}
                                    {application.solemnised_address && (
                                        <InfoItem icon={MapPin} label="Solemnisation Address" value={application.solemnised_address} />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Additional Information Section */}
                        {(application.preferred_date || application.special_requests) && (
                            <div className="details-card bg-witness-card">
                                <div className="card-title-row">
                                    <div className="icon-box icon-box-slate">
                                        <FileText size={22} />
                                    </div>
                                    <h2 className="card-title-text">Additional Information</h2>
                                </div>
                                <div className="card-body">
                                    {application.preferred_date && (
                                        <InfoItem 
                                            icon={Calendar} 
                                            label="Preferred Date" 
                                            value={new Date(application.preferred_date).toLocaleDateString(undefined, { dateStyle: 'long' })} 
                                        />
                                    )}
                                    {application.special_requests && (
                                        <InfoItem icon={FileText} label="Special Requests" value={application.special_requests} />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar */}
                    <div className="no-print-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Appointment Details Card */}
                        <div className="details-card bg-appointment-card">
                            <div className="card-title-row">
                                <div className="icon-box icon-box-purple">
                                    <Calendar size={22} />
                                </div>
                                <h2 className="card-title-text">Appointment</h2>
                            </div>
                            <div className="card-body">
                                {application.appointment_date ? (
                                    <>
                                        <InfoItem
                                            icon={Calendar}
                                            label="Date"
                                            value={new Date(application.appointment_date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                        />
                                        <InfoItem icon={Clock} label="Time Slot" value={application.appointment_time} />
                                        <InfoItem icon={MapPin} label="Location" value={application.appointment_location} />
                                    </>
                                ) : (
                                    <div className="py-4 text-center">
                                        <p className="text-slate-400 italic text-sm">Appointment not yet scheduled.</p>
                                    </div>
                                )}

                                {application.special_requests && (
                                    <div className="mt-6 pt-6 border-t border-indigo-100/50">
                                        <p className="info-label">Special Requests</p>
                                        <div className="bg-white/60 p-4 rounded-xl border border-indigo-100/40 text-sm text-slate-600 line-height-relaxed">
                                            "{application.special_requests}"
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Status Card */}
                        <div className="details-card bg-payment-card">
                            <div className="card-title-row">
                                <div className="icon-box icon-box-green">
                                    <CreditCard size={22} />
                                </div>
                                <h2 className="card-title-text">Payment Status</h2>
                            </div>
                            <div className="card-body">
                                <InfoItem
                                    icon={CreditCard}
                                    label="Deposit Amount"
                                    value={application.deposit_amount ? `PKR ${application.deposit_amount}` : 'Not Set'}
                                    subValue={application.payment_status || 'Pending Verification'}
                                />
                            </div>
                        </div>

                        {/* Documents Card */}
                        <div className="details-card bg-documents-card">
                            <div className="card-title-row">
                                <div className="icon-box icon-box-teal-sidebar">
                                    <FileText size={22} />
                                </div>
                                <h2 className="card-title-text">Documents</h2>
                            </div>
                            <div className="card-body p-4">
                                <div className="grid grid-cols-1 gap-3">
                                    {application.payment_receipt_url && <DocumentCard title="Payment Receipt" path={application.payment_receipt_url} />}
                                    {application.groom_id_path && <DocumentCard title="Groom ID Card" path={application.groom_id_path} />}
                                    {application.bride_id_path && <DocumentCard title="Bride ID Card" path={application.bride_id_path} />}
                                    {application.mahr_declaration_path && <DocumentCard title="Mahr Declaration" path={application.mahr_declaration_path} />}
                                    {application.civil_divorce_doc_path && <DocumentCard title="Civil Divorce" path={application.civil_divorce_doc_path} />}
                                    {application.islamic_divorce_doc_path && <DocumentCard title="Islamic Divorce" path={application.islamic_divorce_doc_path} />}
                                    {application.statutory_declaration_path && <DocumentCard title="Statutory Decl." path={application.statutory_declaration_path} />}
                                </div>

                                {![
                                    application.payment_receipt_url,
                                    application.groom_id_path,
                                    application.bride_id_path,
                                    application.mahr_declaration_path,
                                    application.civil_divorce_doc_path,
                                    application.islamic_divorce_doc_path,
                                    application.statutory_declaration_path
                                ].some(Boolean) && (
                                        <p className="text-center text-slate-400 text-sm py-8 italic">No documents uploaded.</p>
                                    )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Print-Only Certificate Table */}
                <div className="print-certificate-table" style={{ display: 'none' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black' }}>
                        <thead>
                            <tr>
                                <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', fontWeight: 'bold', width: '15%' }}></th>
                                <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>Full Name</th>
                                <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>Father's Name</th>
                                <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>Date & Place Of Birth</th>
                                <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>Present Address</th>
                                <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>Marital Status</th>
                                <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>By Representative or Personally</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* BRIDE GROOM */}
                            <tr>
                                <td style={{ border: '1px solid black', padding: '12px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }}>BRIDE GROOM</td>
                                <td style={{ border: '1px solid black', padding: '12px' }}>{application.groom_full_name}</td>
                                <td style={{ border: '1px solid black', padding: '12px' }}>{application.groom_father_name || ''}</td>
                                <td style={{ border: '1px solid black', padding: '12px' }}>
                                    {new Date(application.groom_date_of_birth).toLocaleDateString('en-GB')}<br/>
                                    {application.groom_place_of_birth || ''}
                                </td>
                                <td style={{ border: '1px solid black', padding: '12px' }}>{application.groom_address}</td>
                                <td style={{ border: '1px solid black', padding: '12px' }}></td>
                                <td style={{ border: '1px solid black', padding: '12px' }}>{application.groom_personally ? 'Personally' : application.groom_representative ? 'By Representative' : ''}</td>
                            </tr>

                            {/* BRIDE */}
                            <tr>
                                <td style={{ border: '1px solid black', padding: '12px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }}>BRIDE</td>
                                <td style={{ border: '1px solid black', padding: '12px' }}>{application.bride_full_name}</td>
                                <td style={{ border: '1px solid black', padding: '12px' }}>{application.bride_father_name || ''}</td>
                                <td style={{ border: '1px solid black', padding: '12px' }}>
                                    {new Date(application.bride_date_of_birth).toLocaleDateString('en-GB')}<br/>
                                    {application.bride_place_of_birth || ''}
                                </td>
                                <td style={{ border: '1px solid black', padding: '12px' }}>{application.bride_address}</td>
                                <td style={{ border: '1px solid black', padding: '12px' }}></td>
                                <td style={{ border: '1px solid black', padding: '12px' }}>{application.bride_personally ? 'Personally' : application.bride_representative ? 'By Representative' : ''}</td>
                            </tr>

                            {/* REPRESENTATIVE OR GUARDIAN OF BRIDE GROOM */}
                            {application.groom_rep_name && (
                                <tr>
                                    <td style={{ border: '1px solid black', padding: '12px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }}>REPRESENTATIVE OR GUARDIAN OF BRIDE GROOM</td>
                                    <td style={{ border: '1px solid black', padding: '12px' }}>{application.groom_rep_name}</td>
                                    <td style={{ border: '1px solid black', padding: '12px' }}>{application.groom_rep_father_name || ''}</td>
                                    <td style={{ border: '1px solid black', padding: '12px' }}>
                                        {application.groom_rep_date_of_birth ? new Date(application.groom_rep_date_of_birth).toLocaleDateString('en-GB') : ''}<br/>
                                        {application.groom_rep_place_of_birth || ''}
                                    </td>
                                    <td style={{ border: '1px solid black', padding: '12px' }}>{application.groom_rep_address || ''}</td>
                                    <td style={{ border: '1px solid black', padding: '12px', textAlign: 'center', fontSize: '20pt' }}>/</td>
                                    <td style={{ border: '1px solid black', padding: '12px', textAlign: 'center', fontSize: '20pt' }}>/</td>
                                </tr>
                            )}

                            {/* REPRESENTATIVE OR GUARDIAN OF BRIDE */}
                            {application.bride_rep_name && (
                                <tr>
                                    <td style={{ border: '1px solid black', padding: '12px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }}>REPRESENTATIVE OR GUARDIAN OF BRIDE</td>
                                    <td style={{ border: '1px solid black', padding: '12px' }}>{application.bride_rep_name}</td>
                                    <td style={{ border: '1px solid black', padding: '12px' }}>{application.bride_rep_father_name || ''}</td>
                                    <td style={{ border: '1px solid black', padding: '12px' }}>
                                        {application.bride_rep_date_of_birth ? new Date(application.bride_rep_date_of_birth).toLocaleDateString('en-GB') : ''}<br/>
                                        {application.bride_rep_place_of_birth || ''}
                                    </td>
                                    <td style={{ border: '1px solid black', padding: '12px' }}>{application.bride_rep_address || ''}</td>
                                    <td style={{ border: '1px solid black', padding: '12px', textAlign: 'center', fontSize: '20pt' }}>/</td>
                                    <td style={{ border: '1px solid black', padding: '12px', textAlign: 'center', fontSize: '20pt' }}>/</td>
                                </tr>
                            )}

                            {/* WITNESSES */}
                            {witnesses.map((witness, i) => (
                                <tr key={`witness-${i}`}>
                                    <td style={{ border: '1px solid black', padding: '12px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }}>WITNESS No {i + 1}</td>
                                    <td style={{ border: '1px solid black', padding: '12px' }}>{witness.witness_name}</td>
                                    <td style={{ border: '1px solid black', padding: '12px' }}>{witness.witness_father_name || ''}</td>
                                    <td style={{ border: '1px solid black', padding: '12px' }}>
                                        {witness.witness_date_of_birth ? new Date(witness.witness_date_of_birth).toLocaleDateString('en-GB') : ''}<br/>
                                        {witness.witness_place_of_birth || ''}
                                    </td>
                                    <td style={{ border: '1px solid black', padding: '12px' }}>{witness.witness_address || ''}</td>
                                    <td style={{ border: '1px solid black', padding: '12px', textAlign: 'center', fontSize: '20pt' }}>/</td>
                                    <td style={{ border: '1px solid black', padding: '12px', textAlign: 'center', fontSize: '20pt' }}>/</td>
                                </tr>
                            ))}

                            {/* MAHR */}
                            <tr>
                                <td style={{ border: '1px solid black', padding: '10px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }}>Mahr</td>
                                <td style={{ border: '1px solid black', padding: '12px' }} colSpan="6">{application.mahr_amount || ''}</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid black', padding: '10px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }}>Deferred / Prompt</td>
                                <td style={{ border: '1px solid black', padding: '12px' }} colSpan="6">{application.mahr_type === 'deferred' ? 'Deferred' : application.mahr_type === 'prompt' ? 'Prompt' : ''}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Bottom Section */}
                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
                        {/* Disclaimer */}
                        <div style={{ flex: '1', fontSize: '9pt', lineHeight: '1.4' }}>
                            <p>This Nikkah certificate is issued in accordance with Islamic laws and may not be accepted by authorities in the U.K. and other non-Muslim countries. To be married in accordance with British Marriage Laws, both parties are advised to go through a Civil Marriage at the Registration Office in the United Kingdom.</p>
                        </div>

                        {/* Solemnization Details */}
                        <div style={{ flex: '1' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Marriage Solemnized</p>
                            <p>Date: {application.solemnised_date ? new Date(application.solemnised_date).toLocaleDateString('en-GB') : '................................'}</p>
                            <p>Place: {application.solemnised_place || '................................'}</p>
                            <p style={{ fontWeight: 'bold', marginTop: '1rem', marginBottom: '0.5rem' }}>Marriage Solemnized by</p>
                            <p>Address: {application.solemnised_address || '................................'}</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #ccc', textAlign: 'center', fontWeight: 'bold', fontSize: '10pt' }}>
                        <p>Issued by: Jamiyat Tabligh-ul-Islam, Central Mosque, Darfield Street, Westgate, Bradford, BD1 3RU</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
