import React from "react";

export default function LoadingPage() {
  return (
    <div className="loading-overlay">
      <div className="loader-box">
        <div className="loader">
            <h2 data-text="Storage" className="loader-title_1">Storage</h2><br/>
            <h2 data-text="Assistance" className="loader-title_2">Assistance</h2>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar"></div>
        </div>
      </div>
    </div>
  );
}