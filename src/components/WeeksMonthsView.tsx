import React, { useState } from 'react';
import { DailyLog, UserProfile } from '../types/diet';
import { computeWeeklySummaries, computeMonthlySummaries } from '../utils/dietMath';
import { parseLocalDate } from '../utils/dateUtils';
import { Language, t } from '../utils/i18n';
import { Calendar, TrendingDown, Award, ChevronRight, Activity, Ruler } from 'lucide-react';

interface WeeksMonthsViewProps {
  logs: DailyLog[];
  profile: UserProfile;
  onSelectDate: (date: string) => void;
  lang: Language;
}

export const WeeksMonthsView: React.FC<WeeksMonthsViewProps> = ({
  logs,
  profile,
  onSelectDate,
  lang,
}) => {
  const [subTab, setSubTab] = useState<'weeks' | 'months' | 'measurements'>('weeks');
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  const weeklySummaries = computeWeeklySummaries(logs, profile.dailyCalorieTarget);
  const monthlySummaries = computeMonthlySummaries(logs);

  const measurementLogs = logs
    .filter((l) => l.measurements && Object.keys(l.measurements).length > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Tab Switcher */}
      <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-rose-950 font-serif">
            {t('weeksMonthsTitle', lang)}
          </h2>
          <p className="text-xs sm:text-sm text-rose-600/80 mt-1">
            {t('weeksMonthsDesc', lang)}
          </p>
        </div>

        {/* Segmented Controls */}
        <div className="flex items-center bg-rose-50/80 p-1 rounded-xl border border-rose-100 self-start sm:self-auto">
          <button
            onClick={() => setSubTab('weeks')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              subTab === 'weeks'
                ? 'bg-white text-rose-950 shadow-xs'
                : 'text-rose-700/80 hover:text-rose-900'
            }`}
          >
            {t('weeklyReview', lang)}
          </button>
          <button
            onClick={() => setSubTab('months')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              subTab === 'months'
                ? 'bg-white text-rose-950 shadow-xs'
                : 'text-rose-700/80 hover:text-rose-900'
            }`}
          >
            {t('monthlyHeatmap', lang)}
          </button>
          <button
            onClick={() => setSubTab('measurements')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              subTab === 'measurements'
                ? 'bg-white text-rose-950 shadow-xs'
                : 'text-rose-700/80 hover:text-rose-900'
            }`}
          >
            {t('measurements', lang)}
          </button>
        </div>
      </div>

      {/* 1. WEEKLY REVIEW TAB */}
      {subTab === 'weeks' && (
        <div className="space-y-4">
          {weeklySummaries.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-rose-100 text-center text-rose-500">
              {lang === 'zh' ? '暂无周度数据，开始记录后将自动汇总！' : 'No weekly data available yet. Start logging to build weekly aggregates!'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {weeklySummaries
                .slice()
                .reverse()
                .map((week) => {
                  const isExpanded = expandedWeek === week.weekNumber;
                  const isWeightDown = (week.weightDelta || 0) <= 0;
                  const weekLogs = logs.filter(
                    (l) => l.date >= week.startDate && l.date <= week.endDate
                  );

                  return (
                    <div
                      key={week.weekNumber}
                      className="bg-white rounded-2xl border border-rose-100/90 shadow-xs overflow-hidden transition-all"
                    >
                      <div
                        onClick={() =>
                          setExpandedWeek(isExpanded ? null : week.weekNumber)
                        }
                        className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-rose-50/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-100 text-pink-600 flex items-center justify-center font-bold text-sm shrink-0">
                            W{week.weekNumber}
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-rose-950">
                              {lang === 'zh' ? `第 ${week.weekNumber} 周 (${week.startDate} ~ ${week.endDate})` : week.label}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-rose-500 mt-0.5">
                              <span>{week.daysLogged} {lang === 'zh' ? '天已打卡' : 'days logged'}</span>
                              <span>·</span>
                              <span>{t('adherence', lang)}: {week.avgAdherence * 20}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Weekly Metrics */}
                        <div className="grid grid-cols-3 sm:flex items-center gap-4 sm:gap-6 text-center md:text-right">
                          <div>
                            <span className="text-[10px] uppercase font-semibold text-rose-400 block">
                              {t('avgWeight', lang)}
                            </span>
                            <span className="text-sm sm:text-base font-bold text-rose-950 tabular-nums">
                              {week.avgWeight !== undefined ? `${week.avgWeight} ${profile.unit}` : '--'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-semibold text-rose-400 block">
                              {t('weekChange', lang)}
                            </span>
                            <span
                              className={`text-sm sm:text-base font-bold tabular-nums flex items-center justify-center md:justify-end gap-0.5 ${
                                isWeightDown ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {week.weightDelta !== undefined ? (
                                <>
                                  <TrendingDown className={`w-3.5 h-3.5 ${isWeightDown ? 'text-emerald-600' : 'rotate-180 text-rose-600'}`} />
                                  <span>{week.weightDelta > 0 ? `+${week.weightDelta}` : week.weightDelta} {profile.unit}</span>
                                </>
                              ) : (
                                '--'
                              )}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-semibold text-rose-400 block">
                              {t('avgIntake', lang)}
                            </span>
                            <span className="text-sm sm:text-base font-bold text-rose-950 tabular-nums">
                              {week.avgCalories} <span className="text-xs font-normal text-rose-400">kcal</span>
                            </span>
                          </div>

                          <div className="hidden sm:block">
                            <ChevronRight
                              className={`w-5 h-5 text-rose-400 transition-transform ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Expandable Daily breakdown */}
                      {isExpanded && (
                        <div className="bg-rose-50/30 border-t border-rose-100 p-4 sm:p-5">
                          <h4 className="text-xs font-semibold text-rose-900 uppercase tracking-wider mb-3">
                            {lang === 'zh' ? `第 ${week.weekNumber} 周每日记录明细` : `Daily Breakdown for Week ${week.weekNumber}`}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                            {weekLogs.map((day) => {
                              const dayCals = day.meals.reduce((s, m) => s + (m.calories || 0), 0);
                              return (
                                <button
                                  key={day.date}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectDate(day.date);
                                  }}
                                  className="bg-white rounded-xl p-3 border border-rose-100 text-left hover:border-pink-300 transition-all cursor-pointer shadow-2xs"
                                >
                                  <span className="text-[10px] text-rose-400 font-medium block">
                                    {day.date}
                                  </span>
                                  <div className="mt-1">
                                    <span className="text-sm font-bold text-rose-950 tabular-nums block">
                                      {day.weight !== undefined ? `${day.weight} ${profile.unit}` : '--'}{day.weightEvening !== undefined ? ` · 🌙${day.weightEvening}` : ''}
                                    </span>
                                    <span className="text-xs text-rose-600 tabular-nums">
                                      {dayCals} kcal
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* 2. MONTHLY HEATMAP TAB */}
      {subTab === 'months' && (
        <div className="space-y-6">
          {monthlySummaries.map((month) => {
            const consistencyPct = Math.round((month.daysLogged / month.totalDays) * 100);
            return (
              <div
                key={month.monthKey}
                className="bg-white rounded-3xl p-6 border border-rose-100 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-rose-100 gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-rose-950 font-serif">
                      {month.label}
                    </h3>
                    <p className="text-xs text-rose-500">
                      {lang === 'zh'
                        ? `${month.daysLogged} / ${month.totalDays} 天已打卡（打卡率 ${consistencyPct}%）`
                        : `${month.daysLogged} of ${month.totalDays} days recorded (${consistencyPct}% consistency)`}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                      <span className="text-rose-400 block text-[10px] uppercase">{t('netChange', lang)}</span>
                      <span className="font-bold text-rose-950 tabular-nums">
                        {month.netWeightChange !== undefined ? `${month.netWeightChange} ${profile.unit}` : '--'}
                      </span>
                    </div>
                    <div className="bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                      <span className="text-rose-400 block text-[10px] uppercase">{t('dailyAvgCals', lang)}</span>
                      <span className="font-bold text-rose-950 tabular-nums">
                        {month.avgCalories} kcal
                      </span>
                    </div>
                  </div>
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-2">
                  {(lang === 'zh'
                    ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
                    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                  ).map((d) => (
                    <div key={d} className="text-center text-[10px] font-semibold text-rose-400 uppercase py-1">
                      {d}
                    </div>
                  ))}

                  {/* Empty offset padding for 1st day of month */}
                  {Array.from({
                    length: (new Date(`${month.monthKey}-01T12:00:00`).getDay() + 6) % 7,
                  }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-12 rounded-xl bg-transparent" />
                  ))}

                  {/* Days of month */}
                  {Array.from({ length: month.totalDays }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `${month.monthKey}-${String(dayNum).padStart(2, '0')}`;
                    const dayLog = month.logs.find((l) => l.date === dateStr);
                    const dayCals = dayLog?.meals.reduce((s, m) => s + (m.calories || 0), 0) || 0;
                    const hasWeight = dayLog?.weight !== undefined;
                    const isWithinBudget = dayCals > 0 && dayCals <= profile.dailyCalorieTarget;

                    let bgClass = 'bg-rose-50/30 border-rose-100/60 text-rose-400';
                    if (dayLog && (dayCals > 0 || hasWeight)) {
                      bgClass = isWithinBudget
                        ? 'bg-rose-100/80 border-rose-300 text-rose-950'
                        : 'bg-pink-50 border-pink-200 text-rose-900';
                    }

                    return (
                      <button
                        key={dateStr}
                        onClick={() => onSelectDate(dateStr)}
                        className={`min-h-[52px] sm:min-h-[60px] p-1.5 rounded-xl border flex flex-col justify-between text-left transition-all hover:border-pink-500 hover:shadow-xs cursor-pointer ${bgClass}`}
                        title={dateStr}
                      >
                        <span className="text-[11px] font-bold tabular-nums">
                          {dayNum}
                        </span>

                        {dayLog && (
                          <div className="text-[10px] leading-tight mt-1">
                            {hasWeight && (
                              <span className="font-semibold text-rose-900 block tabular-nums">
                                {dayLog.weight}
                              </span>
                            )}
                            {dayCals > 0 && (
                              <span className="text-rose-600 block tabular-nums">
                                {dayCals}k
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. MEASUREMENTS TAB */}
      {subTab === 'measurements' && (
        <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-xs space-y-6">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-pink-500" />
            <div>
              <h3 className="text-lg font-bold text-rose-950 font-serif">
                {t('tapeMeasurements', lang)}
              </h3>
              <p className="text-xs text-rose-500">
                {lang === 'zh' ? '腰围、臀围、胸围与大腿围长期变化跟踪' : 'Waist, hips, chest, and thigh changes over the weeks'}
              </p>
            </div>
          </div>

          {measurementLogs.length === 0 ? (
            <div className="text-center py-8 text-rose-400 text-xs">
              {lang === 'zh' ? '暂无围度记录。在每日日志中记录腰围与臀围即可在此展示！' : 'No measurements recorded yet. Log your waist and hips in the journal to view progress!'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-rose-100 text-[11px] uppercase tracking-wider text-rose-400 font-semibold">
                    <th className="py-3 px-3">{lang === 'zh' ? '日期' : 'Date'}</th>
                    <th className="py-3 px-3">{lang === 'zh' ? '体重' : 'Weight'}</th>
                    <th className="py-3 px-3">{t('waist', lang)} ({profile.measurementUnit})</th>
                    <th className="py-3 px-3">{t('hips', lang)} ({profile.measurementUnit})</th>
                    <th className="py-3 px-3">{t('chest', lang)} ({profile.measurementUnit})</th>
                    <th className="py-3 px-3">{t('thigh', lang)} ({profile.measurementUnit})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-50">
                  {measurementLogs
                    .slice()
                    .reverse()
                    .map((item) => {
                      return (
                        <tr
                          key={item.date}
                          onClick={() => onSelectDate(item.date)}
                          className="hover:bg-rose-50/50 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-3 font-semibold text-rose-950">
                            {item.date}
                          </td>
                          <td className="py-3 px-3 tabular-nums text-rose-800">
                            {item.weight !== undefined ? `${item.weight} ${profile.unit}` : '--'}{item.weightEvening !== undefined ? ` · 🌙${item.weightEvening}` : ''}
                          </td>
                          <td className="py-3 px-3 tabular-nums font-medium text-rose-900">
                            {item.measurements?.waist || '--'}
                          </td>
                          <td className="py-3 px-3 tabular-nums font-medium text-rose-900">
                            {item.measurements?.hips || '--'}
                          </td>
                          <td className="py-3 px-3 tabular-nums font-medium text-rose-900">
                            {item.measurements?.chest || '--'}
                          </td>
                          <td className="py-3 px-3 tabular-nums font-medium text-rose-900">
                            {item.measurements?.thigh || '--'}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
