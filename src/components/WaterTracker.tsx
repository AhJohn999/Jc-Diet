import React from 'react';
import { Droplet, Plus, Minus } from 'lucide-react';
import { Language, t } from '../utils/i18n';

interface WaterTrackerProps {
  currentMl: number;
  targetMl: number;
  onChange: (newMl: number) => void;
  lang?: Language;
}

export const WaterTracker: React.FC<WaterTrackerProps> = ({
  currentMl,
  targetMl,
  onChange,
  lang = 'zh',
}) => {
  const glassVolume = 250; // ml per glass
  const totalGlasses = Math.max(8, Math.ceil(targetMl / glassVolume));
  const filledGlasses = Math.floor(currentMl / glassVolume);
  const percentage = Math.min(100, Math.round((currentMl / targetMl) * 100));

  const handleAddGlass = () => {
    onChange(currentMl + glassVolume);
  };

  const handleRemoveGlass = () => {
    if (currentMl >= glassVolume) {
      onChange(currentMl - glassVolume);
    } else {
      onChange(0);
    }
  };

  const handleSetGlasses = (index: number) => {
    onChange((index + 1) * glassVolume);
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-pink-50 border border-pink-100 text-pink-600 flex items-center justify-center">
            <Droplet className="w-4 h-4 fill-pink-500 text-pink-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-rose-950">{t('hydrationTitle', lang)}</h3>
            <p className="text-xs text-rose-600/70">{t('hydrationTarget', lang)}: {targetMl} ml / {lang === 'zh' ? '天' : 'day'}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRemoveGlass}
            disabled={currentMl <= 0}
            className="w-7 h-7 rounded-lg border border-rose-200 text-rose-600 flex items-center justify-center hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title={t('removeGlass', lang)}
            aria-label="Decrease water"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-semibold text-rose-900 tabular-nums px-1">
            {currentMl} <span className="font-normal text-rose-500">ml</span>
          </span>
          <button
            onClick={handleAddGlass}
            className="w-7 h-7 rounded-lg bg-pink-500 text-white flex items-center justify-center hover:bg-pink-600 active:scale-95 transition-all shadow-xs shadow-pink-500/20 cursor-pointer"
            title={t('addGlass', lang)}
            aria-label="Add water"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-rose-100/60 rounded-full h-2 mb-3.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-pink-400 to-rose-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Glass Icons Grid */}
      <div className="grid grid-cols-8 sm:grid-cols-9 gap-1.5 pt-1">
        {Array.from({ length: totalGlasses }).map((_, idx) => {
          const isFilled = idx < filledGlasses;
          return (
            <button
              key={idx}
              onClick={() => handleSetGlasses(idx)}
              className={`h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                isFilled
                  ? 'bg-gradient-to-b from-pink-200 to-rose-300 border-rose-300 text-rose-800 shadow-2xs'
                  : 'bg-rose-50/40 border-dashed border-rose-200 text-rose-300 hover:border-rose-400 hover:text-rose-400'
              }`}
              title={`${lang === 'zh' ? '第' : 'Glass'} ${idx + 1} ${(idx + 1) * glassVolume} ml`}
              aria-label={`Water glass ${idx + 1}`}
            >
              <Droplet
                className={`w-3.5 h-3.5 ${
                  isFilled ? 'fill-rose-500 text-rose-600' : 'text-rose-300'
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-rose-500/90 font-medium">
        <span>{lang === 'zh' ? `已记录 ${filledGlasses} 杯 (${currentMl} ml)` : `${filledGlasses} glasses recorded (${currentMl} ml)`}</span>
        <span>{lang === 'zh' ? `完成度 ${percentage}%` : `${percentage}% completed`}</span>
      </div>
    </div>
  );
};

