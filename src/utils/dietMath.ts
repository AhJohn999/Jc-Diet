import { DailyLog, UserProfile, WeekSummary, MonthSummary } from '../types/diet';

export function calculateDayTotals(log?: DailyLog) {
  if (!log) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      mealCount: 0,
    };
  }

  const totals = log.meals.reduce(
    (acc, meal) => {
      acc.calories += meal.calories || 0;
      acc.protein += meal.protein || 0;
      acc.carbs += meal.carbs || 0;
      acc.fat += meal.fat || 0;
      acc.mealCount += 1;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 }
  );

  return totals;
}

export function computeStreak(logs: DailyLog[]): number {
  if (!logs || logs.length === 0) return 0;
  
  // Sort logs descending by date
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Check if today or yesterday has a log
  let currentCheck = new Date();
  let checkStr = currentCheck.toISOString().split('T')[0];
  
  let hasLatest = sorted.some(l => l.date === checkStr);
  if (!hasLatest) {
    // Check yesterday
    currentCheck.setDate(currentCheck.getDate() - 1);
    checkStr = currentCheck.toISOString().split('T')[0];
    if (!sorted.some(l => l.date === checkStr)) {
      return 0;
    }
  }

  let streak = 0;
  while (true) {
    const targetDateStr = currentCheck.toISOString().split('T')[0];
    const found = sorted.find(l => l.date === targetDateStr);
    if (found && (found.meals.length > 0 || found.weight !== undefined)) {
      streak++;
      currentCheck.setDate(currentCheck.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function computeWeeklySummaries(logs: DailyLog[], calorieTarget: number): WeekSummary[] {
  if (logs.length === 0) return [];
  
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const weeksMap: { [key: string]: DailyLog[] } = {};

  sorted.forEach((log) => {
    const d = new Date(log.date + 'T00:00:00');
    // Align to Monday of that week
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const weekKey = monday.toISOString().split('T')[0];

    if (!weeksMap[weekKey]) {
      weeksMap[weekKey] = [];
    }
    weeksMap[weekKey].push(log);
  });

  const keys = Object.keys(weeksMap).sort((a, b) => a.localeCompare(b));
  
  return keys.map((key, index) => {
    const weekLogs = weeksMap[key];
    const mon = new Date(key + 'T00:00:00');
    const sun = new Date(mon);
    sun.setDate(sun.getDate() + 6);
    
    const weights = weekLogs.filter(l => l.weight !== undefined).map(l => l.weight as number);
    const avgWeight = weights.length > 0 ? Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10 : undefined;
    const startWeight = weights.length > 0 ? weights[0] : undefined;
    const endWeight = weights.length > 0 ? weights[weights.length - 1] : undefined;
    const weightDelta = (startWeight !== undefined && endWeight !== undefined) ? Math.round((endWeight - startWeight) * 10) / 10 : undefined;

    let totalCalories = 0;
    let daysWithMeals = 0;
    let totalAdherence = 0;
    let adherenceCount = 0;

    weekLogs.forEach(l => {
      const dayCal = l.meals.reduce((sum, m) => sum + (m.calories || 0), 0);
      if (dayCal > 0) {
        totalCalories += dayCal;
        daysWithMeals++;
      }
      if (l.dietAdherence) {
        totalAdherence += l.dietAdherence;
        adherenceCount++;
      }
    });

    const avgCalories = daysWithMeals > 0 ? Math.round(totalCalories / daysWithMeals) : 0;
    const avgDeficit = avgCalories > 0 ? calorieTarget - avgCalories : 0;
    const avgAdherence = adherenceCount > 0 ? Math.round((totalAdherence / adherenceCount) * 10) / 10 : 4;

    const startLabel = mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endLabel = sun.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return {
      weekNumber: index + 1,
      label: `Week ${index + 1} (${startLabel} - ${endLabel})`,
      startDate: key,
      endDate: sun.toISOString().split('T')[0],
      avgWeight,
      startWeight,
      endWeight,
      weightDelta,
      avgCalories,
      calorieTarget,
      avgDeficit,
      daysLogged: weekLogs.length,
      avgAdherence,
    };
  });
}

export function computeMonthlySummaries(logs: DailyLog[]): MonthSummary[] {
  if (logs.length === 0) return [];
  
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const monthsMap: { [key: string]: DailyLog[] } = {};

  sorted.forEach(log => {
    const monthKey = log.date.substring(0, 7); // YYYY-MM
    if (!monthsMap[monthKey]) {
      monthsMap[monthKey] = [];
    }
    monthsMap[monthKey].push(log);
  });

  const keys = Object.keys(monthsMap).sort((a, b) => a.localeCompare(b));

  return keys.map(key => {
    const monthLogs = monthsMap[key];
    const [year, month] = key.split('-').map(Number);
    const dateObj = new Date(year, month - 1, 1);
    const label = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const totalDaysInMonth = new Date(year, month, 0).getDate();

    const weights = monthLogs.filter(l => l.weight !== undefined).map(l => l.weight as number);
    const avgWeight = weights.length > 0 ? Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10 : undefined;
    const startWeight = weights.length > 0 ? weights[0] : undefined;
    const endWeight = weights.length > 0 ? weights[weights.length - 1] : undefined;
    const netWeightChange = (startWeight !== undefined && endWeight !== undefined) ? Math.round((endWeight - startWeight) * 10) / 10 : undefined;

    let totalCals = 0;
    let daysWithCals = 0;

    monthLogs.forEach(l => {
      const c = l.meals.reduce((s, m) => s + (m.calories || 0), 0);
      if (c > 0) {
        totalCals += c;
        daysWithCals++;
      }
    });

    const avgCalories = daysWithCals > 0 ? Math.round(totalCals / daysWithCals) : 0;

    return {
      monthKey: key,
      label,
      avgWeight,
      startWeight,
      endWeight,
      netWeightChange,
      avgCalories,
      daysLogged: monthLogs.length,
      totalDays: totalDaysInMonth,
      logs: monthLogs,
    };
  });
}
