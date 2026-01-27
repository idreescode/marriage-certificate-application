import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import { getAllApplications, getSettings } from "../services/api";
import {
  Users,
  CreditCard,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  FileText,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    pendingPayment: 0,
    scheduled: 0,
    completed: 0,
    totalRevenue: 0,
    revenueChange: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    // Check if token exists
    const token = localStorage.getItem("token");
    if (!token) {
      const returnUrl = "/admin/dashboard";
      navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }
    fetchStats();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      setError(null);

      // Fetch settings to get default_deposit_amount
      const settingsResponse = await getSettings();
      const defaultDepositSetting = settingsResponse.data.data.default_deposit_amount?.value;
      const defaultDepositAmount = defaultDepositSetting ? parseFloat(defaultDepositSetting) : 200; // Default to 200 if not set

      // Request all applications without pagination for dashboard stats
      const response = await getAllApplications({ limit: 10000, page: 1 });

      // Check if response structure is correct
      if (!response || !response.data || !response.data.success) {
        throw new Error(
          response?.data?.message || "Invalid response from server"
        );
      }

      if (!response.data.data || !response.data.data.applications) {
        throw new Error("Applications data not found in response");
      }

      const apps = response.data.data.applications || [];

      const newApps = apps.filter((a) => a.status === "admin_review").length;
      const pending = apps.filter((a) => a.status === "payment_pending").length;
      const scheduled = apps.filter(
        (a) => a.status === "appointment_scheduled"
      ).length;
      const completed = apps.filter((a) => a.status === "completed").length;

      // Calculate deposit fee (all time) - Total applications × default_deposit_amount
      // Revenue = Total Applications Count × default_deposit_amount (deposit_amount set ho ya na ho)
      const totalApplicationsCount = apps.length;
      const revenue = totalApplicationsCount * defaultDepositAmount;

      // Calculate deposit fee for current month and last month
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      let currentMonthRevenue = 0;
      let lastMonthRevenue = 0;

      // Calculate monthly revenue: Applications count in that month × default_deposit_amount
      apps.forEach((app) => {
        const appDate = new Date(app.created_at);
        const appMonth = appDate.getMonth();
        const appYear = appDate.getFullYear();

        // Check if application was created in current month
        if (appMonth === currentMonth && appYear === currentYear) {
          currentMonthRevenue += defaultDepositAmount;
        }
        // Check if application was created in last month
        else if (appMonth === lastMonth && appYear === lastMonthYear) {
          lastMonthRevenue += defaultDepositAmount;
        }
      });

      // Calculate percentage change
      let revenueChange = 0;
      if (lastMonthRevenue > 0) {
        revenueChange = ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
      } else if (currentMonthRevenue > 0) {
        // If last month had no revenue but current month has, it's 100% increase
        revenueChange = 100;
      }

      // Process Chart Data (Last 6 Months)
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const last6Months = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        last6Months.push({
          name: months[d.getMonth()],
          monthIndex: d.getMonth(),
          year: d.getFullYear(),
          applications: 0,
        });
      }

      apps.forEach((app) => {
        const d = new Date(app.created_at);
        const monthIndex = d.getMonth();
        const year = d.getFullYear();

        const period = last6Months.find(
          (p) => p.monthIndex === monthIndex && p.year === year
        );
        if (period) {
          period.applications += 1;
        }
      });

      setChartData(last6Months);
      setApplications(apps);

      setStats({
        total: apps.length,
        new: newApps,
        pendingPayment: pending,
        scheduled: scheduled,
        completed: completed,
        totalRevenue: revenue,
        revenueChange: revenueChange,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);

      // Extract error message
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Unable to load dashboard data. Please try again.";

      setError(errorMessage);

      // Show toast notification
      toast.error(errorMessage);

      // If unauthorized, redirect to login
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("token");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, bg, variant }) => (
    <div className={`stat-card stat-card--${variant}`}>
      <div>
        <p
          style={{
            color: "var(--slate-500)",
            fontSize: "0.9rem",
            fontWeight: 500,
            marginBottom: "0.25rem",
          }}
        >
          {title}
        </p>
        <h3
          style={{
            fontSize: "1.8rem",
            fontWeight: 800,
            color: "var(--slate-800)",
            margin: 0,
          }}
        >
          {value}
        </h3>
      </div>
      <div className="stat-icon" style={{ backgroundColor: bg }}>
        <Icon size={24} className={color} style={{ color: color }} />
      </div>
    </div>
  );

  if (loading) return <Loader fullscreen />;

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: "1.5rem",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "var(--radius-lg)",
            padding: "2rem",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            border: "1px solid var(--slate-200)",
            maxWidth: "500px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <AlertCircle
            size={48}
            color="#ef4444"
            style={{ marginBottom: "1rem" }}
          />
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "var(--slate-800)",
              marginBottom: "0.5rem",
            }}
          >
            Unable to Load Dashboard
          </h3>
          <p style={{ color: "var(--slate-600)", marginBottom: "1.5rem" }}>
            {error}
          </p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchStats();
            }}
            className="btn btn-primary"
            style={{ width: "100%" }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
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
        <h1 style={{ fontSize: "2rem", margin: 0, color: "white" }}>
          Dashboard Overview
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.85)",
            margin: 0,
            marginTop: "0.25rem",
          }}
        >
          Welcome back, Administrator. Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Applications"
          value={stats.total}
          icon={Users}
          color="white"
          bg="rgba(255,255,255,0.15)"
          variant="blue"
        />
        <StatCard
          title="New Requests"
          value={stats.new}
          icon={AlertCircle}
          color="white"
          bg="rgba(255,255,255,0.15)"
          variant="orange"
        />
        <StatCard
          title="Pending Payments"
          value={stats.pendingPayment}
          icon={CreditCard}
          color="white"
          bg="rgba(255,255,255,0.15)"
          variant="purple"
        />
        <StatCard
          title="Scheduled Nikkahs"
          value={stats.scheduled}
          icon={Calendar}
          color="white"
          bg="rgba(255,255,255,0.15)"
          variant="green"
        />
      </div>

      {/* Revenue Section */}
      <div className="revenue-section">
        {/* Main Chart Area */}
        <div
          style={{
            background: "white",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            border: "1px solid var(--slate-200)",
          }}
        >
          {/* Card Header */}
          <div
            style={{
              background: "#1e3a5f",
              padding: "1rem 1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                margin: 0,
                color: "white",
                fontWeight: 600,
              }}
            >
              Applications Overview
            </h3>
            <span style={{ fontSize: "0.75rem", color: "var(--slate-400)" }}>
              Last 6 Months
            </span>
          </div>
          {/* Chart Body */}
          <div style={{ padding: "1.5rem", height: "340px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#334155", fontSize: 14, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#334155", fontSize: 14, fontWeight: 500 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    padding: "10px 14px",
                  }}
                  itemStyle={{ color: "white" }}
                  labelStyle={{
                    color: "white",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                  cursor={{ fill: "rgba(202, 108, 64, 0.15)" }}
                />
                <Bar
                  dataKey="applications"
                  fill="var(--brand-600)"
                  radius={[6, 6, 0, 0]}
                  barSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Stats */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Total Revenue Card */}
          <div
            style={{
              background: "white",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
              border: "1px solid var(--slate-200)",
            }}
          >
            <div
              style={{
                background: "#115e59",
                padding: "0.875rem 1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <TrendingUp size={18} color="white" />
              <h3
                style={{
                  fontSize: "0.95rem",
                  margin: 0,
                  color: "white",
                  fontWeight: 600,
                }}
              >
                Total Revenue
              </h3>
            </div>
            <div style={{ padding: "1.25rem" }}>
              <span
                style={{
                  fontSize: "2.25rem",
                  fontWeight: 800,
                  color: "var(--slate-900)",
                }}
              >
                £{stats.totalRevenue.toLocaleString()}
              </span>
              <p
                style={{
                  marginTop: "0.75rem",
                  color: stats.revenueChange >= 0 ? "#059669" : "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {stats.revenueChange !== 0 ? (
                  <>
                    {stats.revenueChange >= 0 ? (
                      <TrendingUp size={16} />
                    ) : (
                      <TrendingDown size={16} />
                    )}
                    {stats.revenueChange >= 0 ? "+" : ""}
                    {stats.revenueChange.toFixed(1)}% from last month
                  </>
                ) : (
                  <>
                    <TrendingUp size={16} /> No change from last month
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Incomplete Applications Section */}
      <div style={{ marginTop: "2rem" }}>
        <div
          style={{
            background: "white",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            border: "1px solid var(--slate-200)",
          }}
        >
          <div
            style={{
              background: "#1e3a5f",
              padding: "1rem 1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <FileText size={18} color="white" />
              <h3
                style={{
                  fontSize: "1rem",
                  margin: 0,
                  color: "white",
                  fontWeight: 600,
                }}
              >
                Incomplete Applications
              </h3>
            </div>
            <span
              style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)" }}
            >
              {applications.filter((a) => a.status !== "completed").length}{" "}
              pending
            </span>
          </div>
          <div style={{ padding: "1rem" }}>
            {applications.filter((a) => a.status !== "completed").length ===
              0 ? (
              <p
                style={{
                  color: "var(--slate-500)",
                  textAlign: "center",
                  padding: "2rem",
                  margin: 0,
                }}
              >
                No incomplete applications
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {applications
                  .filter((a) => a.status !== "completed")
                  .slice(0, 2)
                  .map((app) => (
                    <Link
                      key={app.id}
                      to={`/admin/applications/${app.id}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.875rem 1rem",
                        background: "#f8fafc",
                        borderRadius: "var(--radius-md)",
                        textDecoration: "none",
                        transition: "all 0.2s",
                        border: "1px solid transparent",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#f1f5f9";
                        e.currentTarget.style.borderColor = "var(--slate-200)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "#f8fafc";
                        e.currentTarget.style.borderColor = "transparent";
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              margin: 0,
                              fontWeight: 600,
                              color: "var(--slate-800)",
                              fontSize: "0.9rem",
                            }}
                          >
                            <span
                              style={{
                                color: "var(--brand-600)",
                                fontWeight: 700,
                              }}
                            >
                              #{app.application_number || app.id}
                            </span>{" "}
                            — {app.groom_full_name} & {app.bride_full_name}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              color: "var(--slate-500)",
                              fontSize: "0.75rem",
                              marginTop: "0.25rem",
                            }}
                          >
                            {new Date(app.created_at).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <span
                          style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "9999px",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.03em",
                            background:
                              app.status === "admin_review"
                                ? "#dbeafe"
                                : app.status === "payment_pending"
                                  ? "#fef3c7"
                                  : app.status === "payment_verified"
                                    ? "#d1fae5"
                                    : app.status === "appointment_scheduled"
                                      ? "#e0e7ff"
                                      : "#f1f5f9",
                            color:
                              app.status === "admin_review"
                                ? "#1e40af"
                                : app.status === "payment_pending"
                                  ? "#92400e"
                                  : app.status === "payment_verified"
                                    ? "#065f46"
                                    : app.status === "appointment_scheduled"
                                      ? "#3730a3"
                                      : "#475569",
                          }}
                        >
                          {app.status === "admin_review"
                            ? "Review"
                            : app.status === "payment_pending"
                              ? "Payment Due"
                              : app.status === "payment_verified"
                                ? "Verified"
                                : app.status === "appointment_scheduled"
                                  ? "Scheduled"
                                  : app.status}
                        </span>
                        <ChevronRight size={16} color="#94a3b8" />
                      </div>
                    </Link>
                  ))}

                {applications.filter((a) => a.status !== "completed").length >
                  2 && (
                    <div style={{ padding: "0.5rem 0 0 0" }}>
                      <Link
                        to="/admin/applications"
                        className="btn btn-primary"
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: "0.5rem",
                          background: "var(--brand-600)",
                          color: "white",
                          border: "none",
                          padding: "0.75rem",
                          borderRadius: "var(--radius-md)",
                          textDecoration: "none",
                          fontWeight: 500,
                        }}
                      >
                        View All{" "}
                        {
                          applications.filter((a) => a.status !== "completed")
                            .length
                        }{" "}
                        Pending Applications
                      </Link>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
