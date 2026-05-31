import React, { useEffect, useRef } from "react";
import { styled } from "@mui/material/styles";

// ─── Component riêng để gán srcObject đúng cách ─────────────────────────────
// Dùng useEffect thay vì ref callback để đảm bảo srcObject được gán/cập nhật
// mỗi khi stream prop thay đổi (ref callback chỉ chạy lúc mount/unmount).
function RemoteVideoItem({ stream }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
  }, [stream]);

  return (
    <VideoCard>
      <RemoteVideo
        ref={videoRef}
        autoPlay
        playsInline
      />
    </VideoCard>
  );
}

// ─── Component riêng cho local video ────────────────────────────────────────
function LocalVideoItem({ stream }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
  }, [stream]);

  return (
    <LocalVideo
      ref={videoRef}
      autoPlay
      muted
      playsInline
    />
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function CallModalGroup({ localStream, remoteStreams, endCall }) {
  // remoteStreams là object { uid: MediaStream }
  const remoteEntries = Object.entries(remoteStreams || {});

  return (
    <Overlay>
      <CallContainer>

        {/* ===== REMOTE VIDEOS ===== */}
        <Grid count={remoteEntries.length}>

          {remoteEntries.length === 0 && (
            <WaitingText>Waiting for participants...</WaitingText>
          )}

          {remoteEntries.map(([uid, stream]) => (
            <RemoteVideoItem key={uid} stream={stream} />
          ))}

        </Grid>

        {/* ===== LOCAL VIDEO ===== */}
        {localStream && <LocalVideoItem stream={localStream} />}

        {/* ===== CONTROL ===== */}
        <ControlBar>
          <EndButton onClick={endCall}>⛔ End</EndButton>
        </ControlBar>

      </CallContainer>
    </Overlay>
  );
}

/* ================= STYLE ================= */

const Overlay = styled("div")(() => ({
  position: "fixed",
  inset: 0,
  background: "#000",
  zIndex: 9999,
}));

const CallContainer = styled("div")(() => ({
  position: "relative",
  width: "100%",
  height: "100%",
}));

const Grid = styled("div")(({ count }) => ({
  display: "grid",
  gridTemplateColumns: count <= 1
    ? "1fr"
    : count <= 4
    ? "repeat(2, 1fr)"
    : "repeat(3, 1fr)",
  gap: "12px",
  padding: "20px",
  width: "100%",
  height: "100%",
  overflowY: "auto",
  boxSizing: "border-box",
}));

const VideoCard = styled("div")(() => ({
  background: "#111",
  borderRadius: "14px",
  overflow: "hidden",
  position: "relative",
  minHeight: "240px",
}));

const RemoteVideo = styled("video")(() => ({
  width: "100%",
  height: "100%",
  objectFit: "cover",
  background: "#222",
  display: "block",
}));

const LocalVideo = styled("video")(() => ({
  position: "absolute",
  bottom: "90px",
  right: "20px",
  width: "220px",
  height: "140px",
  borderRadius: "14px",
  border: "2px solid white",
  objectFit: "cover",
  background: "#111",
  zIndex: 10000,
  display: "block",
}));

const ControlBar = styled("div")(() => ({
  position: "absolute",
  bottom: "20px",
  left: 0,
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));

const EndButton = styled("button")(() => ({
  padding: "14px 28px",
  borderRadius: "999px",
  background: "#ff3b30",
  color: "white",
  fontSize: "18px",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold",
}));

const WaitingText = styled("div")(() => ({
  color: "white",
  fontSize: "22px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
}));