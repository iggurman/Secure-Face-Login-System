import { useEffect } from "react";
import { useCamera } from "../hooks/useCamera.js";

/**
 * FaceScanner
 * Reusable webcam preview component with scanner UI overlay.
 *
 * Props:
 *   onReady(captureFrame)  — called when camera is live
 *   status                 — "idle" | "scanning" | "success" | "error"
 *   size                   — number (px), default 240
 *   cornerColor            — CSS color, default "#6c63ff"
 */
export default function FaceScanner({
  onReady,
  status = "idle",
  size = 240,
  cornerColor = "#6c63ff",
}) {
  const { videoRef, ready, error, startCamera, captureFrame } = useCamera();

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  useEffect(() => {
    if (ready && onReady) onReady(captureFrame);
  }, [ready, onReady, captureFrame]);

  const borderColor = {
    idle:     cornerColor,
    scanning: cornerColor,
    success:  "#4ade80",
    error:    "#f87171",
  }[status];

  const scanLineColor = status === "success" ? "#4ade80" : status === "error" ? "#f87171" : cornerColor;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>

      {/* Outer pulse ring */}
      {status === "scanning" && (
        <div
          className="absolute rounded-2xl border-2 pointer-events-none"
          style={{
            width: size, height: size,
            borderColor,
            animation: "pulseRing 2s ease-out infinite",
          }}
        />
      )}

      {/* Success / error glow */}
      {(status === "success" || status === "error") && (
        <div
          className="absolute rounded-2xl pointer-events-none"
          style={{
            width: size, height: size,
            boxShadow: `0 0 32px 4px ${borderColor}55`,
          }}
        />
      )}

      {/* Camera box */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          width: size, height: size,
          background: "rgba(108,99,255,0.06)",
          border: `1.5px solid ${borderColor}44`,
        }}
      >
        {/* Video feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Scan line animation */}
        {(status === "scanning" || status === "idle") && (
          <div
            className="absolute left-0 right-0 h-0.5 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${scanLineColor}, transparent)`,
              animation: "scanDown 2.2s ease-in-out infinite",
              opacity: 0.8,
            }}
          />
        )}

        {/* Grid overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0.06 }}
        >
          <line x1="33%" y1="0" x2="33%" y2="100%" stroke="white" strokeWidth="1" />
          <line x1="66%" y1="0" x2="66%" y2="100%" stroke="white" strokeWidth="1" />
          <line x1="0" y1="33%" x2="100%" y2="33%" stroke="white" strokeWidth="1" />
          <line x1="0" y1="66%" x2="100%" y2="66%" stroke="white" strokeWidth="1" />
        </svg>

        {/* Face oval guide */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: Math.round(size * 0.44),
            height: Math.round(size * 0.58),
            border: `1.5px dashed ${borderColor}60`,
            borderRadius: "50%",
          }}
        />

        {/* Corner brackets */}
        {["tl","tr","bl","br"].map((pos) => (
          <div
            key={pos}
            className="absolute"
            style={{
              width: 22, height: 22,
              top:    pos.includes("t") ? 10 : undefined,
              bottom: pos.includes("b") ? 10 : undefined,
              left:   pos.includes("l") ? 10 : undefined,
              right:  pos.includes("r") ? 10 : undefined,
              borderTop:    pos.includes("t") ? `2.5px solid ${borderColor}` : undefined,
              borderBottom: pos.includes("b") ? `2.5px solid ${borderColor}` : undefined,
              borderLeft:   pos.includes("l") ? `2.5px solid ${borderColor}` : undefined,
              borderRight:  pos.includes("r") ? `2.5px solid ${borderColor}` : undefined,
              borderRadius:
                pos === "tl" ? "6px 0 0 0" :
                pos === "tr" ? "0 6px 0 0" :
                pos === "bl" ? "0 0 0 6px" : "0 0 6px 0",
            }}
          />
        ))}

        {/* Status overlay — success / error */}
        {(status === "success" || status === "error") && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{ background: `${status === "success" ? "#4ade80" : "#f87171"}18` }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: status === "success" ? "#4ade8022" : "#f8717122" }}
            >
              {status === "success" ? (
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Camera error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-dark-800 p-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M15 10l4.553-2.069A1 1 0 0121 8.876v6.248a1 1 0 01-1.447.894L15 14M3 8a2 2 0 00-2 2v4a2 2 0 002 2h9a2 2 0 002-2v-4a2 2 0 00-2-2H3z" />
            </svg>
            <p className="text-xs text-red-400 text-center">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
