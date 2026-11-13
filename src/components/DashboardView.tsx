import React, { useState } from 'react';
import { DailyLog, UserProfile, MealItem, MealType } from '../types/diet';
import { calculateDayTotals, computeStreak } from '../utils/dietMath';
import {
  formatLocalDate,
  parseLocalDate,
  getWeekDays,
  getMonthDays,
  getTodayLocalDate,
  shiftDays,
  shiftMonths,
  formatDateWithWeekday,
} from '../utils/dateUtils';
import { Language, t } from '../utils/i18n';
import { WaterTracker } from './WaterTracker';
import {
  Plus,
  Flame,
  Sparkles,
  Scale,
  Utensils,
  Award,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingDown,
  Activity,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DashboardViewProps {
  profile: UserProfile;
  logs: DailyLog[];
  todayLog?: DailyLog;
  onUpdateTodayLog: (updated: DailyLog) => void;
  onOpenQuickLogModal: (mealType?: MealType) => void;
  onSelectDate: (date: string) => void;
  selectedDate: string;
  lang?: Language;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  logs,
  todayLog,
  onUpdateTodayLog,
  onOpenQuickLogModal,
  onSelectDate,
  selectedDate,
  lang = 'zh',
}) => {
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const [navMode, setNavMode] = useState<'week' | 'month'>('week');
  const [periodSummaryMode, setPeriodSummaryMode] = useState<'week' | 'month'>('week');

  const todayStr = getTodayLocalDate();

  // Calculations
  const streak = computeStreak(logs);
  const totalGoalDelta = Math.abs(profile.startWeight - profile.goalWeight) || 1;
  const currentLost = Math.round((profile.startWeight - profile.currentWeight) * 10) / 10;
  const progressPct = Math.min(100, Math.max(0, Math.round((currentLost / totalGoalDelta) * 100)));

  // Start Date calculation with local date parsing
  const startDateObj = profile.startDate ? parseLocalDate(profile.startDate) : new Date();
  const currentDateObj = parseLocalDate(selectedDate);
  const diffTime = currentDateObj.getTime() - startDateObj.getTime();
  const daysElapsed = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const formattedStartDate = profile.startDate
    ? parseLocalDate(profile.startDate).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : profile.startDate;

  const dayTotals = calculateDayTotals(todayLog);
  const remainingCalories = profile.dailyCalorieTarget - dayTotals.calories;

  const proteinPct = Math.min(100, Math.round((dayTotals.protein / (profile.dailyProteinTarget || 1)) * 100));
  const carbsPct = Math.min(100, Math.round((dayTotals.carbs / (profile.dailyCarbsTarget || 1)) * 100));
  const fatPct = Math.min(100, Math.round((dayTotals.fat / (profile.dailyFatTarget || 1)) * 100));

  // Date navigator items - ALWAYS centered around selectedDate so it's 100% aligned!
  const weekDays = getWeekDays(selectedDate).map((day) => {
    const logForDay = logs.find((l) => l.date === day.date);
    const hasLog = Boolean(logForDay && (logForDay.meals.length > 0 || logForDay.weight !== undefined));
    return {
      ...day,
      hasLog,
      weight: logForDay?.weight,
    };
  });

  const anchorMonthKey = selectedDate.substring(0, 7); // YYYY-MM
  const monthDays = getMonthDays(anchorMonthKey);

  // Period stats calculations (Weekly vs Monthly)
  const currentWeekStart = weekDays[0].date;
  const currentWeekEnd = weekDays[6].date;
  const currentWeekLogs = logs.filter((l) => l.date >= currentWeekStart && l.date <= currentWeekEnd);
  const weekDaysLogged = currentWeekLogs.filter((l) => l.meals.length > 0 || l.weight !== undefined).length;

  let weekTotalCals = 0;
  let weekDaysWithCals = 0;
  currentWeekLogs.forEach((l) => {
    const c = l.meals.reduce((s, m) => s + (m.calories || 0), 0);
    if (c > 0) {
      weekTotalCals += c;
      weekDaysWithCals++;
    }
  });
  const weekAvgCalories = weekDaysWithCals > 0 ? Math.round(weekTotalCals / weekDaysWithCals) : 0;
  const weekWeighedLogs = currentWeekLogs.filter((l) => l.weight !== undefined).sort((a, b) => a.date.localeCompare(b.date));
  const weekWeightDelta =
    weekWeighedLogs.length >= 2
      ? Math.round(((weekWeighedLogs[weekWeighedLogs.length - 1].weight || 0) - (weekWeighedLogs[0].weight || 0)) * 10) / 10
      : undefined;

  // Monthly stats
  const currentMonthLogs = logs.filter((l) => l.date.startsWith(anchorMonthKey));
  const totalDaysInMonth = monthDays.filter((d) => !d.isPadding).length;
  const monthDaysLogged = currentMonthLogs.filter((l) => l.meals.length > 0 || l.weight !== undefined).length;
  let monthTotalCals = 0;
  let monthDaysWithCals = 0;
  currentMonthLogs.forEach((l) => {
    const c = l.meals.reduce((s, m) => s + (m.calories || 0), 0);
    if (c > 0) {
      monthTotalCals += c;
      monthDaysWithCals++;
    }
  });
  const monthAvgCalories = monthDaysWithCals > 0 ? Math.round(monthTotalCals / monthDaysWithCals) : 0;
  const monthWeighedLogs = currentMonthLogs.filter((l) => l.weight !== undefined).sort((a, b) => a.date.localeCompare(b.date));
  const monthWeightDelta =
    monthWeighedLogs.length >= 2
      ? Math.round(((monthWeighedLogs[monthWeighedLogs.length - 1].weight || 0) - (monthWeighedLogs[0].weight || 0)) * 10) / 10
      : undefined;

  const handlePrevRange = () => {
    if (navMode === 'week') {
      const newDate = shiftDays(selectedDate, -7);
      onSelectDate(newDate);
    } else {
      const newDate = shiftMonths(selectedDate, -1);
      onSelectDate(newDate);
    }
  };

  const handleNextRange = () => {
    if (navMode === 'week') {
      const newDate = shiftDays(selectedDate, 7);
      onSelectDate(newDate);
    } else {
      const newDate = shiftMonths(selectedDate, 1);
      onSelectDate(newDate);
    }
  };

  const handleJumpToday = () => {
    onSelectDate(todayStr);
  };

  const handleCelebrate = () => {
    confetti({
      particleCount: 65,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#f43f5e', '#ec4899', '#fda4af', '#f472b6', '#fb7185'],
    });
  };

  const handleWaterChange = (newMl: number) => {
    const updated: DailyLog = todayLog
      ? { ...todayLog, waterIntake: newMl }
      : {
          date: selectedDate,
          waterIntake: newMl,
          waterTarget: profile.dailyWaterTarget,
          meals: [],
        };
    onUpdateTodayLog(updated);
  };

  const mealSections: { type: MealType; titleKey: 'breakfast' | 'lunch' | 'dinner' | 'snack'; subKey: 'breakfastSub' | 'lunchSub' | 'dinnerSub' | 'snackSub'; icon: string }[] = [
    { type: 'breakfast', titleKey: 'breakfast', subKey: 'breakfastSub', icon: '🌅' },
    { type: 'lunch', titleKey: 'lunch', subKey: 'lunchSub', icon: '🥗' },
    { type: 'dinner', titleKey: 'dinner', subKey: 'dinnerSub', icon: '🍲' },
    { type: 'snack', titleKey: 'snack', subKey: 'snackSub', icon: '🍓' },
  ];

  return (
    <div className="space-y-6">
      {/* Photo Lightbox Modal */}
      {zoomedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/70 backdrop-blur-xs cursor-pointer"
          onClick={() => setZoomedPhoto(null)}
        >
          <div className="relative max-w-lg w-full bg-white rounded-3xl p-3 shadow-2xl border border-rose-200">
            <button
              onClick={() => setZoomedPhoto(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-rose-900/60 text-white flex items-center justify-center hover:bg-rose-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={zoomedPhoto} alt="Meal Zoom" className="w-full h-auto rounded-2xl max-h-[75vh] object-contain" />
          </div>
        </div>
      )}

      {/* 1. Hero Progress Banner with Start Date */}
      <div className="bg-gradient-to-br from-pink-50 via-white to-rose-50/70 rounded-3xl p-6 sm:p-7 border border-rose-100/90 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-200/25 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-100/90 text-rose-800 text-xs font-semibold shadow-2xs">
                <span>{profile.customEmoji || '🌸'}</span>
                <span className="font-serif">{profile.customTitle?.trim() || (lang === 'zh' ? 'JC 饮食日记' : 'JC Diet')}</span>
              </span>
              <span className="text-rose-300">·</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-700/80">
                {t('progressMilestone', lang)}
              </span>
              <span className="text-rose-300">·</span>
              <span className="text-xs text-rose-700 font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-pink-500" />
                {t('startedOn', lang)}: {formattedStartDate} ({daysElapsed} {t('daysOnDiet', lang)})
              </span>
              <span className="text-rose-300">·</span>
              <span className="text-xs text-rose-600/90 font-medium">
                {streak} {t('streakDays', lang)}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-rose-950 font-serif">
              {currentLost > 0 ? (
                <>
                  {t('totalLost', lang)}{' '}
                  <span className="text-rose-600 font-bold tabular-nums">
                    {currentLost} {profile.unit}
                  </span>
                  ！
                </>
              ) : (
                t('journeyInBloom', lang)
              )}
            </h2>

            <p className="text-xs sm:text-sm text-rose-800/80 mt-1 max-w-xl">
              {lang === 'zh'
                ? `从 ${formattedStartDate} 开启旅程。每周的规律饮食正在发生蜕变，已完成总目标的 ${progressPct}%。目标体重：${profile.goalWeight} ${profile.unit}。`
                : `Started on ${formattedStartDate}. Consistent daily habits compound over the weeks. You are ${progressPct}% toward your target goal of ${profile.goalWeight} ${profile.unit}.`}
            </p>
          </div>

          {/* Quick Stat Quad */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 shrink-0">
            <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 border border-rose-100 text-center shadow-2xs">
              <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wide block">
                {t('startedOn', lang)}
              </span>
              <span className="text-xs sm:text-sm font-bold text-rose-950 block mt-1">
                {formattedStartDate}
              </span>
              <span className="text-[10px] text-pink-600 font-medium">Day #{daysElapsed}</span>
            </div>
            <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 border border-rose-100 text-center shadow-2xs">
              <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wide block">
                {t('startingWeight', lang)}
              </span>
              <span className="text-base sm:text-lg font-bold text-rose-950 tabular-nums">
                {profile.startWeight}
              </span>
              <span className="text-[10px] text-rose-400 ml-0.5">{profile.unit}</span>
            </div>
            <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-rose-200 text-center shadow-xs">
              <span className="text-[10px] font-semibold text-pink-600 uppercase tracking-wide block">
                {t('currentWeight', lang)}
              </span>
              <span className="text-base sm:text-lg font-bold text-pink-600 tabular-nums">
                {profile.currentWeight}
              </span>
              <span className="text-[10px] text-pink-400 ml-0.5">{profile.unit}</span>
            </div>
            <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 border border-rose-100 text-center shadow-2xs">
              <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wide block">
                {t('goalWeight', lang)}
              </span>
              <span className="text-base sm:text-lg font-bold text-rose-950 tabular-nums">
                {profile.goalWeight}
              </span>
              <span className="text-[10px] text-rose-400 ml-0.5">{profile.unit}</span>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="mt-6 pt-5 border-t border-rose-100/80">
          <div className="flex items-center justify-between text-xs font-medium text-rose-700 mb-2">
            <div className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-rose-500" />
              <span>
                {t('overallProgress', lang)}: <strong className="text-rose-950">{progressPct}%</strong>
              </span>
            </div>
            <button
              onClick={handleCelebrate}
              className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              {t('celebrateProgress', lang)}
            </button>
          </div>
          <div className="w-full bg-rose-100/70 h-3 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-pink-400 via-rose-500 to-pink-500 rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Interactive Date Selector Strip (with Weekly / Monthly Toggle) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-100 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-pink-500" />
              <h3 className="text-xs font-semibold text-rose-900 uppercase tracking-wider">
                {t('viewNavigator', lang)}
              </h3>
            </div>

            {/* Week vs Month Switcher */}
            <div className="flex items-center bg-rose-50 p-1 rounded-xl border border-rose-100">
              <button
                onClick={() => setNavMode('week')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  navMode === 'week'
                    ? 'bg-white text-rose-950 shadow-2xs font-bold'
                    : 'text-rose-600/70 hover:text-rose-950'
                }`}
              >
                {t('weekView', lang)}
              </button>
              <button
                onClick={() => setNavMode('month')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  navMode === 'month'
                    ? 'bg-white text-rose-950 shadow-2xs font-bold'
                    : 'text-rose-600/70 hover:text-rose-950'
                }`}
              >
                {t('monthView', lang)}
              </button>
            </div>
          </div>

          {/* Range Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handlePrevRange}
              className="w-7 h-7 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
              title={navMode === 'week' ? t('prevWeek', lang) : t('prevMonth', lang)}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs text-rose-900 font-semibold px-1 tabular-nums">
              {navMode === 'week'
                ? `${weekDays[0].date} ~ ${weekDays[6].date}`
                : anchorMonthKey}
            </span>

            <button
              onClick={handleNextRange}
              className="w-7 h-7 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
              title={navMode === 'week' ? t('nextWeek', lang) : t('nextMonth', lang)}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleJumpToday}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 transition-colors cursor-pointer"
            >
              {t('today', lang)}
            </button>
          </div>
        </div>

        {/* Selected date confirmation banner - Clearly aligned with the highlighted day below! */}
        <div className="flex items-center justify-between bg-rose-50/60 px-3.5 py-2 rounded-xl border border-rose-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-rose-700 font-medium">
              {t('selected', lang)}:{' '}
              <strong className="text-rose-950 font-bold ml-1">
                {formatDateWithWeekday(selectedDate, lang)}
              </strong>
            </span>
          </div>
          {selectedDate === todayStr && (
            <span className="text-[11px] bg-pink-100 text-pink-700 font-semibold px-2 py-0.5 rounded-full">
              {lang === 'zh' ? '今天' : 'Today'}
            </span>
          )}
        </div>

        {/* Mode A: Week View (7 columns) - Perfectly Aligned! */}
        {navMode === 'week' && (
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-1">
            {weekDays.map((day) => {
              const isSelected = day.date === selectedDate;
              const dayName = lang === 'zh' ? day.dayNameZh : day.dayNameEn;
              const isToday = day.date === todayStr;

              return (
                <button
                  key={day.date}
                  onClick={() => onSelectDate(day.date)}
                  className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/30 scale-[1.03] ring-2 ring-rose-400 z-10'
                      : isToday
                      ? 'bg-pink-50/80 border-pink-200 text-rose-950 hover:bg-pink-100/60'
                      : 'bg-rose-50/30 border-rose-100 hover:bg-rose-100/60 text-rose-900'
                  }`}
                >
                  <span
                    className={`text-[10px] font-semibold ${
                      isSelected ? 'text-pink-100' : isToday ? 'text-pink-600 font-bold' : 'text-rose-400'
                    }`}
                  >
                    {dayName}
                  </span>
                  <span className="text-sm sm:text-base font-bold tabular-nums mt-0.5">
                    {day.dayNumber}
                  </span>
                  <div className="mt-1 flex items-center gap-1">
                    {day.hasLog ? (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-white' : 'bg-pink-500'
                        }`}
                      />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                    )}
                  </div>
                  {isSelected && (
                    <span className="text-[9px] uppercase font-bold tracking-tight bg-white/20 text-white px-1 rounded mt-0.5 leading-tight">
                      {lang === 'zh' ? '已选' : 'Selected'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Mode B: Month View (full calendar grid on dashboard!) */}
        {navMode === 'month' && (
          <div className="space-y-1 pt-1">
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-rose-400 py-1">
              {(lang === 'zh'
                ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
                : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
              ).map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {monthDays.map((day) => {
                if (day.isPadding) {
                  return <div key={day.date} className="h-10 rounded-lg bg-transparent" />;
                }

                const isSelected = day.date === selectedDate;
                const logForDay = logs.find((l) => l.date === day.date);
                const hasLog = Boolean(logForDay && (logForDay.meals.length > 0 || logForDay.weight !== undefined));
                const isToday = day.date === todayStr;

                return (
                  <button
                    key={day.date}
                    onClick={() => onSelectDate(day.date)}
                    className={`h-10 sm:h-12 rounded-xl text-center flex flex-col items-center justify-center border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/25 font-bold scale-[1.04] ring-2 ring-rose-400 z-10'
                        : isToday
                        ? 'bg-pink-100/70 border-pink-300 text-rose-950 font-bold hover:bg-pink-200/80'
                        : hasLog
                        ? 'bg-rose-100/60 border-rose-200 text-rose-950 hover:bg-rose-200/80'
                        : 'bg-rose-50/20 border-rose-100/60 text-rose-500 hover:bg-rose-100/40'
                    }`}
                  >
                    <span className="text-xs sm:text-sm tabular-nums font-bold leading-tight">
                      {day.dayNumber}
                    </span>
                    {hasLog && (
                      <span
                        className={`w-1 h-1 rounded-full mt-0.5 ${
                          isSelected ? 'bg-white' : 'bg-pink-500'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Dashboard Period Progress Card: Weekly vs Monthly Switcher */}
      <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-100">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-pink-500" />
            <h3 className="text-sm font-bold text-rose-950 font-serif">
              {t('periodSummary', lang)}
            </h3>
            <span className="text-xs text-rose-400">
              ({periodSummaryMode === 'week' ? `${currentWeekStart} ~ ${currentWeekEnd}` : anchorMonthKey})
            </span>
          </div>

          {/* Segmented Button: Weekly vs Monthly */}
          <div className="flex items-center bg-rose-50 p-1 rounded-xl border border-rose-100 self-start sm:self-auto">
            <button
              onClick={() => setPeriodSummaryMode('week')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                periodSummaryMode === 'week'
                  ? 'bg-white text-rose-950 shadow-2xs font-bold'
                  : 'text-rose-600/70 hover:text-rose-950'
              }`}
            >
              📅 {t('viewThisWeek', lang)}
            </button>
            <button
              onClick={() => setPeriodSummaryMode('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                periodSummaryMode === 'month'
                  ? 'bg-white text-rose-950 shadow-2xs font-bold'
                  : 'text-rose-600/70 hover:text-rose-950'
              }`}
            >
              🗓️ {t('viewThisMonth', lang)}
            </button>
          </div>
        </div>

        {/* Period Metrics Grid */}
        {periodSummaryMode === 'week' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-rose-50/40 rounded-xl p-3 border border-rose-100">
              <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wide block">
                {t('weekDaysLogged', lang)}
              </span>
              <span className="text-lg font-bold text-rose-950 tabular-nums">
                {weekDaysLogged} / 7
              </span>
              <span className="text-[10px] text-rose-500 ml-1">{lang === 'zh' ? '天' : 'days'}</span>
            </div>

            <div className="bg-rose-50/40 rounded-xl p-3 border border-rose-100">
              <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wide block">
                {t('weekAvgCalories', lang)}
              </span>
              <span className="text-lg font-bold text-rose-950 tabular-nums">
                {weekAvgCalories > 0 ? weekAvgCalories : '--'}
              </span>
              <span className="text-[10px] text-rose-500 ml-1">kcal</span>
            </div>

            <div className="bg-rose-50/40 rounded-xl p-3 border border-rose-100">
              <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wide block">
                {t('weekWeightChange', lang)}
              </span>
              <span className={`text-lg font-bold tabular-nums ${(weekWeightDelta || 0) <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {weekWeightDelta !== undefined ? `${weekWeightDelta > 0 ? '+' : ''}${weekWeightDelta} ${profile.unit}` : '--'}
              </span>
            </div>

            <div className="bg-rose-50/40 rounded-xl p-3 border border-rose-100">
              <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wide block">
                {t('weekAdherence', lang)}
              </span>
              <span className="text-lg font-bold text-pink-600 tabular-nums">
                {Math.round((weekDaysLogged / 7) * 100)}%
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-rose-50/40 rounded-xl p-3 border border-rose-100">
              <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wide block">
                {t('monthDaysLogged', lang)}
              </span>
              <span className="text-lg font-bold text-rose-950 tabular-nums">
                {monthDaysLogged} / {totalDaysInMonth}
              </span>
              <span className="text-[10px] text-rose-500 ml-1">{lang === 'zh' ? '天' : 'days'}</span>
            </div>

            <div className="bg-rose-50/40 rounded-xl p-3 border border-rose-100">
              <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wide block">
                {t('monthAvgCalories', lang)}
              </span>
              <span className="text-lg font-bold text-rose-950 tabular-nums">
                {monthAvgCalories > 0 ? monthAvgCalories : '--'}
              </span>
              <span className="text-[10px] text-rose-500 ml-1">kcal</span>
            </div>

            <div className="bg-rose-50/40 rounded-xl p-3 border border-rose-100">
              <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wide block">
                {t('monthWeightChange', lang)}
              </span>
              <span className={`text-lg font-bold tabular-nums ${(monthWeightDelta || 0) <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {monthWeightDelta !== undefined ? `${monthWeightDelta > 0 ? '+' : ''}${monthWeightDelta} ${profile.unit}` : '--'}
              </span>
            </div>

            <div className="bg-rose-50/40 rounded-xl p-3 border border-rose-100">
              <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wide block">
                {t('monthAdherence', lang)}
              </span>
              <span className="text-lg font-bold text-pink-600 tabular-nums">
                {Math.round((monthDaysLogged / Math.max(1, totalDaysInMonth)) * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Two-Column Dashboard: Today's Budget & Macros on Left, Hydration & Weight on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Calorie & Macro Target Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-rose-100 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100">
                <Flame className="w-4 h-4 fill-pink-500 text-pink-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-rose-950 font-serif">
                  {t('calorieBudgetTitle', lang)}
                </h3>
                <p className="text-xs text-rose-600/70">
                  {t('target', lang)}: {profile.dailyCalorieTarget} kcal · {t('styleLabel', lang)}: {profile.dietStyle}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className={`text-xl font-bold tabular-nums ${remainingCalories >= 0 ? 'text-rose-950' : 'text-rose-600'}`}>
                {Math.abs(remainingCalories)}
              </span>
              <p className="text-[11px] text-rose-500 font-medium">
                {remainingCalories >= 0 ? t('remaining', lang) : t('overBudget', lang)}
              </p>
            </div>
          </div>

          {/* Consumed / Budget Bar */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-rose-900 mb-1.5">
              <span>{dayTotals.calories} kcal {t('consumed', lang)}</span>
              <span>{Math.round((dayTotals.calories / profile.dailyCalorieTarget) * 100)}% {t('percentOfGoal', lang)}</span>
            </div>
            <div className="w-full bg-rose-100/60 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  dayTotals.calories > profile.dailyCalorieTarget
                    ? 'bg-rose-600'
                    : 'bg-gradient-to-r from-pink-400 to-rose-500'
                }`}
                style={{
                  width: `${Math.min(100, Math.round((dayTotals.calories / profile.dailyCalorieTarget) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* Macronutrients breakdown */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {/* Protein */}
            <div className="bg-rose-50/50 rounded-xl p-3.5 border border-rose-100/80">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-semibold text-rose-900">{t('protein', lang)}</span>
                <span className="text-[11px] text-rose-600 tabular-nums">
                  {dayTotals.protein} / {profile.dailyProteinTarget}g
                </span>
              </div>
              <div className="w-full bg-rose-200/50 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all"
                  style={{ width: `${proteinPct}%` }}
                />
              </div>
              <span className="text-[10px] text-rose-500 mt-1 block tabular-nums">
                {proteinPct}% {t('target', lang)}
              </span>
            </div>

            {/* Carbs */}
            <div className="bg-rose-50/50 rounded-xl p-3.5 border border-rose-100/80">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-semibold text-rose-900">{t('carbs', lang)}</span>
                <span className="text-[11px] text-rose-600 tabular-nums">
                  {dayTotals.carbs} / {profile.dailyCarbsTarget}g
                </span>
              </div>
              <div className="w-full bg-rose-200/50 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-pink-400 h-full rounded-full transition-all"
                  style={{ width: `${carbsPct}%` }}
                />
              </div>
              <span className="text-[10px] text-rose-500 mt-1 block tabular-nums">
                {carbsPct}% {t('target', lang)}
              </span>
            </div>

            {/* Fat */}
            <div className="bg-rose-50/50 rounded-xl p-3.5 border border-rose-100/80">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-semibold text-rose-900">{t('fats', lang)}</span>
                <span className="text-[11px] text-rose-600 tabular-nums">
                  {dayTotals.fat} / {profile.dailyFatTarget}g
                </span>
              </div>
              <div className="w-full bg-rose-200/50 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-400 h-full rounded-full transition-all"
                  style={{ width: `${fatPct}%` }}
                />
              </div>
              <span className="text-[10px] text-rose-500 mt-1 block tabular-nums">
                {fatPct}% {t('target', lang)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Water Tracker + Day Weigh-in */}
        <div className="space-y-4">
          <WaterTracker
            currentMl={todayLog?.waterIntake || 0}
            targetMl={todayLog?.waterTarget || profile.dailyWaterTarget}
            onChange={handleWaterChange}
            lang={lang}
          />

          {/* Weigh-in quick box */}
          <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-rose-500 uppercase tracking-wide block">
                {t('loggedWeight', lang)}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold text-rose-950 tabular-nums">
                  {todayLog?.weight !== undefined ? todayLog.weight : '--'}
                </span>
                <span className="text-xs text-rose-600">{profile.unit}</span>
                {todayLog?.weightEvening !== undefined && (
                  <span className="text-xs text-rose-500 ml-2 tabular-nums">🌙 {todayLog.weightEvening}</span>
                )}
              </div>
              <p className="text-[11px] text-rose-500/80 mt-0.5">
                {todayLog?.weight !== undefined
                  ? t('weighedToday', lang)
                  : t('tapToLogWeight', lang)}
              </p>
            </div>

            <button
              onClick={() => onOpenQuickLogModal()}
              className="px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200/80 transition-colors cursor-pointer"
            >
              {todayLog?.weight !== undefined ? t('update', lang) : t('logWeightBtn', lang)}
            </button>
          </div>
        </div>
      </div>

      {/* 5. Meals Timeline for Selected Date */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-rose-100 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-pink-500" />
            <h3 className="text-lg font-bold text-rose-950 font-serif">
              {t('mealsTitle', lang)} ({selectedDate})
            </h3>
          </div>

          <button
            onClick={() => onOpenQuickLogModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors cursor-pointer shadow-xs hover:bg-rose-600"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('addFood', lang)}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mealSections.map((section) => {
            const sectionMeals = (todayLog?.meals || []).filter((m) => m.type === section.type);
            const sectionCalories = sectionMeals.reduce((s, m) => s + (m.calories || 0), 0);
            const sectionProtein = sectionMeals.reduce((s, m) => s + (m.protein || 0), 0);
            const sectionTitle = t(section.titleKey, lang);
            const sectionSub = t(section.subKey, lang);

            return (
              <div
                key={section.type}
                className="bg-rose-50/30 rounded-2xl p-4 border border-rose-100/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-rose-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{section.icon}</span>
                      <div>
                        <h4 className="text-sm font-semibold text-rose-950">{sectionTitle}</h4>
                        <span className="text-[11px] text-rose-500">{sectionSub}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-rose-900 tabular-nums">
                        {sectionCalories} kcal
                      </span>
                      {sectionProtein > 0 && (
                        <p className="text-[10px] text-rose-500 tabular-nums">{sectionProtein}g protein</p>
                      )}
                    </div>
                  </div>

                  {/* Meals List */}
                  {sectionMeals.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      {sectionMeals.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl p-2.5 border border-rose-100 flex items-start justify-between gap-2.5 text-xs"
                        >
                          <div className="flex items-start gap-2.5">
                            {item.photoUrl && (
                              <img
                                src={item.photoUrl}
                                alt={item.name}
                                onClick={() => setZoomedPhoto(item.photoUrl!)}
                                className="w-12 h-12 object-cover rounded-lg border border-rose-200 cursor-pointer hover:opacity-90 transition-opacity shrink-0 shadow-2xs"
                                title={t('viewFullPhoto', lang)}
                              />
                            )}
                            <div>
                              <p className="font-medium text-rose-950">{item.name}</p>
                              {item.notes && (
                                <p className="text-[11px] text-rose-500/80 mt-0.5">{item.notes}</p>
                              )}
                              <div className="flex items-center gap-2 text-[10px] text-rose-400 mt-1">
                                <span>P: {item.protein}g</span>
                                <span>·</span>
                                <span>C: {item.carbs}g</span>
                                <span>·</span>
                                <span>F: {item.fat}g</span>
                              </div>
                            </div>
                          </div>
                          <span className="font-semibold text-rose-800 tabular-nums shrink-0">
                            {item.calories} kcal
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-xs text-rose-400">{t('noMealsLogged', lang)}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onOpenQuickLogModal(section.type)}
                  className="mt-3 w-full py-1.5 text-xs text-rose-700 hover:text-rose-950 bg-white hover:bg-rose-100/50 rounded-lg border border-rose-200/60 font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-rose-500" />
                  <span>{t('addTo', lang)} {sectionTitle}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
