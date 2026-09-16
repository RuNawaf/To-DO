export type Urgency = "overdue" | "critical" | "soon" | "upcoming" | "none";

export function minutesLeft(deadline: string | null, now = Date.now()): number | null {
  if (!deadline) return null;
  return (new Date(deadline).getTime() - now) / 60000;
}

export function urgencyOf(deadline: string | null, now = Date.now()): Urgency {
  const mins = minutesLeft(deadline, now);
  if (mins === null) return "none";
  if (mins <= 0) return "overdue";
  if (mins <= 24 * 60) return "critical"; // within a day
  if (mins <= 3 * 24 * 60) return "soon"; // within 3 days
  return "upcoming";
}

export function formatCountdown(deadline: string | null, now = Date.now()): string {
  if (!deadline) return "بدون موعد";
  const mins = minutesLeft(deadline, now);
  if (mins === null) return "بدون موعد";
  if (mins <= 0) {
    const overdueMin = Math.abs(mins);
    if (overdueMin < 60) return `متأخر ${Math.round(overdueMin)} دقيقة`;
    if (overdueMin < 24 * 60) return `متأخر ${Math.round(overdueMin / 60)} ساعة`;
    return `متأخر ${Math.round(overdueMin / (24 * 60))} يوم`;
  }

  const totalMinutes = Math.round(mins);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutesOnly = totalMinutes % 60;

  if (days >= 1) {
    if (hours === 0) return `باقي ${days === 1 ? "يوم" : `${days} أيام`}`;
    return `باقي ${days === 1 ? "يوم" : `${days} أيام`} و${hours} ساعة`;
  }
  if (hours >= 1) {
    if (minutesOnly === 0) return `باقي ${hours === 1 ? "ساعة" : `${hours} ساعات`}`;
    return `باقي ${hours} ساعة و${minutesOnly} دقيقة`;
  }
  return `باقي ${minutesOnly} دقيقة`;
}

export function formatDeadlineDate(deadline: string | null): string {
  if (!deadline) return "";
  const d = new Date(deadline);
  return d.toLocaleString("ar-SA-u-ca-gregory", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
