/**
 * Safe local date formatting without UTC timezone drift.
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function getTodayLocalDate(): string {
  return formatLocalDate(new Date());
}

export function shiftDays(dateStr: string, days: number): string {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

export function shiftMonths(dateStr: string, months: number): string {
  const date = parseLocalDate(dateStr);
  const targetDay = date.getDate();
  date.setDate(1); // Set to 1st to avoid overflow issues
  date.setMonth(date.getMonth() + months);
  const maxDaysInNewMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 12, 0, 0).getDate();
  date.setDate(Math.min(targetDay, maxDaysInNewMonth));
  return formatLocalDate(date);
}

export function formatDateWithWeekday(dateStr: string, lang: 'zh' | 'en' = 'zh'): string {
  const date = parseLocalDate(dateStr);
  const today = getTodayLocalDate();
  const isToday = dateStr === today;

  const dayOfWeek = date.getDay(); // 0 is Sun, 1 is Mon
  const zhWeekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const enWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (lang === 'zh') {
    const [y, m, d] = dateStr.split('-');
    const base = `${y}年${Number(m)}月${Number(d)}日 ${zhWeekdays[dayOfWeek]}`;
    return isToday ? `${base} (今天)` : base;
  } else {
    const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const base = `${enWeekdays[dayOfWeek]}, ${enMonths[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    return isToday ? `${base} (Today)` : base;
  }
}

export function getWeekDays(centerDateStr: string): { date: string; dayNumber: number; dayNameZh: string; dayNameEn: string }[] {
  const center = parseLocalDate(centerDateStr);
  const dayOfWeek = center.getDay(); // 0 is Sunday, 1 is Monday
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(center);
  monday.setDate(center.getDate() + diffToMonday);

  const zhDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const enDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return Array.from({ length: 7 }).map((_, i) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    return {
      date: formatLocalDate(current),
      dayNumber: current.getDate(),
      dayNameZh: zhDays[i],
      dayNameEn: enDays[i],
    };
  });
}

export function getMonthDays(monthYearStr: string): { date: string; dayNumber: number; isPadding?: boolean }[] {
  // monthYearStr is YYYY-MM
  const [year, month] = monthYearStr.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1, 12, 0, 0);
  const totalDays = new Date(year, month, 0, 12, 0, 0).getDate();
  
  // Day of week for 1st (0 is Sun, 1 is Mon)
  const firstDayOfWeek = firstDay.getDay();
  const offset = (firstDayOfWeek + 6) % 7; // Monday-based: 0 if Mon, 6 if Sun

  const days: { date: string; dayNumber: number; isPadding?: boolean }[] = [];

  // Padding days from previous month
  for (let i = 0; i < offset; i++) {
    days.push({ date: `pad-${i}`, dayNumber: 0, isPadding: true });
  }

  // Actual days
  for (let d = 1; d <= totalDays; d++) {
    const cur = new Date(year, month - 1, d, 12, 0, 0);
    days.push({ date: formatLocalDate(cur), dayNumber: d });
  }

  return days;
}
