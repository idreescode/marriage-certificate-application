
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplicationById, generateCertificate as generateCertAPI, getFileUrl } from '../services/api';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import {
    ArrowLeft, User, Calendar, Phone, Mail, MapPin,
    FileText, CheckCircle, Clock, Globe, Shield, Download,
    CreditCard, MoreVertical
} from 'lucide-react';

export default function AdminApplicationDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

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

    const DocumentCard = ({ title, path, type = 'doc' }) => {
        if (!path) return null;
        const isImage = path.match(/\.(jpeg|jpg|png|webp)$/i);

        return (
            <a
                href={getFileUrl(path)}
                target="_blank"
                rel="noreferrer"
                className="group relative flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl bg-white hover:border-blue-400 hover:shadow-md transition-all duration-200 aspect-square text-center"
            >
                <div className="mb-3 p-3 bg-slate-50 rounded-full group-hover:bg-blue-50 transition-colors">
                    {isImage ? <FileText className="text-slate-500 group-hover:text-blue-500" size={24} /> : <FileText className="text-slate-500 group-hover:text-blue-500" size={24} />}
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700 mb-1 line-clamp-2">{title}</span>
                <span className="text-xs text-slate-400 group-hover:text-blue-400">View Document</span>

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-xl transition-colors pointer-events-none" />
            </a>
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


            <div className="max-w-6xl mx-auto px-6">

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
                            className="flex items-center text-white/80 hover:text-white font-medium transition-colors text-sm"
                            style={{ background: 'transparent', border: 'none', color: 'white', padding: 0 }}
                        >
                            <ArrowLeft size={16} className="mr-2" /> Back to Applications
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

                        <div className="flex flex-col gap-3 min-w-[200px]">
                            {application.status === 'appointment_scheduled' && (
                                <button onClick={handleGenerateCertificate} className="btn w-full bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                                    <CheckCircle size={18} className="mr-2" /> Mark Completed
                                </button>
                            )}
                            {application.certificate_url && (
                                <a
                                    href={getFileUrl(application.certificate_url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn w-full bg-white text-blue-600 hover:bg-blue-50 border-none shadow-md transition-all font-semibold"
                                >
                                    <Download size={18} className="mr-2" /> Download Certificate
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                    {/* Main Info Column */}
                    <div className="xl:col-span-2 space-y-8">

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
                                    <InfoItem icon={User} label="Full Name" value={application.groom_full_name} subValue={`Born on ${new Date(application.groom_date_of_birth).toLocaleDateString(undefined, { dateStyle: 'long' })}`} />
                                    <InfoItem icon={CreditCard} label="ID Number" value={application.groom_id_number} />
                                    <InfoItem icon={Phone} label="Contact Information" value={application.groom_phone} subValue={application.groom_email} />
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
                                    <InfoItem icon={User} label="Full Name" value={application.bride_full_name} subValue={`Born on ${new Date(application.bride_date_of_birth).toLocaleDateString(undefined, { dateStyle: 'long' })}`} />
                                    <InfoItem icon={CreditCard} label="ID Number" value={application.bride_id_number} />
                                    <InfoItem icon={Phone} label="Contact Information" value={application.bride_phone} subValue={application.bride_email} />
                                    <InfoItem icon={MapPin} label="Residential Address" value={application.bride_address} />
                                </div>
                            </div>
                        </div>


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
                                                <InfoItem icon={Phone} label="Contact Phone" value={witness.witness_phone} />
                                                {witness.witness_email && (
                                                    <InfoItem icon={Mail} label="Email Address" value={witness.witness_email} />
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
                    </div>

                    {/* Right Sidebar */}
                    <div className="">

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
                            <div className="card-body p-2">
                                <div className="grid grid-cols-2 gap-3">
                                    {application.payment_receipt_url && <DocumentCard title="Receipt" path={application.payment_receipt_url} />}
                                    {application.groom_id_path && <DocumentCard title="Groom ID" path={application.groom_id_path} />}
                                    {application.bride_id_path && <DocumentCard title="Bride ID" path={application.bride_id_path} />}
                                    {application.mahr_declaration_path && <DocumentCard title="Mahr" path={application.mahr_declaration_path} />}
                                    {application.civil_divorce_doc_path && <DocumentCard title="C-Divorce" path={application.civil_divorce_doc_path} />}
                                    {application.islamic_divorce_doc_path && <DocumentCard title="I-Divorce" path={application.islamic_divorce_doc_path} />}
                                    {application.statutory_declaration_path && <DocumentCard title="Statutory" path={application.statutory_declaration_path} />}
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
            </div>
        </div>
    );
}
