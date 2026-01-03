import { useNavigate } from 'react-router-dom';
import ApplicantNavbar from '../components/ApplicantNavbar';
import { ArrowLeft, UploadCloud, FileText, Trash2, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Loader2, Info } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { uploadDocuments } from '../services/api';

export default function DocumentUpload() {
    const navigate = useNavigate();
    const [showConversion, setShowConversion] = useState(false);
    const [files, setFiles] = useState({
        groomId: null,
        brideId: null,
        addressProof: null,
        groomConversionCert: null,
        brideConversionCert: null,
        witness1Id: null,
        witness2Id: null,
        mahrDeclaration: null,
        civilDivorceDoc: null,
        islamicDivorceDoc: null,
        statutoryDeclaration: null
    });

    const [hasConversionCertificate, setHasConversionCertificate] = useState(false);
    const [groomConverted, setGroomConverted] = useState(false);
    const [brideConverted, setBrideConverted] = useState(false);
    const [bridePreviouslyMarried, setBridePreviouslyMarried] = useState(false);
    const [brideDivorceType, setBrideDivorceType] = useState(null); // 'civil', 'islamic', 'both'
    const [brideAhleKitab, setBrideAhleKitab] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleFileChange = (e, type) => {
        if (e.target.files[0]) {
            setFiles({ ...files, [type]: e.target.files[0] });
            if (errors[type]) {
                setErrors(prev => ({ ...prev, [type]: null }));
            }
        }
    };

    const removeFile = (type) => {
        setFiles({ ...files, [type]: null });
    };

    const isSubmitDisabled = () => {
        // Only disable if no documents are selected at all
        return Object.values(files).every(file => file === null);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!files.groomId) newErrors.groomId = true;
        if (!files.brideId) newErrors.brideId = true;
        if (!files.witness1Id) newErrors.witness1Id = true;
        if (!files.witness2Id) newErrors.witness2Id = true;
        if (!files.mahrDeclaration) newErrors.mahrDeclaration = true;

        if (bridePreviouslyMarried) {
            if (!brideDivorceType) newErrors.brideDivorceType = true;
            else if (brideDivorceType === 'civil' && !files.civilDivorceDoc) newErrors.civilDivorceDoc = true;
            else if (brideDivorceType === 'islamic' && !files.islamicDivorceDoc) newErrors.islamicDivorceDoc = true;
            else if (brideDivorceType === 'both') {
                if (!files.civilDivorceDoc) newErrors.civilDivorceDoc = true;
                if (!files.islamicDivorceDoc) newErrors.islamicDivorceDoc = true;
            }
        }

        if (brideAhleKitab && !files.statutoryDeclaration) {
            newErrors.statutoryDeclaration = true;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (isSubmitDisabled()) return;

        if (!validateForm()) {
            toast.error("Please upload all the required documents", { id: 'validation-error' });
            return;
        }

        setUploading(true);
        const toastId = toast.loading('Uploading documents...');

        try {
            const formData = new FormData();

            // Append files to formData
            Object.keys(files).forEach(key => {
                if (files[key]) {
                    formData.append(key, files[key]);
                }
            });

            await uploadDocuments(formData);

            toast.success('Documents uploaded successfully!', { id: toastId });

            // Navigate back after delay
            setTimeout(() => {
                navigate('/applicant/dashboard');
            }, 1000);

        } catch (error) {
            console.error('Upload error:', error);
            const msg = error.response?.data?.message || 'Failed to upload documents';
            toast.error(msg, { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    const UploadCard = ({ title, subtitle, name, required = false, type = 'image/*,.pdf' }) => (
        <div className="card h-full flex flex-col justify-between" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
                <div className="flex justify-between items-start mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm mb-1" style={{ fontWeight: 700, color: 'var(--slate-800)', fontSize: '0.9rem', marginBottom: '0.25rem', margin: 0 }}>{title} {required && <span style={{ color: 'var(--danger)' }}>*</span>}</h4>
                        <p className="text-xs text-slate-500" style={{ fontSize: '0.8rem', color: 'var(--slate-500)', margin: 0 }}>{subtitle}</p>
                    </div>
                </div>

                {files[name] ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between group" style={{ backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)', borderRadius: '0.5rem', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="flex items-center gap-3 overflow-hidden" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                            <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--brand-50)', width: '2rem', height: '2rem', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FileText size={16} style={{ color: 'var(--brand-600)' }} />
                            </div>
                            <span className="text-sm font-medium text-slate-700 truncate" style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--slate-700)' }}>{files[name].name}</span>
                        </div>
                        <button
                            onClick={() => removeFile(name)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors"
                            style={{ padding: '0.375rem', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'color 0.2s' }}
                        >
                            <Trash2 size={16} color="var(--slate-400)" />
                        </button>
                    </div>
                ) : (
                    <label className={`
                        flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all
                        ${errors[name] ? 'border-red-300 bg-red-50' : 'border-slate-300 hover:bg-slate-50'}
                    `} style={{
                            borderColor: errors[name] ? 'var(--danger)' : 'var(--slate-300)',
                            backgroundColor: errors[name] ? '#fef2f2' : 'var(--slate-50)',
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
                            if (!errors[name]) {
                                e.currentTarget.style.borderColor = 'var(--brand-400)';
                                e.currentTarget.style.backgroundColor = 'var(--brand-50)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!errors[name]) {
                                e.currentTarget.style.borderColor = 'var(--slate-300)';
                                e.currentTarget.style.backgroundColor = 'var(--slate-50)';
                            }
                        }}
                    >
                        <input type="file" className="hidden" onChange={(e) => handleFileChange(e, name)} accept={type} style={{ display: 'none' }} />
                        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3 text-slate-500 transition-colors" style={{ backgroundColor: 'var(--slate-100)', width: '2.5rem', height: '2.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                            <UploadCloud size={20} />
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--brand-600)', fontSize: '0.9rem', fontWeight: 500 }}>Click to upload</span>
                        <span className="text-xs text-slate-400 mt-1" style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}>PDF or Image</span>
                    </label>
                )}
            </div>
            {files[name] && (
                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--success)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 600 }}>
                    <CheckCircle2 size={14} />
                    <span>Ready to upload</span>
                </div>
            )}
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--slate-50)' }}>
            <ApplicantNavbar />

            <main className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
                <button
                    onClick={() => navigate('/applicant/dashboard')}
                    className="btn btn-link text-slate-500 mb-6 pl-0 flex items-center gap-2 hover:text-slate-800 transition-colors"
                    style={{ background: 'transparent', paddingLeft: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', color: 'var(--slate-500)', cursor: 'pointer' }}
                >
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>

                <div className="mb-8 text-center md:text-left" style={{ marginBottom: '2rem' }}>
                    <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--brand-600)', fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.2 }}>Document Submission</h1>
                    <p className="text-slate-500" style={{ color: 'var(--slate-500)', margin: 0 }}>Please provide clear, legible copies of all required documents to proceed with your Nikah application.</p>
                </div>

                {/* Important Requirement Alert */}
                <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm" style={{ backgroundColor: '#fffbeb', borderColor: '#fcd34d', marginBottom: '2rem', borderRadius: '0.75rem', padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div className="bg-amber-100 p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: '#fef3c7', padding: '0.5rem', borderRadius: '0.5rem' }}>
                        <AlertTriangle className="text-amber-700" size={24} style={{ color: '#b45309' }} />
                    </div>
                    <div>
                        <h4 className="font-bold text-amber-900 text-lg mb-2" style={{ color: '#78350f', fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem', marginTop: 0 }}>Requirements Checklist</h4>
                        <ul className="list-disc pl-5 text-amber-800 text-sm leading-relaxed" style={{ color: '#92400e', fontSize: '0.9rem', lineHeight: 1.6, paddingLeft: '1.25rem', margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.5rem 2rem' }}>
                            <li>Valid <strong>Passport</strong> or <strong>Driving Licence</strong> (Both parties)</li>
                            <li><strong>Witness IDs</strong> for two Muslim male witnesses</li>
                            <li>Signed <strong>Dowry (Mahr) Declaration</strong></li>

                            <li><strong>Divorce Documents</strong> (if applicable)</li>
                            <li><strong>Certificate of Conversion to Islam</strong> (if applicable)</li>
                            <li><strong>Statutory Declaration (Affidavit) for Ahle Kitab</strong> (if applicable)</li>
                        </ul>
                    </div>
                </div>

                <div className="space-y-8" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Section 1: Identification */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--slate-200)' }}>
                            <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ backgroundColor: 'var(--brand-100)', color: 'var(--brand-700)', width: '1.5rem', height: '1.5rem', borderRadius: '50%', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                            <h3 className="text-lg font-semibold m-0" style={{ color: 'var(--brand-600)', fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Identification Documents</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            <UploadCard
                                title="Groom's ID Proof"
                                subtitle="Passport or Driving Licence"
                                name="groomId"
                                required
                            />
                            <UploadCard
                                title="Bride's ID Proof"
                                subtitle="Passport or Driving Licence"
                                name="brideId"
                                required
                            />
                        </div>
                    </div>

                    {/* Section 2: Witnesses */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--slate-200)' }}>
                            <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ backgroundColor: 'var(--brand-100)', color: 'var(--brand-700)', width: '1.5rem', height: '1.5rem', borderRadius: '50%', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                            <h3 className="text-lg font-semibold m-0" style={{ color: 'var(--brand-600)', fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Witnesses</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            <UploadCard
                                title="Witness 1 ID"
                                subtitle="Muslim Male Witness ID"
                                name="witness1Id"
                                required
                            />
                            <UploadCard
                                title="Witness 2 ID"
                                subtitle="Muslim Male Witness ID"
                                name="witness2Id"
                                required
                            />
                        </div>
                    </div>

                    {/* Section 3: Wedding Details */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--slate-200)' }}>
                            <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ backgroundColor: 'var(--brand-100)', color: 'var(--brand-700)', width: '1.5rem', height: '1.5rem', borderRadius: '50%', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
                            <h3 className="text-lg font-semibold m-0" style={{ color: 'var(--brand-600)', fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Wedding Details</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            <UploadCard
                                title="Mahr Declaration"
                                subtitle="Signed by both parties"
                                name="mahrDeclaration"
                                required
                            />

                        </div>
                    </div>

                    {/* Section 4: Additional Requirements (Conditional) */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm" style={{ backgroundColor: 'white', border: '1px solid var(--slate-200)', borderRadius: '0.75rem', boxShadow: 'var(--shadow-sm)' }}>
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center cursor-pointer" onClick={() => setShowConversion(!showConversion)} style={{ padding: '1rem', backgroundColor: 'var(--slate-50)', borderBottom: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Info size={18} className="text-brand-600" style={{ color: 'var(--brand-600)' }} />
                                <h3 className="text-md font-semibold text-slate-800 m-0" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--slate-800)', margin: 0 }}>Additional Circumstances</h3>
                            </div>
                            <button className="text-slate-400" style={{ border: 'none', background: 'transparent', color: 'var(--slate-400)' }}>
                                {showConversion ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                        </div>

                        <div className={`p-6 space-y-8`} style={{ display: showConversion ? 'block' : 'none', padding: '1.5rem' }}>

                            {/* Conversion To Islam */}
                            <div>
                                <div className="flex items-center gap-3 mb-6" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <input
                                        type="checkbox"
                                        id="conversionCheck"
                                        checked={hasConversionCertificate}
                                        onChange={(e) => {
                                            setHasConversionCertificate(e.target.checked);
                                            if (!e.target.checked) {
                                                setGroomConverted(false);
                                                setBrideConverted(false);
                                            }
                                        }}
                                        className="w-5 h-5"
                                        style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--brand-500)', cursor: 'pointer' }}
                                    />
                                    <label htmlFor="conversionCheck" className="font-semibold text-slate-800 select-none cursor-pointer" style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                                        Do you have a certificate of conversion to Islam?
                                    </label>
                                </div>

                                {hasConversionCertificate && (
                                    <div className="pl-0 md:pl-8 border-l-2 border-slate-100 ml-2 animate-in fade-in slide-in-from-top-2 duration-300" style={{ borderLeft: '2px solid var(--slate-100)', paddingLeft: '2rem', marginLeft: '0.5rem' }}>


                                        <div className="space-y-4">
                                            {/* Groom Conversion */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <input
                                                        type="checkbox"
                                                        id="groomConversionCheck"
                                                        checked={groomConverted}
                                                        onChange={(e) => setGroomConverted(e.target.checked)}
                                                        className="w-5 h-5"
                                                        style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--brand-500)', cursor: 'pointer' }}
                                                    />
                                                    <label htmlFor="groomConversionCheck" className="font-semibold text-slate-800 select-none cursor-pointer" style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                                                        Has the Groom converted to Islam?
                                                    </label>
                                                </div>

                                                {groomConverted && (
                                                    <div className="pl-0 md:pl-8 ml-2 animate-in fade-in slide-in-from-top-2 duration-300" style={{ paddingLeft: '2rem', marginLeft: '0.5rem' }}>
                                                        <UploadCard
                                                            title="Groom's Certificate"
                                                            subtitle="Certificate of Conversion"
                                                            name="groomConversionCert"
                                                            required
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bride Conversion */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <input
                                                        type="checkbox"
                                                        id="brideConversionCheck"
                                                        checked={brideConverted}
                                                        onChange={(e) => setBrideConverted(e.target.checked)}
                                                        className="w-5 h-5"
                                                        style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--brand-500)', cursor: 'pointer' }}
                                                    />
                                                    <label htmlFor="brideConversionCheck" className="font-semibold text-slate-800 select-none cursor-pointer" style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                                                        Has the Bride converted to Islam?
                                                    </label>
                                                </div>

                                                {brideConverted && (
                                                    <div className="pl-0 md:pl-8 ml-2 animate-in fade-in slide-in-from-top-2 duration-300" style={{ paddingLeft: '2rem', marginLeft: '0.5rem' }}>
                                                        <UploadCard
                                                            title="Bride's Certificate"
                                                            subtitle="Certificate of Conversion"
                                                            name="brideConversionCert"
                                                            required
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>



                            <hr className="border-slate-100" style={{ borderTop: '1px solid var(--slate-100)', borderBottom: 'none', margin: '2rem 0' }} />

                            {/* Ahle Kitab (People of the Book) */}
                            <div>
                                <div className="flex items-center gap-3 mb-6" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <input
                                        type="checkbox"
                                        id="ahleKitabCheck"
                                        checked={brideAhleKitab}
                                        onChange={(e) => setBrideAhleKitab(e.target.checked)}
                                        className="w-5 h-5"
                                        style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--brand-500)', cursor: 'pointer' }}
                                    />
                                    <label htmlFor="ahleKitabCheck" className="font-semibold text-slate-800 select-none cursor-pointer" style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                                        Is the bride from the People of the Book (Ahle Kitab)?
                                    </label>
                                </div>

                                {brideAhleKitab && (
                                    <div className="space-y-6 pl-0 md:pl-8 border-l-2 border-slate-100 ml-2 animate-in fade-in slide-in-from-top-2 duration-300" style={{ borderLeft: '2px solid var(--slate-100)', paddingLeft: '2rem', marginLeft: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800" style={{ backgroundColor: '#fffbeb', borderColor: '#fcd34d', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#92400e' }}>
                                            <strong>Note:</strong> The Statutory Declaration (Affidavit) must be signed by a solicitor or a Commissioner of Oaths.
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                            <UploadCard
                                                title="Statutory Declaration"
                                                subtitle="Affidavit signed by Solicitor/Commissioner"
                                                name="statutoryDeclaration"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <hr className="border-slate-100" style={{ borderTop: '1px solid var(--slate-100)', borderBottom: 'none', margin: '2rem 0' }} />

                            {/* Previous Marriage */}
                            <div>
                                <div className="flex items-center gap-3 mb-6" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <input
                                        type="checkbox"
                                        id="brideMarriageCheck"
                                        checked={bridePreviouslyMarried}
                                        onChange={(e) => {
                                            setBridePreviouslyMarried(e.target.checked);
                                            if (!e.target.checked) setBrideDivorceType(null);
                                        }}
                                        className="w-5 h-5"
                                        style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--brand-500)', cursor: 'pointer' }}
                                    />
                                    <label htmlFor="brideMarriageCheck" className="font-semibold text-slate-800 select-none cursor-pointer" style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                                        Was the bride previously married?
                                    </label>
                                </div>

                                {bridePreviouslyMarried && (
                                    <div className="space-y-6 pl-0 md:pl-8 border-l-2 border-slate-100 ml-2" style={{ borderLeft: '2px solid var(--slate-100)', paddingLeft: '2rem', marginLeft: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                        <div className="bg-slate-50 p-4 rounded-lg" style={{ backgroundColor: 'var(--slate-50)', padding: '1rem', borderRadius: '0.5rem' }}>
                                            <p className="text-sm font-semibold text-slate-700 mb-3" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.75rem' }}>Type of Previous Marriage <span style={{ color: 'var(--danger)' }}>*</span></p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                                {['civil', 'islamic', 'both'].map((type) => (
                                                    <label key={type} className="flex items-center gap-2 px-4 py-2 rounded border cursor-pointer transition-all"
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: brideDivorceType === type ? '1px solid var(--brand-500)' : '1px solid transparent',
                                                            backgroundColor: brideDivorceType === type ? 'white' : 'transparent',
                                                            boxShadow: brideDivorceType === type ? 'var(--shadow-sm)' : 'none'
                                                        }}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="divorceType"
                                                            value={type}
                                                            checked={brideDivorceType === type}
                                                            onChange={(e) => {
                                                                setBrideDivorceType(e.target.value);
                                                                setErrors(prev => ({ ...prev, brideDivorceType: null }));
                                                            }}
                                                            style={{ accentColor: 'var(--brand-500)' }}
                                                        />
                                                        <span className="text-sm capitalize" style={{ fontSize: '0.875rem', textTransform: 'capitalize' }}>{type === 'both' ? 'Both Civil & Islamic' : `${type} Only`}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                            {(brideDivorceType === 'civil' || brideDivorceType === 'both') && (
                                                <UploadCard
                                                    title="Civil Divorce Doc"
                                                    subtitle="Decree Absolute"
                                                    name="civilDivorceDoc"
                                                    required
                                                />
                                            )}
                                            {(brideDivorceType === 'islamic' || brideDivorceType === 'both') && (
                                                <UploadCard
                                                    title="Islamic Divorce Doc"
                                                    subtitle="Talaq / Khula / Faskh"
                                                    name="islamicDivorceDoc"
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

                <div className="mt-10 flex justify-end pt-6 border-t border-slate-200" style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', paddingTop: '1.5rem', borderTop: '1px solid var(--slate-200)' }}>
                    <button
                        className="btn btn-primary btn-lg flex items-center gap-3"
                        disabled={isSubmitDisabled() || uploading}
                        onClick={handleSubmit}
                        style={{ opacity: isSubmitDisabled() || uploading ? 0.7 : 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 4px 6px -1px rgba(202, 108, 64, 0.2)' }}
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                <span>Uploading...</span>
                            </>
                        ) : (
                            <>
                                <UploadCloud size={20} />
                                <span>Submit Documents</span>
                            </>
                        )}
                    </button>
                </div>
            </main >
        </div >
    );
}
