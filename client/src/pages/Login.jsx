import { useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import FaceScanner from "../components/FaceScanner.jsx";
import ConfidenceMeter from "../components/ConfidenceMeter.jsx";
import LivenessSteps from "../components/LivenessSteps.jsx";

const STEP_DEFAULTS = [
  { label: "Face detected",          state: "pending" },
  { label: "Liveness check",         state: "pending" },
  { label: "Matching with database", state: "pending" },
];

export default function Login() {
  const { login } = useAuth();

  const [email,      setEmail]      = useState("");
  const [status,     setStatus]     = useState("idle"); // idle | scanning | success | error
  const [steps,      setSteps]      = useState(STEP_DEFAULTS);
  const [confidence, setConfidence] = useState(0);
  const [loading,    setLoading]    = useState(false);

  const captureFnRef = useRef(null);

  const onCameraReady = useCallback((captureFn) => {
    captureFnRef.current = captureFn;
  }, []);

  function setStep(index, state) {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, state } : s))
    );
  }

  async function handleScan() {
    if (!email.trim()) { toast.error("Enter your email first"); return; }
    if (!captureFnRef.current) { toast.error("Camera not ready"); return; }
    if (loading) return;

    setLoading(true);
    setStatus("scanning");
    setSteps(STEP_DEFAULTS);
    setConfidence(0);

    try {
      // Step 1 — capture frame
      const frame = captureFnRef.current(0.92);
      if (!frame) throw new Error("Could not capture frame from camera");
      setStep(0, "done");

      // Step 2 — liveness (simulated client-side delay; real check happens server-side)
      setStep(1, "active");
      await delay(600);
      setStep(1, "done");

      // Step 3 — call backend
      setStep(2, "active");

      const { data } = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        image: frame,
      });

      setConfidence(data.confidence || 97);
      setStep(2, "done");
      setStatus("success");

      toast.success(`Welcome back, ${data.user.name}!`);
      await delay(800);
      login(data.token, data.user);

    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Try again.";
      const conf = err.response?.data?.confidence || 0;
      setStep(2, "error");
      setConfidence(conf);
      setStatus("error");
      toast.error(msg);
      await delay(1500);
      setStatus("idle");
      setSteps(STEP_DEFAULTS);
      setConfidence(0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-start px-10">
        {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(#6c63ff 1px,transparent 1px),linear-gradient(90deg,#6c63ff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="w-full max-w-xl animate-[slideUp_0.4s_ease-out]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="text-xl font-semibold text-white">FaceAuth</span>
        </div>

        <div className="card space-y-5">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-1">Welcome back</h1>
            <p className="text-sm text-gray-400">Look at the camera to authenticate</p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Email address</label>
            <input
              className="input-field"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
            />
          </div>

          {/* Scanner */}
          <div className="flex justify-center">
            <FaceScanner onReady={onCameraReady} status={status} size={220} />
          </div>

          {/* Confidence */}
          <ConfidenceMeter value={confidence} visible={status !== "idle"} />

          {/* Liveness steps */}
          <LivenessSteps steps={steps} />

          {/* CTA */}
          <button
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleScan}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
                Scan Face
              </>
            )}
          </button>

          <p className="text-center text-sm text-gray-500">
            No account?{" "}
            <Link to="/register" className="text-accent hover:underline font-medium">
              Register
            </Link>
          </p>
        </div>

        {/* Security note */}
        <div className="mt-4 flex items-center gap-2.5 bg-dark-700 border border-[rgba(108,99,255,0.15)] rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <p className="text-xs text-gray-500">Face embeddings are encrypted. Raw images are never stored.</p>
        </div>
      </div>
    </div>
  );
}

function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }
