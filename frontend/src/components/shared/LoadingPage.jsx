import React from "react";
import { useDarkMode } from "../../hooks/useDarkMode";

export default function LoadingPage(darkMode) {
  const { loading } = useDarkMode();

  if (loading) return null;

  return (
    <div
      style={{
        ...styleSheet.loadingOverlay,
        ...(darkMode ? styleSheet.loadingOverlayDark : styleSheet.loadingOverlayLight),
      }}
    >
      <style>
        {`
          @keyframes loadingText {
            0%, 10%, 100% {
              width: 0;
            }
            70%, 90% {
              width: 100%;
            }
          }

          @keyframes progressAnim {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}
      </style>

      <div style={styleSheet.loaderBox}>
        <div
          style={{
            ...styleSheet.loader,
            backgroundColor: darkMode ? "#121212" : "#f8fdff",
          }}
        >
          <h2 style={styleSheet.loaderTitle}>
            <span style={styleSheet.strokeText}>Storage</span>
            <span style={styleSheet.fillTextBlue}>Storage</span>
          </h2>

          <h2 style={styleSheet.loaderTitle}>
            <span style={styleSheet.strokeText}>Assistance</span>
            <span style={styleSheet.fillTextWhite}>Assistance</span>
          </h2>
        </div>

        <div style={styleSheet.progressBarContainer}>
          <div style={styleSheet.progressBar}></div>
        </div>
      </div>
    </div>
  );
}

const styleSheet = {
  loadingOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },

  loadingOverlayDark: {
    backgroundColor: "#121212",
  },

  loadingOverlayLight: {
    backgroundColor: "#f8fdff",
  },

  loaderBox: {
    textAlign: "center",
    width: "100%",
    maxWidth: "400px",
    padding: "0 20px",
  },

  loader: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "50vh",
  },

  loaderTitle: {
    fontSize: "clamp(2rem, 7vw, 5rem)",
    marginBottom: "1rem",
    position: "relative",
    color: "transparent",
    WebkitTextStroke: "2px #0077b6",
    textTransform: "uppercase",
    fontWeight: "bold",
    lineHeight: 1.1,
  },

  strokeText: {
    color: "transparent",
    WebkitTextStroke: "2px #0077b6",
  },

  fillTextBlue: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 0,
    height: "100%",
    color: "#0077b6",
    WebkitTextStroke: "0px transparent",
    borderRight: "2px solid #0077b6",
    overflow: "hidden",
    whiteSpace: "nowrap",
    animation: "loadingText 2s linear infinite",
  },

  fillTextWhite: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 0,
    height: "100%",
    color: "#023e5a",
    WebkitTextStroke: "0px transparent",
    borderRight: "2px solid #023e5a",
    overflow: "hidden",
    whiteSpace: "nowrap",
    animation: "loadingText 2s linear infinite",
  },

  progressBarContainer: {
    height: "12px",
    width: "100%",
    backgroundColor: "#d9eef8",
    borderRadius: "10px",
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    width: "100%",
    background: "linear-gradient(270deg, #005f92, #0077b6)",
    animation: "progressAnim 2s infinite linear",
  },
};