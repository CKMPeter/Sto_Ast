import React from "react";
import { useDarkMode } from "../../hooks/useDarkMode";

export default function LoadingPage() {
    const { darkMode, loading } = useDarkMode();
    if (loading) return null; // ⛔ avoid flicker on initial load
    return (
        <div className={`loading-overlay ${darkMode ? 'dark' : 'light'}`}>
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