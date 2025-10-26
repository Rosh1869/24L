import jsPDF from "jspdf";

type Worklog = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
};

const HOURLY_RATE = 6;
const GBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

function toHoursAndMinutes(totalHoursNum: number) {
  const h = Math.trunc(totalHoursNum || 0);
  let m = Math.round(((totalHoursNum || 0) - h) * 60);
  let H = h;
  if (m === 60) {
    H += 1;
    m = 0;
  }
  return { hours: H, minutes: m };
}

function formatDateDisplay(isoDate: string) {
  const d = new Date(isoDate);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTimeDisplay(isoString: string) {
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatTime12hr(isoString: string) {
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function exportWorklogPDF(
  group: { logs: Worklog[]; totalHours: number; displayMonth: string },
  monthKey: string,
) {
  let doc = new jsPDF();
  const name = "Roshan";
  doc.setFontSize(16);
  doc.text(`Monthly Report: ${group.displayMonth}`, 10, 15);
  doc.setFontSize(12);
  doc.text(`Employee Name: ${name}`, 10, 22);
  doc.text(
    `Total Hours: ${toHoursAndMinutes(group.totalHours).hours} hrs ${toHoursAndMinutes(group.totalHours).minutes} mins`,
    10,
    30,
  );

  doc.setFontSize(10);
  doc.text("Date", 10, 42);
  doc.text("Start", 40, 42);
  doc.text("End", 65, 42);
  doc.text("Hours", 90, 42);

  let y = 48;
  group.logs.forEach((log, idx) => {
    doc.text(formatDateDisplay(log.date), 10, y);
    doc.text(formatTime12hr(log.startTime), 40, y);
    doc.text(formatTime12hr(log.endTime), 65, y);
    const hm = toHoursAndMinutes(Number(log.hours));
    doc.text(`${hm.hours}h ${hm.minutes}m`, 90, y);
    y += 6;
    if (y > 270) {
      // Add footer before new page
      doc.addPage();
      doc.setFontSize(10);
      y = 20;
    }
  });

  doc.save(`worklog-${monthKey}.pdf`);
}
