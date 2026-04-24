import { useRef, useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { ArrowLeft, RefreshCw, Download, Share2 } from "lucide-react";

const FILTERS: { name: string; css: string }[] = [
  { name: "Normal",  css: "none" },
  { name: "Warm",    css: "sepia(0.35) saturate(1.4) brightness(1.05)" },
  { name: "Vivid",   css: "saturate(1.8) contrast(1.1)" },
  { name: "Faded",   css: "contrast(0.85) brightness(1.1) saturate(0.7)" },
  { name: "Cool",    css: "hue-rotate(20deg) saturate(1.2) brightness(0.97)" },
  { name: "B&W",     css: "grayscale(1) contrast(1.1)" },
  { name: "Golden",  css: "sepia(0.6) saturate(1.6) brightness(1.1)" },
];

type Phase = "preview" | "recording" | "done" | "error" | "unsupported";

function formatTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

const canRecord = () =>
  typeof MediaRecorder !== "undefined" &&
  typeof navigator.mediaDevices?.getUserMedia === "function";

export default function Cam() {
  const [, navigate] = useLocation();
  const { settings } = useFitCheckSettings();

  const [phase, setPhase] = useState<Phase>(canRecord() ? "preview" : "unsupported");
  const [filterIdx, setFilterIdx] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [elapsed, setElapsed] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  // Refs so the RAF loop never needs to restart when these change
  const filterIdxRef = useRef(0);
  const facingModeRef = useRef<"user" | "environment">("user");
  const locationRef = useRef<string | null>(null);

  useEffect(() => { filterIdxRef.current = filterIdx; }, [filterIdx]);
  useEffect(() => { facingModeRef.current = facingMode; }, [facingMode]);
  useEffect(() => { locationRef.current = settings.location?.name ?? null; }, [settings.location]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rafRunning = useRef(false);

  // Stable draw loop — uses refs only, never recreated
  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !rafRunning.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) {
      rafRef.current = requestAnimationFrame(drawFrame);
      return;
    }

    const CW = 720;
    const CH = 1280;
    if (canvas.width !== CW) canvas.width = CW;
    if (canvas.height !== CH) canvas.height = CH;

    // Object-cover: scale to fill, crop excess
    const scale = Math.max(CW / vw, CH / vh);
    const sw = vw * scale;
    const sh = vh * scale;
    const ox = (CW - sw) / 2;
    const oy = (CH - sh) / 2;

    const filter = FILTERS[filterIdxRef.current].css;
    ctx.filter = filter === "none" ? "" : filter;
    ctx.save();
    if (facingModeRef.current === "user") {
      ctx.translate(CW, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, ox, oy, sw, sh);
    ctx.restore();
    ctx.filter = "";

    // Branding overlay
    const loc = locationRef.current;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.roundRect(24, 24, CW - 48, loc ? 170 : 140, 20);
    ctx.fill();

    ctx.font = "bold 40px system-ui, sans-serif";
    ctx.fillStyle = "#FF9500";
    ctx.fillText("FIT✔️", 52, 80);

    ctx.font = "bold 28px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText("Get Ready With Me", 52, 122);

    if (loc) {
      ctx.font = "22px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText(`📍 ${loc}`, 52, 158);
    }

    rafRef.current = requestAnimationFrame(drawFrame);
  }, []); // no deps — uses refs only

  const startCamera = useCallback(async (facing: "user" | "environment" = "user") => {
    try {
      streamRef.current?.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      // Start RAF loop once, keep it running
      if (!rafRunning.current) {
        rafRunning.current = true;
        drawFrame();
      }
      setPhase("preview");
    } catch {
      setPhase("error");
    }
  }, [drawFrame]);

  useEffect(() => {
    if (canRecord()) startCamera("user");
    return () => {
      rafRunning.current = false;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []); // only on mount/unmount

  const flipCamera = () => {
    const next: "user" | "environment" = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    facingModeRef.current = next;
    startCamera(next);
  };

  const toggleRecord = () => {
    if (phase === "preview") {
      // Start recording
      const canvas = canvasRef.current;
      const stream = streamRef.current;
      if (!canvas || !stream) return;

      const canvasStream = canvas.captureStream(30);
      stream.getAudioTracks().forEach(t => canvasStream.addTrack(t));

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";

      chunksRef.current = [];
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(canvasStream, { mimeType });
      } catch {
        try {
          recorder = new MediaRecorder(canvasStream);
        } catch {
          setPhase("error");
          return;
        }
      }

      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const url = URL.createObjectURL(blob);
        setVideoBlob(blob);
        setVideoUrl(url);
        setPhase("done");
      };
      recorder.start(250);
      recorderRef.current = recorder;

      setElapsed(0);
      setPhase("recording");

      timerRef.current = setInterval(() => {
        setElapsed(e => {
          if (e >= 59) {
            recorderRef.current?.stop();
            if (timerRef.current) clearInterval(timerRef.current);
            return 60;
          }
          return e + 1;
        });
      }, 1000);

    } else if (phase === "recording") {
      // Stop recording
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.stop();
    }
  };

  const retake = () => {
    setVideoUrl(null);
    setVideoBlob(null);
    setElapsed(0);
    setShareError(null);
    rafRunning.current = false;
    cancelAnimationFrame(rafRef.current);
    startCamera(facingMode);
  };

  const downloadVideo = () => {
    if (!videoUrl || !videoBlob) return;
    const ext = videoBlob.type.includes("mp4") ? "mp4" : "webm";
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `fitcheck-grwm-${Date.now()}.${ext}`;
    a.click();
  };

  const shareVideo = async (platform: "tiktok" | "facebook" | "general") => {
    if (!videoBlob) return;
    setShareError(null);
    const ext = videoBlob.type.includes("mp4") ? "mp4" : "webm";
    const file = new File([videoBlob], `fitcheck-grwm.${ext}`, { type: videoBlob.type });
    const text = platform === "tiktok"
      ? "Check my outfit today with FIT✔️! #GRWM #FitCheck #OOTD"
      : platform === "facebook"
      ? "Getting ready with today's weather-based outfit from FIT✔️!"
      : "My GRWM with FIT✔️";

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "My FIT✔️ GRWM", text });
      } catch (e: any) {
        if (e?.name !== "AbortError") setShareError("Share failed — try Save instead.");
      }
    } else {
      downloadVideo();
    }
  };

  const handleNativeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoBlob(file);
    setVideoUrl(URL.createObjectURL(file));
    setPhase("done");
  };

  // ── Unsupported ──
  if (phase === "unsupported") {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-6 p-8 z-50">
        <button onClick={() => navigate("/")} className="absolute top-12 left-4 text-white/60 flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <span className="text-5xl">🎬</span>
        <div className="text-center">
          <h2 className="text-white font-bold text-xl mb-2">FIT✔️ GRWM</h2>
          <p className="text-white/60 text-sm mb-6">In-app recording isn't available on this browser. Record a video with your camera app, then upload it here to share.</p>
        </div>
        <input type="file" accept="video/*" ref={fileInputRef} className="hidden" onChange={handleNativeUpload} />
        <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 rounded-2xl bg-[#FF9500] text-white font-bold text-base">
          Upload a Video
        </button>
      </div>
    );
  }

  // ── Error ──
  if (phase === "error") {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-6 p-8 z-50">
        <button onClick={() => navigate("/")} className="absolute top-12 left-4 text-white/60 flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <span className="text-5xl">📵</span>
        <div className="text-center">
          <h2 className="text-white font-bold text-xl mb-2">Camera Access Needed</h2>
          <p className="text-white/60 text-sm">Allow camera and microphone access in your browser settings, then try again.</p>
        </div>
        <button onClick={() => startCamera(facingMode)} className="px-8 py-3 rounded-2xl bg-[#FF9500] text-white font-bold">Try Again</button>
        <div className="w-full border-t border-white/10 pt-4">
          <p className="text-white/40 text-xs text-center mb-3">Or upload an existing video</p>
          <input type="file" accept="video/*" ref={fileInputRef} className="hidden" onChange={handleNativeUpload} />
          <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 rounded-2xl border border-white/20 text-white/70 font-medium text-sm">
            Upload Video
          </button>
        </div>
      </div>
    );
  }

  // ── Done / Share ──
  if (phase === "done" && videoUrl) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col z-50">
        <div className="relative flex-1 overflow-hidden">
          <video ref={previewVideoRef} src={videoUrl} className="absolute inset-0 w-full h-full object-cover" playsInline autoPlay loop />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />
          <div className="absolute top-0 left-0 right-0 px-4 pt-12 pb-4 flex items-center">
            <button onClick={retake} className="w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-white font-bold text-base flex-1 text-center">Share Your Fit</span>
            <div className="w-9" />
          </div>
        </div>

        <div className="bg-[#111] px-5 pt-5 pb-10 space-y-3">
          <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-1">Upload to</p>

          <button onClick={() => shareVideo("tiktok")} className="w-full flex items-center gap-4 bg-white/5 active:bg-white/10 rounded-2xl px-4 py-4 border border-white/10">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #010101 0%, #69C9D0 50%, #EE1D52 100%)" }}>
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.05a8.18 8.18 0 004.78 1.52V7.13a4.85 4.85 0 01-1.01-.44z" /></svg>
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-semibold">TikTok</p>
              <p className="text-white/50 text-xs">Opens share sheet</p>
            </div>
            <Share2 className="w-4 h-4 text-white/30 shrink-0" />
          </button>

          <button onClick={() => shareVideo("facebook")} className="w-full flex items-center gap-4 bg-white/5 active:bg-white/10 rounded-2xl px-4 py-4 border border-white/10">
            <div className="w-11 h-11 rounded-xl bg-[#1877F2] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-semibold">Facebook Reels</p>
              <p className="text-white/50 text-xs">Opens share sheet</p>
            </div>
            <Share2 className="w-4 h-4 text-white/30 shrink-0" />
          </button>

          <div className="flex gap-3 pt-1">
            <button onClick={() => shareVideo("general")} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/15 text-white/80 font-medium text-sm">
              <Share2 className="w-4 h-4" /> More
            </button>
            <button onClick={downloadVideo} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/15 text-white/80 font-medium text-sm">
              <Download className="w-4 h-4" /> Save
            </button>
          </div>

          {shareError && <p className="text-red-400 text-xs text-center">{shareError}</p>}
          <p className="text-white/25 text-[10px] text-center">Tap TikTok or Facebook to open your phone's share sheet.</p>
        </div>
      </div>
    );
  }

  // ── Camera viewfinder ──
  return (
    <div className="fixed inset-0 bg-black overflow-hidden z-50">
      <video ref={videoRef} className="hidden" playsInline muted />

      {/* Canvas — no CSS transform; flipping is done inside drawFrame */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />

      {/* Recording border pulse */}
      <AnimatePresence>
        {phase === "recording" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 border-[5px] border-red-500 pointer-events-none z-30"
            style={{ boxShadow: "inset 0 0 40px rgba(239,68,68,0.3)" }} />
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/")} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur flex items-center justify-center border border-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FF9500]/20 border border-[#FF9500]/40 flex items-center justify-center">
              <span className="text-[#FF9500] font-black text-sm leading-none">F</span>
            </div>
            <div>
              <span className="text-white font-black text-sm tracking-tight leading-none block">FIT✔️</span>
              <span className="text-white/50 text-[9px] uppercase tracking-widest font-semibold leading-tight block">Get Ready With Me</span>
            </div>
          </div>
          <button onClick={flipCamera} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur flex items-center justify-center border border-white/10">
            <RefreshCw className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Timer */}
      {phase === "recording" && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/50 backdrop-blur rounded-full px-4 py-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white font-mono text-sm font-bold">{formatTime(elapsed)}</span>
        </div>
      )}

      {/* Bottom controls — fixed to bottom, no scroll */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 via-black/60 to-transparent">
        {/* Filter strip */}
        <div className="flex gap-3 overflow-x-auto px-4 pt-8 pb-4" style={{ scrollbarWidth: "none" }}>
          {FILTERS.map((f, i) => (
            <button key={f.name} onClick={() => setFilterIdx(i)} className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`w-14 h-14 rounded-2xl border-2 transition-all duration-200 overflow-hidden ${i === filterIdx ? "border-[#FF9500] scale-105 shadow-lg shadow-[#FF9500]/30" : "border-white/20"}`}
                style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)", filter: f.css === "none" ? undefined : f.css }}>
                <div className="w-full h-full flex items-end justify-center pb-1.5">
                  <div className="w-5 h-9 rounded-sm bg-white/25" />
                </div>
              </div>
              <span className={`text-[10px] font-semibold ${i === filterIdx ? "text-[#FF9500]" : "text-white/55"}`}>{f.name}</span>
            </button>
          ))}
        </div>

        {/* Record button */}
        <div className="flex items-center justify-center py-6">
          <button onClick={toggleRecord} className="relative flex items-center justify-center w-24 h-24">
            <div className={`absolute inset-0 rounded-full border-4 transition-colors duration-200 ${phase === "recording" ? "border-red-500" : "border-white/70"}`} />
            <motion.div
              animate={phase === "recording"
                ? { borderRadius: "10px", width: "36px", height: "36px" }
                : { borderRadius: "9999px", width: "60px", height: "60px" }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-red-500 shadow-lg shadow-red-500/40"
            />
          </button>
        </div>
        <p className="text-white/40 text-[11px] text-center pb-8 font-medium -mt-3">
          {phase === "preview" ? "Tap to record" : "Tap to stop"}
        </p>
      </div>
    </div>
  );
}
