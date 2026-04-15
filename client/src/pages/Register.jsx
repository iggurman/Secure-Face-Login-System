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
  <div className="min-h-screen flex items-center justify-center p-6">

    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center animate-[slideUp_0.4s_ease-out]">

      {/* LEFT SIDE (LOGO + INFO) */}
      <div className="hidden lg:flex flex-col justify-center max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="text-xl font-semibold text-white">FaceAuth</span>
        </div>

        <h1 className="text-4xl font-bold text-white mb-4">
          Create your account
        </h1>

        <p className="text-gray-400">
          Register using advanced face authentication. Capture multiple angles for better accuracy and security.
        </p>

      </div>

      {/* RIGHT SIDE (FORM + SCANNER) */}
      <div className="w-full max-w-md ml-auto">

        <div className="card space-y-5 w-full">

          {/* Step indicator */}
          <div className="flex items-center gap-3">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  step >= s ? "bg-accent text-white" : "bg-dark-600 text-gray-500"
                }`}>
                  {s}
                </div>
                <span className={`text-xs ${step >= s ? "text-gray-300" : "text-gray-600"}`}>
                  {s === 1 ? "Your details" : "Face capture"}
                </span>
                {s < 2 && <div className={`flex-1 h-px ${step > s ? "bg-accent" : "bg-dark-600"}`} />}
              </div>
            ))}
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">

              <div className="text-center">
                <h1 className="text-2xl font-semibold mb-1">Create account</h1>
                <p className="text-sm text-gray-400">Set up passwordless face login</p>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Full name</label>
                <input className="input-field" type="text"
                  value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Email</label>
                <input className="input-field" type="email"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <button className="btn-primary" onClick={nextFormStep}>
                Continue
              </button>

              <p className="text-center text-sm text-gray-500">
                Already registered?{" "}
                <Link to="/login" className="text-accent">Log in</Link>
              </p>

            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">

              <FaceScanner
                onReady={onCameraReady}
                status={status}
                size={240}
              />

              <button className="btn-primary" onClick={capturePhoto}>
                Capture ({captures.length}/{TOTAL_PHOTOS})
              </button>

              {captures.length >= 3 && (
                <button className="btn-primary" onClick={handleRegister}>
                  Register
                </button>
              )}

              <button
                className="btn-ghost w-full"
                onClick={() => {
                  setStep(1);
                  setCaptures([]);
                  setStatus("idle");
                }}
              >
                ← Back
              </button>

            </div>
          )}

        </div>
      </div>

    </div>
  </div>
);

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}}