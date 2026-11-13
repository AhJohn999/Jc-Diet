import React, { useState } from 'react';
import { DailyLog } from '../types/diet';
import { calculateDayTotals } from '../utils/dietMath';
import { Language, t } from '../utils/i18n';

interface CalorieChartProps {
  logs: DailyLog[];
  calorieTarget: number;
  lang?: Language;
}

export const CalorieChart: React.FC<CalorieChartProps> = ({ logs, calorieTarget, lang = 'zh' }) => {
  const [range, setRange] = useState<'14' | '30' | '60'>('14');
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    x: number;
    y: number;
  } | null>(null);

  const daysCount = parseInt(range, 10);
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const recentLogs = sorted.slice(-daysCount);

  if (recentLogs.length === 0) {
    return null;
  }

  const chartData = recentLogs.map((l) => {
    const totals = calculateDayTotals(l);
    return {
      date: l.date,
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
    };
  });

  const maxCalorie = Math.max(...chartData.map((d) => d.calories), calorieTarget * 1.25, 2000);
  const width = 800;
  const height = 260;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const barCount = chartData.length;
  const slotWidth = chartW / barCount;
  const barWidth = Math.max(6, Math.min(24, slotWidth * 0.65));

  const getY = (val: number) => paddingTop + chartH - (val / maxCalorie) * chartH;
  const targetY = getY(calorieTarget);

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-rose-100 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-rose-950 font-serif">
            {t('calorieChartTitle', lang)}
          </h3>
          <p className="text-xs text-rose-600/70 mt-0.5">
            {t('target', lang)}: <span className="font-semibold text-rose-800">{calorieTarget} kcal/day</span>
          </p>
        </div>

        <div className="flex items-center bg-rose-50/70 p-1 rounded-xl border border-rose-100/60 self-start sm:self-auto">
          {(
            [
              { id: '14', label: t('days14', lang) },
              { id: '30', label: t('days30', lang) },
              { id: '60', label: t('days60', lang) },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setRange(item.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                range === item.id
                  ? 'bg-white text-rose-900 shadow-2xs font-semibold'
                  : 'text-rose-600/80 hover:text-rose-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="min-w-[500px]">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none overflow-visible">
            {/* Grid lines */}
            {[0, 500, 1000, 1500, 2000, 2500].filter((c) => c <= maxCalorie).map((val) => {
              const y = getY(val);
              return (
                <g key={val}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="#ffe4e6"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={paddingLeft - 6}
                    y={y + 4}
                    textAnchor="end"
                    fill="#9f1239"
                    fontSize="10"
                    className="tabular-nums"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Target Line */}
            <g>
              <line
                x1={paddingLeft}
                y1={targetY}
                x2={width - paddingRight}
                y2={targetY}
                stroke="#e11d48"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text
                x={width - paddingRight}
                y={targetY - 5}
                textAnchor="end"
                fill="#be123c"
                fontSize="10"
                fontWeight="600"
              >
                Budget ({calorieTarget} kcal)
              </text>
            </g>

            {/* Daily Bars */}
            {chartData.map((d, i) => {
              const x = paddingLeft + i * slotWidth + (slotWidth - barWidth) / 2;
              const barH = (d.calories / maxCalorie) * chartH;
              const y = paddingTop + chartH - barH;
              const isOver = d.calories > calorieTarget;
              const isClose = d.calories > calorieTarget * 0.9 && !isOver;

              const fillColor = isOver ? '#fb7185' : isClose ? '#f43f5e' : '#fda4af';

              const dObj = new Date(d.date + 'T00:00:00');
              const showLabel = i % Math.max(1, Math.floor(chartData.length / 7)) === 0;

              return (
                <g key={d.date}>
                  {/* Invisible tap target */}
                  <rect
                    x={paddingLeft + i * slotWidth}
                    y={paddingTop}
                    width={slotWidth}
                    height={chartH}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() =>
                      setHoveredDay({
                        date: d.date,
                        calories: d.calories,
                        protein: d.protein,
                        carbs: d.carbs,
                        fat: d.fat,
                        x: x + barWidth / 2,
                        y,
                      })
                    }
                    onMouseLeave={() => setHoveredDay(null)}
                    onClick={() =>
                      setHoveredDay({
                        date: d.date,
                        calories: d.calories,
                        protein: d.protein,
                        carbs: d.carbs,
                        fat: d.fat,
                        x: x + barWidth / 2,
                        y,
                      })
                    }
                  />

                  {/* Visual Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(2, barH)}
                    rx="3"
                    fill={fillColor}
                    className="transition-all duration-150 hover:brightness-110 pointer-events-none"
                  />

                  {/* X Axis Label */}
                  {showLabel && (
                    <text
                      x={x + barWidth / 2}
                      y={height - paddingBottom + 18}
                      textAnchor="middle"
                      fill="#9f1239"
                      fontSize="10"
                      className="tabular-nums"
                    >
                      {dObj.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Hover Tooltip */}
            {hoveredDay && (
              <g transform={`translate(${hoveredDay.x}, ${Math.max(30, hoveredDay.y - 56)})`}>
                <rect
                  x="-65"
                  y="-22"
                  width="130"
                  height="50"
                  rx="8"
                  fill="#881337"
                  className="shadow-md"
                />
                <text x="0" y="-8" textAnchor="middle" fill="#fecdd3" fontSize="10" fontWeight="500">
                  {hoveredDay.date}
                </text>
                <text x="0" y="8" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700" className="tabular-nums">
                  {hoveredDay.calories} kcal
                </text>
                <text x="0" y="21" textAnchor="middle" fill="#fda4af" fontSize="9.5" className="tabular-nums">
                  P:{hoveredDay.protein}g · C:{hoveredDay.carbs}g · F:{hoveredDay.fat}g
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};
