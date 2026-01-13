import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import {
  getAllApplications,
  verifyDocuments as verifyDocumentsAPI,
  setDepositAmount as setDepositAPI,
  verifyPayment as verifyPaymentAPI,
  scheduleAppointment as scheduleAPI,
  generateCertificate as generateCertAPI,
} from "../services/api";
import toast from "react-hot-toast";
import {
  Search,
  Filter,
  Clock,
  Banknote,
  Calendar,
  Eye,
  FileText,
  User,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
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
  const [activeModal, setActiveModal] = useState(null); // 'documents', 'deposit', 'verify', 'schedule', 'view'
  const [selectedAppId, setSelectedAppId] = useState(null);

  // Form States
  const [depositAmount, setDepositAmount] = useState("");
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

  const openSetDeposit = (id) => {
    setSelectedAppId(id);
    setDepositAmount("");
    setActiveModal("deposit");
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
  };

  // Action Handlers
  const handleVerifyDocuments = async () => {
    const toastId = toast.loading("Verifying documents...");
    try {
      await verifyDocumentsAPI(selectedAppId);
      toast.success("Documents verified successfully!", { id: toastId });
      closeModal();
      fetchApplications();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to verify documents",
        { id: toastId }
      );
    }
  };

  const handleSetDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount) return;

    const toastId = toast.loading("Setting deposit...");
    try {
      await setDepositAPI(selectedAppId, {
        depositAmount: parseFloat(depositAmount),
      });
      toast.success("Deposit amount set successfully!", { id: toastId });
      closeModal();
      fetchApplications();
    } catch (error) {
      toast.error("Failed to set deposit amount", { id: toastId });
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

                          {/* Show Set Deposit button only if documents are verified */}
                          {app.documents_verified ? (
                            <button
                              onClick={() => openSetDeposit(app.id)}
                              className="btn btn-sm btn-primary"
                              style={{ whiteSpace: "nowrap" }}
                            >
                              Set Deposit
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
                          className="btn btn-sm btn-secondary"
                          style={{ whiteSpace: "nowrap" }}
                        >
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
        <p className="text-slate-600 mb-6">
          Have you reviewed and verified all the uploaded documents?
          <br />
          This will allow you to proceed with setting the deposit amount.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={closeModal} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleVerifyDocuments} className="btn btn-primary">
            Verify Documents
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === "deposit"}
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
            <button
              type="button"
              onClick={closeModal}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Set Amount
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={activeModal === "verify"}
        onClose={closeModal}
        title="Verify Payment"
      >
        <p className="text-slate-600 mb-6">
          Are you sure you want to verify the payment receipt?
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={closeModal} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleVerifyPayment} className="btn btn-primary">
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
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-input"
              value={appointmentData.date}
              onChange={(e) =>
                setAppointmentData({ ...appointmentData, date: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Time</label>
            <input
              type="time"
              className="form-input"
              value={appointmentData.time}
              onChange={(e) =>
                setAppointmentData({ ...appointmentData, time: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
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
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Schedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
