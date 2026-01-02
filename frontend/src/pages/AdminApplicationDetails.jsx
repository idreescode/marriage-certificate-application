
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
        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="p-2 bg-slate-100 rounded-md text-slate-600">
                <Icon size={18} />
            </div>
            <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-slate-800">{value || 'N/A'}</p>
                {subValue && <p className="text-xs text-slate-500 mt-0.5 max-w-xs">{subValue}</p>}
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
        <div className="min-h-screen bg-slate-50 pb-12">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 shadow-sm">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <button
                        onClick={() => navigate('/admin/applications')}
                        className="flex items-center text-slate-500 hover:text-slate-800 font-medium transition-colors"
                    >
                        <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
                    </button>

                    <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-sm">Application ID:</span>
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">#{application.application_number}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">

                {/* Header Hero Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-start gap-6">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Marriage Application</h1>
                                <StatusBadge status={application.status} />
                            </div>
                            <p className="text-slate-500 text-lg">
                                <span className="font-semibold text-slate-700">{application.groom_full_name}</span> &
                                <span className="font-semibold text-slate-700 ml-1">{application.bride_full_name}</span>
                            </p>
                            <div className="flex items-center gap-6 mt-4 text-sm text-slate-500">
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
                                    className="btn w-full bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md hover:shadow-lg transition-all"
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
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <User className="text-blue-500" size={20} /> Applicant Information
                                </h2>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                                {/* Vertical Divider */}
                                <div className="hidden md:block absolute left-1/2 top-6 bottom-6 w-px bg-slate-100" />

                                {/* Groom */}
                                <div className="space-y-4">
                                    <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">Groom</span>
                                    <InfoItem icon={User} label="Full Name" value={application.groom_full_name} subValue={`DOB: ${new Date(application.groom_date_of_birth).toLocaleDateString()}`} />
                                    <InfoItem icon={CreditCard} label="ID Number" value={application.groom_id_number} />
                                    <InfoItem icon={Phone} label="Contact" value={application.groom_phone} subValue={application.groom_email} />
                                    <InfoItem icon={MapPin} label="Address" value={application.groom_address} />
                                </div>

                                {/* Bride */}
                                <div className="space-y-4">
                                    <span className="inline-block px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">Bride</span>
                                    <InfoItem icon={User} label="Full Name" value={application.bride_full_name} subValue={`DOB: ${new Date(application.bride_date_of_birth).toLocaleDateString()}`} />
                                    <InfoItem icon={CreditCard} label="ID Number" value={application.bride_id_number} />
                                    <InfoItem icon={Phone} label="Contact" value={application.bride_phone} subValue={application.bride_email} />
                                    <InfoItem icon={MapPin} label="Address" value={application.bride_address} />
                                </div>
                            </div>
                        </div>

                        {/* Witnesses */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Globe className="text-blue-500" size={20} /> Witnesses
                                </h2>
                            </div>
                            <div className="p-6">
                                {witnesses.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {witnesses.map((witness, i) => (
                                            <div key={witness.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                                                        {i + 1}
                                                    </div>
                                                    <h4 className="font-semibold text-slate-800">{witness.witness_name}</h4>
                                                </div>
                                                <div className="space-y-1 pl-11">
                                                    <p className="text-sm text-slate-600 flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {witness.witness_phone}</p>
                                                    {witness.witness_email && <p className="text-sm text-slate-600 flex items-center gap-2"><Mail size={14} className="text-slate-400" /> {witness.witness_email}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        No witness information available.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-8">

                        {/* Payment & Appointment Status Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 space-y-6">

                                {/* Appointment Block */}
                                <div>
                                    <h3 className="text-sm font-bold bg-slate-100 inline-block px-3 py-1 rounded-lg text-slate-600 mb-4">
                                        <span className="flex items-center gap-2"><Calendar size={16} /> Appointment Details</span>
                                    </h3>
                                    {application.appointment_date ? (
                                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                            <p className="text-blue-900 font-bold text-lg mb-1">{new Date(application.appointment_date).toLocaleDateString()}</p>
                                            <div className="space-y-1 text-blue-700 text-sm">
                                                <p className="flex items-center gap-2"><Clock size={14} /> {application.appointment_time}</p>
                                                <p className="flex items-center gap-2"><MapPin size={14} /> {application.appointment_location}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-slate-500 italic px-2">Appointment not yet scheduled.</div>
                                    )}
                                    {application.special_requests && (
                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Special Requests</p>
                                            <p className="text-sm text-slate-600 bg-yellow-50 p-3 rounded-lg border border-yellow-100">"{application.special_requests}"</p>
                                        </div>
                                    )}
                                </div>

                                {/* Payment Block */}
                                <div>
                                    <h3 className="text-sm font-bold bg-slate-100 inline-block px-3 py-1 rounded-lg text-slate-600 mb-4">
                                        <span className="flex items-center gap-2"><CreditCard size={16} /> Payment Status</span>
                                    </h3>
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                                        <span className="text-sm text-slate-600 font-medium">Deposit Amount</span>
                                        <span className="text-lg font-bold text-slate-800">{application.deposit_amount ? `PKR ${application.deposit_amount}` : 'Not Set'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Documents Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <FileText className="text-blue-500" size={20} /> Attached Documents
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 gap-4">
                                    {application.payment_receipt_url && <DocumentCard title="Payment Receipt" path={application.payment_receipt_url} />}
                                    {application.groom_id_path && <DocumentCard title="Groom ID" path={application.groom_id_path} />}
                                    {application.bride_id_path && <DocumentCard title="Bride ID" path={application.bride_id_path} />}
                                    {application.mahr_declaration_path && <DocumentCard title="Mahr Declaration" path={application.mahr_declaration_path} />}
                                    {application.civil_divorce_doc_path && <DocumentCard title="Civil Divorce" path={application.civil_divorce_doc_path} />}
                                    {application.islamic_divorce_doc_path && <DocumentCard title="Islamic Divorce" path={application.islamic_divorce_doc_path} />}
                                    {application.statutory_declaration_path && <DocumentCard title="Statutory Declaration" path={application.statutory_declaration_path} />}
                                </div>

                                {/* Empty State if no docs */}
                                {![
                                    application.payment_receipt_url,
                                    application.groom_id_path,
                                    application.bride_id_path,
                                    application.mahr_declaration_path,
                                    application.civil_divorce_doc_path,
                                    application.islamic_divorce_doc_path,
                                    application.statutory_declaration_path
                                ].some(Boolean) && (
                                        <p className="text-center text-slate-400 text-sm py-4">No documents uploaded.</p>
                                    )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
