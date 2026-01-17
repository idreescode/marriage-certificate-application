import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import {
  getAllApplications,
  approveApplication as approveApplicationAPI,
  verifyDocuments as verifyDocumentsAPI,
  verifyPayment as verifyPaymentAPI,
  generateCertificate as generateCertAPI,
  deleteApplication as deleteApplicationAPI,
  updateApplicationNumber,
} from "../services/api";
import toast from "react-hot-toast";
import {
  Search,
  Filter,
  Clock,
  Eye,
  FileText,
  User,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  Plus,
  Check,
  X,
  Pencil,
} from "lucide-react";

import { useSearchParams } from "react-router-dom";

export default function AdminApplications() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [filterStatus, setFilterStatus] = useState(
    searchParams.get("status") || "all"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);
  const itemsPerPage = 10;

  // Modal States
  const [activeModal, setActiveModal] = useState(null); // 'documents', 'verify', 'view', 'delete', 'approve'
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [deleteAppData, setDeleteAppData] = useState(null); // { id, applicationNumber }
  const [approveAppData, setApproveAppData] = useState(null); // { id, applicationNumber, groomName, brideName }

  // Edit Application Number State
  const [editingAppId, setEditingAppId] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  // Loading states for actions
  const [verifyingDocuments, setVerifyingDocuments] = useState(false);

  useEffect(() => {
    // Check authentication before making API call
    const token = localStorage.getItem("token");
    if (!token) {
      const returnUrl = "/admin/applications";
      navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }
    setCurrentPage(1); // Reset to first page when component mounts
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filter changes
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const fetchApplications = async () => {
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (filterStatus !== "all") {
        params.status = filterStatus;
      }

      const response = await getAllApplications(params);
      const data = response.data.data;
      
      // Handle both paginated and non-paginated responses
      if (data.applications) {
        setApplications(data.applications);
      } else if (Array.isArray(data)) {
        setApplications(data);
      }
      
      // Set pagination info if available
      if (data.total !== undefined) {
        setTotalApplications(data.total);
        setTotalPages(Math.ceil(data.total / itemsPerPage));
      } else if (data.totalPages !== undefined) {
        setTotalPages(data.totalPages);
        setTotalApplications(data.total || applications.length);
      } else {
        // Fallback: calculate from applications array
        setTotalApplications(applications.length);
        setTotalPages(1);
      }
    } catch (error) {
      // Only show error if it's not a 401 (unauthorized) - auth errors are handled by redirect
      if (error.response?.status !== 401) {
        toast.error("Failed to load applications");
      }
      // For 401, just redirect without showing error (handled by AdminLayout or redirect above)
    } finally {
      setLoading(false);
    }
  };

  // Open Handlers
  const openVerifyDocuments = (id) => {
    setSelectedAppId(id);
    setActiveModal("documents");
  };

  const openVerifyPayment = (id) => {
    setSelectedAppId(id);
    setActiveModal("verify");
  };

  const openApproveModal = (app) => {
    setApproveAppData({
      id: app.id,
      applicationNumber: app.application_number,
      groomName: app.groom_full_name,
      brideName: app.bride_full_name,
      groomAddress: app.groom_address,
      brideAddress: app.bride_address,
      solemnisedDate: app.solemnised_date,
      solemnisedPlace: app.solemnised_place,
      solemnisedAddress: app.solemnised_address,
    });
    setActiveModal("approve");
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedAppId(null);
    setDeleteAppData(null);
    setApproveAppData(null);
  };

  // Action Handlers
  const handleApproveApplication = async () => {
    if (!approveAppData) return;

    const toastId = toast.loading("Approving application...");
    try {
      await approveApplicationAPI(approveAppData.id);
      toast.success(
        "Application approved successfully! Deposit amount set to £200. User will receive portal credentials. Payment email will be sent after document verification.",
        { id: toastId }
      );
      closeModal();
      fetchApplications();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to approve application",
        { id: toastId }
      );
    }
  };

  const handleVerifyDocuments = async () => {
    if (verifyingDocuments) return; // Prevent multiple clicks

    setVerifyingDocuments(true);
    const toastId = toast.loading("Verifying documents...");
    try {
      await verifyDocumentsAPI(selectedAppId);
      toast.success(
        "Documents verified successfully! Deposit amount email sent to applicant.",
        { id: toastId }
      );
      closeModal();
      fetchApplications();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to verify documents",
        { id: toastId }
      );
    } finally {
      setVerifyingDocuments(false);
    }
  };

  const handleVerifyPayment = async () => {
    const toastId = toast.loading("Verifying payment...");
    try {
      await verifyPaymentAPI(selectedAppId);
      toast.success("Payment verified successfully!", { id: toastId });
      closeModal();
      fetchApplications();
    } catch (error) {
      toast.error("Failed to verify payment", { id: toastId });
    }
  };

  const openDeleteModal = (appId, applicationNumber) => {
    setDeleteAppData({ id: appId, applicationNumber });
    setActiveModal("delete");
  };

  const handleDeleteApplication = async () => {
    if (!deleteAppData) return;

    const toastId = toast.loading("Deleting application...");
    try {
      await deleteApplicationAPI(deleteAppData.id);
      toast.success("Application deleted successfully", { id: toastId });
      closeModal();
      fetchApplications();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete application",
        { id: toastId }
      );
    }
  };

  const handleGenerateCertificate = async (appId) => {
    const toastId = toast.loading("Generating certificate...");
    try {
      await generateCertAPI(appId);
      toast.success("Certificate generated successfully!", { id: toastId });
      fetchApplications();
    } catch (error) {
      console.error("Certificate generation error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to generate certificate";
      toast.error(errorMessage, { id: toastId, duration: 5000 });
    }
  };

  // Edit Application Number Handlers
  const startEditing = (appId, currentNumber) => {
    setEditingAppId(appId);
    setEditingValue(currentNumber);
  };

  const cancelEditing = () => {
    setEditingAppId(null);
    setEditingValue("");
  };

  const handleSaveApplicationNumber = async (appId) => {
    if (!editingValue.trim()) {
      toast.error("Application number cannot be empty");
      return;
    }

    const toastId = toast.loading("Updating application number...");
    try {
      await updateApplicationNumber(appId, editingValue.trim());
      toast.success("Application number updated successfully!", {
        id: toastId,
      });
      setEditingAppId(null);
      setEditingValue("");
      fetchApplications();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update application number",
        { id: toastId }
      );
    }
  };

  const StatusBadge = ({ status, app }) => {
    const styles = {
      submitted: "badge-info",
      admin_review: "badge-warning",
      payment_pending: "badge-warning",
      payment_verified: "badge-info",
      appointment_scheduled: "badge-info",
      completed: "badge-success",
    };

    // Custom display text for statuses
    const statusText = {
      submitted: "SUBMITTED",
      payment_pending: "PAYMENT PENDING",
      payment_verified: "PAYMENT VERIFIED",
      appointment_scheduled: "APPOINTMENT SCHEDULED",
      completed: "COMPLETED",
    };

    // For admin_review status:
    // - If approved_at exists, it means approved → "DOCUMENT PENDING"
    // - Otherwise, it's not approved yet → "UNDER REVIEW"
    if (status === "admin_review") {
      if (app && app.approved_at) {
        statusText.admin_review = "DOCUMENT PENDING";
      } else {
        statusText.admin_review = "UNDER REVIEW";
      }
    }

    return (
      <span className={`badge ${styles[status] || "badge-info"}`}>
        {statusText[status] || status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  // Filtering (server-side filtering is preferred, but keep client-side as fallback)
  const filteredApps = applications;

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (loading) return <Loader fullscreen />;

  return (
    <div>
      <div
        className="admin-applications-header"
        style={{
          background: "var(--brand-600)",
          padding: "1.5rem 2rem",
          borderRadius: "var(--radius-lg)",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ flex: "1 1 auto", minWidth: "200px" }}>
          <h1 style={{ fontSize: "2rem", margin: 0, color: "white" }}>
            Applications
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.85)",
              margin: 0,
              marginTop: "0.25rem",
            }}
          >
            Manage and track all nikkah applications.
          </p>
        </div>
        <Link
          to="/admin/applications/manual"
          className="btn-add-new-application"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.5rem",
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "var(--radius-md)",
            color: "white",
            textDecoration: "none",
            fontWeight: 500,
            fontSize: "0.875rem",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.25)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.15)";
          }}
        >
          <Plus size={18} />
          Add New Application
        </Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Toolbar */}
        <div
          className="card-header"
          style={{
            padding: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "white",
            borderBottom: "1px solid var(--slate-200)",
            marginBottom: 0,
          }}
        >
          <div className="d-flex gap-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={`btn btn-sm`}
              style={{
                background:
                  filterStatus === "all" ? "var(--brand-600)" : "transparent",
                color: filterStatus === "all" ? "white" : "var(--slate-600)",
                border:
                  filterStatus === "all"
                    ? "none"
                    : "1px solid var(--slate-300)",
              }}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus("admin_review")}
              className={`btn btn-sm`}
              style={{
                background:
                  filterStatus === "admin_review"
                    ? "var(--brand-600)"
                    : "transparent",
                color:
                  filterStatus === "admin_review"
                    ? "white"
                    : "var(--slate-600)",
                border:
                  filterStatus === "admin_review"
                    ? "none"
                    : "1px solid var(--slate-300)",
              }}
            >
              New Request
            </button>
            <button
              onClick={() => setFilterStatus("payment_pending")}
              className={`btn btn-sm`}
              style={{
                background:
                  filterStatus === "payment_pending"
                    ? "var(--brand-600)"
                    : "transparent",
                color:
                  filterStatus === "payment_pending"
                    ? "white"
                    : "var(--slate-600)",
                border:
                  filterStatus === "payment_pending"
                    ? "none"
                    : "1px solid var(--slate-300)",
              }}
            >
              Pending Payment
            </button>
          </div>

          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "10px",
                top: "10px",
                color: "#94a3b8",
              }}
            />
            <input
              placeholder="Search applicants..."
              className="form-input"
              style={{ width: "250px", paddingLeft: "35px" }}
            />
          </div>
        </div>

        {/* Table */}
        <div
          className="table-container"
          style={{ border: "none", borderRadius: 0 }}
        >
          <table>
            <thead>
              <tr>
                <th>Ref #</th>
                <th>Groom</th>
                <th>Bride</th>
                <th>Status</th>
                <th>Solemnised Date</th>
                <th>Solemnised Place</th>
                <th>Solemnised Address</th>
                <th style={{ width: "220px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app) => (
                <tr key={app.id}>
                  <td
                    style={{
                      fontFamily: "monospace",
                      color: "var(--slate-500)",
                    }}
                  >
                    {editingAppId === app.id ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveApplicationNumber(app.id);
                            } else if (e.key === "Escape") {
                              cancelEditing();
                            }
                          }}
                          style={{
                            fontFamily: "monospace",
                            padding: "0.25rem 0.5rem",
                            border: "1px solid var(--brand-500)",
                            borderRadius: "4px",
                            fontSize: "0.875rem",
                            width: "200px",
                          }}
                          autoFocus
                        />
                        <Check
                          size={16}
                          onClick={() => handleSaveApplicationNumber(app.id)}
                          style={{
                            color: "var(--success)",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.2)";
                            e.currentTarget.style.opacity = "0.8";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.opacity = "1";
                          }}
                          title="Save"
                        />
                        <X
                          size={16}
                          onClick={cancelEditing}
                          style={{
                            color: "#ef4444",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.2)";
                            e.currentTarget.style.opacity = "0.8";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.opacity = "1";
                          }}
                          title="Cancel"
                        />
                      </div>
                    ) : (
                      <span
                        onClick={() =>
                          startEditing(app.id, app.application_number)
                        }
                        style={{
                          display: "inline-block",
                          cursor: "pointer",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "rgba(59, 130, 246, 0.1)";
                          e.currentTarget.style.color = "var(--brand-600)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "var(--slate-500)";
                        }}
                        title="Click to edit application number"
                      >
                        #{app.application_number}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{app.groom_full_name}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{app.bride_full_name}</div>
                  </td>
                  <td>
                    <StatusBadge status={app.status} app={app} />
                  </td>
                  <td style={{ color: "var(--slate-500)" }}>
                    {app.solemnised_date
                      ? new Date(app.solemnised_date).toLocaleDateString()
                      : "-"}
                  </td>
                  <td style={{ color: "var(--slate-500)" }}>
                    {app.solemnised_place || "-"}
                  </td>
                  <td style={{ color: "var(--slate-500)" }}>
                    {app.solemnised_address || "-"}
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Link
                        to={`/admin/applications/${app.id}`}
                        className="btn btn-sm btn-secondary"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </Link>

                      <Link
                        to={`/admin/applications/${app.id}/edit`}
                        className="btn btn-sm btn-secondary"
                        title="Edit Application"
                        style={{
                          color: "var(--brand-600)",
                          borderColor: "var(--brand-600)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--brand-50)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <Pencil size={16} />
                      </Link>

                      <button
                        onClick={() =>
                          openDeleteModal(app.id, app.application_number)
                        }
                        className="btn btn-sm btn-secondary"
                        title="Delete Application"
                        style={{
                          color: "#ef4444",
                          borderColor: "#ef4444",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#fee2e2";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <Trash2 size={16} />
                      </button>

                      {app.status === "admin_review" && (
                        <>
                          {/* Show Approve button only if application is not yet approved (approved_at is null) */}
                          {!app.approved_at && (
                            <button
                              onClick={() => openApproveModal(app)}
                              className="btn btn-sm btn-success"
                              style={{
                                whiteSpace: "nowrap",
                                backgroundColor: "var(--success)",
                                color: "white",
                                border: "none",
                              }}
                            >
                              <Check size={14} />
                              Approve
                            </button>
                          )}

                          {/* Show Verify Documents button if documents are uploaded but not verified (after approval) */}
                          {app.approved_at &&
                            (app.groom_id_path || app.bride_id_path) &&
                            !app.documents_verified && (
                              <button
                                onClick={() => openVerifyDocuments(app.id)}
                                className="btn btn-sm btn-primary"
                                style={{ whiteSpace: "nowrap" }}
                              >
                                Verify Documents
                              </button>
                            )}
                        </>
                      )}

                      {app.status === "payment_pending" &&
                        app.payment_receipt_url && (
                          <button
                            onClick={() => openVerifyPayment(app.id)}
                            className="btn btn-sm btn-primary"
                            style={{ whiteSpace: "nowrap" }}
                          >
                            Verify Payment
                          </button>
                        )}
                      {/* Show Generate Certificate button after payment is verified */}
                      {app.status === "payment_verified" && (
                        <button
                          onClick={() => handleGenerateCertificate(app.id)}
                          className="btn btn-sm btn-success text-white"
                          style={{
                            backgroundColor: "var(--success)",
                            border: "none",
                            color: "white",
                            whiteSpace: "nowrap",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: "130px",
                            padding: "0.5rem 1rem",
                          }}
                        >
                          Generate Certificate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredApps.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center"
                    style={{ padding: "3rem", color: "var(--slate-500)" }}
                  >
                    No applications found in this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            padding: "1rem",
            borderTop: "1px solid var(--slate-200)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.9rem",
            color: "var(--slate-500)",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <span>
            Showing {filteredApps.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, totalApplications)} of {totalApplications} results
          </span>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-secondary"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              style={{
                opacity: currentPage === 1 ? 0.5 : 1,
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              style={{
                opacity: currentPage >= totalPages ? 0.5 : 1,
                cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modals - Reused from previous implementation */}
      <Modal
        isOpen={activeModal === "documents"}
        onClose={closeModal}
        title="Verify Documents"
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <p
            style={{
              color: "var(--slate-700)",
              fontSize: "0.95rem",
              lineHeight: "1.6",
              margin: 0,
            }}
          >
            Have you reviewed and verified all the uploaded documents?
          </p>
          <p
            style={{
              color: "var(--slate-500)",
              fontSize: "0.875rem",
              marginTop: "0.5rem",
              margin: 0,
            }}
          >
            This will mark the documents as verified, change the application status to payment pending, and send the deposit amount email to the applicant.
            Note: The deposit amount should already be set when the application was approved.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            marginTop: "1.75rem",
          }}
        >
          <button
            onClick={closeModal}
            className="btn btn-secondary"
            style={{ minWidth: "100px" }}
          >
            Cancel
          </button>
          <button
            onClick={handleVerifyDocuments}
            className="btn btn-primary"
            style={{ minWidth: "140px" }}
            disabled={verifyingDocuments}
          >
            {verifyingDocuments ? "Verifying..." : "Verify Documents"}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === "verify"}
        onClose={closeModal}
        title="Verify Payment"
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <p
            style={{
              color: "var(--slate-700)",
              fontSize: "0.95rem",
              lineHeight: "1.6",
              margin: 0,
            }}
          >
            Are you sure you want to verify the payment receipt?
          </p>
          <p
            style={{
              color: "var(--slate-500)",
              fontSize: "0.875rem",
              marginTop: "0.5rem",
              margin: 0,
            }}
          >
            This action will mark the payment as verified.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            marginTop: "1.75rem",
          }}
        >
          <button
            onClick={closeModal}
            className="btn btn-secondary"
            style={{ minWidth: "100px" }}
          >
            Cancel
          </button>
          <button
            onClick={handleVerifyPayment}
            className="btn btn-primary"
            style={{ minWidth: "100px" }}
          >
            Verify Payment
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={activeModal === "delete"}
        onClose={closeModal}
        title="Delete Application"
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "1rem",
              padding: "1rem",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              marginBottom: "1.25rem",
            }}
          >
            <AlertTriangle
              size={24}
              color="#dc2626"
              style={{ flexShrink: 0, marginTop: "2px" }}
            />
            <div style={{ flex: 1 }}>
              <p
                style={{
                  color: "#991b1b",
                  fontSize: "1rem",
                  fontWeight: 600,
                  margin: 0,
                  marginBottom: "0.5rem",
                }}
              >
                Are you sure you want to delete application #
                {deleteAppData?.applicationNumber}?
              </p>
              <p
                style={{
                  color: "#7f1d1d",
                  fontSize: "0.875rem",
                  lineHeight: "1.6",
                  margin: 0,
                }}
              >
                This will deactivate the application and prevent the applicant
                from logging in.
              </p>
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            marginTop: "1.75rem",
          }}
        >
          <button
            onClick={closeModal}
            className="btn btn-secondary"
            style={{ minWidth: "100px" }}
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteApplication}
            className="btn"
            style={{
              minWidth: "120px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#dc2626";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ef4444";
            }}
          >
            <Trash2
              size={16}
              style={{
                marginRight: "0.5rem",
                display: "inline-block",
                verticalAlign: "middle",
              }}
            />
            Delete
          </button>
        </div>
      </Modal>

      {/* Approve Confirmation Modal */}
      <Modal
        isOpen={activeModal === "approve"}
        onClose={closeModal}
        title="Approve Application"
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "1rem",
              padding: "1rem",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              marginBottom: "1.25rem",
            }}
          >
            <Check
              size={24}
              color="#16a34a"
              style={{ flexShrink: 0, marginTop: "2px" }}
            />
            <div style={{ flex: 1 }}>
              <p
                style={{
                  color: "#166534",
                  fontSize: "1rem",
                  fontWeight: 600,
                  margin: 0,
                  marginBottom: "0.5rem",
                }}
              >
                Are you sure you want to approve application #
                {approveAppData?.applicationNumber}?
              </p>
              <p
                style={{
                  color: "#15803d",
                  fontSize: "0.875rem",
                  lineHeight: "1.6",
                  margin: 0,
                  marginBottom: "0.5rem",
                }}
              >
                <strong>Groom:</strong> {approveAppData?.groomName}
                <br />
                <strong>Bride:</strong> {approveAppData?.brideName}
              </p>
              {approveAppData?.solemnisedDate && (
                <p
                  style={{
                    color: "#15803d",
                    fontSize: "0.875rem",
                    lineHeight: "1.6",
                    margin: 0,
                    marginBottom: "0.5rem",
                  }}
                >
                  <strong>Solemnised Date:</strong>{" "}
                  {new Date(approveAppData.solemnisedDate).toLocaleDateString()}
                </p>
              )}
              {approveAppData?.solemnisedPlace && (
                <p
                  style={{
                    color: "#15803d",
                    fontSize: "0.875rem",
                    lineHeight: "1.6",
                    margin: 0,
                    marginBottom: "0.5rem",
                  }}
                >
                  <strong>Solemnised Place:</strong>{" "}
                  {approveAppData.solemnisedPlace}
                </p>
              )}
              {approveAppData?.solemnisedAddress && (
                <p
                  style={{
                    color: "#15803d",
                    fontSize: "0.875rem",
                    lineHeight: "1.6",
                    margin: 0,
                    marginBottom: "0.5rem",
                  }}
                >
                  <strong>Solemnised Address:</strong>{" "}
                  {approveAppData.solemnisedAddress}
                </p>
              )}
              <p
                style={{
                  color: "#15803d",
                  fontSize: "0.875rem",
                  lineHeight: "1.6",
                  margin: 0,
                }}
              >
                This will approve the application, set the deposit amount to £200, and send portal access
                credentials to the applicant via email. Payment details email will be sent after document verification.
              </p>
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            marginTop: "1.75rem",
          }}
        >
          <button
            onClick={closeModal}
            className="btn btn-secondary"
            style={{ minWidth: "100px" }}
          >
            Cancel
          </button>
          <button
            onClick={handleApproveApplication}
            className="btn btn-success"
            style={{
              minWidth: "120px",
              backgroundColor: "var(--success)",
              color: "white",
              border: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#16a34a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--success)";
            }}
          >
            <Check
              size={16}
              style={{
                marginRight: "0.5rem",
                display: "inline-block",
                verticalAlign: "middle",
              }}
            />
            Approve
          </button>
        </div>
      </Modal>
    </div>
  );
}
