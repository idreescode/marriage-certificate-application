import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import { getSettings, updateSettings } from "../services/api";
import toast from "react-hot-toast";
import { Settings, Mail, PoundSterling, Save, AlertCircle } from "lucide-react";

export default function AdminSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    admin_emails: "",
    default_deposit_amount: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("token");
    if (!token) {
      const returnUrl = "/admin/settings";
      navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await getSettings();
      const settingsData = response.data.data;
      
      setSettings({
        admin_emails: settingsData.admin_emails?.value || "",
        default_deposit_amount: settingsData.default_deposit_amount?.value || "200",
      });
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error("Failed to load settings");
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate admin emails
    if (!settings.admin_emails.trim()) {
      newErrors.admin_emails = "At least one admin email is required";
    } else {
      const emails = settings.admin_emails.split(",").map((e) => e.trim()).filter((e) => e.length > 0);
      if (emails.length === 0) {
        newErrors.admin_emails = "At least one valid email is required";
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (const email of emails) {
          if (!emailRegex.test(email)) {
            newErrors.admin_emails = `Invalid email format: ${email}`;
            break;
          }
        }
      }
    }

    // Validate default deposit amount
    const amount = parseFloat(settings.default_deposit_amount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.default_deposit_amount = "Default deposit amount must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    setSaving(true);
    try {
      await updateSettings({
        admin_emails: settings.admin_emails.trim(),
        default_deposit_amount: settings.default_deposit_amount.trim(),
      });
      
      toast.success("Settings updated successfully");
      // Refresh settings to get updated timestamps
      await fetchSettings();
    } catch (error) {
      if (error.response?.status === 401) {
        // Auth error handled by interceptor
        return;
      }
      const errorMessage = error.response?.data?.message || "Failed to update settings";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    // Clear error for this field when user starts typing
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  if (loading) {
    return <Loader />;
  }

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
            Settings
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.85)",
              margin: 0,
              marginTop: "0.25rem",
            }}
          >
            Manage system configuration
          </p>
        </div>
      </div>

      <div>
        <form onSubmit={handleSubmit} className="settings-form">
          {/* Admin Emails Section */}
          <div className="settings-section">
            <div className="settings-section-header">
              <div className="settings-icon-wrapper">
                <Mail size={20} />
              </div>
              <div>
                <h2 className="settings-section-title">Admin Email Addresses</h2>
                <p className="settings-section-description">
                  Email addresses that receive admin notifications (comma-separated)
                </p>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="admin_emails" className="form-label">
                Admin Emails
              </label>
              <input
                type="text"
                id="admin_emails"
                className={`form-input ${errors.admin_emails ? "input-error" : ""}`}
                value={settings.admin_emails}
                onChange={(e) => handleChange("admin_emails", e.target.value)}
                placeholder="admin@example.com, admin2@example.com"
              />
              {errors.admin_emails && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  <span>{errors.admin_emails}</span>
                </div>
              )}
              <p className="form-hint">
                Enter one or more email addresses separated by commas. These emails will receive notifications for new applications, payment receipts, and other admin alerts.
              </p>
            </div>
          </div>

          {/* Default Deposit Amount Section */}
          <div className="settings-section">
            <div className="settings-section-header">
              <div className="settings-icon-wrapper">
                <PoundSterling size={20} />
              </div>
              <div>
                <h2 className="settings-section-title">Default Deposit Amount</h2>
                <p className="settings-section-description">
                  Default deposit amount set when approving new applications
                </p>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="default_deposit_amount" className="form-label">
                Default Deposit Amount (£)
              </label>
              <input
                type="number"
                id="default_deposit_amount"
                className={`form-input ${errors.default_deposit_amount ? "input-error" : ""}`}
                value={settings.default_deposit_amount}
                onChange={(e) => handleChange("default_deposit_amount", e.target.value)}
                placeholder="200"
                min="0"
                step="0.01"
              />
              {errors.default_deposit_amount && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  <span>{errors.default_deposit_amount}</span>
                </div>
              )}
              <p className="form-hint">
                This amount will be automatically set when you approve a new application. You can still change it individually for each application.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="settings-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="loader-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
