import React from "react";
import { styled } from "@mui/material/styles";

export default function CallModalGroup({
  localStream,
  remoteStreams,
  endCall,
}) {

  // convert object -> array
  const remoteStreamList = Object.values(remoteStreams || {});

  return (
    <Overlay>
      <CallContainer>

        {/* ===== REMOTE VIDEOS ===== */}
        <Grid>

          {remoteStreamList.length === 0 && (
            <WaitingText>
              Waiting for participants...
            </WaitingText>
          )}

          {remoteStreamList.map((stream, index) => (
            <VideoCard key={index}>
              <RemoteVideo
                autoPlay
                playsInline
                ref={(video) => {
                  if (video && stream) {
                    video.srcObject = stream;
                  }
                }}
              />
            </VideoCard>
          ))}

        </Grid>

        {/* ===== LOCAL VIDEO ===== */}
        {localStream && (
          <LocalVideo
            autoPlay
            muted
            playsInline
            ref={(video) => {
              if (video && localStream) {
                video.srcObject = localStream;
              }
            }}
          />
        )}

        {/* ===== CONTROL ===== */}
        <ControlBar>

          <EndButton onClick={endCall}>
            ⛔ End
          </EndButton>

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

const Grid = styled("div")(() => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
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