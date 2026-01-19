import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getApplicationById,
  getFileUrl,
  generateCertificate,
  approveApplication,
} from "../services/api";
import Loader from "../components/Loader";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  Clock,
  Globe,
  Shield,
  CreditCard,
  MoreVertical,
  ExternalLink,
  Printer,
  CheckCircle,
} from "lucide-react";

export default function AdminApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  // Print functionality added

  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);
  const [witnesses, setWitnesses] = useState([]);

  useEffect(() => {
    // Check authentication before making API call
    const token = localStorage.getItem("token");
    if (!token) {
      const returnUrl = `/admin/applications/${id}`;
      navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }
    fetchApplicationDetails();
  }, [id, navigate]);

  const fetchApplicationDetails = async () => {
    try {
      const response = await getApplicationById(id);
      if (response.data.success) {
        setApplication(response.data.data.application);
        setWitnesses(response.data.data.witnesses);
      }
    } catch (error) {
      // Only show error if it's not a 401 (unauthorized) - auth errors are handled by redirect
      if (error.response?.status !== 401) {
        toast.error("Failed to load application details");
        navigate("/admin/applications");
      }
      // For 401, just redirect without showing error (handled by AdminLayout or redirect above)
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!application) {
      toast.error("Application data not loaded");
      return;
    }

    // Check if application is in the correct status for approval
    if (application.status !== "admin_review") {
      toast.error(
        "Application is not in review status or has already been processed"
      );
      return;
    }

    const toastId = toast.loading("Approving application...");
    try {
      await approveApplication(id);
      toast.success(
        "Application approved successfully! Deposit amount set to £200. Portal credentials sent to applicant.",
        { id: toastId }
      );
      // Refresh application data
      fetchApplicationDetails();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to approve application",
        { id: toastId }
      );
    }
  };

  const handlePrint = async () => {
    if (!application) {
      console.error("❌ No application data available");
      toast.error("Application data not loaded");
      return;
    }

    console.log("🖨️ Print button clicked for application:", application.id);
    console.log("📋 Application status:", application.status);
    console.log("📅 Appointment date:", application.appointment_date);
    console.log("📄 Certificate URL:", application.certificate_url);

    try {
      // Always generate a fresh certificate when printing
      console.log("🔄 Generating certificate...");
      const toastId = toast.loading("Generating certificate...");

      try {
        // When printing, don't send email notification to applicant
        const response = await generateCertificate(id, false);
        console.log("✅ Certificate generation response:", response.data);

        if (response.data.success) {
          const certificateUrl = response.data.data.certificateUrl;
          console.log("📄 Generated certificate URL:", certificateUrl);

          // Update application state with new certificate URL
          setApplication((prev) => ({
            ...prev,
            certificate_url: certificateUrl,
          }));
          // Open the certificate PDF in a new tab immediately (before toast to avoid popup blockers)
          const fullUrl = getFileUrl(certificateUrl);
          console.log("🔗 Opening certificate URL:", fullUrl);
          console.log("📋 Certificate URL from response:", certificateUrl);

          // Verify URL is valid
          if (!fullUrl || fullUrl === '') {
            console.error("❌ Invalid URL generated:", fullUrl);
            toast.error("Failed to generate certificate URL", { id: toastId });
            return;
          }

          // Open PDF immediately - fetch as blob to ensure it's accessible
          // This method works even if direct file access has issues
          const openCertificate = async () => {
            try {
              // Try to fetch the PDF as a blob
              const response = await fetch(fullUrl, {
                method: 'GET',
                credentials: 'include', // Include cookies for auth if needed
              });
              
              if (response.ok) {
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                
                // Open blob URL in new tab
                const newWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');
                
                if (newWindow) {
                  // Clean up blob URL after a delay
                  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                  console.log("✅ Certificate opened via blob URL");
                  toast.success("Certificate generated and opened!", {
                    id: toastId,
                  });
                  return true;
                } else {
                  // Fallback: create download link
                  const link = document.createElement("a");
                  link.href = blobUrl;
                  link.target = "_blank";
                  link.download = `certificate-${id}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                  console.log("✅ Certificate downloaded via blob");
                  toast.success("Certificate generated! Check your downloads.", {
                    id: toastId,
                  });
                  return true;
                }
              } else {
                throw new Error(`HTTP ${response.status}`);
              }
            } catch (fetchError) {
              console.warn("⚠️ Blob fetch failed, trying direct URL:", fetchError);
              
              // Fallback: try direct URL methods
              // Method 1: window.open
              try {
                const newWindow = window.open(fullUrl, '_blank', 'noopener,noreferrer');
                if (newWindow) {
                  console.log("✅ Certificate opened via direct window.open");
                  toast.success("Certificate generated and opened!", {
                    id: toastId,
                  });
                  return true;
                }
              } catch (e) {
                console.warn("⚠️ window.open failed:", e);
              }
              
              // Method 2: Anchor click
              try {
                const link = document.createElement("a");
                link.href = fullUrl;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.style.display = "none";
                document.body.appendChild(link);
                link.click();
                setTimeout(() => {
                  if (document.body.contains(link)) {
                    document.body.removeChild(link);
                  }
                }, 1000);
                console.log("✅ Certificate opened via anchor click");
                toast.success("Certificate generated and opened!", {
                  id: toastId,
                });
                return true;
              } catch (e) {
                console.error("❌ All methods failed:", e);
              }
              
              // Final fallback: show clickable message
              toast.success(
                `Certificate generated! Click here to open.`,
                {
                  id: toastId,
                  duration: 10000,
                  onClick: () => {
                    window.open(fullUrl, '_blank', 'noopener,noreferrer');
                  },
                  style: {
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  },
                }
              );
              return false;
            }
          };
          
          // Wait a brief moment for file to be written, then open
          setTimeout(() => {
            openCertificate();
          }, 500);
          
          toast.success("Certificate generated successfully!", {
            id: toastId,
          });
        } else {
          console.error(
            "❌ Certificate generation failed:",
            response.data.message
          );
          toast.error(
            response.data.message || "Failed to generate certificate",
            { id: toastId }
          );
          return;
        }
      } catch (error) {
        console.error("❌ Certificate generation error:", error);
        console.error("Error response:", error.response?.data);
        console.error("Error status:", error.response?.status);
        console.error("Error message:", error.message);

        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to generate certificate";

        toast.error(errorMessage, {
          id: toastId,
          duration: 5000,
        });
        return;
      }
    } catch (error) {
      console.error("❌ Unexpected error in handlePrint:", error);
      console.error("Error stack:", error.stack);
      toast.error(`Error: ${error.message || "Failed to open certificate"}`, {
        duration: 5000,
      });
    }
  };

  const StatusBadge = ({ status }) => {
    const config = {
      submitted: { color: "bg-blue-100 text-blue-700", label: "Submitted" },
      admin_review: {
        color: "bg-amber-100 text-amber-700",
        label: "Admin Review",
      },
      payment_pending: {
        color: "bg-orange-100 text-orange-700",
        label: "Payment Pending",
      },
      payment_verified: {
        color: "bg-indigo-100 text-indigo-700",
        label: "Payment Verified",
      },
      appointment_scheduled: {
        color: "bg-purple-100 text-purple-700",
        label: "Appointment Set",
      },
      completed: {
        color: "bg-emerald-100 text-emerald-700",
        label: "Completed",
      },
      cancelled: { color: "bg-red-100 text-red-700", label: "Cancelled" },
    };

    const style = config[status] || {
      color: "bg-gray-100 text-gray-700",
      label: status,
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${style.color}`}
      >
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
        <p className="info-value">{value || "N/A"}</p>
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
  if (!application)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Application Not Found
          </h2>
          <button
            onClick={() => navigate("/admin/applications")}
            className="text-blue-600 hover:underline"
          >
            Return to Applications
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-6xl mx-auto px-6" style={{ paddingTop: "2rem" }}>
        {/* Header Hero Section */}
        <div
          className="app-detail-header"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-600) 0%, var(--brand-800) 100%)",
            padding: "2.5rem",
            borderRadius: "20px",
            marginBottom: "2rem",
            color: "white",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          }}
        >
          {/* Breadcrumb / Top Row */}
          <div
            className="header-top-row"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              paddingBottom: "1rem",
              marginBottom: "0.5rem",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <button
              onClick={() => navigate("/admin/applications")}
              className="btn-back-nav"
            >
              <ArrowLeft size={16} /> <span>Back to Applications</span>
            </button>
            <span
              className="font-mono text-white/80 text-sm bg-white/10 px-3 py-1 rounded-full"
              style={{ whiteSpace: "nowrap" }}
            >
              ID: #{application.application_number}
            </span>
          </div>

          <div
            className="header-content-wrapper"
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                  }}
                >
                  <h1
                    style={{
                      color: "white",
                      margin: 0,
                      fontSize: "clamp(1.5rem, 4vw, 2rem)",
                      fontWeight: "bold",
                    }}
                  >
                    Nikkah Application
                  </h1>
                  <div className="bg-white rounded-full px-2 py-1">
                    <StatusBadge status={application.status} />
                  </div>
                </div>
              </div>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.9)",
                  fontSize: "clamp(0.95rem, 2.5vw, 1.125rem)",
                  marginBottom: "1rem",
                }}
              >
                <span className="font-semibold">
                  {application.groom_full_name}
                </span>
                <span className="mx-2">&</span>
                <span className="font-semibold">
                  {application.bride_full_name}
                </span>
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  fontSize: "0.875rem",
                  color: "rgba(255, 255, 255, 0.8)",
                }}
              >
                <span className="flex items-center gap-1.5">
                  <Clock size={16} /> Applied on{" "}
                  {new Date(application.created_at).toLocaleDateString()}
                </span>
                {application.preferred_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={16} /> Preferred:{" "}
                    {new Date(application.preferred_date).toLocaleDateString()}
                  </span>
                )}
                {/* Solemnised Information */}
                {(application.solemnised_date ||
                  application.solemnised_place ||
                  application.solemnised_address) && (
                  <div
                    style={{
                      marginTop: "0.75rem",
                      paddingTop: "0.75rem",
                      borderTop: "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    {application.solemnised_date && (
                      <span className="flex items-center gap-1.5">
                        <Calendar size={16} /> Solemnised Date:{" "}
                        {new Date(
                          application.solemnised_date
                        ).toLocaleDateString(undefined, { dateStyle: "long" })}
                      </span>
                    )}
                    {application.solemnised_place && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={16} /> Solemnised Place:{" "}
                        {application.solemnised_place}
                      </span>
                    )}
                    {application.solemnised_address && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={16} /> Solemnised Address:{" "}
                        {application.solemnised_address}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div
              className="header-actions"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                width: "100%",
              }}
            >
              {application.status === "admin_review" && !application.approved_at && (
                <button
                  onClick={handleApprove}
                  className="btn-back-nav"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    width: "100%",
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    color: "white",
                    fontWeight: "600",
                  }}
                >
                  <CheckCircle size={16} /> Approve Application
                </button>
              )}
              <button
                onClick={handlePrint}
                className="btn-back-nav print-button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  width: "100%",
                }}
              >
                <Printer size={16} /> Print Application
              </button>
            </div>
          </div>
        </div>

        <div
          className="grid grid-cols-1 xl:grid-cols-3"
          style={{ gap: "2rem" }}
        >
          {/* Main Info Column */}
          <div
            className="xl:col-span-2"
            style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
          >
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
                  <InfoItem
                    icon={User}
                    label="Full Name"
                    value={application.groom_full_name}
                  />
                  {application.groom_father_name && (
                    <InfoItem
                      icon={User}
                      label="Father's Name"
                      value={application.groom_father_name}
                    />
                  )}
                  <InfoItem
                    icon={Calendar}
                    label="Date of Birth"
                    value={new Date(
                      application.groom_date_of_birth
                    ).toLocaleDateString(undefined, { dateStyle: "long" })}
                  />
                  {application.groom_place_of_birth && (
                    <InfoItem
                      icon={MapPin}
                      label="Place of Birth"
                      value={application.groom_place_of_birth}
                    />
                  )}
                  <InfoItem
                    icon={MapPin}
                    label="Residential Address"
                    value={application.groom_address}
                  />
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
                  <InfoItem
                    icon={User}
                    label="Full Name"
                    value={application.bride_full_name}
                  />
                  {application.bride_father_name && (
                    <InfoItem
                      icon={User}
                      label="Father's Name"
                      value={application.bride_father_name}
                    />
                  )}
                  <InfoItem
                    icon={Calendar}
                    label="Date of Birth"
                    value={new Date(
                      application.bride_date_of_birth
                    ).toLocaleDateString(undefined, { dateStyle: "long" })}
                  />
                  {application.bride_place_of_birth && (
                    <InfoItem
                      icon={MapPin}
                      label="Place of Birth"
                      value={application.bride_place_of_birth}
                    />
                  )}
                  <InfoItem
                    icon={MapPin}
                    label="Residential Address"
                    value={application.bride_address}
                  />
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
                      <h2 className="card-title-text">
                        Groom's Representative
                      </h2>
                    </div>
                    <div className="card-body">
                      <InfoItem
                        icon={User}
                        label="Full Name"
                        value={application.groom_rep_name}
                      />
                      {application.groom_rep_father_name && (
                        <InfoItem
                          icon={User}
                          label="Father's Name"
                          value={application.groom_rep_father_name}
                        />
                      )}
                      {application.groom_rep_date_of_birth && (
                        <InfoItem
                          icon={Calendar}
                          label="Date of Birth"
                          value={new Date(
                            application.groom_rep_date_of_birth
                          ).toLocaleDateString(undefined, {
                            dateStyle: "long",
                          })}
                        />
                      )}
                      {application.groom_rep_place_of_birth && (
                        <InfoItem
                          icon={MapPin}
                          label="Place of Birth"
                          value={application.groom_rep_place_of_birth}
                        />
                      )}
                      {application.groom_rep_address && (
                        <InfoItem
                          icon={MapPin}
                          label="Residential Address"
                          value={application.groom_rep_address}
                        />
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
                      <h2 className="card-title-text">
                        Bride's Representative
                      </h2>
                    </div>
                    <div className="card-body">
                      <InfoItem
                        icon={User}
                        label="Full Name"
                        value={application.bride_rep_name}
                      />
                      {application.bride_rep_father_name && (
                        <InfoItem
                          icon={User}
                          label="Father's Name"
                          value={application.bride_rep_father_name}
                        />
                      )}
                      {application.bride_rep_date_of_birth && (
                        <InfoItem
                          icon={Calendar}
                          label="Date of Birth"
                          value={new Date(
                            application.bride_rep_date_of_birth
                          ).toLocaleDateString(undefined, {
                            dateStyle: "long",
                          })}
                        />
                      )}
                      {application.bride_rep_place_of_birth && (
                        <InfoItem
                          icon={MapPin}
                          label="Place of Birth"
                          value={application.bride_rep_place_of_birth}
                        />
                      )}
                      {application.bride_rep_address && (
                        <InfoItem
                          icon={MapPin}
                          label="Residential Address"
                          value={application.bride_rep_address}
                        />
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
                    { bg: "bg-witness-amber", icon: "icon-box-amber" },
                    { bg: "bg-witness-emerald", icon: "icon-box-emerald" },
                    { bg: "bg-witness-violet", icon: "icon-box-violet" },
                    { bg: "bg-witness-orange", icon: "icon-box-orange" },
                    { bg: "bg-witness-slate", icon: "icon-box-slate" },
                    { bg: "bg-witness-lime", icon: "icon-box-lime" },
                  ];
                  const variant = variants[i % variants.length];

                  return (
                    <div
                      key={witness.id}
                      className={`details-card ${variant.bg}`}
                    >
                      <div className="card-title-row">
                        <div className={`icon-box ${variant.icon}`}>
                          <User size={22} />
                        </div>
                        <h2 className="card-title-text">Witness {i + 1}</h2>
                      </div>
                      <div className="card-body">
                        <InfoItem
                          icon={User}
                          label="Full Name"
                          value={witness.witness_name}
                        />
                        {witness.witness_father_name && (
                          <InfoItem
                            icon={User}
                            label="Father Name"
                            value={witness.witness_father_name}
                          />
                        )}
                        {witness.witness_date_of_birth && (
                          <InfoItem
                            icon={Calendar}
                            label="Date of Birth"
                            value={new Date(
                              witness.witness_date_of_birth
                            ).toLocaleDateString(undefined, {
                              dateStyle: "long",
                            })}
                          />
                        )}
                        {witness.witness_place_of_birth && (
                          <InfoItem
                            icon={MapPin}
                            label="Place of Birth"
                            value={witness.witness_place_of_birth}
                          />
                        )}
                        {witness.witness_address && (
                          <InfoItem
                            icon={MapPin}
                            label="Residential Address"
                            value={witness.witness_address}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="details-card bg-white border-dashed text-center py-12">
                <p className="text-slate-400 font-medium">
                  No witness information available for this application.
                </p>
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
                    <InfoItem
                      icon={CreditCard}
                      label="Mahr Amount"
                      value={application.mahr_amount}
                    />
                  )}
                  {application.mahr_type && (
                    <InfoItem
                      icon={FileText}
                      label="Mahr Type"
                      value={
                        application.mahr_type === "prompt"
                          ? "Prompt (Immediate)"
                          : "Deferred"
                      }
                    />
                  )}
                </div>
              </div>
            )}

            {/* Solemnisation Details Section */}
            {(application.solemnised_date ||
              application.solemnised_place ||
              application.solemnised_address) && (
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
                      value={new Date(
                        application.solemnised_date
                      ).toLocaleDateString(undefined, { dateStyle: "long" })}
                    />
                  )}
                  {application.solemnised_place && (
                    <InfoItem
                      icon={MapPin}
                      label="Place of Solemnisation"
                      value={application.solemnised_place}
                    />
                  )}
                  {application.solemnised_address && (
                    <InfoItem
                      icon={MapPin}
                      label="Solemnisation Address"
                      value={application.solemnised_address}
                    />
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
                      value={new Date(
                        application.preferred_date
                      ).toLocaleDateString(undefined, { dateStyle: "long" })}
                    />
                  )}
                  {application.special_requests && (
                    <InfoItem
                      icon={FileText}
                      label="Special Requests"
                      value={application.special_requests}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div
            className="no-print-sidebar"
            style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
          >
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
                      value={new Date(
                        application.appointment_date
                      ).toLocaleDateString(undefined, { dateStyle: "long" })}
                    />
                    <InfoItem
                      icon={Clock}
                      label="Time Slot"
                      value={application.appointment_time}
                    />
                    <InfoItem
                      icon={MapPin}
                      label="Location"
                      value={application.appointment_location}
                    />
                  </>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-slate-400 italic text-sm">
                      Appointment not yet scheduled.
                    </p>
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
                  value={
                    application.deposit_amount
                      ? `£${application.deposit_amount}`
                      : "Not Set"
                  }
                  subValue={
                    application.payment_status || "Pending Verification"
                  }
                />
              </div>
            </div>

            {/* Payment Receipt Card (Optional) */}
            {application.payment_receipt_url && (
              <div className="details-card bg-payment-card">
                <div className="card-title-row">
                  <div className="icon-box icon-box-green">
                    <CreditCard size={22} />
                  </div>
                  <h2 className="card-title-text">Payment Receipt</h2>
                </div>
                <div className="card-body p-4">
                  <DocumentCard
                    title="Payment Receipt"
                    path={application.payment_receipt_url}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Print-Only Certificate Table */}
        <div className="print-certificate-table" style={{ display: "none" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "2px solid black",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "8px",
                    textAlign: "center",
                    fontWeight: "bold",
                    width: "15%",
                  }}
                ></th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "8px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Full Name
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "8px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Father's Name
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "8px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Date & Place Of Birth
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "8px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Present Address
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "8px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Marital Status
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "8px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  By Representative or Personally
                </th>
              </tr>
            </thead>
            <tbody>
              {/* BRIDE GROOM */}
              <tr>
                <td
                  style={{
                    border: "1px solid black",
                    padding: "12px",
                    fontWeight: "bold",
                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >
                  BRIDE GROOM
                </td>
                <td style={{ border: "1px solid black", padding: "12px" }}>
                  {application.groom_full_name || "NIL"}
                </td>
                <td style={{ border: "1px solid black", padding: "12px" }}>
                  {application.groom_father_name || "NIL"}
                </td>
                <td style={{ border: "1px solid black", padding: "12px" }}>
                  {application.groom_date_of_birth
                    ? new Date(
                        application.groom_date_of_birth
                      ).toLocaleDateString("en-GB")
                    : "NIL"}
                  <br />
                  {application.groom_place_of_birth || "NIL"}
                </td>
                <td style={{ border: "1px solid black", padding: "12px" }}>
                  {application.groom_address || "NIL"}
                </td>
                <td style={{ border: "1px solid black", padding: "12px" }}>
                  {application.groom_marital_status || "NIL"}
                </td>
                <td style={{ border: "1px solid black", padding: "12px" }}>
                  {application.groom_personally
                    ? "Personally"
                    : application.groom_representative
                    ? "By Representative"
                    : "NIL"}
                </td>
              </tr>

              {/* BRIDE */}
              <tr>
                <td
                  style={{
                    border: "1px solid black",
                    padding: "12px",
                    fontWeight: "bold",
                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >
                  BRIDE
                </td>
                <td style={{ border: "1px solid black", padding: "12px" }}>
                  {application.bride_full_name || "NIL"}
                </td>
                <td style={{ border: "1px solid black", padding: "12px" }}>
                  {application.bride_father_name || "NIL"}
                </td>
                <td style={{ border: "1px solid black", padding: "12px" }}>
                  {application.bride_date_of_birth
                    ? new Date(
                        application.bride_date_of_birth
                      ).toLocaleDateString("en-GB")
                    : "NIL"}
                  <br />
                  {application.bride_place_of_birth || "NIL"}
                </td>
                <td style={{ border: "1px solid black", padding: "12px" }}>
                  {application.bride_address || "NIL"}
                </td>
                <td style={{ border: "1px solid black", padding: "12px" }}>
                  {application.bride_marital_status || "NIL"}
                </td>
                <td style={{ border: "1px solid black", padding: "12px" }}>
                  {application.bride_personally
                    ? "Personally"
                    : application.bride_representative
                    ? "By Representative"
                    : "NIL"}
                </td>
              </tr>

              {/* REPRESENTATIVE OR GUARDIAN OF BRIDE GROOM */}
              {application.groom_rep_name && (
                <tr>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "12px",
                      fontWeight: "bold",
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}
                  >
                    REPRESENTATIVE OR GUARDIAN OF BRIDE GROOM
                  </td>
                  <td style={{ border: "1px solid black", padding: "12px" }}>
                    {application.groom_rep_name || "NIL"}
                  </td>
                  <td style={{ border: "1px solid black", padding: "12px" }}>
                    {application.groom_rep_father_name || "NIL"}
                  </td>
                  <td style={{ border: "1px solid black", padding: "12px" }}>
                    {application.groom_rep_date_of_birth
                      ? new Date(
                          application.groom_rep_date_of_birth
                        ).toLocaleDateString("en-GB")
                      : "NIL"}
                    <br />
                    {application.groom_rep_place_of_birth || "NIL"}
                  </td>
                  <td style={{ border: "1px solid black", padding: "12px" }}>
                    {application.groom_rep_address || "NIL"}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "12px",
                      textAlign: "center",
                      fontSize: "20pt",
                    }}
                  >
                    /
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "12px",
                      textAlign: "center",
                      fontSize: "20pt",
                    }}
                  >
                    /
                  </td>
                </tr>
              )}

              {/* REPRESENTATIVE OR GUARDIAN OF BRIDE */}
              {application.bride_rep_name && (
                <tr>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "12px",
                      fontWeight: "bold",
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}
                  >
                    REPRESENTATIVE OR GUARDIAN OF BRIDE
                  </td>
                  <td style={{ border: "1px solid black", padding: "12px" }}>
                    {application.bride_rep_name || "NIL"}
                  </td>
                  <td style={{ border: "1px solid black", padding: "12px" }}>
                    {application.bride_rep_father_name || "NIL"}
                  </td>
                  <td style={{ border: "1px solid black", padding: "12px" }}>
                    {application.bride_rep_date_of_birth
                      ? new Date(
                          application.bride_rep_date_of_birth
                        ).toLocaleDateString("en-GB")
                      : "NIL"}
                    <br />
                    {application.bride_rep_place_of_birth || "NIL"}
                  </td>
                  <td style={{ border: "1px solid black", padding: "12px" }}>
                    {application.bride_rep_address || "NIL"}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "12px",
                      textAlign: "center",
                      fontSize: "20pt",
                    }}
                  >
                    /
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "12px",
                      textAlign: "center",
                      fontSize: "20pt",
                    }}
                  >
                    /
                  </td>
                </tr>
              )}

              {/* WITNESSES */}
              {witnesses.map((witness, i) => (
                <tr key={`witness-${i}`}>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "12px",
                      fontWeight: "bold",
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}
                  >
                    WITNESS No {i + 1}
                  </td>
                  <td style={{ border: "1px solid black", padding: "12px" }}>
                    {witness.witness_name || "NIL"}
                  </td>
                  <td style={{ border: "1px solid black", padding: "12px" }}>
                    {witness.witness_father_name || "NIL"}
                  </td>
                  <td style={{ border: "1px solid black", padding: "12px" }}>
                    {witness.witness_date_of_birth
                      ? new Date(
                          witness.witness_date_of_birth
                        ).toLocaleDateString("en-GB")
                      : "NIL"}
                    <br />
                    {witness.witness_place_of_birth || "NIL"}
                  </td>
                  <td style={{ border: "1px solid black", padding: "12px" }}>
                    {witness.witness_address || "NIL"}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "12px",
                      textAlign: "center",
                      fontSize: "20pt",
                    }}
                  >
                    /
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "12px",
                      textAlign: "center",
                      fontSize: "20pt",
                    }}
                  >
                    /
                  </td>
                </tr>
              ))}

              {/* MAHR */}
              <tr>
                <td
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    fontWeight: "bold",
                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >
                  Mahr
                </td>
                <td
                  style={{ border: "1px solid black", padding: "12px" }}
                  colSpan="6"
                >
                  {application.mahr_amount || "NIL"}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    fontWeight: "bold",
                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >
                  Deferred / Prompt
                </td>
                <td
                  style={{ border: "1px solid black", padding: "12px" }}
                  colSpan="6"
                >
                  {application.mahr_type === "deferred"
                    ? "Deferred"
                    : application.mahr_type === "prompt"
                    ? "Prompt"
                    : "NIL"}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Bottom Section - Three Columns */}
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
              alignItems: "flex-start",
            }}
          >
            {/* Disclaimer - Left */}
            <div
              style={{
                flex: "1",
                fontSize: "8pt",
                lineHeight: "1.4",
                wordWrap: "break-word",
                overflowWrap: "break-word",
                minWidth: 0,
              }}
            >
              <p style={{ margin: 0 }}>
                This marriage certificate is issued in accordance with Islamic
                laws and may not be accepted by authorities in the U.K. and
                other non-Muslim countries. To be married in accordance with
                British Marriage Laws, both parties are advised to go through a
                Civil Marriage at the Registration Office in the United Kingdom.
              </p>
            </div>

            {/* Signature and Seal - Center */}
            <div
              style={{
                flex: "1",
                textAlign: "center",
                fontSize: "8pt",
                minWidth: 0,
              }}
            >
              <p
                style={{
                  fontWeight: "bold",
                  margin: "0 0 0.5rem 0",
                  fontSize: "9pt",
                }}
              >
                SIGNATURE AND SEAL OF PRESIDING AUTHORITY SOLEMNIZING MARRIAGE
              </p>
              <div
                style={{
                  border: "1px solid #000",
                  padding: "0.5rem",
                  margin: "0.5rem 0",
                  minHeight: "100px",
                  background: "white",
                }}
              >
                {/* Blank space for manual signature and seal */}
              </div>
            </div>

            {/* Solemnization Details - Right */}
            <div
              style={{
                flex: "1",
                wordWrap: "break-word",
                overflowWrap: "break-word",
                minWidth: 0,
              }}
            >
              <p
                style={{
                  fontWeight: "bold",
                  marginBottom: "0.5rem",
                  wordBreak: "break-word",
                }}
              >
                Marriage Solemnized
              </p>
              <p style={{ margin: "0.2rem 0", wordBreak: "break-word" }}>
                Date:{" "}
                {application.solemnised_date
                  ? new Date(application.solemnised_date).toLocaleDateString(
                      "en-GB"
                    )
                  : "NIL"}
              </p>
              <p style={{ margin: "0.2rem 0", wordBreak: "break-word" }}>
                Place: {application.solemnised_place || "NIL"}
              </p>
              <p
                style={{
                  fontWeight: "bold",
                  marginTop: "1rem",
                  marginBottom: "0.5rem",
                  wordBreak: "break-word",
                }}
              >
                Marriage Solemnized by
              </p>
              <p style={{ margin: "0.2rem 0", wordBreak: "break-word" }}>
                Name: {application.solemnised_by || "NIL"}
              </p>
              <p style={{ margin: "0.2rem 0", wordBreak: "break-word" }}>
                Address: {application.solemnised_address || "NIL"}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: "2rem",
              paddingTop: "1rem",
              borderTop: "1px solid #ccc",
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "10pt",
            }}
          >
            <p>
              Issued by: Jamiyat Tabligh-ul-Islam, Central Mosque, Darfield
              Street, Westgate, Bradford, BD1 3RU
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
