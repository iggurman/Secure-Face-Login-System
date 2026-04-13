import { useRef, useState, useCallback, useEffect } from "react";

/**
 * useCamera
 * Manages webcam stream, mounting to a <video> element,
 * and capturing frames as base64 JPEG strings.
 */
export function useCamera() {
  const videoRef   = useRef(null);
  const streamRef  = useRef(null);
  const canvasRef  = useRef(document.createElement("canvas"));

  const [ready,   setReady]   = useState(false);
  const [error,   setError]   = useState(null);
  const [mirrored, setMirrored] = useState(true);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width:       { ideal: 640 },
          height:      { ideal: 480 },
          facingMode:  "user",
          frameRate:   { ideal: 30 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setReady(true);
        };
      }
    } catch (err) {
      const msg =
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access and refresh."
          : err.name === "NotFoundError"
          ? "No camera found on this device."
          : `Camera error: ${err.message}`;
      setError(msg);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setReady(false);
  }, []);

  /**
   * Capture a single frame from the video feed.
   * Returns a base64-encoded JPEG string (data URI).
   */
  const captureFrame = useCallback((quality = 0.92) => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !ready) return null;

    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");

    // Mirror the frame to match the preview (selfie-style)
    if (mirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (mirrored) ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform

    return canvas.toDataURL("image/jpeg", quality);
  }, [ready, mirrored]);

  // Auto-stop when component unmounts
  useEffect(() => () => stopCamera(), [stopCamera]);

  return {
    videoRef,
    ready,
    error,
    mirrored,
    setMirrored,
    startCamera,
    stopCamera,
    captureFrame,
  };
}
