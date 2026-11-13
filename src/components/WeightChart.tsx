import React, { useState, useId } from 'react';
import { DailyLog, WeightUnit } from '../types/diet';
import { Language, t } from '../utils/i18n';

interface WeightChartProps {
  logs: DailyLog[];
  startWeight: number;
  goalWeight: number;
  unit: WeightUnit;
  lang?: Language;
}

export const WeightChart: React.FC<WeightChartProps> = ({
  logs,
  startWeight,
  goalWeight,
  unit,
  lang = 'zh',
}) => {
  const [filterRange, setFilterRange] = useState<'all' | '60' | '30' | '14'>('all');
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    weight: number;
    x: number;
    y: number;
    deltaFromStart: number;
  } | null>(null);

  const gradientId = useId();

  // Extract logs with weight
  const weightedLogs = logs
    .filter((l) => l.weight !== undefined)
    .sort((a, b) => a.date.localeCompare(b.date));

  let filtered = weightedLogs;
  if (filterRange !== 'all') {
    const days = parseInt(filterRange, 10);
    filtered = weightedLogs.slice(-days);
  }

  if (filtered.length < 2) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-rose-100 flex flex-col items-center justify-center min-h-[260px] text-center">
        <p className="text-sm font-medium text-rose-900 mb-1">
          {lang === 'zh' ? '暂无足够称重数据以绘制趋势线' : 'More weigh-in data needed for trendline'}
        </p>
        <p className="text-xs text-rose-500">
          {lang === 'zh' ? '至少记录2次体重即可展现周与月度曲线。' : 'Record at least 2 weigh-ins to see your weekly and monthly curve.'}
        </p>
      </div>
    );
  }

  // Calculate 7-day moving average
  const dataWithMovingAvg = filtered.map((item, idx) => {
    const windowStart = Math.max(0, idx - 6);
    const windowSlice = filtered.slice(windowStart, idx + 1);
    const sum = windowSlice.reduce((s, w) => s + (w.weight || 0), 0);
    const avg = Math.round((sum / windowSlice.length) * 10) / 10;
    return {
      date: item.date,
      weight: item.weight!,
      movingAvg: avg,
    };
  });

  const weights = dataWithMovingAvg.map((d) => d.weight);
  const minWeightVal = Math.min(...weights, goalWeight);
  const maxWeightVal = Math.max(...weights, startWeight);

  const paddingVal = (maxWeightVal - minWeightVal) * 0.1 || 1.0;
  const minY = Math.floor((minWeightVal - paddingVal) * 2) / 2;
  const maxY = Math.ceil((maxWeightVal + paddingVal) * 2) / 2;

  // Chart dimensions
  const width = 800;
  const height = 320;
  const paddingLeft = 52;
  const paddingRight = 24;
  const paddingTop = 30;
  const paddingBottom = 45;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const getX = (idx: number) => paddingLeft + (idx / (dataWithMovingAvg.length - 1)) * chartW;
  const getY = (val: number) => paddingTop + chartH - ((val - minY) / (maxY - minY)) * chartH;

  // Build SVG path strings
  const points = dataWithMovingAvg.map((d, i) => `${getX(i)},${getY(d.weight)}`).join(' ');
  const movingAvgPoints = dataWithMovingAvg.map((d, i) => `${getX(i)},${getY(d.movingAvg)}`).join(' ');

  // Area under path
  const areaPath = `M ${getX(0)},${getY(dataWithMovingAvg[0].weight)} ` +
    dataWithMovingAvg.map((d, i) => `L ${getX(i)},${getY(d.weight)}`).join(' ') +
    ` L ${getX(dataWithMovingAvg.length - 1)},${height - paddingBottom} L ${getX(0)},${height - paddingBottom} Z`;

  // Y-axis ticks
  const yTicks = [
    minY,
    minY + (maxY - minY) * 0.25,
    minY + (maxY - minY) * 0.5,
    minY + (maxY - minY) * 0.75,
    maxY,
  ];

  const goalY = getY(goalWeight);
  const startY = getY(startWeight);

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-rose-100 shadow-xs relative">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-rose-950 font-serif">
              {t('weightCurveTitle', lang)}
            </h3>
            <span className="text-xs text-rose-500 font-medium">({unit})</span>
          </div>
          <p className="text-xs text-rose-600/70 mt-0.5">
            {t('weightCurveDesc', lang)}
          </p>
        </div>

        {/* Segmented Range Filter */}
        <div className="flex items-center bg-rose-50/70 p-1 rounded-xl border border-rose-100/60 self-start sm:self-auto">
          {(
            [
              { id: '14', label: t('days14', lang) },
              { id: '30', label: t('days30', lang) },
              { id: '60', label: t('days60', lang) },
              { id: 'all', label: t('allTime', lang) },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterRange(item.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                filterRange === item.id
                  ? 'bg-white text-rose-900 shadow-2xs font-semibold'
                  : 'text-rose-600/80 hover:text-rose-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[500px]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none overflow-visible"
          >
            <defs>
              <linearGradient id={`fillGrad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {yTicks.map((tickVal, i) => {
              const y = getY(tickVal);
              return (
                <g key={i}>
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
                    x={paddingLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    fill="#9f1239"
                    fontSize="11"
                    fontFamily="inherit"
                    className="tabular-nums font-medium"
                  >
                    {tickVal.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Goal Line */}
            {goalWeight >= minY && goalWeight <= maxY && (
              <g>
                <line
                  x1={paddingLeft}
                  y1={goalY}
                  x2={width - paddingRight}
                  y2={goalY}
                  stroke="#ec4899"
                  strokeWidth="1.5"
                  strokeDasharray="5 4"
                />
                <text
                  x={width - paddingRight}
                  y={goalY - 6}
                  textAnchor="end"
                  fill="#db2777"
                  fontSize="10"
                  fontWeight="600"
                >
                  Goal ({goalWeight} {unit})
                </text>
              </g>
            )}

            {/* Start Line */}
            {startWeight >= minY && startWeight <= maxY && (
              <g>
                <line
                  x1={paddingLeft}
                  y1={startY}
                  x2={width - paddingRight}
                  y2={startY}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={width - paddingRight}
                  y={startY - 6}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                >
                  Start ({startWeight} {unit})
                </text>
              </g>
            )}

            {/* Area fill */}
            <path d={areaPath} fill={`url(#fillGrad-${gradientId})`} />

            {/* Actual weigh-ins line */}
            <polyline
              fill="none"
              stroke="#fb7185"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />

            {/* 7-day Moving Average Trendline */}
            <polyline
              fill="none"
              stroke="#e11d48"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={movingAvgPoints}
            />

            {/* Interactive Data Dots */}
            {dataWithMovingAvg.map((d, i) => {
              const x = getX(i);
              const y = getY(d.weight);
              const delta = Math.round((d.weight - startWeight) * 10) / 10;
              const isHovered = hoveredPoint?.date === d.date;

              return (
                <g key={d.date}>
                  {/* Invisible enlarged hit target for effortless tapping */}
                  <circle
                    cx={x}
                    cy={y}
                    r="12"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() =>
                      setHoveredPoint({
                        date: d.date,
                        weight: d.weight,
                        x,
                        y,
                        deltaFromStart: delta,
                      })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                    onClick={() =>
                      setHoveredPoint({
                        date: d.date,
                        weight: d.weight,
                        x,
                        y,
                        deltaFromStart: delta,
                      })
                    }
                  />
                  {/* Visual dot */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 5.5 : 3}
                    fill={isHovered ? '#be123c' : '#f43f5e'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="pointer-events-none transition-all duration-150"
                  />
                </g>
              );
            })}

            {/* X-axis labels (show sample dates) */}
            {dataWithMovingAvg.map((d, i) => {
              // Only show ~6-8 evenly spaced labels
              const step = Math.max(1, Math.floor(dataWithMovingAvg.length / 6));
              if (i % step === 0 || i === dataWithMovingAvg.length - 1) {
                const x = getX(i);
                const dObj = new Date(d.date + 'T00:00:00');
                const label = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <text
                    key={d.date}
                    x={x}
                    y={height - paddingBottom + 20}
                    textAnchor="middle"
                    fill="#9f1239"
                    fontSize="10.5"
                    className="tabular-nums"
                  >
                    {label}
                  </text>
                );
              }
              return null;
            })}

            {/* Tooltip render */}
            {hoveredPoint && (
              <g transform={`translate(${hoveredPoint.x}, ${Math.max(35, hoveredPoint.y - 48)})`}>
                <rect
                  x="-55"
                  y="-22"
                  width="110"
                  height="40"
                  rx="8"
                  fill="#881337"
                  className="shadow-md"
                />
                <text
                  x="0"
                  y="-6"
                  textAnchor="middle"
                  fill="#fecdd3"
                  fontSize="10"
                  fontWeight="500"
                >
                  {hoveredPoint.date}
                </text>
                <text
                  x="0"
                  y="10"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="700"
                  className="tabular-nums"
                >
                  {hoveredPoint.weight} {unit} ({hoveredPoint.deltaFromStart > 0 ? `+${hoveredPoint.deltaFromStart}` : hoveredPoint.deltaFromStart} {unit})
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Chart Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-rose-100 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-rose-800">
            <span className="w-3 h-1 bg-rose-600 rounded-full inline-block" />
            <span className="font-medium">{t('movingAvgLegend', lang)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-700">
            <span className="w-3 h-0.5 bg-rose-400 rounded-full inline-block" />
            <span>{t('dailyWeighLegend', lang)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-pink-700">
            <span className="w-3 h-0.5 border-t border-dashed border-pink-500 inline-block" />
            <span>{t('goalLegend', lang)} ({goalWeight} {unit})</span>
          </div>
        </div>

        <div className="text-rose-500 text-[11px]">
          {lang === 'zh' ? '悬停或轻触节点查看具体体重' : 'Hover or tap any node for exact weigh-in'}
        </div>
      </div>
    </div>
  );
};
