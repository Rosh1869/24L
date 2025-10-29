export function toHoursAndMinutes(totalHoursNum: number) {
  const h = Math.trunc(totalHoursNum || 0);
  let m = Math.round(((totalHoursNum || 0) - h) * 60);
  let H = h;
  if (m === 60) {
    H += 1;
    m = 0;
  }
  return { hours: H, minutes: m };
}

export function formatDateDisplay(isoDate: string) {
  const d = new Date(isoDate);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatTime12hr(isoString: string) {
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function getDayOfWeek(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-GB", { weekday: "long" });
}
