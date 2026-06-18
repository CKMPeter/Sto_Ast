import React, { useEffect, useRef, useState, useCallback } from "react";
import { styled } from "@mui/material/styles";

// ============================================================
// HOOK — tắt/bật mic & cam (dùng chung cho cả 2 modal)
// ============================================================
function useMediaControls(localStream) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    setMicOn(true);
    setCamOn(true);
  }, [localStream]);

  const toggleMic = useCallback(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setMicOn((v) => !v);
  }, [localStream]);

  const toggleCam = useCallback(() => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setCamOn((v) => !v);
  }, [localStream]);

  return { micOn, camOn, toggleMic, toggleCam };
}

// ============================================================
// REMOTE VIDEO ITEM
// ============================================================
function RemoteVideoItem({ stream }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    if (video.srcObject !== stream) video.srcObject = stream;
  }, [stream]);

  return (
    <VideoCard>
      <RemoteVideo ref={videoRef} autoPlay playsInline />
    </VideoCard>
  );
}

// ============================================================
// LOCAL VIDEO ITEM
// ============================================================
function LocalVideoItem({ stream, camOn }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    if (video.srcObject !== stream) video.srcObject = stream;
  }, [stream]);

  return (
    <LocalVideoWrapper>
      <LocalVideo
        ref={videoRef} autoPlay muted playsInline
        style={{ display: camOn ? "block" : "none" }}
      />
      {!camOn && (
        <CamOffPlaceholder>🚫</CamOffPlaceholder>
      )}
    </LocalVideoWrapper>
  );
}

// ============================================================
// CONTROL BUTTON
// ============================================================
function CtrlBtn({ onClick, title, active, danger, children }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "60px", height: "60px", borderRadius: "50%", cursor: "pointer",
        fontSize: "24px", display: "flex", alignItems: "center", justifyContent: "center",
        border: active && !danger ? "2px solid rgba(255,255,255,0.5)" : "2px solid transparent",
        background: danger ? "#e53935" : active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
        transform: hover ? "scale(1.1)" : "scale(1)",
        transition: "transform 0.15s, background 0.15s",
        boxShadow: danger ? "0 4px 16px rgba(229,57,53,0.45)" : "none",
        color: "white",
      }}
    >
      {children}
    </button>
  );
}

// ============================================================
// MAIN
// ============================================================
export default function CallModalGroup({ localStream, remoteStreams, endCall }) {
  const remoteEntries = Object.entries(remoteStreams || {});
  const { micOn, camOn, toggleMic, toggleCam } = useMediaControls(localStream);

  return (
    <Overlay>
      <CallContainer>

        <Grid count={remoteEntries.length}>
          {remoteEntries.length === 0 && (
            <WaitingText>Đang chờ người tham gia...</WaitingText>
          )}
          {remoteEntries.map(([uid, stream]) => (
            <RemoteVideoItem key={uid} stream={stream} />
          ))}
        </Grid>

        {localStream && <LocalVideoItem stream={localStream} camOn={camOn} />}

        <ControlBar>
          <CtrlBtn onClick={toggleMic} title={micOn ? "Tắt mic" : "Bật mic"} active={micOn}>
            {micOn ? "🎤" : "🔇"}
          </CtrlBtn>

          <CtrlBtn onClick={toggleCam} title={camOn ? "Tắt cam" : "Bật cam"} active={camOn}>
            {camOn ? "📷" : "🚫"}
          </CtrlBtn>

          <CtrlBtn onClick={endCall} title="Rời cuộc gọi" danger>
            📵
          </CtrlBtn>
        </ControlBar>

      </CallContainer>
    </Overlay>
  );
}

/* ── STYLES ─────────────────────────────────────────────── */

const Overlay = styled("div")(() => ({
  position: "fixed", inset: 0, background: "#000", zIndex: 9999,
}));

const CallContainer = styled("div")(() => ({
  position: "relative", width: "100%", height: "100%",
}));

const Grid = styled("div")(({ count }) => ({
  display: "grid",
  gridTemplateColumns: count <= 1 ? "1fr" : count <= 4 ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
  gap: "12px",
  padding: "20px 20px 100px 20px", // bottom padding cho control bar
  width: "100%",
  height: "100%",
  overflowY: "auto",
  boxSizing: "border-box",
}));

const VideoCard = styled("div")(() => ({
  background: "#111", borderRadius: "14px", overflow: "hidden",
  position: "relative", minHeight: "240px",
}));

const RemoteVideo = styled("video")(() => ({
  width: "100%", height: "100%", objectFit: "cover", background: "#222", display: "block",
}));

const LocalVideoWrapper = styled("div")(() => ({
  position: "absolute", right: "20px", bottom: "100px",
  width: "200px", height: "130px", zIndex: 10000,
  borderRadius: "14px", overflow: "hidden",
  border: "2px solid rgba(255,255,255,0.25)",
  background: "#111",
}));

const LocalVideo = styled("video")(() => ({
  width: "100%", height: "100%", objectFit: "cover", display: "block",
}));

const CamOffPlaceholder = styled("div")(() => ({
  width: "100%", height: "100%", display: "flex",
  alignItems: "center", justifyContent: "center", fontSize: "36px",
}));

const ControlBar = styled("div")(() => ({
  position: "absolute", bottom: "20px", left: 0, width: "100%",
  display: "flex", justifyContent: "center", alignItems: "center", gap: "20px",
}));

const WaitingText = styled("div")(() => ({
  color: "white", fontSize: "20px",
  display: "flex", alignItems: "center", justifyContent: "center",
  width: "100%", height: "100%",
}));