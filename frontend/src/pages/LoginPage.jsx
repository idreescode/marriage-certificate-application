import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { login } from "../services/api";
import toast from "react-hot-toast";
import { LogIn, Lock, Mail, ArrowLeft } from "lucide-react";
import logo from "../assets/logo.svg";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("userType");
    const redirectUrl = searchParams.get("redirect");

    if (token) {
      // User is already logged in
      if (redirectUrl) {
        // Redirect to the intended URL
        navigate(decodeURIComponent(redirectUrl));
      } else if (userType === "admin" || userType === "super_admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/applicant/dashboard");
      }
    }
  }, [navigate, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await login(formData);
      const { token, user } = response.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("userType", user.role); // 'admin', 'super_admin', or 'applicant'
      localStorage.setItem("userName", user.fullName);

      // Get redirect URL from query params
      const redirectUrl = searchParams.get("redirect");

      // Check if user is admin or super_admin
      if (user.role === "admin" || user.role === "super_admin") {
        toast.success(`Welcome back, ${user.fullName}`);
        // If there's a redirect URL, go there, otherwise go to dashboard
        if (redirectUrl) {
          navigate(decodeURIComponent(redirectUrl));
        } else {
          navigate("/admin/dashboard");
        }
      } else {
        toast.success("Login successful");
        // For applicants, also check redirect URL
        if (redirectUrl && redirectUrl.startsWith("/applicant")) {
          navigate(decodeURIComponent(redirectUrl));
        } else {
          navigate("/applicant/dashboard");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "60fr 40fr",
      }}
    >
      {/* Left Panel - Branding */}
      <div
        className="hidden-mobile"
        style={{
          background:
            "linear-gradient(135deg, var(--brand-700), var(--brand-900))",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "6rem",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative Circles */}
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "-10%",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            bottom: "-5%",
            right: "-5%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        ></div>

        <div style={{ position: "relative", zIndex: 10 }}>
          <h1
            style={{
              fontSize: "3.5rem",
              fontWeight: "800",
              marginBottom: "1.5rem",
              lineHeight: 1.1,
              color: "white",
            }}
          >
            Nikkah App
            <br />
            Portal
          </h1>
          <p
            style={{
              fontSize: "1.25rem",
              opacity: 0.9,
              maxWidth: "600px",
              lineHeight: 1.6,
              color: "var(--brand-100)",
            }}
          >
            One secure platform for applicants and administrators. Manage your
            applications, verify records, and access services efficiently.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div
        className="login-form-panel"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "2rem",
          background: "var(--slate-50)",
        }}
      >
        <div className="login-form-container" style={{ maxWidth: "400px", width: "100%", margin: "0 auto" }}>
          <div
            className="logo-container"
            style={{
              marginBottom: "2rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                marginBottom: "1.5rem",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <img
                src={logo}
                alt="Official Logo"
                className="login-logo"
                style={{ height: "120px", width: "auto", maxWidth: "100%" }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={18}
                  className="text-slate-400"
                  style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--slate-400)",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                />
                <input
                  type="email"
                  className="form-input"
                  style={{
                    paddingLeft: "48px",
                    paddingRight: "12px",
                    height: "56px",
                    fontSize: "1.1rem",
                    fontWeight: 500,
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "2rem" }}>
              <div className="password-label-container" style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                marginBottom: "0.5rem",
                flexWrap: "wrap",
                gap: "0.5rem"
              }}>
                <label className="form-label password-label" style={{ marginBottom: 0, flex: "1 1 auto", minWidth: "fit-content" }}>
                  Password
                </label>
                <Link
                  to="/applicant/forgot-password"
                  className="forgot-password-link"
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--brand-600)",
                    textDecoration: "none",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <Lock
                  size={18}
                  className="text-slate-400"
                  style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--slate-400)",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                />
                <input
                  type="password"
                  className="form-input"
                  style={{
                    paddingLeft: "48px",
                    paddingRight: "12px",
                    height: "56px",
                    fontSize: "1.1rem",
                    fontWeight: 500,
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full btn-lg login-submit-btn"
              disabled={loading}
              style={{ 
                background: "var(--brand-600)", 
                border: "none",
                width: "100%",
                minHeight: "48px"
              }}
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        /* Desktop styles (default - above 768px) */
        /* Left panel shows, grid layout, full spacing */
        
        /* Tablet and Mobile (768px and below) */
        @media (max-width: 768px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
          .hidden-mobile {
            display: none !important;
          }
          .login-form-panel {
            padding: 1.5rem 1rem !important;
            min-height: 100vh !important;
            justify-content: flex-start !important;
            padding-top: 2rem !important;
          }
          .login-form-container {
            max-width: 100% !important;
          }
          .logo-container {
            margin-bottom: 1.5rem !important;
          }
          .login-logo {
            height: 80px !important;
          }
          .form-group {
            margin-bottom: 1.25rem !important;
          }
          .form-label {
            font-size: 0.85rem !important;
            margin-bottom: 0.5rem !important;
          }
          .password-label-container {
            flex-direction: row !important;
            align-items: center !important;
            gap: 0.5rem !important;
            margin-bottom: 0.5rem !important;
          }
          .password-label {
            margin-bottom: 0 !important;
            flex: 0 0 auto !important;
          }
          .forgot-password-link {
            margin-left: auto !important;
            flex-shrink: 0 !important;
          }
          .form-input {
            font-size: 16px !important;
            height: 50px !important;
            padding-left: 44px !important;
            padding-right: 12px !important;
            box-sizing: border-box !important;
          }
          .login-submit-btn {
            height: 50px !important;
            font-size: 1rem !important;
            margin-top: 0.5rem !important;
          }
          [class*="lucide"] {
            left: 14px !important;
            width: 16px !important;
            height: 16px !important;
          }
        }
        
        /* Small Mobile (480px and below) */
        @media (max-width: 480px) {
          .login-form-panel {
            padding: 1rem 0.75rem !important;
            padding-top: 1.5rem !important;
          }
          .login-logo {
            height: 70px !important;
            margin-bottom: 1rem !important;
          }
          .logo-container {
            margin-bottom: 1.25rem !important;
          }
          .form-group {
            margin-bottom: 1rem !important;
          }
          .form-input {
            font-size: 16px !important;
            height: 48px !important;
            padding-left: 42px !important;
            padding-right: 12px !important;
            box-sizing: border-box !important;
            width: 100% !important;
          }
          .form-label {
            font-size: 0.8rem !important;
            margin-bottom: 0.4rem !important;
          }
          .password-label-container {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.25rem !important;
            margin-bottom: 0.5rem !important;
          }
          .password-label {
            margin-bottom: 0 !important;
            width: 100% !important;
          }
          .forgot-password-link {
            margin-left: 0 !important;
            margin-top: 0 !important;
            font-size: 0.8rem !important;
            align-self: flex-start !important;
          }
          .login-submit-btn {
            height: 48px !important;
            font-size: 0.95rem !important;
            padding: 0.75rem 1rem !important;
          }
          [class*="lucide"] {
            left: 12px !important;
            width: 16px !important;
            height: 16px !important;
          }
        }
        
        /* Extra Small Mobile (360px and below) */
        @media (max-width: 360px) {
          .login-form-panel {
            padding: 0.75rem 0.5rem !important;
            padding-top: 1rem !important;
          }
          .login-logo {
            height: 60px !important;
          }
          .form-input {
            height: 46px !important;
            padding-left: 40px !important;
            padding-right: 10px !important;
            box-sizing: border-box !important;
            width: 100% !important;
          }
          .form-label {
            font-size: 0.75rem !important;
          }
          .forgot-password-link {
            font-size: 0.75rem !important;
          }
          .login-submit-btn {
            height: 46px !important;
            font-size: 0.9rem !important;
          }
          [class*="lucide"] {
            left: 10px !important;
            width: 14px !important;
            height: 14px !important;
          }
        }
        
        /* Ensure desktop maintains original styles */
        @media (min-width: 769px) {
          .login-form-panel {
            padding: 2rem !important;
            justify-content: center !important;
          }
          .login-logo {
            height: 120px !important;
          }
          .form-input {
            height: 56px !important;
            font-size: 1.1rem !important;
            padding-left: 48px !important;
          }
          .login-submit-btn {
            height: auto !important;
            font-size: inherit !important;
          }
        }
      `}</style>
    </div>
  );
}
