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

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase("preview");
    } catch {
      setPhase("error");
    }
  }, [facingMode]);

  useEffect(() => {
    if (canRecord()) startCamera();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startCamera]);

  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth || 1080;
    canvas.height = video.videoHeight || 1920;

    ctx.filter = FILTERS[filterIdx].css;
    ctx.save();
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.filter = "none";

    const loc = settings.location?.name;
    const temp = "Today's Fit";

    ctx.font = "bold 36px system-ui, sans-serif";
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(24, 24, canvas.width - 48, 110);

    ctx.fillStyle = "#FF9500";
    ctx.fillText("Fit Check", 44, 72);
    ctx.font = "26px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    if (loc) ctx.fillText(`📍 ${loc}`, 44, 112);
    ctx.fillText(`✨ ${temp}`, loc ? 300 : 44, 112);

    rafRef.current = requestAnimationFrame(drawFrame);
  }, [filterIdx, facingMode, settings.location?.name]);

  useEffect(() => {
    if (phase === "preview" || phase === "recording") {
      drawFrame();
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, drawFrame]);

  const startRecording = () => {
    const canvas = canvasRef.current;
    const stream = streamRef.current;
    if (!canvas || !stream) return;

    const canvasStream = canvas.captureStream(30);
    const audioTracks = stream.getAudioTracks();
    audioTracks.forEach(t => canvasStream.addTrack(t));

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : "video/mp4";

    chunksRef.current = [];
    const recorder = new MediaRecorder(canvasStream, { mimeType });
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setVideoBlob(blob);
      setVideoUrl(url);
      setPhase("done");
    };
    recorder.start(100);
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
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stop();
  };

  const retake = () => {
    setVideoUrl(null);
    setVideoBlob(null);
    setElapsed(0);
    setShareError(null);
    startCamera();
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
    const fileName = `fitcheck-grwm.${ext}`;
    const file = new File([videoBlob], fileName, { type: videoBlob.type });

    const title = "My Fit Check GRWM";
    const text = platform === "tiktok"
      ? "Check my outfit today with Fit Check! #GRWM #FitCheck #OOTD"
      : platform === "facebook"
      ? "Getting ready with today's weather-based outfit from Fit Check!"
      : "My GRWM with Fit Check";

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title, text });
      } catch (e: any) {
        if (e?.name !== "AbortError") setShareError("Share failed. Try downloading the video.");
      }
    } else {
      downloadVideo();
    }
  };

  const handleNativeVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoBlob(file);
    setVideoUrl(url);
    setPhase("done");
  };

  if (phase === "unsupported") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 p-8">
        <button onClick={() => navigate("/")} className="absolute top-12 left-4 text-white/60 flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
          <span className="text-3xl">🎬</span>
        </div>
        <div className="text-center">
          <h2 className="text-white font-bold text-xl mb-2">Fit Check Cam</h2>
          <p className="text-white/60 text-sm mb-6">Your browser doesn't support in-app recording. Record a video with your camera app instead, then upload it here to share.</p>
        </div>
        <input type="file" accept="video/*" ref={fileInputRef} className="hidden" onChange={handleNativeVideoUpload} />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-4 rounded-2xl bg-[#FF9500] text-white font-bold text-base"
        >
          Upload a Video
        </button>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 p-8">
        <button onClick={() => navigate("/")} className="absolute top-12 left-4 text-white/60 flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <span className="text-5xl">📵</span>
        <div className="text-center">
          <h2 className="text-white font-bold text-xl mb-2">Camera Access Needed</h2>
          <p className="text-white/60 text-sm">Allow camera access in your browser settings and try again.</p>
        </div>
        <button onClick={startCamera} className="px-8 py-3 rounded-2xl bg-[#FF9500] text-white font-bold">Try Again</button>
        <div className="w-full border-t border-white/10 pt-4">
          <p className="text-white/40 text-xs text-center mb-3">Or upload a video you've already recorded</p>
          <input type="file" accept="video/*" ref={fileInputRef} className="hidden" onChange={handleNativeVideoUpload} />
          <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 rounded-2xl border border-white/20 text-white/70 font-medium text-sm">
            Upload Video
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done" && videoUrl) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Preview */}
        <div className="relative flex-1 overflow-hidden">
          <video
            ref={previewVideoRef}
            src={videoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            autoPlay
            loop
            muted={false}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />
          <div className="absolute top-0 left-0 right-0 px-4 pt-12 pb-4 flex items-center gap-3">
            <button onClick={retake} className="flex items-center gap-2 text-white/80">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-white font-bold text-lg flex-1 text-center">Share Your Fit</span>
            <div className="w-5" />
          </div>
        </div>

        {/* Share panel */}
        <div className="bg-[#111] px-5 pt-5 pb-10 space-y-3">
          <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-4">Upload to</p>

          {/* TikTok */}
          <button
            onClick={() => shareVideo("tiktok")}
            className="w-full flex items-center gap-4 bg-white/5 active:bg-white/10 rounded-2xl px-4 py-4 border border-white/10 transition-colors"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #010101 0%, #69C9D0 50%, #EE1D52 100%)" }}>
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.05a8.18 8.18 0 004.78 1.52V7.13a4.85 4.85 0 01-1.01-.44z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-semibold">TikTok</p>
              <p className="text-white/50 text-xs">Opens your share sheet</p>
            </div>
            <Share2 className="w-4 h-4 text-white/30" />
          </button>

          {/* Facebook */}
          <button
            onClick={() => shareVideo("facebook")}
            className="w-full flex items-center gap-4 bg-white/5 active:bg-white/10 rounded-2xl px-4 py-4 border border-white/10 transition-colors"
          >
            <div className="w-11 h-11 rounded-xl bg-[#1877F2] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-semibold">Facebook Reels</p>
              <p className="text-white/50 text-xs">Opens your share sheet</p>
            </div>
            <Share2 className="w-4 h-4 text-white/30" />
          </button>

          {/* More / Download */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => shareVideo("general")}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/15 text-white/80 font-medium text-sm"
            >
              <Share2 className="w-4 h-4" /> More
            </button>
            <button
              onClick={downloadVideo}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/15 text-white/80 font-medium text-sm"
            >
              <Download className="w-4 h-4" /> Save
            </button>
          </div>

          {shareError && (
            <p className="text-red-400 text-xs text-center pt-1">{shareError}</p>
          )}

          <p className="text-white/25 text-[10px] text-center pt-2">
            Tap TikTok or Facebook to open your phone's share sheet and choose where to post.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Hidden live video feed */}
      <video ref={videoRef} className="hidden" playsInline muted />

      {/* Canvas — filtered camera output */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
      />

      {/* Recording border */}
      <AnimatePresence>
        {phase === "recording" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 border-4 border-red-500 pointer-events-none z-30 rounded-none"
            style={{ boxShadow: "inset 0 0 30px rgba(239,68,68,0.3)" }}
          />
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/")} className="w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center border border-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FF9500]/20 border border-[#FF9500]/40 flex items-center justify-center">
              <span className="text-[#FF9500] font-black text-sm leading-none">F</span>
            </div>
            <span className="text-white font-black text-sm tracking-tight">Fit Check</span>
          </div>

          <button
            onClick={() => {
              setFacingMode(m => m === "user" ? "environment" : "user");
            }}
            className="w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center border border-white/10"
          >
            <RefreshCw className="w-4 h-4 text-white" />
          </button>
        </div>

        {settings.location?.name && (
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md rounded-full px-3 py-1 border border-white/10">
              <span className="text-white/80 text-xs font-medium">📍 {settings.location.name}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#FF9500]/20 backdrop-blur-md rounded-full px-3 py-1 border border-[#FF9500]/30">
              <span className="text-[#FF9500] text-xs font-semibold">✨ Today's Fit</span>
            </div>
          </div>
        )}
      </div>

      {/* Timer */}
      {phase === "recording" && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/40 backdrop-blur rounded-full px-3 py-1">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white font-mono text-sm font-bold">{formatTime(elapsed)}</span>
        </div>
      )}

      {/* Filter strip + record controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-10 px-4">
        {/* Filters */}
        <div className="flex gap-3 overflow-x-auto pb-5" style={{ scrollbarWidth: "none" }}>
          {FILTERS.map((f, i) => (
            <button key={f.name} onClick={() => setFilterIdx(i)} className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={`w-14 h-14 rounded-2xl border-2 transition-all duration-200 overflow-hidden ${i === filterIdx ? "border-[#FF9500] scale-105 shadow-lg shadow-[#FF9500]/30" : "border-white/20"}`}
                style={{
                  background: "linear-gradient(135deg, #1a1a2e, #16213e)",
                  filter: f.css === "none" ? undefined : f.css,
                }}
              >
                <div className="w-full h-full flex items-end justify-center pb-1.5">
                  <div className="w-5 h-9 rounded-sm bg-white/25" />
                </div>
              </div>
              <span className={`text-[10px] font-semibold ${i === filterIdx ? "text-[#FF9500]" : "text-white/55"}`}>{f.name}</span>
            </button>
          ))}
        </div>

        {/* Record row */}
        <div className="flex items-center justify-center mt-1">
          <button
            onPointerDown={phase === "preview" ? startRecording : undefined}
            onPointerUp={phase === "recording" ? stopRecording : undefined}
            onClick={phase === "recording" ? stopRecording : undefined}
            className="relative flex items-center justify-center"
          >
            <div className={`absolute w-20 h-20 rounded-full border-4 transition-colors duration-200 ${phase === "recording" ? "border-red-500" : "border-white/70"}`} />
            <motion.div
              animate={phase === "recording"
                ? { borderRadius: "8px", width: "34px", height: "34px" }
                : { borderRadius: "9999px", width: "56px", height: "56px" }
              }
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-red-500 shadow-lg shadow-red-500/40"
            />
          </button>
        </div>
        <p className="text-white/40 text-[11px] text-center mt-3 font-medium">
          {phase === "preview" ? "Tap to record" : "Tap to stop"}
        </p>
      </div>
    </div>
  );
}
