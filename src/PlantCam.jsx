import { useState, useEffect, useRef, useCallback } from "react";
import Hls from "hls.js";

const HLS_URL = "/cam/hls/stream.m3u8";
const SNAPSHOT_URL = "/cam/snapshot";
const STATUS_URL = "/api/cam/status";
const TIMELAPSE_URL = "/api/timelapse";

function StatusDot({ status }) {
  const color = status === "live" ? "#22c55e" : status === "degraded" ? "#eab308" : "#ef4444";
  const label = status === "live" ? "Stream Live" : status === "degraded" ? "Camera Only" : "Offline";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block", boxShadow: status === "live" ? `0 0 6px ${color}` : "none" }} />
      {label}
    </span>
  );
}

function HLSPlayer({ onStatusChange }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const initHls = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    setError(null);
    setLoading(true);
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = HLS_URL;
      video.addEventListener("loadeddata", () => { setLoading(false); onStatusChange?.("live"); }, { once: true });
      video.addEventListener("error", () => { setError("stream_error"); setLoading(false); onStatusChange?.("offline"); }, { once: true });
      video.play().catch(() => {});
      return;
    }
    if (!Hls.isSupported()) {
      setError("hls_unsupported");
      setLoading(false);
      return;
    }
    const hls = new Hls({ liveSyncDurationCount: 3, liveMaxLatencyDurationCount: 8, liveDurationInfinity: true, maxBufferLength: 30, maxMaxBufferLength: 60, maxBufferSize: 30 * 1024 * 1024, enableWorker: true, lowLatencyMode: false, backBufferLength: 2, startFragPrefetch: true, fragLoadingMaxRetry: 6, fragLoadingRetryDelay: 500, manifestLoadingMaxRetry: 6, levelLoadingMaxRetry: 6 });
    hlsRef.current = hls;
    hls.loadSource(HLS_URL);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => { setLoading(false); onStatusChange?.("live"); video.play().catch(() => {}); });
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.details === "fragLoadError" || data.details === "fragLoadTimeOut") {
        hls.startLoad();
        return;
      }
      if (data.fatal) {
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
          return;
        }
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
          setTimeout(() => { if (hlsRef.current === hls) initHls(); }, 10000);
          return;
        }
        setError("stream_error");
        setLoading(false);
        onStatusChange?.("offline");
      }
    });
    const liveCheck = setInterval(() => {
      if (!hls.liveSyncPosition || !isFinite(hls.liveSyncPosition)) return;
      if (video.paused) { video.play().catch(() => {}); }
      const drift = hls.liveSyncPosition - video.currentTime;
      if (drift > 10) { video.currentTime = hls.liveSyncPosition; video.play().catch(() => {}); }
    }, 5000);
    hls._liveCheckInterval = liveCheck;
  }, [onStatusChange]);
  useEffect(() => {
    initHls();
    return () => { if (hlsRef.current) { clearInterval(hlsRef.current._liveCheckInterval); hlsRef.current.destroy(); } };
  }, [initHls]);
  if (error === "hls_unsupported") {
    return (
      <div style={{ background: "var(--card-alt)", borderRadius: 12, padding: 20, textAlign: "center" }}>
        <p style={{ color: "var(--text-sub)", fontSize: 13 }}>HLS not supported in this browser. Showing latest snapshot instead.</p>
        <img src={SNAPSHOT_URL} alt="Latest snapshot" style={{ maxWidth: "100%", borderRadius: 8, marginTop: 10 }} />
      </div>
    );
  }
  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: "#000" }}>
      {loading && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", zIndex: 2 }}>
          <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>Connecting to stream...</span>
        </div>
      )}
      {error && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", zIndex: 2, gap: 10 }}>
          <span style={{ color: "#f87171", fontSize: 14, fontWeight: 600 }}>Stream unavailable</span>
          <button onClick={initHls} style={{ background: "var(--tab-active)", color: "var(--tab-active-text)", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Retry</button>
          <img src={SNAPSHOT_URL} alt="Latest snapshot" style={{ maxWidth: "80%", borderRadius: 8, marginTop: 8, opacity: 0.7 }} onError={(e) => { e.target.style.display = "none"; }} />
        </div>
      )}
      <video ref={videoRef} muted autoPlay playsInline style={{ width: "100%", display: "block", borderRadius: 12 }} />
    </div>
  );
}

export default function PlantCam() {
  const [streamStatus, setStreamStatus] = useState("offline");
  const [camStatus, setCamStatus] = useState(null);
  const [dailyTL, setDailyTL] = useState([]);
  const [weeklyTL, setWeeklyTL] = useState([]);
  const [selectedTL, setSelectedTL] = useState(null);
  useEffect(() => {
    const fetchStatus = () => {
      fetch(STATUS_URL).then(r => r.json()).then(data => setCamStatus(data)).catch(() => {});
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    fetch(TIMELAPSE_URL).then(r => r.json()).then(data => { setDailyTL(data.daily || []); setWeeklyTL(data.weekly || []); }).catch(() => {});
  }, []);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-bold)", margin: 0 }}>Plant Cam</h2>
        <StatusDot status={camStatus?.overall || streamStatus} />
      </div>
      <HLSPlayer onStatusChange={setStreamStatus} />
      {camStatus && (
        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          {camStatus.hls && (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: 11 }}>
              <span style={{ color: "var(--text-sub)" }}>HLS: </span>
              <span style={{ fontWeight: 600, color: camStatus.hls.status === "live" ? "#22c55e" : "#ef4444" }}>{camStatus.hls.status}</span>
              {camStatus.hls.segments != null && <span style={{ color: "var(--text-muted)" }}> ({camStatus.hls.segments} segments)</span>}
            </div>
          )}
          {camStatus.camera && (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: 11 }}>
              <span style={{ color: "var(--text-sub)" }}>Camera: </span>
              <span style={{ fontWeight: 600, color: camStatus.camera.status === "online" ? "#22c55e" : "#ef4444" }}>{camStatus.camera.status}</span>
            </div>
          )}
        </div>
      )}
      {(weeklyTL.length > 0 || dailyTL.length > 0) && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-bold)", marginBottom: 10 }}>Timelapse Archive</h3>
          {weeklyTL.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-sub)", marginBottom: 6, display: "block" }}>Weekly</span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {weeklyTL.map(tl => (
                  <button key={tl.filename} onClick={() => setSelectedTL(selectedTL?.filename === tl.filename ? null : tl)} style={{ padding: "6px 12px", borderRadius: 8, border: selectedTL?.filename === tl.filename ? "2px solid var(--tab-active)" : "1px solid var(--chip-border)", background: selectedTL?.filename === tl.filename ? "var(--tab-active)" : "var(--tab-inactive)", color: selectedTL?.filename === tl.filename ? "var(--tab-active-text)" : "var(--tab-inactive-text)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                    {tl.label} <span style={{ opacity: 0.6, fontSize: 10 }}>({tl.size_mb}MB)</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {dailyTL.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-sub)", marginBottom: 6, display: "block" }}>Daily</span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {dailyTL.map(tl => (
                  <button key={tl.date} onClick={() => setSelectedTL(selectedTL?.date === tl.date ? null : tl)} style={{ padding: "6px 12px", borderRadius: 8, border: selectedTL?.date === tl.date ? "2px solid var(--tab-active)" : "1px solid var(--chip-border)", background: selectedTL?.date === tl.date ? "var(--tab-active)" : "var(--tab-inactive)", color: selectedTL?.date === tl.date ? "var(--tab-active-text)" : "var(--tab-inactive-text)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                    {tl.date} <span style={{ opacity: 0.6, fontSize: 10 }}>({tl.size_mb}MB)</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {selectedTL && (
            <video src={selectedTL.url} controls style={{ width: "100%", borderRadius: 12, background: "#000" }} />
          )}
        </div>
      )}
      <div style={{ marginTop: 20, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-bold)", marginBottom: 8 }}>Sensor Readings</h3>
        <p style={{ fontSize: 12, color: "var(--text-sub)", margin: 0 }}>Soil moisture, temperature, and light sensors coming soon.</p>
      </div>
    </div>
  );
}
