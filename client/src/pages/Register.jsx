import { useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import FaceScanner from "../components/FaceScanner.jsx";

const ANGLE_GUIDES = ["Front", "Left 15°", "Right 15°", "Tilt up", "Tilt down"];
const TOTAL_PHOTOS = 5;

export default function Register() {
  const { login } = useAuth();

  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState("");
  const [captures,   setCaptures]   = useState([]); // base64 strings
  const [status,     setStatus]     = useState("idle");
  const [loading,    setLoading]    = useState(false);
  const [step,       setStep]       = useState(1); // 1=form, 2=face

  const captureFnRef = useRef(null);

  const onCameraReady = useCallback((fn) => { captureFnRef.current = fn; }, []);

  function nextFormStep() {
    if (!name.trim())               { toast.error("Enter your name");          return; }
    if (!/\S+@\S+\.\S+/.test(email)) { toast.error("Enter a valid email");      return; }
    setStep(2);
  }

  async function capturePhoto() {
    if (!captureFnRef.current || captures.length >= TOTAL_PHOTOS) return;
    const frame = captureFnRef.current(0.92);
    if (!frame) { toast.error("Camera not ready"); return; }
    const updated = [...captures, frame];
    setCaptures(updated);
    if (updated.length < TOTAL_PHOTOS) {
      toast.success(`Photo ${updated.length} of ${TOTAL_PHOTOS} captured`);
    } else {
      toast.success("All photos captured! Ready to register.");
    }
  }

  async function handleRegister() {
    if (captures.length < 3) { toast.error("Capture at least 3 photos"); return; }
    setLoading(true);
    setStatus("scanning");
    try {
      const { data } = await api.post("/auth/register", {
        name:   name.trim(),
        email:  email.trim().toLowerCase(),
        images: captures,
      });
      setStatus("success");
      toast.success("Registration successful! Logging you in…");
      await delay(800);
      login(data.token, data.user);
    } catch (err) {
      setStatus("error");
      const msg = err.response?.data?.message || "Registration failed. Try again.";
      toast.error(msg);
      await delay(1200);
      setStatus("idle");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(#6c63ff 1px,transparent 1px),linear-gradient(90deg,#6c63ff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="w-full max-w-sm animate-[slideUp_0.4s_ease-out]">
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
          {/* Step indicator */}
          <div className="flex items-center gap-3">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  step >= s ? "bg-accent text-white" : "bg-dark-600 text-gray-500"
                }`}>{s}</div>
                <span className={`text-xs ${step >= s ? "text-gray-300" : "text-gray-600"}`}>
                  {s === 1 ? "Your details" : "Face capture"}
                </span>
                {s < 2 && <div className={`flex-1 h-px ${step > s ? "bg-accent" : "bg-dark-600"}`} />}
              </div>
            ))}
          </div>

          {/* STEP 1 — Details form */}
          {step === 1 && (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
              <div className="text-center">
                <h1 className="text-2xl font-semibold mb-1">Create account</h1>
                <p className="text-sm text-gray-400">Set up passwordless face login</p>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Full name</label>
                <input className="input-field" type="text" placeholder="Alex Johnson"
                  value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Email address</label>
                <input className="input-field" type="email" placeholder="alex@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && nextFormStep()} />
              </div>

              <button className="btn-primary" onClick={nextFormStep}>
                Continue to face setup
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>

              <p className="text-center text-sm text-gray-500">
                Already registered?{" "}
                <Link to="/login" className="text-accent hover:underline font-medium">Log in</Link>
              </p>
            </div>
          )}

          {/* STEP 2 — Face capture */}
          {step === 2 && (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
              <div className="text-center">
                <h1 className="text-xl font-semibold mb-1">Capture your face</h1>
                <p className="text-sm text-gray-400">
                  {captures.length < TOTAL_PHOTOS
                    ? `Photo ${captures.length + 1} of ${TOTAL_PHOTOS} — ${ANGLE_GUIDES[captures.length]}`
                    : "All photos captured!"}
                </p>
              </div>

              {/* Scanner */}
              <div className="flex justify-center">
                <FaceScanner
                  onReady={onCameraReady}
                  status={status}
                  size={210}
                  cornerColor={captures.length === TOTAL_PHOTOS ? "#4ade80" : "#6c63ff"}
                />
              </div>

              {/* Progress dots */}
              <div className="flex gap-2 justify-center">
                {Array.from({ length: TOTAL_PHOTOS }).map((_, i) => (
                  <div key={i} className={`h-2 rounded-full transition-all duration-300 ${
                    i < captures.length ? "bg-success w-6" :
                    i === captures.length ? "bg-accent w-4" :
                    "bg-dark-600 w-2"
                  }`} />
                ))}
              </div>

              {/* Thumbnails */}
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: TOTAL_PHOTOS }).map((_, i) => (
                  <div key={i}
                    className={`aspect-square rounded-xl overflow-hidden border ${
                      i < captures.length
                        ? "border-success/40 bg-success/10"
                        : "border-[rgba(108,99,255,0.2)] bg-dark-600"
                    } flex items-center justify-center`}
                  >
                    {i < captures.length ? (
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6"/>
                      </svg>
                    )}
                  </div>
                ))}
              </div>

              {/* Angle guide pills */}
              <div className="flex gap-1.5 flex-wrap">
                {ANGLE_GUIDES.map((g, i) => (
                  <span key={i} className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                    i < captures.length  ? "bg-success/10 text-green-400 border border-success/30" :
                    i === captures.length ? "bg-accent/15 text-[#a78bfa] border border-accent/30" :
                    "bg-dark-600 text-gray-600 border border-transparent"
                  }`}>{g}</span>
                ))}
              </div>

              {/* Action buttons */}
              {captures.length < TOTAL_PHOTOS ? (
                <button className="btn-primary" style={{ background: "#4ade80", color: "#0d0f1a" }} onClick={capturePhoto}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M20 7h-4l-2-3H10L8 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                  </svg>
                  Capture Photo ({captures.length}/{TOTAL_PHOTOS})
                </button>
              ) : (
                <button
                  className="btn-primary disabled:opacity-50"
                  onClick={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                      Complete Registration
                    </>
                  )}
                </button>
              )}

              <button className="btn-ghost w-full" onClick={() => { setStep(1); setCaptures([]); setStatus("idle"); }}>
                ← Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }
