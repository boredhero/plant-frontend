import { useState, useEffect, useRef, useCallback } from "react";
import Hls from "hls.js";

const STATUS_URL = "/api/cam/status";
const TIMELAPSE_URL = "/api/timelapse";
const INFO_URL = "/api/info";

function StatusDot({ status }) {
  const color = status === "live" ? "#22c55e" : status === "degraded" ? "#eab308" : status === "connecting" ? "#60a5fa" : "#ef4444";
  const label = status === "live" ? "Stream Live" : status === "degraded" ? "Camera Only" : status === "connecting" ? "Connecting..." : "Offline";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block", boxShadow: status === "live" ? `0 0 6px ${color}` : "none" }} />
      {label}
    </span>
  );
}

function HLSPlayer({ hlsUrl, snapshotUrl, onStatusChange }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const initHls = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (hlsRef.current) { clearInterval(hlsRef.current._liveCheckInterval); hlsRef.current.destroy(); hlsRef.current = null; }
    setError(null);
    setLoading(true);
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
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
    const hls = new Hls({ liveSyncDurationCount: 3, liveMaxLatencyDurationCount: 8, liveDurationInfinity: true, maxBufferLength: 30, maxMaxBufferLength: 60, maxBufferSize: 30 * 1024 * 1024, enableWorker: true, lowLatencyMode: false, backBufferLength: 2, startFragPrefetch: true, fragLoadingMaxRetry: Infinity, fragLoadingRetryDelay: 1000, manifestLoadingMaxRetry: Infinity, levelLoadingMaxRetry: Infinity });
    hlsRef.current = hls;
    hls.loadSource(hlsUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => { setLoading(false); onStatusChange?.("live"); video.play().catch(() => {}); });
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.details === "fragLoadError" || data.details === "fragLoadTimeOut") { hls.startLoad(); return; }
      if (data.fatal) {
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) { hls.recoverMediaError(); return; }
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) { hls.startLoad(); setTimeout(() => { if (hlsRef.current === hls) initHls(); }, 10000); return; }
        setError("reconnect");
        setLoading(false);
        onStatusChange?.("offline");
        setTimeout(() => { if (hlsRef.current === hls) initHls(); }, 5000);
      }
    });
    const liveCheck = setInterval(() => {
      if (!hls.liveSyncPosition || !isFinite(hls.liveSyncPosition)) return;
      if (video.paused) { video.play().catch(() => {}); }
      const drift = hls.liveSyncPosition - video.currentTime;
      if (drift > 10) { video.currentTime = hls.liveSyncPosition; video.play().catch(() => {}); }
    }, 5000);
    hls._liveCheckInterval = liveCheck;
  }, [hlsUrl, onStatusChange]);
  useEffect(() => {
    initHls();
    const onVisible = () => { if (document.visibilityState === "visible" && hlsRef.current) initHls(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { document.removeEventListener("visibilitychange", onVisible); if (hlsRef.current) { clearInterval(hlsRef.current._liveCheckInterval); hlsRef.current.destroy(); } };
  }, [initHls]);
  if (error === "hls_unsupported") {
    return (
      <div style={{ background: "var(--card-alt)", borderRadius: 12, padding: 20, textAlign: "center" }}>
        <p style={{ color: "var(--text-sub)", fontSize: 13 }}>HLS not supported in this browser. Showing latest snapshot instead.</p>
        {snapshotUrl && <img src={snapshotUrl} alt="Latest snapshot" style={{ maxWidth: "100%", borderRadius: 8, marginTop: 10 }} />}
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
          <span style={{ color: error === "reconnect" ? "#fbbf24" : "#f87171", fontSize: 14, fontWeight: 600 }}>{error === "reconnect" ? "Reconnecting..." : "Stream unavailable"}</span>
          <button onClick={initHls} style={{ background: "var(--tab-active)", color: "var(--tab-active-text)", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{error === "reconnect" ? "Reconnect Now" : "Retry"}</button>
          {snapshotUrl && <img src={snapshotUrl} alt="Latest snapshot" style={{ maxWidth: "80%", borderRadius: 8, marginTop: 8, opacity: 0.7 }} onError={(e) => { e.target.style.display = "none"; }} />}
        </div>
      )}
      <video ref={videoRef} muted autoPlay playsInline style={{ width: "100%", display: "block", borderRadius: 12 }} />
    </div>
  );
}

const CAMERAS = [
  { id: 1, label: "Cam 1", hlsUrl: "/cam/hls/stream.m3u8", snapshotUrl: "/cam/snapshot" },
  { id: 2, label: "Cam 2", hlsUrl: "/cam2/hls/stream.m3u8", snapshotUrl: "/cam2/snapshot" },
];

export default function PlantCam() {
  const [activeCam, setActiveCam] = useState(CAMERAS[0]);
  const [streamStatus, setStreamStatus] = useState("connecting");
  const [camStatus, setCamStatus] = useState(null);
  const [backendVersion, setBackendVersion] = useState(null);
  const [dailyTL, setDailyTL] = useState([]);
  const [weeklyTL, setWeeklyTL] = useState([]);
  const [selectedTL, setSelectedTL] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState(null);
  const resetStream = () => {
    setResetting(true);
    setResetMsg(null);
    fetch(`/api/cam/reset/${activeCam.id}`, { method: "POST" }).then(r => {
      if (r.status === 429) { return r.json().then(data => { setResetMsg(data.message); setResetting(false); }); }
      setTimeout(() => { setResetting(false); setStreamStatus("connecting"); }, 3000);
    }).catch(() => setResetting(false));
  };
  useEffect(() => {
    const fetchStatus = () => {
      fetch(STATUS_URL).then(r => r.json()).then(data => setCamStatus(data)).catch(() => {});
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    fetch(INFO_URL).then(r => r.json()).then(data => setBackendVersion(data.version)).catch(() => {});
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
      <div style={{ display: "flex", gap: 6, marginBottom: 10, alignItems: "center" }}>
        {CAMERAS.length > 1 && CAMERAS.map(cam => (
          <button key={cam.id} onClick={() => { setActiveCam(cam); setStreamStatus("connecting"); }} style={{ padding: "5px 14px", borderRadius: 8, border: activeCam.id === cam.id ? "2px solid var(--tab-active)" : "1px solid var(--chip-border)", background: activeCam.id === cam.id ? "var(--tab-active)" : "var(--tab-inactive)", color: activeCam.id === cam.id ? "var(--tab-active-text)" : "var(--tab-inactive-text)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {cam.label}
          </button>
        ))}
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {resetMsg && <span style={{ fontSize: 10, color: "#f87171" }}>{resetMsg}</span>}
          <button onClick={resetStream} disabled={resetting} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid var(--chip-border)", background: "var(--tab-inactive)", color: "var(--tab-inactive-text)", fontSize: 11, fontWeight: 500, cursor: resetting ? "wait" : "pointer", opacity: resetting ? 0.5 : 0.7 }}>
            {resetting ? "Resetting..." : "Reset Stream"}
          </button>
        </span>
      </div>
      <HLSPlayer key={activeCam.id} hlsUrl={activeCam.hlsUrl} snapshotUrl={activeCam.snapshotUrl} onStatusChange={setStreamStatus} />
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
      {(weeklyTL.length > 0 || dailyTL.length > 0) && (() => {
        const camIds = [...new Set([...dailyTL, ...weeklyTL].map(t => t.cam_id).filter(Boolean))].sort();
        const camLabels = {};
        [...dailyTL, ...weeklyTL].forEach(t => { if (t.cam_id) camLabels[t.cam_id] = t.cam; });
        return (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-bold)", marginBottom: 10 }}>Timelapse Archive</h3>
            <div style={{ display: "grid", gridTemplateColumns: camIds.length > 1 ? "1fr 1fr" : "1fr", gap: 16 }}>
              {camIds.map(camId => {
                const camDaily = dailyTL.filter(t => t.cam_id === camId);
                const camWeekly = weeklyTL.filter(t => t.cam_id === camId);
                return (
                  <div key={camId} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-bold)", display: "block", marginBottom: 8 }}>{camLabels[camId] || `Camera ${camId}`}</span>
                    {camWeekly.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Weekly</span>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {camWeekly.map(tl => (
                            <button key={tl.url} onClick={() => setSelectedTL(selectedTL?.url === tl.url ? null : tl)} style={{ padding: "4px 10px", borderRadius: 6, border: selectedTL?.url === tl.url ? "2px solid var(--tab-active)" : "1px solid var(--chip-border)", background: selectedTL?.url === tl.url ? "var(--tab-active)" : "var(--tab-inactive)", color: selectedTL?.url === tl.url ? "var(--tab-active-text)" : "var(--tab-inactive-text)", fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
                              {tl.label} <span style={{ opacity: 0.5, fontSize: 9 }}>({tl.size_mb}MB)</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {camDaily.length > 0 && (
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Daily</span>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {camDaily.map(tl => (
                            <button key={tl.url} onClick={() => setSelectedTL(selectedTL?.url === tl.url ? null : tl)} style={{ padding: "4px 10px", borderRadius: 6, border: selectedTL?.url === tl.url ? "2px solid var(--tab-active)" : "1px solid var(--chip-border)", background: selectedTL?.url === tl.url ? "var(--tab-active)" : "var(--tab-inactive)", color: selectedTL?.url === tl.url ? "var(--tab-active-text)" : "var(--tab-inactive-text)", fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
                              {tl.date} <span style={{ opacity: 0.5, fontSize: 9 }}>({tl.size_mb}MB)</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {selectedTL && (
              <video src={selectedTL.url} controls preload="auto" style={{ width: "100%", borderRadius: 12, background: "#000", marginTop: 12 }} />
            )}
          </div>
        );
      })()}
      <div style={{ marginTop: 20, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 80 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-bold)", marginBottom: 4, margin: 0 }}>Sensor Readings</h3>
        <p style={{ fontSize: 12, color: "var(--text-sub)", margin: "4px 0 0 0" }}>Soil moisture, temperature, and light sensors coming soon.</p>
      </div>
      <div style={{ marginTop: 16, fontSize: 10, color: "var(--text-muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>
          {"source: "}
          <a href="https://github.com/boredhero/plant-frontend" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-muted)", textDecoration: "underline", textUnderlineOffset: 2 }}>frontend</a>
          {" / "}
          <a href="https://github.com/boredhero/plant-backend" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-muted)", textDecoration: "underline", textUnderlineOffset: 2 }}>backend</a>
        </span>
        {backendVersion && <span>v{backendVersion}</span>}
      </div>
    </div>
  );
}
