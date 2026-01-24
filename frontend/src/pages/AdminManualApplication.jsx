import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createManualApplication, getApplicationById, updateApplication, getFileUrl } from "../services/api";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  ArrowLeft,
  Save,
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
} from "lucide-react";
import Loader from "../components/Loader";

// Move FormSection outside component
const FormSection = ({ title, children }) => (
  <div
    style={{
      background: "var(--brand-50)",
      borderRadius: "10px",
      marginBottom: "1.5rem",
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      border: "1px solid #e2e8f0",
    }}
  >
    <div
      style={{
        background: "rgba(116, 116, 116, 0.11)",
        padding: "15px 0px 15px 64px",
        borderRadius: "23px 23px 0px 0px",
        marginBottom: "30px",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: "Montserrat, sans-serif",
          fontSize: "clamp(20px, 4vw, 31px)",
          fontWeight: 600,
          color: "#575757",
          textTransform: "uppercase",
          lineHeight: "1.2",
        }}
      >
        {title}
      </h2>
    </div>
    <div style={{ padding: "1.5rem" }}>{children}</div>
  </div>
);

// Move FormRow outside component
const FormRow = ({ children }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "1rem",
      marginBottom: "1rem",
    }}
  >
    {children}
  </div>
);

// Move FormField outside component - receives formData and handleChange as props
const FormField = ({
  label,
  name,
  type = "text",
  required = false,
  span = 1,
  formData,
  handleChange,
  ...props
}) => {
  // Handle date picker changes
  const handleDateChange = (date) => {
    if (!date) {
      const event = {
        target: {
          name: name,
          value: ''
        }
      };
      handleChange(event);
      return;
    }

    if (type === "datetime-local") {
      // Format: YYYY-MM-DDTHH:mm for datetime-local
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const value = `${year}-${month}-${day}T${hours}:${minutes}`;
      
      const event = {
        target: {
          name: name,
          value: value
        }
      };
      handleChange(event);
    } else {
      // Format: YYYY-MM-DD for date
      const event = {
        target: {
          name: name,
          value: date.toISOString().split('T')[0]
        }
      };
      handleChange(event);
    }
  };

  // Convert string date to Date object for DatePicker
  const getDateValue = () => {
    const value = formData[name] || "";
    if (value && typeof value === 'string') {
      if (type === "datetime-local") {
        // Handle YYYY-MM-DDTHH:mm format
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
          const date = new Date(value);
          return isNaN(date.getTime()) ? null : date;
        }
        // Also handle YYYY-MM-DDTHH:mm:ss format
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          const date = new Date(value);
          return isNaN(date.getTime()) ? null : date;
        }
      } else {
        // Handle YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          const date = new Date(value);
          return isNaN(date.getTime()) ? null : date;
        }
      }
    }
    return null;
  };

  return (
    <div style={{ gridColumn: span === 2 ? "span 2" : "span 1" }}>
      <label
        style={{
          display: "block",
          marginBottom: "10px",
          fontFamily: "Montserrat, sans-serif",
          fontSize: "clamp(16px, 3vw, 25px)",
          fontWeight: 400,
          color: "#2E2E2E",
          textTransform: "uppercase",
        }}
      >
        {label} {required && <span style={{ color: "#FF0000" }}>*</span>}
      </label>
      {type === "textarea" ? (
        <textarea
          name={name}
          value={formData[name] || ""}
          onChange={handleChange}
          required={required}
          style={{
            width: "100%",
            height: "54px",
            padding: "15px",
            border: "2.7px solid #CA6C41",
            borderRadius: "10px",
            fontSize: "16px",
            fontFamily: "Montserrat, sans-serif",
            color: "#333",
            background: "#FFFFFF",
            outline: "none",
            resize: "vertical",
            minHeight: "80px",
            transition: "box-shadow 0.2s",
          }}
          onFocus={(e) => {
            e.target.style.boxShadow = "0 0 0 4px rgba(202, 108, 65, 0.2)";
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = "none";
          }}
          rows={3}
          {...props}
        />
      ) : type === "date" || type === "datetime-local" ? (
        <DatePicker
          selected={getDateValue()}
          onChange={handleDateChange}
          dateFormat={type === "datetime-local" ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd"}
          placeholderText={type === "datetime-local" ? "Select date and time" : "Select date"}
          required={required}
          className="date-picker-input"
          wrapperClassName="custom-datepicker-wrapper"
          showYearDropdown
          showMonthDropdown
          dropdownMode="select"
          showTimeSelect={type === "datetime-local"}
          timeIntervals={15}
          timeCaption="Time"
          maxDate={name === 'solemnisedDate' ? null : new Date()} // Allow future dates only for solemnisedDate
        />
      ) : (
        <input
          type={type}
          name={name}
          value={formData[name] || ""}
          onChange={handleChange}
          required={required}
          style={{
            width: "100%",
            height: "54px",
            padding: "15px",
            border: "2.7px solid #CA6C41",
            borderRadius: "10px",
            fontSize: "16px",
            fontFamily: "Montserrat, sans-serif",
            color: "#333",
            background: "#FFFFFF",
            outline: "none",
            transition: "box-shadow 0.2s",
          }}
          onFocus={(e) => {
            e.target.style.boxShadow = "0 0 0 4px rgba(202, 108, 65, 0.2)";
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = "none";
          }}
          {...props}
        />
      )}
    </div>
  );
};

export default function AdminManualApplication() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(isEditMode);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [formData, setFormData] = useState({
    // Application Number
    applicationNumber: "",
    // Document Files
    groomIdFile: null,
    brideIdFile: null,
    witness1MaleIdFile: null,
    witness1FemaleIdFile: null,
    witness2MaleIdFile: null,
    witness2FemaleIdFile: null,
    mahrDeclarationFile: null,
    civilDivorceDocFile: null,
    islamicDivorceDocFile: null,
    groomConversionCertFile: null,
    brideConversionCertFile: null,
    statutoryDeclarationFile: null,
    // Groom Information
    groomName: "",
    groomFatherName: "",
    groomDateOfBirth: "",
    groomPlaceOfBirth: "",
    groomAddress: "",
    groomIdNumber: "",
    groomConfirm: false,
    groomPersonally: false,
    groomRepresentative: false,
    // Groom Representative
    groomRepName: "",
    groomRepFatherName: "",
    groomRepDateOfBirth: "",
    groomRepPlaceOfBirth: "",
    groomRepAddress: "",
    // Bride Information
    brideName: "",
    brideFatherName: "",
    brideDateOfBirth: "",
    bridePlaceOfBirth: "",
    brideAddress: "",
    brideIdNumber: "",
    brideConfirm: false,
    bridePersonally: false,
    brideRepresentative: false,
    // Bride Representative
    brideRepName: "",
    brideRepFatherName: "",
    brideRepDateOfBirth: "",
    brideRepPlaceOfBirth: "",
    brideRepAddress: "",
    // Witnesses
    // Witness No 1 (MALE)
    witness1MaleName: "",
    witness1MaleFatherName: "",
    witness1MaleDateOfBirth: "",
    witness1MalePlaceOfBirth: "",
    witness1MaleAddress: "",
    // Witness No 1 (FEMALE)
    witness1FemaleName: "",
    witness1FemaleFatherName: "",
    witness1FemaleDateOfBirth: "",
    witness1FemalePlaceOfBirth: "",
    witness1FemaleAddress: "",
    // Witness No 2 (MALE)
    witness2MaleName: "",
    witness2MaleFatherName: "",
    witness2MaleDateOfBirth: "",
    witness2MalePlaceOfBirth: "",
    witness2MaleAddress: "",
    // Witness No 2 (FEMALE)
    witness2FemaleName: "",
    witness2FemaleFatherName: "",
    witness2FemaleDateOfBirth: "",
    witness2FemalePlaceOfBirth: "",
    witness2FemaleAddress: "",
    // Mahr
    mahrAmount: "",
    mahrDeferred: false,
    mahrPrompt: false,
    // Solemnisation
    solemnisedDate: "",
    solemnisedPlace: "",
    solemnisedAddress: "",
    // Contact & Status
    email: "",
    contactNumber: "",
    status: "completed",
    depositAmount: "",
    paymentStatus: "verified",
    appointmentDate: "",
    appointmentTime: "",
    appointmentLocation: "",
    preferredDate: "",
    specialRequests: "",
  });

  const [showAdditional, setShowAdditional] = useState(false);
  const [hasConversionCertificate, setHasConversionCertificate] =
    useState(false);
  const [groomConverted, setGroomConverted] = useState(false);
  const [brideConverted, setBrideConverted] = useState(false);
  const [bridePreviouslyMarried, setBridePreviouslyMarried] = useState(false);
  const [brideDivorceType, setBrideDivorceType] = useState(null);
  const [brideAhleKitab, setBrideAhleKitab] = useState(false);
  
  // Store existing document paths for editing
  const [existingDocuments, setExistingDocuments] = useState({
    groomIdPath: null,
    brideIdPath: null,
    witness1MaleIdPath: null,
    witness1FemaleIdPath: null,
    witness2MaleIdPath: null,
    witness2FemaleIdPath: null,
    mahrDeclarationPath: null,
    civilDivorceDocPath: null,
    islamicDivorceDocPath: null,
    groomConversionCertPath: null,
    brideConversionCertPath: null,
    statutoryDeclarationPath: null,
  });

  // Load application data for editing
  useEffect(() => {
    // Check authentication before making API call
    const token = localStorage.getItem("token");
    if (!token) {
      const returnUrl = isEditMode && id ? `/admin/applications/${id}/edit` : "/admin/applications/manual";
      navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (isEditMode && id) {
      const loadApplication = async () => {
        try {
          setInitialLoading(true);
          const response = await getApplicationById(id);
          if (response.data.success) {
            const app = response.data.data.application;
            const witnesses = response.data.data.witnesses || [];
            
            // Debug logging
            console.log("Application data:", app);
            console.log("Witnesses data:", witnesses);
            console.log("Groom rep name:", app.groom_rep_name);
            console.log("Bride rep name:", app.bride_rep_name);
            console.log("Date fields:", {
              groom_date_of_birth: app.groom_date_of_birth,
              bride_date_of_birth: app.bride_date_of_birth,
              groom_rep_date_of_birth: app.groom_rep_date_of_birth,
              bride_rep_date_of_birth: app.bride_rep_date_of_birth,
            });
            
            // Sort witnesses by witness_order if available, otherwise by id
            const sortedWitnesses = [...witnesses].sort((a, b) => {
              if (a.witness_order !== null && b.witness_order !== null) {
                return a.witness_order - b.witness_order;
              }
              if (a.witness_order !== null) return -1;
              if (b.witness_order !== null) return 1;
              return (a.id || 0) - (b.id || 0);
            });
            
            // Format dates for input fields (YYYY-MM-DD)
            // Handle dates directly to avoid timezone conversion issues
            const formatDate = (date, includeTime = false) => {
              if (!date) return "";
              try {
                // If it's already in YYYY-MM-DD or YYYY-MM-DDTHH:mm format, return it directly
                if (typeof date === 'string') {
                  if (includeTime && /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(date)) {
                    // MySQL DATETIME format: convert to datetime-local format
                    return date.replace(' ', 'T').substring(0, 16);
                  }
                  if (includeTime && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(date)) {
                    return date.substring(0, 16);
                  }
                  if (!includeTime && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
                    return date;
                  }
                }
                // If it's a Date object or other format, parse it
                const d = new Date(date);
                if (isNaN(d.getTime())) return "";
                // Use local date components to avoid timezone shifts
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                if (includeTime) {
                  const hours = String(d.getHours()).padStart(2, '0');
                  const minutes = String(d.getMinutes()).padStart(2, '0');
                  return `${year}-${month}-${day}T${hours}:${minutes}`;
                }
                return `${year}-${month}-${day}`;
              } catch (e) {
                console.error("Error formatting date:", date, e);
                return "";
              }
            };

            // Format time for input fields (HH:MM)
            const formatTime = (time) => {
              if (!time) return "";
              // If it's already in HH:MM format, return as is
              if (typeof time === 'string' && time.match(/^\d{2}:\d{2}$/)) {
                return time;
              }
              // If it's a Date object or timestamp, extract time
              try {
                const d = new Date(`2000-01-01T${time}`);
                if (isNaN(d.getTime())) return "";
                return d.toTimeString().slice(0, 5);
              } catch (e) {
                return "";
              }
            };

            // Convert number to string, handling null/undefined
            const formatNumber = (num) => {
              if (num === null || num === undefined) return "";
              return String(num);
            };

            // Normalize phone number - handle arrays and convert to string
            const formatPhoneNumber = (phone) => {
              if (!phone) return "";
              // If it's an array, join it into a string
              if (Array.isArray(phone)) {
                return phone.join("");
              }
              // If it's already a string, return it
              return String(phone);
            };

            // Store existing document paths
            setExistingDocuments({
              groomIdPath: app.groom_id_path || null,
              brideIdPath: app.bride_id_path || null,
              witness1MaleIdPath: app.witness1_male_id_path || null,
              witness1FemaleIdPath: app.witness1_female_id_path || null,
              witness2MaleIdPath: app.witness2_male_id_path || null,
              witness2FemaleIdPath: app.witness2_female_id_path || null,
              mahrDeclarationPath: app.mahr_declaration_path || null,
              civilDivorceDocPath: app.civil_divorce_doc_path || null,
              islamicDivorceDocPath: app.islamic_divorce_doc_path || null,
              groomConversionCertPath: app.groom_conversion_cert_path || null,
              brideConversionCertPath: app.bride_conversion_cert_path || null,
              statutoryDeclarationPath: app.statutory_declaration_path || null,
            });

            setFormData({
              applicationNumber: app.application_number || "",
              groomIdFile: null,
              brideIdFile: null,
              witness1MaleIdFile: null,
              witness1FemaleIdFile: null,
              witness2MaleIdFile: null,
              witness2FemaleIdFile: null,
              mahrDeclarationFile: null,
              civilDivorceDocFile: null,
              islamicDivorceDocFile: null,
              groomConversionCertFile: null,
              brideConversionCertFile: null,
              statutoryDeclarationFile: null,
              groomName: app.groom_full_name || "",
              groomFatherName: app.groom_father_name || "",
              groomDateOfBirth: formatDate(app.groom_date_of_birth),
              groomPlaceOfBirth: app.groom_place_of_birth || "",
              groomAddress: app.groom_address || "",
              groomIdNumber: app.groom_id_number || "",
              groomConfirm: Boolean(app.groom_confirm),
              groomPersonally: Boolean(app.groom_personally),
              groomRepresentative: Boolean(app.groom_representative),
              groomRepName: app.groom_rep_name || "",
              groomRepFatherName: app.groom_rep_father_name || "",
              groomRepDateOfBirth: formatDate(app.groom_rep_date_of_birth),
              groomRepPlaceOfBirth: app.groom_rep_place_of_birth || "",
              groomRepAddress: app.groom_rep_address || "",
              brideName: app.bride_full_name || "",
              brideFatherName: app.bride_father_name || "",
              brideDateOfBirth: formatDate(app.bride_date_of_birth),
              bridePlaceOfBirth: app.bride_place_of_birth || "",
              brideAddress: app.bride_address || "",
              brideIdNumber: app.bride_id_number || "",
              brideConfirm: Boolean(app.bride_confirm),
              bridePersonally: Boolean(app.bride_personally),
              brideRepresentative: Boolean(app.bride_representative),
              brideRepName: app.bride_rep_name || "",
              brideRepFatherName: app.bride_rep_father_name || "",
              brideRepDateOfBirth: formatDate(app.bride_rep_date_of_birth),
              brideRepPlaceOfBirth: app.bride_rep_place_of_birth || "",
              brideRepAddress: app.bride_rep_address || "",
              // Witness No 1 (MALE) - sortedWitnesses[0]
              witness1MaleName: sortedWitnesses[0]?.witness_name || sortedWitnesses[0]?.full_name || "",
              witness1MaleFatherName: sortedWitnesses[0]?.witness_father_name || sortedWitnesses[0]?.father_name || "",
              witness1MaleDateOfBirth: formatDate(sortedWitnesses[0]?.witness_date_of_birth || sortedWitnesses[0]?.date_of_birth),
              witness1MalePlaceOfBirth: sortedWitnesses[0]?.witness_place_of_birth || sortedWitnesses[0]?.place_of_birth || "",
              witness1MaleAddress: sortedWitnesses[0]?.witness_address || sortedWitnesses[0]?.address || "",
              // Witness No 1 (FEMALE) - sortedWitnesses[1]
              witness1FemaleName: sortedWitnesses[1]?.witness_name || sortedWitnesses[1]?.full_name || "",
              witness1FemaleFatherName: sortedWitnesses[1]?.witness_father_name || sortedWitnesses[1]?.father_name || "",
              witness1FemaleDateOfBirth: formatDate(sortedWitnesses[1]?.witness_date_of_birth || sortedWitnesses[1]?.date_of_birth),
              witness1FemalePlaceOfBirth: sortedWitnesses[1]?.witness_place_of_birth || sortedWitnesses[1]?.place_of_birth || "",
              witness1FemaleAddress: sortedWitnesses[1]?.witness_address || sortedWitnesses[1]?.address || "",
              // Witness No 2 (MALE) - sortedWitnesses[2]
              witness2MaleName: sortedWitnesses[2]?.witness_name || sortedWitnesses[2]?.full_name || "",
              witness2MaleFatherName: sortedWitnesses[2]?.witness_father_name || sortedWitnesses[2]?.father_name || "",
              witness2MaleDateOfBirth: formatDate(sortedWitnesses[2]?.witness_date_of_birth || sortedWitnesses[2]?.date_of_birth),
              witness2MalePlaceOfBirth: sortedWitnesses[2]?.witness_place_of_birth || sortedWitnesses[2]?.place_of_birth || "",
              witness2MaleAddress: sortedWitnesses[2]?.witness_address || sortedWitnesses[2]?.address || "",
              // Witness No 2 (FEMALE) - sortedWitnesses[3]
              witness2FemaleName: sortedWitnesses[3]?.witness_name || sortedWitnesses[3]?.full_name || "",
              witness2FemaleFatherName: sortedWitnesses[3]?.witness_father_name || sortedWitnesses[3]?.father_name || "",
              witness2FemaleDateOfBirth: formatDate(sortedWitnesses[3]?.witness_date_of_birth || sortedWitnesses[3]?.date_of_birth),
              witness2FemalePlaceOfBirth: sortedWitnesses[3]?.witness_place_of_birth || sortedWitnesses[3]?.place_of_birth || "",
              witness2FemaleAddress: sortedWitnesses[3]?.witness_address || sortedWitnesses[3]?.address || "",
              mahrAmount: app.mahr_amount || "",
              mahrDeferred: app.mahr_type === "deferred",
              mahrPrompt: app.mahr_type === "prompt",
              solemnisedDate: formatDate(app.solemnised_date, true),
              solemnisedPlace: app.solemnised_place || "",
              solemnisedAddress: app.solemnised_address || "",
              email: app.portal_email || "",
              contactNumber: app.contact_number || "",
              status: app.status || "completed",
              depositAmount: formatNumber(app.deposit_amount),
              paymentStatus: app.payment_status || "verified",
              appointmentDate: formatDate(app.appointment_date),
              appointmentTime: formatTime(app.appointment_time),
              appointmentLocation: app.appointment_location || "",
              preferredDate: formatDate(app.preferred_date),
              specialRequests: app.special_requests || "",
            });

            // Debug: Log formatted dates
            console.log("Formatted dates in formData:", {
              groomDateOfBirth: formatDate(app.groom_date_of_birth),
              brideDateOfBirth: formatDate(app.bride_date_of_birth),
              groomRepDateOfBirth: formatDate(app.groom_rep_date_of_birth),
              brideRepDateOfBirth: formatDate(app.bride_rep_date_of_birth),
            });

            // Set additional flags
            if (app.groom_conversion_cert_path || app.bride_conversion_cert_path) {
              setHasConversionCertificate(true);
              if (app.groom_conversion_cert_path) setGroomConverted(true);
              if (app.bride_conversion_cert_path) setBrideConverted(true);
            }
            if (app.statutory_declaration_path) setBrideAhleKitab(true);
            if (app.civil_divorce_doc_path || app.islamic_divorce_doc_path) {
              setBridePreviouslyMarried(true);
              if (app.civil_divorce_doc_path && app.islamic_divorce_doc_path) {
                setBrideDivorceType("both");
              } else if (app.civil_divorce_doc_path) {
                setBrideDivorceType("civil");
              } else if (app.islamic_divorce_doc_path) {
                setBrideDivorceType("islamic");
              }
            }
          }
        } catch (error) {
          // Only show error if it's not a 401 (unauthorized) - auth errors are handled by redirect
          if (error.response?.status !== 401) {
            toast.error("Failed to load application");
          }
          navigate("/admin/applications");
        } finally {
          setInitialLoading(false);
          setLoading(false); // Enable the update button after data is loaded
        }
      };
      loadApplication();
    } else {
      // Not in edit mode, ensure button is enabled
      setLoading(false);
    }
  }, [id, isEditMode, navigate]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") {
      setFormData((prev) => ({
        ...prev,
        [name]: files && files[0] ? files[0] : null,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  }, []);

  const handleFileChange = (e, name) => {
    if (e.target.files[0]) {
      setFormData((prev) => ({
        ...prev,
        [name]: e.target.files[0],
      }));
    }
  };

  const removeFile = (name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: null,
    }));
  };

  const handleMahrTypeChange = (type) => {
    setFormData((prev) => {
      // Toggle the clicked one, uncheck the other
      const newDeferred = type === "deferred" ? !prev.mahrDeferred : false;
      const newPrompt = type === "prompt" ? !prev.mahrPrompt : false;

      return {
        ...prev,
        mahrDeferred: newDeferred,
        mahrPrompt: newPrompt,
        mahrType: newDeferred ? "deferred" : newPrompt ? "prompt" : "",
      };
    });
  };

  const handlePersonallyChange = (field, value) => {
    if (field === "groom") {
      setFormData((prev) => ({
        ...prev,
        groomPersonally: value === "personally",
        groomRepresentative: value === "representative",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        bridePersonally: value === "personally",
        brideRepresentative: value === "representative",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Convert mahr checkboxes to mahrType
    let mahrType = "";
    if (formData.mahrDeferred) mahrType = "deferred";
    else if (formData.mahrPrompt) mahrType = "prompt";

    // Create FormData for file uploads
    const submitFormData = new FormData();

    // Add all text fields
    Object.keys(formData).forEach((key) => {
      if (key.endsWith("File")) {
        // Handle file fields separately
        if (formData[key]) {
          const fieldName = key.replace("File", "");
          // Map to backend field names
          const fileFieldMap = {
            groomIdFile: "groomId",
            brideIdFile: "brideId",
            witness1MaleIdFile: "witness1MaleId",
            witness1FemaleIdFile: "witness1FemaleId",
            witness2MaleIdFile: "witness2MaleId",
            witness2FemaleIdFile: "witness2FemaleId",
            mahrDeclarationFile: "mahrDeclaration",
            civilDivorceDocFile: "civilDivorceDoc",
            islamicDivorceDocFile: "islamicDivorceDoc",
            groomConversionCertFile: "groomConversionCert",
            brideConversionCertFile: "brideConversionCert",
            statutoryDeclarationFile: "statutoryDeclaration",
          };
          submitFormData.append(fileFieldMap[key] || fieldName, formData[key]);
        }
      } else if (
        formData[key] !== null &&
        formData[key] !== undefined &&
        formData[key] !== "" &&
        !key.endsWith("File")
      ) {
        submitFormData.append(key, formData[key]);
      }
    });

    // Add computed fields
    submitFormData.append("mahrType", mahrType);

    try {
      let response;
      if (isEditMode) {
        response = await updateApplication(id, submitFormData);
        if (response.data.success) {
          toast.success("Application updated successfully!");
          setTimeout(() => {
            navigate(`/admin/applications/${id}`);
          }, 1000);
        }
      } else {
        response = await createManualApplication(submitFormData);
        if (response.data.success) {
          toast.success("Application created successfully!");
          setTimeout(() => {
            navigate("/admin/applications");
          }, 1000);
        }
      }
    } catch (error) {
      // Only show error if it's not a 401 (unauthorized) - auth errors are handled by redirect
      if (error.response?.status !== 401) {
        console.error(`Error ${isEditMode ? "updating" : "creating"} application:`, error);
        toast.error(
          error.response?.data?.message || `Failed to ${isEditMode ? "update" : "create"} application`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // UploadCard Component (same as applicant page)
  const UploadCard = ({ title, subtitle, name, required = false }) => {
    const file = formData[name];
    // Map form field names to existing document path keys
    const documentPathMap = {
      groomIdFile: "groomIdPath",
      brideIdFile: "brideIdPath",
      witness1MaleIdFile: "witness1MaleIdPath",
      witness1FemaleIdFile: "witness1FemaleIdPath",
      witness2MaleIdFile: "witness2MaleIdPath",
      witness2FemaleIdFile: "witness2FemaleIdPath",
      mahrDeclarationFile: "mahrDeclarationPath",
      civilDivorceDocFile: "civilDivorceDocPath",
      islamicDivorceDocFile: "islamicDivorceDocPath",
      groomConversionCertFile: "groomConversionCertPath",
      brideConversionCertFile: "brideConversionCertPath",
      statutoryDeclarationFile: "statutoryDeclarationPath",
    };
    const existingPath = existingDocuments[documentPathMap[name]] || null;
    const hasExistingDocument = existingPath && !file;
    
    return (
      <div
        style={{
          background: "var(--brand-50)",
          borderRadius: "0.5rem",
          padding: "1.5rem",
          border: "1px solid var(--slate-200)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          minHeight: "200px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "1rem",
            }}
          >
            <div>
              <h4
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 700,
                  color: "var(--slate-800)",
                  fontSize: "0.9rem",
                  marginBottom: "0.25rem",
                  margin: 0,
                }}
              >
                {title}{" "}
                {required && <span style={{ color: "var(--danger)" }}>*</span>}
              </h4>
              <p
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "0.8rem",
                  color: "var(--slate-500)",
                  margin: 0,
                }}
              >
                {subtitle}
              </p>
            </div>
          </div>

          {file ? (
            <div
              style={{
                backgroundColor: "var(--slate-50)",
                border: "1px solid var(--slate-200)",
                borderRadius: "0.5rem",
                padding: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    backgroundColor: "var(--brand-50)",
                    width: "2rem",
                    height: "2rem",
                    borderRadius: "0.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileText size={16} style={{ color: "var(--brand-600)" }} />
                </div>
                <span
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    color: "var(--slate-700)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {file.name}
                </span>
              </div>
              <button
                onClick={() => removeFile(name)}
                style={{
                  padding: "0.375rem",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--danger)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--slate-400)";
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : hasExistingDocument ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Existing Document Display */}
              <div
                style={{
                  backgroundColor: "var(--slate-50)",
                  border: "1px solid var(--slate-200)",
                  borderRadius: "0.5rem",
                  padding: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    overflow: "hidden",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "var(--success-50)",
                      width: "2rem",
                      height: "2rem",
                      borderRadius: "0.25rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileText size={16} style={{ color: "var(--success-600)" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontFamily: "Montserrat, sans-serif",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        color: "var(--slate-700)",
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Existing document uploaded
                    </span>
                    <a
                      href={getFileUrl(existingPath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "Montserrat, sans-serif",
                        fontSize: "0.75rem",
                        color: "var(--brand-600)",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        marginTop: "0.25rem",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = "underline";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = "none";
                      }}
                    >
                      View document <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
              
              {/* Upload New File Option */}
              <div
                style={{
                  borderTop: "1px solid var(--slate-200)",
                  paddingTop: "1rem",
                }}
              >
                <p
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: "0.75rem",
                    color: "var(--slate-600)",
                    marginBottom: "0.5rem",
                    marginTop: 0,
                    fontWeight: 500,
                  }}
                >
                  Upload new file to replace:
                </p>
                <label
                  style={{
                    borderColor: "var(--slate-300)",
                    backgroundColor: "var(--slate-50)",
                    borderWidth: "2px",
                    borderStyle: "dashed",
                    borderRadius: "0.5rem",
                    padding: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--brand-400)";
                    e.currentTarget.style.backgroundColor = "var(--brand-50)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--slate-300)";
                    e.currentTarget.style.backgroundColor = "var(--slate-50)";
                  }}
                >
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, name)}
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: "none" }}
                  />
                  <div
                    style={{
                      backgroundColor: "var(--slate-100)",
                      width: "2rem",
                      height: "2rem",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <UploadCloud size={18} color="var(--slate-500)" />
                  </div>
                  <span
                    style={{
                      fontFamily: "Montserrat, sans-serif",
                      color: "var(--brand-600)",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                    }}
                  >
                    Click to upload replacement
                  </span>
                  <span
                    style={{
                      fontFamily: "Montserrat, sans-serif",
                      fontSize: "0.7rem",
                      color: "var(--slate-400)",
                      marginTop: "0.25rem",
                    }}
                  >
                    PDF or Image
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <label
              style={{
                borderColor: "var(--slate-300)",
                backgroundColor: "var(--slate-50)",
                borderWidth: "2px",
                borderStyle: "dashed",
                borderRadius: "0.5rem",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--brand-400)";
                e.currentTarget.style.backgroundColor = "var(--brand-50)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--slate-300)";
                e.currentTarget.style.backgroundColor = "var(--slate-50)";
              }}
            >
              <input
                type="file"
                onChange={(e) => handleFileChange(e, name)}
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: "none" }}
              />
              <div
                style={{
                  backgroundColor: "var(--slate-100)",
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "0.75rem",
                }}
              >
                <UploadCloud size={20} color="var(--slate-500)" />
              </div>
              <span
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  color: "var(--brand-600)",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                }}
              >
                Click to upload
              </span>
              <span
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "0.75rem",
                  color: "var(--slate-400)",
                  marginTop: "0.25rem",
                }}
              >
                PDF or Image
              </span>
            </label>
          )}
        </div>
        {(file || hasExistingDocument) && (
          <div
            style={{
              fontFamily: "Montserrat, sans-serif",
              color: "var(--success)",
              marginTop: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={14} />
            <span>{file ? "Ready to upload" : "Document exists"}</span>
          </div>
        )}
      </div>
    );
  };

  if (initialLoading) return <Loader fullscreen />;

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "1200px",
        margin: "0 auto",
        background: "var(--brand-50)",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "var(--brand-600)",
          padding: "1.5rem 2rem",
          borderRadius: "var(--radius-lg)",
          marginBottom: "1.5rem",
          position: "relative",
        }}
      >
        {/* Top Row with Back Button and SR No */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          {/* Back Button - Top Left Corner */}
          <button
            onClick={() => navigate("/admin/applications")}
            className="btn-back-nav"
          >
            <ArrowLeft size={16} />
            <span>Back to Applications</span>
          </button>

          {/* SR No - Top Right Corner */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: "0.875rem",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              SR No:
            </label>
            <input
              type="text"
              name="applicationNumber"
              value={formData.applicationNumber || ""}
              onChange={handleChange}
              placeholder="Enter SR No"
              style={{
                fontFamily: "monospace",
                color: "white",
                fontSize: "0.875rem",
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.25)",
                padding: "0.5rem 0.75rem",
                borderRadius: "6px",
                width: "150px",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.background = "rgba(255,255,255,0.25)";
                e.target.style.borderColor = "rgba(255,255,255,0.4)";
              }}
              onBlur={(e) => {
                e.target.style.background = "rgba(255,255,255,0.15)";
                e.target.style.borderColor = "rgba(255,255,255,0.25)";
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

        <h1 style={{ fontSize: "2rem", margin: 0, color: "white" }}>
          {isEditMode ? "Edit Application" : "Add Manual Application"}
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.85)",
            margin: 0,
            marginTop: "0.25rem",
          }}
        >
          {isEditMode 
            ? "Update application information" 
            : "Enter all information for completed nikkah records"}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* BRIDEGROOM Section */}
        <FormSection title="BRIDEGROOM">
          <FormRow>
            <FormField
              label="Groom's Full Name"
              name="groomName"
              required
              formData={formData}
              handleChange={handleChange}
            />
            <FormField
              label="Father's full Name"
              name="groomFatherName"
              required
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
          <FormRow>
            <FormField
              label="Date of Birth"
              name="groomDateOfBirth"
              type="date"
              required
              formData={formData}
              handleChange={handleChange}
            />
            <FormField
              label="Place of Birth"
              name="groomPlaceOfBirth"
              required
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
          <FormRow>
            <FormField
              label="Address"
              name="groomAddress"
              type="textarea"
              span={2}
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
          <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                name="groomConfirm"
                checked={formData.groomConfirm}
                onChange={handleChange}
                style={{
                  width: "18px",
                  height: "18px",
                  marginTop: "2px",
                  border: "2.7px solid #CA6C41",
                  borderRadius: "4px",
                  cursor: "pointer",
                  accentColor: "#CA6C41",
                }}
              />
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "#334155",
                  lineHeight: "1.5",
                  textTransform: "uppercase",
                }}
              >
                I can confirm that I have the power, fitness and capacity to
                marry in Islamic law and fulfil my duties in an Islamic marriage
              </span>
            </label>
          </div>
          <div style={{ marginTop: "1.5rem" }}>
            <h3
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: "clamp(16px, 3vw, 25px)",
                fontWeight: 600,
                marginBottom: "0.75rem",
                color: "#2E2E2E",
                textTransform: "uppercase",
              }}
            >
              Personally/Representative
            </h3>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="groomPersonallyRep"
                  checked={formData.groomPersonally}
                  onChange={() => handlePersonallyChange("groom", "personally")}
                  style={{
                    width: "18px",
                    height: "18px",
                    border: "2.7px solid #CA6C41",
                    cursor: "pointer",
                    accentColor: "#CA6C41",
                  }}
                />
                <span
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: "clamp(16px, 3vw, 25px)",
                    color: "#2E2E2E",
                    textTransform: "uppercase",
                  }}
                >
                  Personally
                </span>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="groomPersonallyRep"
                  checked={formData.groomRepresentative}
                  onChange={() =>
                    handlePersonallyChange("groom", "representative")
                  }
                  style={{
                    width: "18px",
                    height: "18px",
                    border: "2.7px solid #CA6C41",
                    cursor: "pointer",
                    accentColor: "#CA6C41",
                  }}
                />
                <span
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: "clamp(16px, 3vw, 25px)",
                    color: "#2E2E2E",
                    textTransform: "uppercase",
                  }}
                >
                  Representative
                </span>
              </label>
            </div>
          </div>
        </FormSection>

        {/* BRIDE Section */}
        <FormSection title="BRIDE">
          <FormRow>
            <FormField
              label="Bride's Full Name"
              name="brideName"
              required
              formData={formData}
              handleChange={handleChange}
            />
            <FormField
              label="Father's full Name"
              name="brideFatherName"
              required
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
          <FormRow>
            <FormField
              label="Date of Birth"
              name="brideDateOfBirth"
              type="date"
              required
              formData={formData}
              handleChange={handleChange}
            />
            <FormField
              label="Place of Birth"
              name="bridePlaceOfBirth"
              required
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
          <FormRow>
            <FormField
              label="Address"
              name="brideAddress"
              type="textarea"
              span={2}
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
          <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                name="brideConfirm"
                checked={formData.brideConfirm}
                onChange={handleChange}
                style={{
                  width: "18px",
                  height: "18px",
                  marginTop: "2px",
                  border: "2.7px solid #CA6C41",
                  borderRadius: "4px",
                  cursor: "pointer",
                  accentColor: "#CA6C41",
                }}
              />
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "#334155",
                  lineHeight: "1.5",
                  textTransform: "uppercase",
                }}
              >
                I can confirm that I have the power, fitness and capacity to
                marry in Islamic law and fulfil my duties in an Islamic marriage
              </span>
            </label>
          </div>
          <div style={{ marginTop: "1.5rem" }}>
            <h3
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: "clamp(16px, 3vw, 25px)",
                fontWeight: 600,
                marginBottom: "0.75rem",
                color: "#2E2E2E",
                textTransform: "uppercase",
              }}
            >
              Personally/Representative
            </h3>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="bridePersonallyRep"
                  checked={formData.bridePersonally}
                  onChange={() => handlePersonallyChange("bride", "personally")}
                  style={{
                    width: "18px",
                    height: "18px",
                    border: "2.7px solid #CA6C41",
                    cursor: "pointer",
                    accentColor: "#CA6C41",
                  }}
                />
                <span
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: "clamp(16px, 3vw, 25px)",
                    color: "#2E2E2E",
                    textTransform: "uppercase",
                  }}
                >
                  Personally
                </span>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="bridePersonallyRep"
                  checked={formData.brideRepresentative}
                  onChange={() =>
                    handlePersonallyChange("bride", "representative")
                  }
                  style={{
                    width: "18px",
                    height: "18px",
                    border: "2.7px solid #CA6C41",
                    cursor: "pointer",
                    accentColor: "#CA6C41",
                  }}
                />
                <span
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: "clamp(16px, 3vw, 25px)",
                    color: "#2E2E2E",
                    textTransform: "uppercase",
                  }}
                >
                  Representative
                </span>
              </label>
            </div>
          </div>
        </FormSection>

        {/* REPRESENTATIVE OR GUARDIAN OF BRIDE GROOM */}
        <FormSection title="REPRESENTATIVE OR GUARDIAN OF BRIDE GROOM">
          <FormRow>
            <FormField
              label="Full Name"
              name="groomRepName"
              required
              formData={formData}
              handleChange={handleChange}
            />
            <FormField
              label="Father's Name"
              name="groomRepFatherName"
              required
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
          <FormRow>
            <FormField
              label="Date of Birth"
              name="groomRepDateOfBirth"
              type="date"
              formData={formData}
              handleChange={handleChange}
            />
            <FormField
              label="Place of Birth"
              name="groomRepPlaceOfBirth"
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
          <FormRow>
            <FormField
              label="Address"
              name="groomRepAddress"
              type="textarea"
              span={2}
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
        </FormSection>

        {/* REPRESENTATIVE OR GUARDIAN OF BRIDE */}
        <FormSection title="REPRESENTATIVE OR GUARDIAN OF BRIDE">
          <FormRow>
            <FormField
              label="Full Name"
              name="brideRepName"
              required
              formData={formData}
              handleChange={handleChange}
            />
            <FormField
              label="Father's Name"
              name="brideRepFatherName"
              required
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
          <FormRow>
            <FormField
              label="Date of Birth"
              name="brideRepDateOfBirth"
              type="date"
              formData={formData}
              handleChange={handleChange}
            />
            <FormField
              label="Place of Birth"
              name="brideRepPlaceOfBirth"
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
          <FormRow>
            <FormField
              label="Address"
              name="brideRepAddress"
              type="textarea"
              span={2}
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
        </FormSection>

        {/* WITNESS 1 */}
        <FormSection title="WITNESS 1">
          <FormRow>
            <FormField
              label="Witness's Full Name"
              name="witness1MaleName"
              formData={formData}
              handleChange={handleChange}
            />
            <FormField
              label="Witness's father's full Name"
              name="witness1MaleFatherName"
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
          <FormRow>
            <FormField
              label="Date of Birth"
              name="witness1MaleDateOfBirth"
              type="date"
              formData={formData}
              handleChange={handleChange}
            />
            <FormField
              label="Place of Birth"
              name="witness1MalePlaceOfBirth"
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
          <FormRow>
            <FormField
              label="Address"
              name="witness1MaleAddress"
              type="textarea"
              span={2}
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
        </FormSection>

        {/* WITNESS 2 */}
        <FormSection title="WITNESS 2">
          <FormRow>
            <FormField
              label="Witness's Full Name"
              name="witness1FemaleName"
              formData={formData}
              handleChange={handleChange}
            />
            <FormField
              label="Witness's father's full Name"
              name="witness1FemaleFatherName"
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
          <FormRow>
            <FormField
              label="Date of Birth"
              name="witness1FemaleDateOfBirth"
              type="date"
              formData={formData}
              handleChange={handleChange}
            />
            <FormField
              label="Place of Birth"
              name="witness1FemalePlaceOfBirth"
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
          <FormRow>
            <FormField
              label="Address"
              name="witness1FemaleAddress"
              type="textarea"
              span={2}
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
        </FormSection>

        {/* WITNESS 3 */}
        <FormSection title="WITNESS 3">
          <FormRow>
            <FormField
              label="Witness's Full Name *"
              name="witness2MaleName"
              required
              formData={formData}
              handleChange={handleChange}
            />
            <FormField
              label="Witness's father's full Name *"
              name="witness2MaleFatherName"
              required
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
          <FormRow>
            <FormField
              label="Date of Birth"
              name="witness2MaleDateOfBirth"
              type="date"
              formData={formData}
              handleChange={handleChange}
            />
            <FormField
              label="Place of Birth"
              name="witness2MalePlaceOfBirth"
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
          <FormRow>
            <FormField
              label="Address"
              name="witness2MaleAddress"
              type="textarea"
              span={2}
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
        </FormSection>

        {/* WITNESS 4 */}
        <FormSection title="WITNESS 4">
          <FormRow>
            <FormField
              label="Witness's Full Name *"
              name="witness2FemaleName"
              required
              formData={formData}
              handleChange={handleChange}
            />
            <FormField
              label="Witness's father's full Name *"
              name="witness2FemaleFatherName"
              required
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
          <FormRow>
            <FormField
              label="Date of Birth"
              name="witness2FemaleDateOfBirth"
              type="date"
              formData={formData}
              handleChange={handleChange}
            />
            <FormField
              label="Place of Birth"
              name="witness2FemalePlaceOfBirth"
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
          <FormRow>
            <FormField
              label="Address"
              name="witness2FemaleAddress"
              type="textarea"
              span={2}
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
        </FormSection>

        {/* MAHR Section */}
        <FormSection title="MAHR">
          <FormRow>
            <FormField
              label="Mahar agreed amount"
              name="mahrAmount"
              required
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
          <div style={{ marginTop: "1rem" }}>
            <label
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: "clamp(16px, 3vw, 25px)",
                fontWeight: 400,
                color: "#2E2E2E",
                marginBottom: "10px",
                display: "block",
              }}
            >
              Deferred/Prompt
            </label>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.mahrDeferred}
                  onChange={() => handleMahrTypeChange("deferred")}
                  style={{
                    width: "18px",
                    height: "18px",
                    border: "2.7px solid #CA6C41",
                    borderRadius: "4px",
                    cursor: "pointer",
                    accentColor: "#CA6C41",
                  }}
                />
                <span
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: "clamp(16px, 3vw, 25px)",
                    color: "#2E2E2E",
                  }}
                >
                  Deferred
                </span>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.mahrPrompt}
                  onChange={() => handleMahrTypeChange("prompt")}
                  style={{
                    width: "18px",
                    height: "18px",
                    border: "2.7px solid #CA6C41",
                    borderRadius: "4px",
                    cursor: "pointer",
                    accentColor: "#CA6C41",
                  }}
                />
                <span
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: "clamp(16px, 3vw, 25px)",
                    color: "#2E2E2E",
                  }}
                >
                  Prompt
                </span>
              </label>
            </div>
          </div>
        </FormSection>

        {/* NIKAH DATE AND PLACE Section */}
        <FormSection title="NIKAH DATE AND PLACE">
          <FormRow>
            <FormField
              label="Date & Time"
              name="solemnisedDate"
              type="datetime-local"
              formData={formData}
              handleChange={handleChange}
            />
            <FormField
              label="Place"
              name="solemnisedPlace"
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
          <FormRow>
            <FormField
              label="Address"
              name="solemnisedAddress"
              type="textarea"
              span={2}
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
        </FormSection>

        {/* CONTACT INFORMATION Section */}
        <FormSection title="CONTACT INFORMATION">
          <FormRow>
            <FormField
              label="Email"
              name="email"
              type="email"
              formData={formData}
              handleChange={handleChange}
            />
            <FormField
              label="Contact Number"
              name="contactNumber"
              formData={formData}
              handleChange={handleChange}
            />
          </FormRow>
        </FormSection>

        {/* DOCUMENTS Section - Same as Applicant Upload Page */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
            marginBottom: "2rem",
          }}
        >
          {/* Section: Identification */}
          <FormSection title="IDENTIFICATION DOCUMENTS">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "1.5rem",
              }}
            >
              <UploadCard
                title="Groom's ID Proof"
                subtitle="Passport or Driving Licence"
                name="groomIdFile"
              />
              <UploadCard
                title="Bride's ID Proof"
                subtitle="Passport or Driving Licence"
                name="brideIdFile"
              />
            </div>
          </FormSection>

          {/* Section: Witnesses */}
          <FormSection title="WITNESSES">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "1.5rem",
              }}
            >
              <UploadCard
                title="Witness 1 ID"
                subtitle="Witness 1 ID"
                name="witness1MaleIdFile"
              />
              <UploadCard
                title="Witness 2 ID"
                subtitle="Witness 2 ID"
                name="witness1FemaleIdFile"
              />
              <UploadCard
                title="Witness 3 ID"
                subtitle="Witness 3 ID"
                name="witness2MaleIdFile"
              />
              <UploadCard
                title="Witness 4 ID"
                subtitle="Witness 4 ID"
                name="witness2FemaleIdFile"
              />
            </div>
          </FormSection>

          {/* Section: Wedding Details */}
          <FormSection title="WEDDING DETAILS">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "1.5rem",
              }}
            >
              <UploadCard
                title="Mahr Declaration"
                subtitle="Signed by both parties"
                name="mahrDeclarationFile"
              />
            </div>
          </FormSection>

          {/* Section 4: Additional Requirements (Collapsible) */}
          <div
            style={{
              backgroundColor: "white",
              border: "1px solid var(--slate-200)",
              borderRadius: "0.75rem",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              onClick={() => setShowAdditional(!showAdditional)}
              style={{
                padding: "1rem",
                backgroundColor: "var(--slate-50)",
                borderBottom: "1px solid var(--slate-200)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Info size={18} style={{ color: "var(--brand-600)" }} />
                <h3
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--slate-800)",
                    margin: 0,
                  }}
                >
                  Additional Circumstances
                </h3>
              </div>
              <button
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--slate-400)",
                  cursor: "pointer",
                }}
              >
                {showAdditional ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>
            </div>

            <div
              style={{
                display: showAdditional ? "block" : "none",
                padding: "1.5rem",
              }}
            >
              {/* Conversion To Islam */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={hasConversionCertificate}
                    onChange={(e) => {
                      setHasConversionCertificate(e.target.checked);
                      if (!e.target.checked) {
                        setGroomConverted(false);
                        setBrideConverted(false);
                        setFormData((prev) => ({
                          ...prev,
                          groomConversionCertFile: null,
                          brideConversionCertFile: null,
                        }));
                      }
                    }}
                    style={{
                      width: "1.25rem",
                      height: "1.25rem",
                      accentColor: "var(--brand-500)",
                      cursor: "pointer",
                    }}
                  />
                  <label
                    style={{
                      fontFamily: "Montserrat, sans-serif",
                      fontWeight: 600,
                      color: "var(--slate-800)",
                      cursor: "pointer",
                    }}
                  >
                    Do you have a certificate of conversion to Islam?
                  </label>
                </div>

                {hasConversionCertificate && (
                  <div
                    style={{
                      borderLeft: "2px solid var(--slate-100)",
                      paddingLeft: "2rem",
                      marginLeft: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                      }}
                    >
                      {/* Groom Conversion */}
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            marginBottom: "0.75rem",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={groomConverted}
                            onChange={(e) => {
                              setGroomConverted(e.target.checked);
                              if (!e.target.checked) {
                                setFormData((prev) => ({
                                  ...prev,
                                  groomConversionCertFile: null,
                                }));
                              }
                            }}
                            style={{
                              width: "1.25rem",
                              height: "1.25rem",
                              accentColor: "var(--brand-500)",
                              cursor: "pointer",
                            }}
                          />
                          <label
                            style={{
                              fontFamily: "Montserrat, sans-serif",
                              fontWeight: 600,
                              color: "var(--slate-800)",
                              cursor: "pointer",
                            }}
                          >
                            Has the Groom converted to Islam?
                          </label>
                        </div>
                        {groomConverted && (
                          <div
                            style={{
                              paddingLeft: "2rem",
                              marginLeft: "0.5rem",
                            }}
                          >
                            <UploadCard
                              title="Groom's Certificate"
                              subtitle="Certificate of Conversion"
                              name="groomConversionCertFile"
                            />
                          </div>
                        )}
                      </div>

                      {/* Bride Conversion */}
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            marginBottom: "0.75rem",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={brideConverted}
                            onChange={(e) => {
                              setBrideConverted(e.target.checked);
                              if (!e.target.checked) {
                                setFormData((prev) => ({
                                  ...prev,
                                  brideConversionCertFile: null,
                                }));
                              }
                            }}
                            style={{
                              width: "1.25rem",
                              height: "1.25rem",
                              accentColor: "var(--brand-500)",
                              cursor: "pointer",
                            }}
                          />
                          <label
                            style={{
                              fontFamily: "Montserrat, sans-serif",
                              fontWeight: 600,
                              color: "var(--slate-800)",
                              cursor: "pointer",
                            }}
                          >
                            Has the Bride converted to Islam?
                          </label>
                        </div>
                        {brideConverted && (
                          <div
                            style={{
                              paddingLeft: "2rem",
                              marginLeft: "0.5rem",
                            }}
                          >
                            <UploadCard
                              title="Bride's Certificate"
                              subtitle="Certificate of Conversion"
                              name="brideConversionCertFile"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <hr
                style={{
                  borderTop: "1px solid var(--slate-100)",
                  borderBottom: "none",
                  margin: "2rem 0",
                }}
              />

              {/* Ahle Kitab */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={brideAhleKitab}
                    onChange={(e) => {
                      setBrideAhleKitab(e.target.checked);
                      if (!e.target.checked) {
                        setFormData((prev) => ({
                          ...prev,
                          statutoryDeclarationFile: null,
                        }));
                      }
                    }}
                    style={{
                      width: "1.25rem",
                      height: "1.25rem",
                      accentColor: "var(--brand-500)",
                      cursor: "pointer",
                    }}
                  />
                  <label
                    style={{
                      fontFamily: "Montserrat, sans-serif",
                      fontWeight: 600,
                      color: "var(--slate-800)",
                      cursor: "pointer",
                    }}
                  >
                    Is the bride from the People of the Book (Ahle Kitab)?
                  </label>
                </div>
                {brideAhleKitab && (
                  <div
                    style={{
                      borderLeft: "2px solid var(--slate-100)",
                      paddingLeft: "2rem",
                      marginLeft: "0.5rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.5rem",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "Montserrat, sans-serif",
                        backgroundColor: "#fffbeb",
                        borderColor: "#fcd34d",
                        padding: "1rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        color: "#92400e",
                        border: "1px solid #fcd34d",
                      }}
                    >
                      <strong>Note:</strong> The Statutory Declaration
                      (Affidavit) must be signed by a solicitor or a
                      Commissioner of Oaths.
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "1.5rem",
                      }}
                    >
                      <UploadCard
                        title="Statutory Declaration"
                        subtitle="Affidavit signed by Solicitor/Commissioner"
                        name="statutoryDeclarationFile"
                      />
                    </div>
                  </div>
                )}
              </div>

              <hr
                style={{
                  borderTop: "1px solid var(--slate-100)",
                  borderBottom: "none",
                  margin: "2rem 0",
                }}
              />

              {/* Previous Marriage */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={bridePreviouslyMarried}
                    onChange={(e) => {
                      setBridePreviouslyMarried(e.target.checked);
                      if (!e.target.checked) {
                        setBrideDivorceType(null);
                        setFormData((prev) => ({
                          ...prev,
                          civilDivorceDocFile: null,
                          islamicDivorceDocFile: null,
                        }));
                      }
                    }}
                    style={{
                      width: "1.25rem",
                      height: "1.25rem",
                      accentColor: "var(--brand-500)",
                      cursor: "pointer",
                    }}
                  />
                  <label
                    style={{
                      fontFamily: "Montserrat, sans-serif",
                      fontWeight: 600,
                      color: "var(--slate-800)",
                      cursor: "pointer",
                    }}
                  >
                    Was the bride previously married?
                  </label>
                </div>
                {bridePreviouslyMarried && (
                  <div
                    style={{
                      borderLeft: "2px solid var(--slate-100)",
                      paddingLeft: "2rem",
                      marginLeft: "0.5rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.5rem",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "var(--slate-50)",
                        padding: "1rem",
                        borderRadius: "0.5rem",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "Montserrat, sans-serif",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "var(--slate-700)",
                          marginBottom: "0.75rem",
                          marginTop: 0,
                        }}
                      >
                        Type of Previous Marriage{" "}
                        <span style={{ color: "var(--danger)" }}>*</span>
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "1rem",
                        }}
                      >
                        {["civil", "islamic", "both"].map((type) => (
                          <label
                            key={type}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              padding: "0.5rem 1rem",
                              borderRadius: "0.25rem",
                              border:
                                brideDivorceType === type
                                  ? "1px solid var(--brand-500)"
                                  : "1px solid transparent",
                              backgroundColor:
                                brideDivorceType === type
                                  ? "white"
                                  : "transparent",
                              boxShadow:
                                brideDivorceType === type
                                  ? "var(--shadow-sm)"
                                  : "none",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="radio"
                              name="divorceType"
                              value={type}
                              checked={brideDivorceType === type}
                              onChange={(e) => {
                                setBrideDivorceType(e.target.value);
                                if (e.target.value !== "civil") {
                                  setFormData((prev) => ({
                                    ...prev,
                                    civilDivorceDocFile: null,
                                  }));
                                }
                                if (e.target.value !== "islamic") {
                                  setFormData((prev) => ({
                                    ...prev,
                                    islamicDivorceDocFile: null,
                                  }));
                                }
                              }}
                              style={{ accentColor: "var(--brand-500)" }}
                            />
                            <span
                              style={{
                                fontFamily: "Montserrat, sans-serif",
                                fontSize: "0.875rem",
                                textTransform: "capitalize",
                              }}
                            >
                              {type === "both"
                                ? "Both Civil & Islamic"
                                : `${type} Only`}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "1.5rem",
                      }}
                    >
                      {(brideDivorceType === "civil" ||
                        brideDivorceType === "both") && (
                        <UploadCard
                          title="Civil Divorce Doc"
                          subtitle="Decree Absolute"
                          name="civilDivorceDocFile"
                        />
                      )}
                      {(brideDivorceType === "islamic" ||
                        brideDivorceType === "both") && (
                        <UploadCard
                          title="Islamic Divorce Doc"
                          subtitle="Talaq / Khula / Faskh"
                          name="islamicDivorceDocFile"
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
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "1rem",
            padding: "1.5rem",
            background: "var(--brand-50)",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
            marginTop: "2rem",
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/admin/applications")}
            style={{
              padding: "0.75rem 1.5rem",
              background: "var(--brand-50)",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#475569",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.75rem 1.5rem",
              background: "var(--brand-600)",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              opacity: loading ? 0.6 : 1,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "var(--brand-700)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "var(--brand-600)";
              }
            }}
          >
            <Save size={16} />
            {loading 
              ? (isEditMode ? "Updating..." : "Creating...") 
              : (isEditMode ? "Update Application" : "Create Application")}
          </button>
        </div>
      </form>
      <style>{`
        /* Date Picker Custom Styling */
        .custom-datepicker-wrapper {
          width: 100%;
        }
        
        .custom-datepicker-wrapper .react-datepicker__input-container {
          width: 100%;
        }
        
        .custom-datepicker-wrapper .react-datepicker__input-container input {
          width: 100% !important;
          height: 54px;
          padding: 15px;
          border: 2.7px solid #CA6C41;
          border-radius: 10px;
          font-size: 16px;
          font-family: Montserrat, sans-serif;
          color: #333;
          background: #FFFFFF;
          outline: none;
          transition: box-shadow 0.2s;
          cursor: pointer;
        }
        
        .custom-datepicker-wrapper .react-datepicker__input-container input:focus {
          box-shadow: 0 0 0 4px rgba(202, 108, 65, 0.2);
        }
        
        /* Date Picker Calendar Styling */
        .react-datepicker {
          font-family: Montserrat, sans-serif;
          border: 2px solid #CA6C41;
          border-radius: 10px;
        }
        
        .react-datepicker__header {
          background-color: #CA6C41;
          border-bottom: 2px solid #CA6C41;
          border-radius: 8px 8px 0 0;
        }
        
        .react-datepicker__current-month,
        .react-datepicker__day-name {
          color: white;
          font-weight: 600;
        }
        
        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background-color: #CA6C41;
          border-radius: 5px;
        }
        
        .react-datepicker__day:hover {
          background-color: rgba(202, 108, 65, 0.2);
          border-radius: 5px;
        }
        
        .react-datepicker__navigation-icon::before {
          border-color: white;
        }
        
        .react-datepicker__year-dropdown,
        .react-datepicker__month-dropdown {
          background-color: white;
          border: 1px solid #CA6C41;
          border-radius: 5px;
        }
      `}</style>
    </div>
  );
}
