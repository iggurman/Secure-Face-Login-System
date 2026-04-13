import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api.js";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  }

  async function handleResetFace() {
    if (!confirm("Delete all face data? You will need to re-register.")) return;
    try {
      await api.delete("/auth/reset-face");
      toast.success("Face data cleared. Please log in again.");
      logout();
      navigate("/register");
    } catch {
      toast.error("Could not reset face data.");
    }
  }

  const stats = [
    { label: "Logins",      value: user?.totalLogins ?? 0,  color: "#6c63ff" },
    { label: "Accuracy",    value: "98.4%",                  color: "#4ade80" },
    { label: "Avg. speed",  value: "0.3s",                   color: "#38bdf8" },
  ];

  const tips = [
    { icon: "✓", color: "#4ade80", bg: "rgba(74,222,128,0.1)", title: "Good lighting improves accuracy", desc: "Face the light source directly for best results" },
    { icon: "i", color: "#6c63ff", bg: "rgba(108,99,255,0.1)", title: "Update face data periodically",   desc: "Retrain every 6 months for best accuracy" },
    { icon: "🛡", color: "#f87171", bg: "rgba(248,113,113,0.1)", title: "Anti-spoof liveness active",   desc: "System blocks photo and video replay attacks" },
  ];

  const history = user?.loginHistory?.slice(0, 6) ?? [];

  return (
    <div className="min-h-screen bg-dark-900 p-4">
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{ backgroundImage: "linear-gradient(#6c63ff 1px,transparent 1px),linear-gradient(90deg,#6c63ff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="max-w-lg mx-auto space-y-4 animate-[slideUp_0.4s_ease-out]">

        {/* Header */}
        <div className="flex items-center justify-between pt-2 pb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="font-semibold text-white">Secure login</span>
          </div>
          <button onClick={handleLogout} className="btn-ghost py-1.5 px-3 text-xs">
            Sign out
          </button>
        </div>

        {/* User hero card */}
        <div className="card" style={{ background: "linear-gradient(135deg,rgba(108,99,255,0.18),rgba(56,189,248,0.08))", borderColor: "rgba(108,99,255,0.3)" }}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-xl font-bold text-white border-2 border-white/20">
                {user?.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-dark-900" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{user?.name}</h2>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                <span className="badge badge-green">Face ID Active</span>
                <span className="badge badge-purple">Secure</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="card p-4 text-center" style={{ padding: "1rem" }}>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Security tips */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Security tips</h3>
            <span className="badge badge-purple">All</span>
          </div>
          {tips.map((t, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
                style={{ background: t.bg, color: t.color }}>
                {t.icon}
              </div>
              <div>
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Login history */}
        <div className="card space-y-1">
          <h3 className="font-medium mb-3">Recent logins</h3>
          {history.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No login history yet</p>
          ) : (
            history.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  item.success ? "bg-green-400/10" : "bg-red-400/10"
                }`}>
                  {item.success ? (
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.success ? "Login successful" : "Match failed"}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {new Date(item.timestamp).toLocaleString()} · {item.userAgent?.split(" ")[0] || "Unknown"}
                  </p>
                </div>
                <span className={`text-xs font-semibold ${item.success ? "text-green-400" : "text-red-400"}`}>
                  {Math.round((item.confidence || 0) * 100)}%
                </span>
              </div>
            ))
          )}
        </div>

        {/* Face registered info */}
        {user?.faceRegisteredAt && (
          <div className="flex items-center gap-2.5 bg-dark-700 border border-[rgba(108,99,255,0.15)] rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <p className="text-xs text-gray-400">
              Face registered on {new Date(user.faceRegisteredAt).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Danger zone */}
        <div className="border border-red-500/20 rounded-2xl p-5 space-y-3">
          <p className="text-sm font-medium text-red-400">Danger zone</p>
          <p className="text-xs text-gray-500">Deletes all stored face embeddings. You will need to re-register.</p>
          <button onClick={handleResetFace}
            className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors">
            Delete face embeddings
          </button>
        </div>

        <p className="text-center text-xs text-gray-600 pb-6">FaceAuth — Powered by DeepFace + MERN</p>
      </div>
    </div>
  );
}
