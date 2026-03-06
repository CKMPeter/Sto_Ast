import React, { useEffect } from 'react'
import Navbar  from '../shared/Navbar';
import { border, color, fontWeight, maxWidth } from '@mui/system';

const styleSheet = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    padding: "2rem",
    tableLayout: "fixed",
  },
  titleContainer: {
    padding: "1rem 2rem 0rem",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#333",
    
  },
  th: {
    border: "1px solid #ddd",
    padding: "0.5rem",
    textAlign: "center",
    borderBottom: "transparent",
    borderTop: "transparent",
    color: "#555",
    fontWeight: "bold",
  },
  dateContainer: {
    border: "1px solid #ddd",
    padding: "2rem",
    textAlign: "center",
    //border: "transparent",
  },
}
const thisMonth = new Date().getMonth() + 1; // Get current month (0-11, so add 1)
const thisYear = new Date().getFullYear(); // Get current year
const startOfMonth = new Date(thisYear, thisMonth - 1 , 1).getDay(); // Get the day of the week for the first day of the month (0-6, where 0 is Sunday)
const today = new Date().getDate(); // Get current day of the month

var months = [ "January", "February", "March", "April", "May", "June", 
           "July", "August", "September", "October", "November", "December" ];

var selectedMonthName = months[thisMonth - 1]; // Adjust for 0-based indexing

function getDaysInMonth(month) {
  return new Date(thisYear, month, 0).getDate(); // Get number of days in the month
}

export default function Schedule() {
  useEffect(() => {
    console.log("Schedule component mounted");
    console.log("Current month:", thisMonth);
    console.log("Current year:", thisYear);
    console.log("Start of Month:", startOfMonth);
    console.log("Days in current month:", getDaysInMonth(thisMonth));
  }, []);

  return (
    <div>
        <Navbar />
        <div style={styleSheet.titleContainer}>
          <h2 style={styleSheet.title}>{selectedMonthName} {thisYear}</h2>
        </div>
        <div style={styleSheet.table}>
          {/* Schedule content would go here */}
          <table style={styleSheet.table}>
            <thead>
              <td style={styleSheet.th}>Sunday</td>
              <td style={styleSheet.th}>Monday</td>
              <td style={styleSheet.th}>Tuesday</td>
              <td style={styleSheet.th}>Wednesday</td>
              <td style={styleSheet.th}>Thursday</td>
              <td style={styleSheet.th}>Friday</td>
              <td style={styleSheet.th}>Saturday</td>
            </thead>
            <tbody>
              {/* Schedule rows would go here */}
                {Array.from({ length: 5 }, (_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }, (_, j) => {
                      const day = i * 7 + j - startOfMonth + 1;
                      const isCurrentMonth = day > 0 && day <= getDaysInMonth(thisMonth);
                      const isToday = day === today;

                      return (
                        <td
                          key={j}
                          style={{
                            ...styleSheet.dateContainer,
                            backgroundColor: isToday ? "#ffeb3b" : "transparent",
                          }}
                          onMouseEnter={(e) => (e.target.style.backgroundColor = "#f0f0f0")}
                          onMouseLeave={(e) =>
                            (e.target.style.backgroundColor = isToday ? "#ffeb3b" : "transparent")
                          }
                        >
                          {isCurrentMonth ? day : ""}
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
    </div>
  )
}
