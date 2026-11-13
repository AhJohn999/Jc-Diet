import React from 'react';
import { DailyLog, UserProfile } from '../types/diet';
import { WeightChart } from './WeightChart';
import { CalorieChart } from './CalorieChart';
import { Language, t } from '../utils/i18n';
import { TrendingDown, Flame, Sparkles, PieChart, Target, Calendar } from 'lucide-react';

interface AnalyticsViewProps {
  logs: DailyLog[];
  profile: UserProfile;
  lang?: Language;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ logs, profile, lang = 'zh' }) => {
  // Aggregate stats
  const weightedLogs = logs
    .filter((l) => l.weight !== undefined)
    .sort((a, b) => a.date.localeCompare(b.date));

  const weights = weightedLogs.map((l) => l.weight as number);
  const minWeight = weights.length > 0 ? Math.min(...weights) : profile.currentWeight;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : profile.startWeight;
  const totalLoss = Math.round((profile.startWeight - profile.currentWeight) * 10) / 10;
  const remainingLoss = Math.round((profile.currentWeight - profile.goalWeight) * 10) / 10;

  // Macro totals
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalCalories = 0;
  let loggedDaysCount = 0;

  logs.forEach((log) => {
    let dayCals = 0;
    log.meals.forEach((m) => {
      totalProtein += m.protein || 0;
      totalCarbs += m.carbs || 0;
      totalFat += m.fat || 0;
      dayCals += m.calories || 0;
    });
    if (dayCals > 0) {
      totalCalories += dayCals;
      loggedDaysCount++;
    }
  });

  const avgCalories = loggedDaysCount > 0 ? Math.round(totalCalories / loggedDaysCount) : profile.dailyCalorieTarget;
  const avgDeficit = profile.dailyCalorieTarget - avgCalories;

  // Macro calories: Protein 4 cal/g, Carbs 4 cal/g, Fat 9 cal/g
  const proteinCals = totalProtein * 4;
  const carbsCals = totalCarbs * 4;
  const fatCals = totalFat * 9;
  const allMacroCals = proteinCals + carbsCals + fatCals || 1;

  const proteinRatio = Math.round((proteinCals / allMacroCals) * 100);
  const carbsRatio = Math.round((carbsCals / allMacroCals) * 100);
  const fatRatio = Math.round((fatCals / allMacroCals) * 100);

  // Projected weeks to goal based on weekly loss rate
  const weeklyRate = profile.weeklyLossGoal || 0.5;
  const weeksLeft = remainingLoss > 0 ? Math.ceil(remainingLoss / weeklyRate) : 0;

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-100 shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-rose-500">
            <TrendingDown className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('totalDrop', lang)}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-rose-950 tabular-nums">
              {totalLoss > 0 ? `-${totalLoss}` : totalLoss}
            </span>
            <span className="text-xs text-rose-500 font-medium">{profile.unit}</span>
          </div>
          <span className="text-[11px] text-rose-500/80 mt-1 block">
            {lang === 'zh' ? `从初始 ${profile.startWeight} ${profile.unit} 至今` : `From ${profile.startWeight} ${profile.unit} start`}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-100 shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-pink-500">
            <Sparkles className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('lowestWeigh', lang)}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-rose-950 tabular-nums">
              {minWeight}
            </span>
            <span className="text-xs text-rose-500 font-medium">{profile.unit}</span>
          </div>
          <span className="text-[11px] text-rose-500/80 mt-1 block">
            {lang === 'zh' ? '历史最佳阶段低点' : 'Personal all-time low'}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-100 shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-rose-600">
            <Flame className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('avgDailyIntake', lang)}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-rose-950 tabular-nums">
              {avgCalories}
            </span>
            <span className="text-xs text-rose-500 font-medium">kcal</span>
          </div>
          <span className="text-[11px] text-rose-500/80 mt-1 block">
            {avgDeficit >= 0
              ? `${avgDeficit} kcal ${lang === 'zh' ? '日均缺口' : 'avg deficit'}`
              : `${Math.abs(avgDeficit)} kcal ${lang === 'zh' ? '超标' : 'surplus'}`}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-100 shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-rose-500">
            <Target className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('toGoal', lang)}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-rose-950 tabular-nums">
              {remainingLoss > 0 ? remainingLoss : 0}
            </span>
            <span className="text-xs text-rose-500 font-medium">{profile.unit}</span>
          </div>
          <span className="text-[11px] text-rose-500/80 mt-1 block">
            {lang === 'zh'
              ? `约 ~${weeksLeft} 周 (每周预期 -${profile.weeklyLossGoal}${profile.unit})`
              : `~${weeksLeft} weeks at ${profile.weeklyLossGoal} ${profile.unit}/wk`}
          </span>
        </div>
      </div>

      {/* Weight Trend Chart */}
      <WeightChart
        logs={logs}
        startWeight={profile.startWeight}
        goalWeight={profile.goalWeight}
        unit={profile.unit}
        lang={lang}
      />

      {/* Calorie Deficit & Target Chart */}
      <CalorieChart
        logs={logs}
        calorieTarget={profile.dailyCalorieTarget}
        lang={lang}
      />

      {/* Macronutrient Balance Card */}
      <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-pink-500" />
            <h3 className="text-base font-semibold text-rose-950 font-serif">
              {t('macroDistribution', lang)}
            </h3>
          </div>
          <span className="text-xs text-rose-500 font-medium">
            {t('styleLabel', lang)}: {profile.dietStyle}
          </span>
        </div>

        {/* Stacked Percentage Bar */}
        <div className="w-full h-4 rounded-full overflow-hidden flex bg-rose-100/50 mb-4">
          <div
            style={{ width: `${proteinRatio}%` }}
            className="bg-rose-500 h-full transition-all"
            title={`${t('protein', lang)}: ${proteinRatio}%`}
          />
          <div
            style={{ width: `${carbsRatio}%` }}
            className="bg-pink-400 h-full transition-all"
            title={`${t('carbs', lang)}: ${carbsRatio}%`}
          />
          <div
            style={{ width: `${fatRatio}%` }}
            className="bg-rose-300 h-full transition-all"
            title={`${t('fats', lang)}: ${fatRatio}%`}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-rose-50/40 rounded-xl border border-rose-100/70">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span className="text-xs font-semibold text-rose-950">{t('protein', lang)}</span>
            </div>
            <span className="text-lg font-bold text-rose-900 tabular-nums">
              {proteinRatio}%
            </span>
            <span className="text-[11px] text-rose-500 block">
              {t('target', lang)}: {profile.dailyProteinTarget}g / {lang === 'zh' ? '天' : 'day'}
            </span>
          </div>

          <div className="p-3 bg-rose-50/40 rounded-xl border border-rose-100/70">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-400 inline-block" />
              <span className="text-xs font-semibold text-rose-950">{t('carbs', lang)}</span>
            </div>
            <span className="text-lg font-bold text-rose-900 tabular-nums">
              {carbsRatio}%
            </span>
            <span className="text-[11px] text-rose-500 block">
              {t('target', lang)}: {profile.dailyCarbsTarget}g / {lang === 'zh' ? '天' : 'day'}
            </span>
          </div>

          <div className="p-3 bg-rose-50/40 rounded-xl border border-rose-100/70">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-300 inline-block" />
              <span className="text-xs font-semibold text-rose-950">{t('fats', lang)}</span>
            </div>
            <span className="text-lg font-bold text-rose-900 tabular-nums">
              {fatRatio}%
            </span>
            <span className="text-[11px] text-rose-500 block">
              {t('target', lang)}: {profile.dailyFatTarget}g / {lang === 'zh' ? '天' : 'day'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
