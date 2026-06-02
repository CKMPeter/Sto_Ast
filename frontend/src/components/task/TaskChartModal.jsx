import React, { useMemo } from "react";
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

const COLORS = ["#ffc107", "#0d6efd", "#198754", "#dc3545"];

export default function TaskChartModal({ show, onClose, subtasks = [] }) {
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
      .map(([name, value]) => ({ name, value }));
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
      0,
    );

    let remaining = totalTimeLogged;

    const data = [{ date: "Start", remaining }];

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
    <Modal show={show} onHide={onClose} centered size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Task Analytics</Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ minHeight: "400px", height: "70vh", gap: "2rem" }}>
        <div
          style={{
            display: "flex",
            gap: "20px",
            width: "100%",
            height: "100%",
          }}
        >
          <div style={styles.chartBox}>
            <h5>Status Pie Chart</h5>

            {pieData.length > 0 ? (
              <div style={styles.chartArea}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label
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
              <p>No task status data available.</p>
            )}
          </div>

          <div style={styles.chartBox}>
            <h5>Burndown Chart</h5>

            {burndownData.length > 1 ? (
              <div style={styles.chartArea}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={burndownData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="remaining"
                      name="Remaining logged time (min)"
                      stroke="#dc3545"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p>No time logged data available.</p>
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

const styles = {
  chartBox: {
    flex: 1,
    minWidth: 0,
    height: "100%",
  },

  chartArea: {
    width: "100%",
    height: "calc(100% - 40px)",
    minHeight: "300px",
  },
};
