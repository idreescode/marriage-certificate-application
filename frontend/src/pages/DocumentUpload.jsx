import { useNavigate } from 'react-router-dom';
import ApplicantNavbar from '../components/ApplicantNavbar';
import { ArrowLeft, Upload, File, X, Check, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

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

    const [bridePreviouslyMarried, setBridePreviouslyMarried] = useState(false);
    const [brideDivorceType, setBrideDivorceType] = useState(null); // 'civil', 'islamic', 'both'
    const [brideAhleKitab, setBrideAhleKitab] = useState(false);

    const handleFileChange = (e, type) => {
        if (e.target.files[0]) {
            setFiles({ ...files, [type]: e.target.files[0] });
        }
    };

    const removeFile = (type) => {
        setFiles({ ...files, [type]: null });
    };

    const isSubmitDisabled = () => {
        const basicReqs = !files.groomId || !files.brideId || !files.witness1Id || !files.witness2Id || !files.mahrDeclaration;
        if (basicReqs) return true;

        if (bridePreviouslyMarried) {
            if (!brideDivorceType) return true;
            if (brideDivorceType === 'civil' && !files.civilDivorceDoc) return true;
            if (brideDivorceType === 'islamic' && !files.islamicDivorceDoc) return true;
            if (brideDivorceType === 'both' && (!files.civilDivorceDoc || !files.islamicDivorceDoc)) return true;
        }

        if (brideAhleKitab && !files.statutoryDeclaration) {
            return true;
        }

        return false;
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--slate-50)' }}>
            <ApplicantNavbar />

            <main className="container" style={{ maxWidth: '800px', padding: '2rem 1rem' }}>
                <button
                    onClick={() => navigate('/applicant/dashboard')}
                    className="btn btn-link text-slate-500 mb-4 pl-0 flex items-center gap-2 hover:text-slate-800"
                >
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>
                <div className="mb-6">
                    <h1 style={{ fontSize: '2rem', margin: 0, color: '#1e293b' }}>Upload Documents</h1>
                    <p className="text-muted">Please provide clear copies of the following documents.</p>
                </div>

                {/* Important Requirement Alert */}
                <div className="mb-6 space-y-4">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-end gap-4 mb-4">
                            <AlertTriangle className="text-amber-600 flex-shrink-0" size={30} />
                            <h4 className="font-bold text-amber-800 text-xl uppercase">Requirement for Nikah</h4>
                        </div>
                        <ul className="list-disc pl-5 text-amber-900 text-sm space-y-1">
                            <li>
                                A valid <strong>Passport</strong> or <strong>Driving Licence</strong> is required at the time of the Nikah. Please ensure the documents you upload match what you will bring.
                            </li>
                            <li>
                                A <strong>written declaration of the agreed Dowry [Mahr]</strong> must be signed by both parties.
                            </li>
                            <li>
                                <strong>Presence of at least two Muslim Male witnesses with their IDs</strong> is required.
                            </li>
                            <li>
                                If the bride was previously married in a civil (legal) marriage, a <strong>civil divorce document</strong> is required (e.g., a Decree Absolute).
                                If the previous marriage was only an Islamic Nikah, a <strong>talaq, Khula, or Faskh</strong> documentation is required.
                                If the previous Nikah was civil and Islamic, <strong>documentation of civil and Islamic divorce</strong> must be provided.
                            </li>
                            <li>
                                In case of the bride being from the People of the Book (Ahle Kitab), the <strong>Statutory Declaration (Affidavit)</strong> must be signed by a solicitor or a Commissioner of Oaths.
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="card">
                    <div className="space-y-6">

                        {/* Groom ID */}
                        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-slate-800">Groom's Passport or Driving Licence</h3>
                                    <p className="text-sm text-slate-500">Scan or clear photo</p>
                                </div>
                                {files.groomId ? (
                                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                        <Check size={12} /> Selected
                                    </span>
                                ) : (
                                    <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-bold">Required</span>
                                )}
                            </div>

                            {files.groomId ? (
                                <div className="flex items-center justify-between bg-white p-3 rounded border">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <File size={20} className="text-blue-500 flex-shrink-0" />
                                        <span className="text-sm truncate">{files.groomId.name}</span>
                                    </div>
                                    <button onClick={() => removeFile('groomId')} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-white transition-colors">
                                    <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'groomId')} accept="image/*,.pdf" />
                                    <div className="text-center">
                                        <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                                        <span className="text-sm text-blue-600 font-medium">Click to upload</span>
                                        <span className="text-xs text-slate-400 block mt-1">PDF, JPG or PNG</span>
                                    </div>
                                </label>
                            )}
                        </div>

                        {/* Bride ID */}
                        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-slate-800">Bride's Passport or Driving Licence</h3>
                                    <p className="text-sm text-slate-500">Scan or clear photo</p>
                                </div>
                                {files.brideId ? (
                                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                        <Check size={12} /> Selected
                                    </span>
                                ) : (
                                    <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-bold">Required</span>
                                )}
                            </div>

                            {files.brideId ? (
                                <div className="flex items-center justify-between bg-white p-3 rounded border">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <File size={20} className="text-blue-500 flex-shrink-0" />
                                        <span className="text-sm truncate">{files.brideId.name}</span>
                                    </div>
                                    <button onClick={() => removeFile('brideId')} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-white transition-colors">
                                    <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'brideId')} accept="image/*,.pdf" />
                                    <div className="text-center">
                                        <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                                        <span className="text-sm text-blue-600 font-medium">Click to upload</span>
                                        <span className="text-xs text-slate-400 block mt-1">PDF, JPG or PNG</span>
                                    </div>
                                </label>
                            )}
                        </div>

                        {/* Witness IDs */}
                        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                            <div className="mb-4">
                                <h3 className="font-semibold text-slate-800">Witness IDs</h3>
                                <p className="text-sm text-slate-500">ID proofs for two Muslim male witnesses</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Witness 1 */}
                                <div className="bg-white p-4 rounded border">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-slate-700">Witness 1 ID</label>
                                        {files.witness1Id ? (
                                            <span className="text-green-600 text-xs font-bold flex items-center gap-1"><Check size={12} /> Selected</span>
                                        ) : (
                                            <span className="text-amber-600 text-xs font-bold">Required</span>
                                        )}
                                    </div>
                                    {files.witness1Id ? (
                                        <div className="flex items-center justify-between bg-slate-50 p-2 rounded border">
                                            <span className="text-xs truncate max-w-[120px]">{files.witness1Id.name}</span>
                                            <button onClick={() => removeFile('witness1Id')} className="text-red-500">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="d-flex items-center justify-center p-3 border border-dashed rounded cursor-pointer hover:bg-slate-50">
                                            <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'witness1Id')} accept="image/*,.pdf" />
                                            <Upload size={16} className="text-slate-400 mr-2" />
                                            <span className="text-xs text-slate-500">Upload</span>
                                        </label>
                                    )}
                                </div>

                                {/* Witness 2 */}
                                <div className="bg-white p-4 rounded border">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-slate-700">Witness 2 ID</label>
                                        {files.witness2Id ? (
                                            <span className="text-green-600 text-xs font-bold flex items-center gap-1"><Check size={12} /> Selected</span>
                                        ) : (
                                            <span className="text-amber-600 text-xs font-bold">Required</span>
                                        )}
                                    </div>
                                    {files.witness2Id ? (
                                        <div className="flex items-center justify-between bg-slate-50 p-2 rounded border">
                                            <span className="text-xs truncate max-w-[120px]">{files.witness2Id.name}</span>
                                            <button onClick={() => removeFile('witness2Id')} className="text-red-500">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="d-flex items-center justify-center p-3 border border-dashed rounded cursor-pointer hover:bg-slate-50">
                                            <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'witness2Id')} accept="image/*,.pdf" />
                                            <Upload size={16} className="text-slate-400 mr-2" />
                                            <span className="text-xs text-slate-500">Upload</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Mahr Declaration */}
                        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-slate-800">Dowry (Mahr) Declaration</h3>
                                    <p className="text-sm text-slate-500">Signed written declaration by both parties</p>
                                </div>
                                {files.mahrDeclaration ? (
                                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                        <Check size={12} /> Selected
                                    </span>
                                ) : (
                                    <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-bold">Required</span>
                                )}
                            </div>

                            {files.mahrDeclaration ? (
                                <div className="flex items-center justify-between bg-white p-3 rounded border">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <File size={20} className="text-blue-500 flex-shrink-0" />
                                        <span className="text-sm truncate">{files.mahrDeclaration.name}</span>
                                    </div>
                                    <button onClick={() => removeFile('mahrDeclaration')} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-white transition-colors">
                                    <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'mahrDeclaration')} accept="image/*,.pdf" />
                                    <div className="text-center">
                                        <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                                        <span className="text-sm text-blue-600 font-medium">Click to upload</span>
                                        <span className="text-xs text-slate-400 block mt-1">PDF, JPG or PNG</span>
                                    </div>
                                </label>
                            )}
                        </div>

                        {/* Conversion Certs */}
                        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                            <div className="mb-4">
                                <h3 className="font-semibold text-slate-800">Conversion Certificates</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="checkbox"
                                        id="conversionCheck"
                                        checked={showConversion}
                                        onChange={(e) => setShowConversion(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 accent-[#CA6C40]"
                                    />
                                    <label htmlFor="conversionCheck" className="text-sm text-slate-700 select-none cursor-pointer">
                                        Is a Conversion Certificate applicable to either party?
                                    </label>
                                </div>
                            </div>

                            {showConversion && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    {/* Groom Conversion */}
                                    <div className="bg-white p-4 rounded border">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-medium text-slate-700">Groom's Certificate</label>
                                            {files.groomConversionCert && <Check size={16} className="text-green-600" />}
                                        </div>
                                        {files.groomConversionCert ? (
                                            <div className="flex items-center justify-between bg-slate-50 p-2 rounded border">
                                                <span className="text-xs truncate max-w-[120px]">{files.groomConversionCert.name}</span>
                                                <button onClick={() => removeFile('groomConversionCert')} className="text-red-500">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="d-flex items-center justify-center p-3 border border-dashed rounded cursor-pointer hover:bg-slate-50">
                                                <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'groomConversionCert')} accept="image/*,.pdf" />
                                                <Upload size={16} className="text-slate-400 mr-2" />
                                                <span className="text-xs text-slate-500">Upload</span>
                                            </label>
                                        )}
                                    </div>

                                    {/* Bride Conversion */}
                                    <div className="bg-white p-4 rounded border">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-medium text-slate-700">Bride's Certificate</label>
                                            {files.brideConversionCert && <Check size={16} className="text-green-600" />}
                                        </div>
                                        {files.brideConversionCert ? (
                                            <div className="flex items-center justify-between bg-slate-50 p-2 rounded border">
                                                <span className="text-xs truncate max-w-[120px]">{files.brideConversionCert.name}</span>
                                                <button onClick={() => removeFile('brideConversionCert')} className="text-red-500">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="d-flex items-center justify-center p-3 border border-dashed rounded cursor-pointer hover:bg-slate-50">
                                                <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'brideConversionCert')} accept="image/*,.pdf" />
                                                <Upload size={16} className="text-slate-400 mr-2" />
                                                <span className="text-xs text-slate-500">Upload</span>
                                            </label>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bride's Previous Marriage */}
                        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                            <div className="mb-4">
                                <h3 className="font-semibold text-slate-800">Bride's Previous Marriage</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="checkbox"
                                        id="brideMarriageCheck"
                                        checked={bridePreviouslyMarried}
                                        onChange={(e) => {
                                            setBridePreviouslyMarried(e.target.checked);
                                            if (!e.target.checked) setBrideDivorceType(null);
                                        }}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 accent-[#CA6C40]"
                                    />
                                    <label htmlFor="brideMarriageCheck" className="text-sm text-slate-700 select-none cursor-pointer">
                                        Was the Bride previously married?
                                    </label>
                                </div>
                            </div>

                            {bridePreviouslyMarried && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                                    <div className="bg-white p-4 rounded border">
                                        <p className="text-sm font-medium text-slate-700 mb-2">Type of Previous Marriage</p>
                                        <div className="flex flex-col gap-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="divorceType"
                                                    value="civil"
                                                    checked={brideDivorceType === 'civil'}
                                                    onChange={(e) => setBrideDivorceType(e.target.value)}
                                                    className="accent-blue-600"
                                                />
                                                <span className="text-sm">Civil (Legal) Marriage Only</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="divorceType"
                                                    value="islamic"
                                                    checked={brideDivorceType === 'islamic'}
                                                    onChange={(e) => setBrideDivorceType(e.target.value)}
                                                    className="accent-blue-600"
                                                />
                                                <span className="text-sm">Islamic Nikah Only</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="divorceType"
                                                    value="both"
                                                    checked={brideDivorceType === 'both'}
                                                    onChange={(e) => setBrideDivorceType(e.target.value)}
                                                    className="accent-blue-600"
                                                />
                                                <span className="text-sm">Both Civil and Islamic</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Civil Divorce Doc */}
                                        {(brideDivorceType === 'civil' || brideDivorceType === 'both') && (
                                            <div className="bg-white p-4 rounded border">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div>
                                                        <label className="text-sm font-medium text-slate-700">Civil Divorce Document</label>
                                                        <p className="text-xs text-slate-500">e.g., Decree Absolute</p>
                                                    </div>
                                                    {files.civilDivorceDoc ? (
                                                        <span className="text-green-600 text-xs font-bold flex items-center gap-1"><Check size={12} /> Selected</span>
                                                    ) : (
                                                        <span className="text-amber-600 text-xs font-bold">Required</span>
                                                    )}
                                                </div>
                                                {files.civilDivorceDoc ? (
                                                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded border">
                                                        <span className="text-xs truncate max-w-[120px]">{files.civilDivorceDoc.name}</span>
                                                        <button onClick={() => removeFile('civilDivorceDoc')} className="text-red-500">
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="d-flex items-center justify-center p-3 border border-dashed rounded cursor-pointer hover:bg-slate-50">
                                                        <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'civilDivorceDoc')} accept="image/*,.pdf" />
                                                        <Upload size={16} className="text-slate-400 mr-2" />
                                                        <span className="text-xs text-slate-500">Upload</span>
                                                    </label>
                                                )}
                                            </div>
                                        )}

                                        {/* Islamic Divorce Doc */}
                                        {(brideDivorceType === 'islamic' || brideDivorceType === 'both') && (
                                            <div className="bg-white p-4 rounded border">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div>
                                                        <label className="text-sm font-medium text-slate-700">Islamic Divorce Doc</label>
                                                        <p className="text-xs text-slate-500">Talaq, Khula, or Faskh</p>
                                                    </div>
                                                    {files.islamicDivorceDoc ? (
                                                        <span className="text-green-600 text-xs font-bold flex items-center gap-1"><Check size={12} /> Selected</span>
                                                    ) : (
                                                        <span className="text-amber-600 text-xs font-bold">Required</span>
                                                    )}
                                                </div>
                                                {files.islamicDivorceDoc ? (
                                                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded border">
                                                        <span className="text-xs truncate max-w-[120px]">{files.islamicDivorceDoc.name}</span>
                                                        <button onClick={() => removeFile('islamicDivorceDoc')} className="text-red-500">
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="d-flex items-center justify-center p-3 border border-dashed rounded cursor-pointer hover:bg-slate-50">
                                                        <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'islamicDivorceDoc')} accept="image/*,.pdf" />
                                                        <Upload size={16} className="text-slate-400 mr-2" />
                                                        <span className="text-xs text-slate-500">Upload</span>
                                                    </label>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            className="btn btn-primary"
                            disabled={isSubmitDisabled()}
                            style={{ opacity: isSubmitDisabled() ? 0.5 : 1 }}
                        >
                            Submit Documents
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
