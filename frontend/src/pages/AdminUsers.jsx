import { useState, useEffect } from "react";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import {
  getAllUsers,
  createAdmin,
  updateUser,
  deleteUser,
} from "../services/api";
import toast from "react-hot-toast";
import {
  Search,
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
  UserPlus,
  X,
  Check,
  Shield,
  Mail,
  User,
} from "lucide-react";

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal States
  const [activeModal, setActiveModal] = useState(null); // 'view', 'edit', 'delete', 'create'
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteUserData, setDeleteUserData] = useState(null);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    email: "",
    full_name: "",
    role: "",
    password: "",
  });

  // Create Admin Form State
  const [createForm, setCreateForm] = useState({
    email: "",
    full_name: "",
    password: "",
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterRole !== "all") params.role = filterRole;
      if (searchTerm) params.search = searchTerm;

      const response = await getAllUsers(params);
      setUsers(response.data.data.users);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRole]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Modal Handlers
  const openViewModal = (user) => {
    setSelectedUser(user);
    setActiveModal("view");
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      email: user.email || "",
      full_name: user.full_name || "",
      role: user.role || "",
      password: "",
    });
    setActiveModal("edit");
  };

  const openDeleteModal = (user) => {
    setDeleteUserData(user);
    setActiveModal("delete");
  };

  const openCreateModal = () => {
    setCreateForm({
      email: "",
      full_name: "",
      password: "",
    });
    setActiveModal("create");
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedUser(null);
    setDeleteUserData(null);
    setEditForm({
      email: "",
      full_name: "",
      role: "",
      password: "",
    });
    setCreateForm({
      email: "",
      full_name: "",
      password: "",
    });
  };

  // Action Handlers
  const handleCreateAdmin = async () => {
    if (!createForm.email || !createForm.full_name || !createForm.password) {
      toast.error("All fields are required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createForm.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate password length
    if (createForm.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    const toastId = toast.loading("Creating admin user...");
    try {
      await createAdmin({
        email: createForm.email,
        full_name: createForm.full_name,
        password: createForm.password,
      });
      toast.success("Admin user created successfully! Credentials sent via email.", { id: toastId });
      closeModal();
      fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create admin user",
        { id: toastId }
      );
    }
  };

  const handleUpdateUser = async () => {
    if (!editForm.email || !editForm.full_name) {
      toast.error("Email and full name are required");
      return;
    }

    // Validate password if provided
    if (editForm.password && editForm.password.trim() !== "") {
      if (editForm.password.length < 6) {
        toast.error("Password must be at least 6 characters long");
        return;
      }
    }

    const toastId = toast.loading("Updating user...");
    try {
      const updateData = {
        email: editForm.email,
        full_name: editForm.full_name,
        role: editForm.role,
      };

      // Only include password if it's provided
      if (editForm.password && editForm.password.trim() !== "") {
        updateData.password = editForm.password;
      }

      await updateUser(selectedUser.id, updateData);
      toast.success("User updated successfully", { id: toastId });
      closeModal();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update user", {
        id: toastId,
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserData) return;

    const toastId = toast.loading("Deleting user...");
    try {
      await deleteUser(deleteUserData.id);
      toast.success("User deleted successfully", { id: toastId });
      closeModal();
      fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete user",
        { id: toastId }
      );
    }
  };

  const RoleBadge = ({ role }) => {
    const styles = {
      admin: { bg: "#dbeafe", color: "#1e40af", label: "Admin" },
      applicant: { bg: "#dcfce7", color: "#166534", label: "Applicant" },
    };

    const style = styles[role] || styles.applicant;

    return (
      <span
        style={{
          padding: "0.25rem 0.75rem",
          borderRadius: "12px",
          fontSize: "0.75rem",
          fontWeight: 600,
          backgroundColor: style.bg,
          color: style.color,
          display: "inline-block",
        }}
      >
        {style.label}
      </span>
    );
  };

  // Filtering
  const filteredUsers =
    filterRole === "all"
      ? users
      : users.filter((user) => user.role === filterRole);

  if (loading) return <Loader fullscreen />;

  return (
    <div>
      <div
        style={{
          background: "var(--brand-600)",
          padding: "1.5rem 2rem",
          borderRadius: "var(--radius-lg)",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2rem", margin: 0, color: "white" }}>
            User Management
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.85)",
              margin: 0,
              marginTop: "0.25rem",
            }}
          >
            Manage system users and their permissions.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.5rem",
            width: "20%",
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "var(--radius-md)",
            color: "white",
            textDecoration: "none",
            fontWeight: 500,
            fontSize: "0.875rem",
            cursor: "pointer",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.25)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.15)";
          }}
        >
          <UserPlus size={16} />
          Add Admin
        </button>
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
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div className="d-flex gap-2" style={{ flexWrap: "wrap" }}>
            <button
              onClick={() => setFilterRole("all")}
              className={`btn btn-sm`}
              style={{
                background:
                  filterRole === "all" ? "var(--brand-600)" : "transparent",
                color: filterRole === "all" ? "white" : "var(--slate-600)",
                border:
                  filterRole === "all"
                    ? "none"
                    : "1px solid var(--slate-300)",
              }}
            >
              All
            </button>
            <button
              onClick={() => setFilterRole("admin")}
              className={`btn btn-sm`}
              style={{
                background:
                  filterRole === "admin" ? "var(--brand-600)" : "transparent",
                color: filterRole === "admin" ? "white" : "var(--slate-600)",
                border:
                  filterRole === "admin"
                    ? "none"
                    : "1px solid var(--slate-300)",
              }}
            >
              Admins
            </button>
            <button
              onClick={() => setFilterRole("applicant")}
              className={`btn btn-sm`}
              style={{
                background:
                  filterRole === "applicant"
                    ? "var(--brand-600)"
                    : "transparent",
                color:
                  filterRole === "applicant" ? "white" : "var(--slate-600)",
                border:
                  filterRole === "applicant"
                    ? "none"
                    : "1px solid var(--slate-300)",
              }}
            >
              Applicants
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
              placeholder="Search users..."
              className="form-input"
              style={{ width: "250px", paddingLeft: "35px" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th style={{ width: "180px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <User size={16} style={{ color: "var(--slate-400)" }} />
                      {user.full_name || "N/A"}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Mail size={14} style={{ color: "var(--slate-400)" }} />
                      {user.email}
                    </div>
                  </td>
                  <td>
                    <RoleBadge role={user.role} />
                  </td>
                  <td style={{ color: "var(--slate-500)" }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <button
                        onClick={() => openViewModal(user)}
                        className="btn btn-sm btn-secondary"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={() => openEditModal(user)}
                        className="btn btn-sm btn-secondary"
                        title="Edit User"
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
                      </button>

                      <button
                        onClick={() => openDeleteModal(user)}
                        className="btn btn-sm btn-secondary"
                        title="Delete User"
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
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center"
                    style={{ padding: "3rem", color: "var(--slate-500)" }}
                  >
                    No users found.
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
          <span>Showing {filteredUsers.length} results</span>
        </div>
      </div>

      {/* View Modal */}
      <Modal
        isOpen={activeModal === "view"}
        onClose={closeModal}
        title="User Details"
      >
        {selectedUser && (
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    background: "var(--brand-100)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--brand-600)",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                  }}
                >
                  {selectedUser.full_name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.25rem" }}>
                    {selectedUser.full_name || "N/A"}
                  </h3>
                  <p style={{ margin: 0, color: "var(--slate-500)" }}>
                    <RoleBadge role={selectedUser.role} />
                  </p>
                </div>
              </div>

              <div
                style={{
                  padding: "1rem",
                  background: "var(--slate-50)",
                  borderRadius: "8px",
                }}
              >
                <div style={{ marginBottom: "0.75rem" }}>
                  <label
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--slate-500)",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      letterSpacing: "0.5px",
                    }}
                  >
                    Email
                  </label>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.95rem" }}>
                    {selectedUser.email}
                  </p>
                </div>

                <div style={{ marginBottom: "0.75rem" }}>
                  <label
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--slate-500)",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      letterSpacing: "0.5px",
                    }}
                  >
                    Role
                  </label>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.95rem" }}>
                    <RoleBadge role={selectedUser.role} />
                  </p>
                </div>

                <div style={{ marginBottom: "0.75rem" }}>
                  <label
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--slate-500)",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      letterSpacing: "0.5px",
                    }}
                  >
                    Created At
                  </label>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.95rem" }}>
                    {new Date(selectedUser.created_at).toLocaleString()}
                  </p>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--slate-500)",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      letterSpacing: "0.5px",
                    }}
                  >
                    Last Updated
                  </label>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.95rem" }}>
                    {new Date(selectedUser.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
              }}
            >
              <button
                onClick={closeModal}
                className="btn btn-secondary"
                style={{ minWidth: "100px" }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={activeModal === "edit"}
        onClose={closeModal}
        title="Edit User"
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={editForm.email}
              onChange={(e) =>
                setEditForm({ ...editForm, email: e.target.value })
              }
              required
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={editForm.full_name}
              onChange={(e) =>
                setEditForm({ ...editForm, full_name: e.target.value })
              }
              required
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="form-label">Role</label>
            <select
              className="form-input"
              value={editForm.role}
              onChange={(e) =>
                setEditForm({ ...editForm, role: e.target.value })
              }
              required
            >
              <option value="applicant">Applicant</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="form-label">
              New Password (leave blank to keep current)
            </label>
            <input
              type="password"
              className="form-input"
              value={editForm.password}
              onChange={(e) =>
                setEditForm({ ...editForm, password: e.target.value })
              }
              placeholder="Enter new password"
            />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
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
            onClick={handleUpdateUser}
            className="btn btn-primary"
            style={{ minWidth: "100px" }}
          >
            Update
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={activeModal === "delete"}
        onClose={closeModal}
        title="Delete User"
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
                Are you sure you want to delete {deleteUserData?.full_name || deleteUserData?.email}?
              </p>
              <p
                style={{
                  color: "#7f1d1d",
                  fontSize: "0.875rem",
                  lineHeight: "1.6",
                  margin: 0,
                }}
              >
                This action cannot be undone. The user will be permanently
                removed from the system.
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
            onClick={handleDeleteUser}
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

      {/* Create Admin Modal */}
      <Modal
        isOpen={activeModal === "create"}
        onClose={closeModal}
        title="Create New Admin"
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={createForm.full_name}
              onChange={(e) =>
                setCreateForm({ ...createForm, full_name: e.target.value })
              }
              placeholder="Enter full name"
              required
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={createForm.email}
              onChange={(e) =>
                setCreateForm({ ...createForm, email: e.target.value })
              }
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={createForm.password}
              onChange={(e) =>
                setCreateForm({ ...createForm, password: e.target.value })
              }
              placeholder="Enter password (min 6 characters)"
              required
            />
            <p style={{ fontSize: "0.75rem", color: "var(--slate-500)", marginTop: "0.5rem", marginBottom: 0 }}>
              The admin will receive an email with these credentials.
            </p>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
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
            onClick={handleCreateAdmin}
            className="btn btn-primary"
            style={{ minWidth: "100px" }}
          >
            Create Admin
          </button>
        </div>
      </Modal>
    </div>
  );
}
