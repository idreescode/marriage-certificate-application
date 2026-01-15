import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import {
  getAllApplications,
  verifyDocuments as verifyDocumentsAPI,
  verifyPayment as verifyPaymentAPI,
  scheduleAppointment as scheduleAPI,
  generateCertificate as generateCertAPI,
  deleteApplication as deleteApplicationAPI,
} from "../services/api";
import toast from "react-hot-toast";
import {
  Search,
  Filter,
  Clock,
  Calendar,
  Eye,
  FileText,
  User,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
} from "lucide-react";

import { useSearchParams } from "react-router-dom";

export default function AdminApplications() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [filterStatus, setFilterStatus] = useState(
    searchParams.get("status") || "all"
  );

  // Modal States
  const [activeModal, setActiveModal] = useState(null); // 'documents', 'verify', 'schedule', 'view', 'delete'
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [deleteAppData, setDeleteAppData] = useState(null); // { id, applicationNumber }

  // Form States
  const [appointmentData, setAppointmentData] = useState({
    date: "",
    time: "",
    location: "",
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await getAllApplications();
      setApplications(response.data.data.applications);
    } catch (error) {
      toast.error("Failed to load applications");
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

  const openSchedule = (id) => {
    setSelectedAppId(id);
    setAppointmentData({ date: "", time: "", location: "" });
    setActiveModal("schedule");
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedAppId(null);
    setDeleteAppData(null);
  };

  // Action Handlers
  const handleVerifyDocuments = async () => {
    const toastId = toast.loading("Verifying documents...");
    try {
      await verifyDocumentsAPI(selectedAppId);
      toast.success("Documents verified successfully! Deposit amount set to £200.", { id: toastId });
      closeModal();
      fetchApplications();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to verify documents",
        { id: toastId }
      );
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
    setActiveModal('delete');
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

  const handleScheduleAppointment = async (e) => {
    e.preventDefault();
    const { date, time, location } = appointmentData;
    if (!date || !time || !location) return;

    const toastId = toast.loading("Scheduling appointment...");
    try {
      await scheduleAPI(selectedAppId, {
        appointmentDate: date,
        appointmentTime: time,
        appointmentLocation: location,
      });
      toast.success("Appointment scheduled successfully!", { id: toastId });
      closeModal();
      fetchApplications();
    } catch (error) {
      toast.error("Failed to schedule appointment", { id: toastId });
    }
  };

  const handleGenerateCertificate = async (appId) => {
    const toastId = toast.loading("Generating certificate...");
    try {
      await generateCertAPI(appId);
      toast.success("Certificate generated successfully!", { id: toastId });
      fetchApplications();
    } catch (error) {
      toast.error("Failed to generate certificate", { id: toastId });
    }
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      submitted: "badge-info",
      admin_review: "badge-warning",
      payment_pending: "badge-warning",
      payment_verified: "badge-info",
      appointment_scheduled: "badge-info",
      completed: "badge-success",
    };
    return (
      <span className={`badge ${styles[status] || "badge-info"}`}>
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  // Filtering
  const filteredApps =
    filterStatus === "all"
      ? applications
      : applications.filter((app) => app.status === filterStatus);

  if (loading) return <Loader fullscreen />;

  return (
    <div>
      <div
        style={{
          background: "var(--brand-600)",
          padding: "1.5rem 2rem",
          borderRadius: "var(--radius-lg)",
          marginBottom: "1.5rem",
        }}
      >
        <div>
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
                <th>Date</th>
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
                    #{app.application_number}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{app.groom_full_name}</div>
                    <div
                      style={{ fontSize: "0.8rem", color: "var(--slate-500)" }}
                    >
                      {app.groom_phone}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{app.bride_full_name}</div>
                    <div
                      style={{ fontSize: "0.8rem", color: "var(--slate-500)" }}
                    >
                      {app.bride_phone}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={app.status} />
                  </td>
                  <td style={{ color: "var(--slate-500)" }}>
                    {new Date(app.created_at).toLocaleDateString()}
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

                      <button
                        onClick={() => openDeleteModal(app.id, app.application_number)}
                        className="btn btn-sm btn-secondary"
                        title="Delete Application"
                        style={{
                          color: '#ef4444',
                          borderColor: '#ef4444'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Trash2 size={16} />
                      </button>

                      {app.status === "admin_review" && (
                        <>
                          {/* Show Verify Documents button if documents are uploaded but not verified */}
                          {(app.groom_id_path || app.bride_id_path) &&
                          !app.documents_verified ? (
                            <button
                              onClick={() => openVerifyDocuments(app.id)}
                              className="btn btn-sm btn-primary"
                              style={{ whiteSpace: "nowrap" }}
                            >
                              Verify Documents
                            </button>
                          ) : null}

                          {/* Show badge if no documents uploaded yet */}
                          {!app.groom_id_path && !app.bride_id_path ? (
                            <span
                              className="badge"
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--slate-600)",
                                backgroundColor: "var(--slate-100)",
                                padding: "0.35rem 0.75rem",
                                fontWeight: 500,
                                whiteSpace: "nowrap",
                              }}
                            >
                              Awaiting Documents
                            </span>
                          ) : null}
                        </>
                      )}

                      {app.status === "payment_pending" &&
                        app.payment_receipt_url && (
                          <button
                            onClick={() => openVerifyPayment(app.id)}
                            className="btn btn-sm btn-primary"
                            style={{ whiteSpace: "nowrap" }}
                          >
                            Verify
                          </button>
                        )}
                      {app.status === "payment_verified" && (
                        <button
                          onClick={() => openSchedule(app.id)}
                          className="btn btn-sm"
                          style={{ 
                            whiteSpace: "nowrap",
                            backgroundColor: "var(--brand-500)",
                            color: "white",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.4rem",
                            minWidth: "130px",
                            padding: "0.5rem 1rem"
                          }}
                        >
                          <Calendar size={14} />
                          Schedule
                        </button>
                      )}
                      {app.status === "appointment_scheduled" && (
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
                            padding: "0.5rem 1rem"
                          }}
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredApps.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
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
          }}
        >
          <span>Showing {filteredApps.length} results</span>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-secondary" disabled>
              <ChevronLeft size={16} />
            </button>
            <button className="btn btn-sm btn-secondary" disabled>
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
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ 
            color: 'var(--slate-700)', 
            fontSize: '0.95rem', 
            lineHeight: '1.6',
            margin: 0 
          }}>
            Have you reviewed and verified all the uploaded documents?
          </p>
          <p style={{ 
            color: 'var(--slate-500)', 
            fontSize: '0.875rem', 
            marginTop: '0.5rem',
            margin: 0 
          }}>
            This will automatically set the deposit amount to £200 and notify the applicant to proceed with payment.
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem' }}>
          <button 
            onClick={closeModal} 
            className="btn btn-secondary"
            style={{ minWidth: '100px' }}
          >
            Cancel
          </button>
          <button 
            onClick={handleVerifyDocuments} 
            className="btn btn-primary"
            style={{ minWidth: '140px' }}
          >
            Verify Documents
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === "verify"}
        onClose={closeModal}
        title="Verify Payment"
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ 
            color: 'var(--slate-700)', 
            fontSize: '0.95rem', 
            lineHeight: '1.6',
            margin: 0 
          }}>
            Are you sure you want to verify the payment receipt?
          </p>
          <p style={{ 
            color: 'var(--slate-500)', 
            fontSize: '0.875rem', 
            marginTop: '0.5rem',
            margin: 0 
          }}>
            This action will mark the payment as verified and allow scheduling the appointment.
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem' }}>
          <button 
            onClick={closeModal} 
            className="btn btn-secondary"
            style={{ minWidth: '100px' }}
          >
            Cancel
          </button>
          <button 
            onClick={handleVerifyPayment} 
            className="btn btn-primary"
            style={{ minWidth: '100px' }}
          >
            Verify
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === "schedule"}
        onClose={closeModal}
        title="Schedule Appointment"
      >
        <form onSubmit={handleScheduleAppointment}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block', fontWeight: 500, color: 'var(--slate-700)' }}>
              Date
            </label>
            <input
              type="date"
              className="form-input"
              value={appointmentData.date}
              onChange={(e) =>
                setAppointmentData({ ...appointmentData, date: e.target.value })
              }
              required
              style={{ width: '100%' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block', fontWeight: 500, color: 'var(--slate-700)' }}>
              Time
            </label>
            <input
              type="time"
              className="form-input"
              value={appointmentData.time}
              onChange={(e) =>
                setAppointmentData({ ...appointmentData, time: e.target.value })
              }
              required
              style={{ width: '100%' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block', fontWeight: 500, color: 'var(--slate-700)' }}>
              Location
            </label>
            <input
              type="text"
              className="form-input"
              value={appointmentData.location}
              onChange={(e) =>
                setAppointmentData({
                  ...appointmentData,
                  location: e.target.value,
                })
              }
              placeholder="e.g. Main Hall"
              required
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={closeModal}
              className="btn btn-secondary"
              style={{ minWidth: '100px' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn"
              style={{
                backgroundColor: "var(--brand-500)",
                color: "white",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                minWidth: '130px',
                justifyContent: 'center'
              }}
            >
              <Calendar size={16} />
              Schedule
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={activeModal === "delete"}
        onClose={closeModal}
        title="Delete Application"
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            padding: '1rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            marginBottom: '1.25rem'
          }}>
            <AlertTriangle size={24} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <p style={{ 
                color: '#991b1b', 
                fontSize: '1rem', 
                fontWeight: 600,
                margin: 0,
                marginBottom: '0.5rem'
              }}>
                Are you sure you want to delete application #{deleteAppData?.applicationNumber}?
              </p>
              <p style={{ 
                color: '#7f1d1d', 
                fontSize: '0.875rem', 
                lineHeight: '1.6',
                margin: 0 
              }}>
                This will deactivate the application and prevent the applicant from logging in.
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem' }}>
          <button 
            onClick={closeModal} 
            className="btn btn-secondary"
            style={{ minWidth: '100px' }}
          >
            Cancel
          </button>
          <button 
            onClick={handleDeleteApplication} 
            className="btn"
            style={{ 
              minWidth: '120px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444';
            }}
          >
            <Trash2 size={16} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
