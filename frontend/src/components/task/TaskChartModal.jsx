import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import { useDarkMode } from "../../hooks/useDarkMode";

const COLORS = ["#0077b6", "#005f92", "#48a6d9", "#d62828"];

export default function TaskChartModal({ show, onClose, subtasks = [] }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const { darkMode } = useDarkMode();

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const pieData = useMemo(() => {
    const counts = {
      "To do": 0,
      "In Progress": 0,
      Done: 0,
      Blocked: 0,
    };

    subtasks.forEach((task) => {
      const status = task.status || "To do";
      counts[status] = (counts[status] || 0) + 1;
    });

    return Object.entries(counts)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
      }));
  }, [subtasks]);

  const burndownData = useMemo(() => {
    const sorted = [...subtasks]
      .filter((task) => Number(task.timeLogged || 0) > 0)
      .sort((a, b) => {
        const dateA = a.updatedAt?._seconds || 0;
        const dateB = b.updatedAt?._seconds || 0;
        return dateA - dateB;
      });

    const totalTimeLogged = sorted.reduce(
      (sum, task) => sum + Number(task.timeLogged || 0),
      0
    );

    let remaining = totalTimeLogged;

    const data = [
      {
        date: "Start",
        remaining,
      },
    ];

    sorted.forEach((task) => {
      remaining -= Number(task.timeLogged || 0);

      const date = task.updatedAt?._seconds
        ? new Date(task.updatedAt._seconds * 1000).toLocaleDateString()
        : task.name || "Unknown";

      data.push({
        date,
        remaining: Math.max(remaining, 0),
      });
    });

    return data;
  }, [subtasks]);

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      size={isMobile ? undefined : "xl"}
      dialogClassName="task-chart-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Task Analytics</Modal.Title>
      </Modal.Header>

      <Modal.Body
        style={{
          ...styles(darkMode).modalBody,
          ...(isMobile ? styles(darkMode).modalBodyMobile : {}),
          backgroundColor: darkMode ? "#2a2a2a" : "#ffffff",
          color: darkMode ? "#ffffff" : "#000000",
        }}
      >
        <div
          style={{
            ...styles(darkMode).chartLayout,
            ...(isMobile ? styles(darkMode).chartLayoutMobile : {}),
          }}
        >
          <div
            style={{
              ...styles(darkMode).chartBox,
              ...(isMobile ? styles(darkMode).chartBoxMobile : {}),
              backgroundColor: darkMode ? "#3a3a3a" : "#f8f9fa",
              color: darkMode ? "#ffffff" : "#000000",
            }}
          >
            <h5 style={styles(darkMode).chartTitle}>Status Pie Chart</h5>

            {pieData.length > 0 ? (
              <div
                style={{
                  ...styles(darkMode).chartArea,
                  ...(isMobile ? styles(darkMode).chartAreaMobile : {}),
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={isMobile ? 65 : 90}
                      label={!isMobile}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p style={styles.emptyText}>No task status data available.</p>
            )}
          </div>

          <div
            style={{
              ...styles(darkMode).chartBox,
              ...(isMobile ? styles(darkMode).chartBoxMobile : {}),
              backgroundColor: darkMode ? "#3a3a3a" : "#f8f9fa",
              color: darkMode ? "#ffffff" : "#000000",
            }}
          >
            <h5 style={styles(darkMode).chartTitle}>Burndown Chart</h5>

            {burndownData.length > 1 ? (
              <div
                style={{
                  ...styles(darkMode).chartArea,
                  ...(isMobile ? styles(darkMode).chartAreaMobile : {}),
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={burndownData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                    />
                    <Tooltip />
                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="remaining"
                      name="Remaining logged time"
                      stroke="#d62828"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p style={styles(darkMode).emptyText}>No time logged data available.</p>
            )}
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

const styles = (darkMode) => ({
  modalBody: {
    minHeight: "400px",
    height: "70vh",
    overflow: "hidden",
  },

  modalBodyMobile: {
    height: "75vh",
    overflowY: "auto",
    padding: "12px",
  },

  chartLayout: {
    display: "flex",
    gap: "20px",
    width: "100%",
    height: "100%",
  },

  chartLayoutMobile: {
    flexDirection: "column",
    height: "auto",
  },

  chartBox: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    padding: "10px",
    border: "1px solid #caf0f8",
    borderRadius: "14px",
    backgroundColor: darkMode ? "#2a2a2a" : "#ffffff",
    color: darkMode ? "#ffffff" : "#000000",
  },

  chartBoxMobile: {
    height: "320px",
    minHeight: "320px",
  },

  chartTitle: {
    color: darkMode ? "#ffffff" : "#023047",
    fontWeight: "700",
    marginBottom: "10px",
  },

  chartArea: {
    width: "100%",
    height: "calc(100% - 40px)",
    minHeight: "300px",
  },

  chartAreaMobile: {
    minHeight: "250px",
    height: "250px",
  },

  emptyText: {
    color: darkMode ? "#adb5bd" : "#6c757d",
    marginTop: "20px",
  },
});