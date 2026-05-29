import React from "react";
import { styled } from "@mui/material/styles";

export default function CallModal({
  localStream,
  remoteStream,
  endCall,
}) {

  return (
    <Overlay>

      <CallContainer>

        {/* REMOTE VIDEO */}
        <RemoteVideo
          autoPlay
          playsInline
          ref={(video) => {

            if (video && remoteStream) {
              video.srcObject = remoteStream;
            }
          }}
        />

        {/* LOCAL VIDEO */}
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

        {/* CONTROLS */}
        <ControlBar>

          <EndButton onClick={endCall}>
            ⛔
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
  background: "black",
  zIndex: 9999,
}));

const CallContainer = styled("div")(() => ({
  position: "relative",
  width: "100%",
  height: "100%",
}));

const RemoteVideo = styled("video")(() => ({
  width: "100%",
  height: "100%",
  objectFit: "cover",
  background: "#111",
}));

const LocalVideo = styled("video")(() => ({
  position: "absolute",
  bottom: "100px",
  right: "20px",
  width: "220px",
  height: "140px",
  borderRadius: "12px",
  border: "2px solid white",
  objectFit: "cover",
  background: "#111",
}));

const ControlBar = styled("div")(() => ({
  position: "absolute",
  bottom: "20px",
  width: "100%",
  display: "flex",
  justifyContent: "center",
}));

const EndButton = styled("button")(() => ({
  width: "70px",
  height: "70px",
  borderRadius: "50%",
  background: "red",
  color: "white",
  fontSize: "24px",
  border: "none",
  cursor: "pointer",
}));