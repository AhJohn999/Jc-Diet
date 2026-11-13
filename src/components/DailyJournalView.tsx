import React, { useState, useRef } from 'react';
import { DailyLog, UserProfile, MealItem, MealType } from '../types/diet';
import { calculateDayTotals } from '../utils/dietMath';
import { parseLocalDate, formatLocalDate } from '../utils/dateUtils';
import { processImageFile } from '../utils/imageUtils';
import { Language, t } from '../utils/i18n';
import { WaterTracker } from './WaterTracker';
import { ChevronLeft, ChevronRight, Plus, Trash2, Scale, Utensils, Smile, Heart, Flame, Sparkles, Camera, X } from 'lucide-react';

interface DailyJournalViewProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  profile: UserProfile;
  currentLog?: DailyLog;
  onSaveLog: (log: DailyLog) => void;
  onOpenQuickLogModal: (mealType?: MealType) => void;
  lang?: Language;
}

const PRESET_FOODS_ZH = [
  { name: '粉红希腊酸奶碗 (蓝莓奇亚籽)', calories: 320, protein: 26, carbs: 34, fat: 7, type: 'breakfast' as MealType },
  { name: '全麦牛油果水波蛋吐司', calories: 340, protein: 14, carbs: 32, fat: 18, type: 'breakfast' as MealType },
  { name: '草莓乳清蛋白奶昔', calories: 240, protein: 30, carbs: 18, fat: 4, type: 'breakfast' as MealType },
  { name: '香煎鸡胸肉藜麦轻食碗', calories: 440, protein: 42, carbs: 38, fat: 12, type: 'lunch' as MealType },
  { name: '三文鱼糙米波奇饭 (毛豆时蔬)', calories: 510, protein: 36, carbs: 46, fat: 18, type: 'lunch' as MealType },
  { name: '低脂火鸡胸牛油果全麦卷', calories: 390, protein: 34, carbs: 32, fat: 14, type: 'lunch' as MealType },
  { name: '香草嫩煎三文鱼配芦笋', calories: 480, protein: 42, carbs: 12, fat: 28, type: 'dinner' as MealType },
  { name: '精瘦牛排配烤红薯西兰花', calories: 510, protein: 45, carbs: 38, fat: 15, type: 'dinner' as MealType },
  { name: '鸡肉番茄西葫芦意面', calories: 380, protein: 36, carbs: 18, fat: 16, type: 'dinner' as MealType },
  { name: '苹果与原味大杏仁 (12颗)', calories: 150, protein: 4, carbs: 22, fat: 7, type: 'snack' as MealType },
  { name: '覆盆子胶原蛋白饮', calories: 110, protein: 18, carbs: 4, fat: 1, type: 'snack' as MealType },
  { name: '85% 纯黑巧克力一块', calories: 95, protein: 2, carbs: 7, fat: 7, type: 'snack' as MealType },
];

const PRESET_FOODS_EN = [
  { name: 'Pink Greek Yogurt Bowl', calories: 320, protein: 26, carbs: 34, fat: 7, type: 'breakfast' as MealType },
  { name: 'Avocado Sourdough Toast', calories: 340, protein: 14, carbs: 32, fat: 18, type: 'breakfast' as MealType },
  { name: 'Vanilla Protein Berry Shake', calories: 240, protein: 30, carbs: 18, fat: 4, type: 'breakfast' as MealType },
  { name: 'Grilled Chicken Nourish Bowl', calories: 440, protein: 42, carbs: 38, fat: 12, type: 'lunch' as MealType },
  { name: 'Salmon Poke & Brown Rice', calories: 510, protein: 36, carbs: 46, fat: 18, type: 'lunch' as MealType },
  { name: 'Turkey Avocado Wrap', calories: 390, protein: 34, carbs: 32, fat: 14, type: 'lunch' as MealType },
  { name: 'Pan-Seared Salmon & Asparagus', calories: 480, protein: 42, carbs: 12, fat: 28, type: 'dinner' as MealType },
  { name: 'Lean Beef & Sweet Potato', calories: 510, protein: 45, carbs: 38, fat: 15, type: 'dinner' as MealType },
  { name: 'Zucchini Noodle Turkey Bolognese', calories: 380, protein: 36, carbs: 18, fat: 16, type: 'dinner' as MealType },
  { name: 'Apple & Raw Almonds (12)', calories: 150, protein: 4, carbs: 22, fat: 7, type: 'snack' as MealType },
  { name: 'Raspberry Collagen Drink', calories: 110, protein: 18, carbs: 4, fat: 1, type: 'snack' as MealType },
  { name: 'Dark Chocolate (85%) Square', calories: 95, protein: 2, carbs: 7, fat: 7, type: 'snack' as MealType },
];

export const DailyJournalView: React.FC<DailyJournalViewProps> = ({
  selectedDate,
  onSelectDate,
  profile,
  currentLog,
  onSaveLog,
  onOpenQuickLogModal,
  lang = 'zh',
}) => {
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const [weightInput, setWeightInput] = useState<string>(
    currentLog?.weight !== undefined ? String(currentLog.weight) : ''
  );
  const [weightEveningInput, setWeightEveningInput] = useState<string>(
    currentLog?.weightEvening !== undefined ? String(currentLog.weightEvening) : ''
  );
  const [notesInput, setNotesInput] = useState<string>(currentLog?.notes || '');
  const [waistInput, setWaistInput] = useState<string>(
    currentLog?.measurements?.waist !== undefined ? String(currentLog.measurements.waist) : ''
  );
  const [hipsInput, setHipsInput] = useState<string>(
    currentLog?.measurements?.hips !== undefined ? String(currentLog.measurements.hips) : ''
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [targetMealIdForUpload, setTargetMealIdForUpload] = useState<string | null>(null);

  const presets = lang === 'zh' ? PRESET_FOODS_ZH : PRESET_FOODS_EN;

  // Sync inputs when selected date or log changes
  React.useEffect(() => {
    setWeightInput(currentLog?.weight !== undefined ? String(currentLog.weight) : '');
    setWeightEveningInput(currentLog?.weightEvening !== undefined ? String(currentLog.weightEvening) : '');
    setNotesInput(currentLog?.notes || '');
    setWaistInput(currentLog?.measurements?.waist !== undefined ? String(currentLog.measurements.waist) : '');
    setHipsInput(currentLog?.measurements?.hips !== undefined ? String(currentLog.measurements.hips) : '');
  }, [selectedDate, currentLog]);

  const handlePrevDay = () => {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() - 1);
    onSelectDate(formatLocalDate(d));
  };

  const handleNextDay = () => {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() + 1);
    onSelectDate(formatLocalDate(d));
  };

  const handleToday = () => {
    onSelectDate(formatLocalDate(new Date()));
  };

  const handleSaveWeight = () => {
    const parsed = parseFloat(weightInput);
    const parsedEvening = parseFloat(weightEveningInput);
    const updated: DailyLog = {
      ...(currentLog || { date: selectedDate, meals: [] }),
      date: selectedDate,
      weight: !isNaN(parsed) && parsed > 0 ? parsed : undefined,
      weightEvening: !isNaN(parsedEvening) && parsedEvening > 0 ? parsedEvening : undefined,
    };
    onSaveLog(updated);
  };

  const handleSaveMeasurements = () => {
    const waist = parseFloat(waistInput);
    const hips = parseFloat(hipsInput);
    const updated: DailyLog = {
      ...(currentLog || { date: selectedDate, meals: [] }),
      date: selectedDate,
      measurements: {
        ...(currentLog?.measurements || {}),
        waist: !isNaN(waist) && waist > 0 ? waist : undefined,
        hips: !isNaN(hips) && hips > 0 ? hips : undefined,
      },
    };
    onSaveLog(updated);
  };

  const handleSaveNotes = () => {
    const updated: DailyLog = {
      ...(currentLog || { date: selectedDate, meals: [] }),
      date: selectedDate,
      notes: notesInput,
    };
    onSaveLog(updated);
  };

  const handleRatingChange = (key: 'hungerRating' | 'energyRating' | 'dietAdherence', val: number) => {
    const updated: DailyLog = {
      ...(currentLog || { date: selectedDate, meals: [] }),
      date: selectedDate,
      [key]: val,
    };
    onSaveLog(updated);
  };

  const handleDeleteMeal = (mealId: string) => {
    if (!currentLog) return;
    const updated: DailyLog = {
      ...currentLog,
      meals: currentLog.meals.filter((m) => m.id !== mealId),
    };
    onSaveLog(updated);
  };

  const handlePhotoUploadForMeal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetMealIdForUpload || !currentLog) return;

    try {
      const compressed = await processImageFile(file, 800, 0.82);
      const updatedMeals = currentLog.meals.map((m) =>
        m.id === targetMealIdForUpload ? { ...m, photoUrl: compressed } : m
      );
      onSaveLog({ ...currentLog, meals: updatedMeals });
    } catch (err) {
      console.error('Failed to attach photo:', err);
    } finally {
      setTargetMealIdForUpload(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhotoFromMeal = (mealId: string) => {
    if (!currentLog) return;
    const updatedMeals = currentLog.meals.map((m) =>
      m.id === mealId ? { ...m, photoUrl: undefined } : m
    );
    onSaveLog({ ...currentLog, meals: updatedMeals });
  };

  const handleAddPreset = (preset: typeof PRESET_FOODS_ZH[0]) => {
    const newMeal: MealItem = {
      id: `${selectedDate}-${Date.now()}`,
      type: preset.type,
      name: preset.name,
      calories: preset.calories,
      protein: preset.protein,
      carbs: preset.carbs,
      fat: preset.fat,
      time: new Date().toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    };

    const existingMeals = currentLog?.meals || [];
    const updated: DailyLog = {
      ...(currentLog || { date: selectedDate }),
      date: selectedDate,
      meals: [...existingMeals, newMeal],
    };
    onSaveLog(updated);
  };

  const mealTypes: { type: MealType; labelKey: 'breakfast' | 'lunch' | 'dinner' | 'snack'; icon: string }[] = [
    { type: 'breakfast', labelKey: 'breakfast', icon: '🌅' },
    { type: 'lunch', labelKey: 'lunch', icon: '🥗' },
    { type: 'dinner', labelKey: 'dinner', icon: '🍲' },
    { type: 'snack', labelKey: 'snack', icon: '🍓' },
  ];

  const dateObj = parseLocalDate(selectedDate);
  const formattedDate = dateObj.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Hidden file input for meal photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUploadForMeal}
        className="hidden"
      />

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

      {/* Date Header Navigator */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-rose-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="w-9 h-9 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
            title={lang === 'zh' ? '前一天' : 'Previous Day'}
            aria-label="Previous Day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-500/90 block flex items-center gap-1">
              <span>{profile.customEmoji || '🌸'}</span>
              <span>{profile.customTitle?.trim() || (lang === 'zh' ? 'JC 饮食日记' : 'JC Diet')}</span>
              <span className="text-rose-300">·</span>
              <span>{t('journalTitle', lang)}</span>
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-rose-950 font-serif">
              {formattedDate}
            </h2>
          </div>

          <button
            onClick={handleNextDay}
            className="w-9 h-9 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
            title={lang === 'zh' ? '后一天' : 'Next Day'}
            aria-label="Next Day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && onSelectDate(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/50 text-rose-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          <button
            onClick={handleToday}
            className="text-xs px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200/80 text-rose-900 font-semibold transition-colors cursor-pointer"
          >
            {t('today', lang)}
          </button>
        </div>
      </div>

      {/* Two Column Layout: Nutrition on Left, Weigh-in & Ratings on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Meals & Foods */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Presets Carousel */}
          <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <h3 className="text-xs font-semibold text-rose-900 uppercase tracking-wider">
                  {t('quickPresets', lang)}
                </h3>
              </div>
              <span className="text-[11px] text-rose-500">{t('tapToLogInstant', lang)}</span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {presets.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddPreset(item)}
                  className="shrink-0 bg-rose-50/50 hover:bg-rose-100/70 border border-rose-100 text-left p-2.5 rounded-xl transition-all cursor-pointer group"
                >
                  <p className="text-xs font-semibold text-rose-950 group-hover:text-pink-600 transition-colors">
                    {item.name}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-rose-500 mt-1">
                    <span className="font-semibold text-rose-700 tabular-nums">{item.calories} kcal</span>
                    <span>·</span>
                    <span>P: {item.protein}g</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Meals Timeline */}
          {mealTypes.map((mt) => {
            const meals = (currentLog?.meals || []).filter((m) => m.type === mt.type);
            const totalCals = meals.reduce((s, m) => s + (m.calories || 0), 0);
            const label = t(mt.labelKey, lang);

            return (
              <div
                key={mt.type}
                className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{mt.icon}</span>
                    <h3 className="text-sm font-semibold text-rose-950">{label}</h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-rose-900 tabular-nums">
                      {totalCals} kcal
                    </span>
                    <button
                      onClick={() => onOpenQuickLogModal(mt.type)}
                      className="px-2.5 py-1 text-xs font-medium text-pink-600 hover:text-white hover:bg-pink-500 rounded-lg border border-pink-200 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{lang === 'zh' ? '添加' : 'Add'}</span>
                    </button>
                  </div>
                </div>

                {meals.length > 0 ? (
                  <div className="divide-y divide-rose-50">
                    {meals.map((item) => (
                      <div
                        key={item.id}
                        className="py-2.5 flex items-start justify-between gap-3 text-xs group"
                      >
                        <div className="flex items-start gap-2.5">
                          {item.photoUrl ? (
                            <div className="relative group/photo shrink-0">
                              <img
                                src={item.photoUrl}
                                alt={item.name}
                                onClick={() => setZoomedPhoto(item.photoUrl!)}
                                className="w-12 h-12 object-cover rounded-xl border border-rose-200 cursor-pointer hover:opacity-90 transition-opacity shadow-2xs"
                                title={t('viewFullPhoto', lang)}
                              />
                              <button
                                onClick={() => handleRemovePhotoFromMeal(item.id)}
                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity text-[10px] cursor-pointer"
                                title="Remove photo"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setTargetMealIdForUpload(item.id);
                                fileInputRef.current?.click();
                              }}
                              className="w-12 h-12 rounded-xl border border-dashed border-rose-200 hover:border-pink-400 bg-rose-50/40 hover:bg-pink-50/50 flex flex-col items-center justify-center text-rose-400 hover:text-pink-600 transition-colors shrink-0 cursor-pointer"
                              title={t('uploadMealPhoto', lang)}
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span className="text-[9px] mt-0.5">{lang === 'zh' ? '照片' : 'Photo'}</span>
                            </button>
                          )}

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-rose-950">{item.name}</span>
                              {item.time && (
                                <span className="text-[10px] text-rose-400">({item.time})</span>
                              )}
                            </div>
                            {item.notes && (
                              <p className="text-[11px] text-rose-500/80 mt-0.5">{item.notes}</p>
                            )}
                            <div className="flex items-center gap-2 text-[10px] text-rose-400 mt-1">
                              <span>{item.calories} kcal</span>
                              <span>·</span>
                              <span>P: {item.protein}g</span>
                              <span>·</span>
                              <span>C: {item.carbs}g</span>
                              <span>·</span>
                              <span>F: {item.fat}g</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setTargetMealIdForUpload(item.id);
                              fileInputRef.current?.click();
                            }}
                            className="text-rose-400 hover:text-pink-600 p-1 rounded-md transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                            title={t('uploadMealPhoto', lang)}
                            aria-label="Upload photo"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMeal(item.id)}
                            className="text-rose-300 hover:text-rose-600 p-1 rounded-md transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                            title="Delete food entry"
                            aria-label="Delete food entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-rose-400 py-1 text-center">
                    {lang === 'zh' ? `暂未记录${label}` : `Nothing logged for ${label.toLowerCase()} yet.`}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Weight, Water, Reflections */}
        <div className="space-y-6">
          {/* Day Weight Log */}
          <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-pink-500" />
              <h3 className="text-xs font-semibold text-rose-900 uppercase tracking-wider">
                {t('weighInForDay', lang)}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {([
                { key: 'morningWeight', value: weightInput, set: setWeightInput },
                { key: 'eveningWeight', value: weightEveningInput, set: setWeightEveningInput },
              ] as const).map((f) => (
                <div key={f.key} className="relative flex-1">
                  <input
                    type="number"
                    step="0.1"
                    placeholder={t(f.key, lang)}
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    className="w-full text-base font-bold text-rose-950 pl-3 pr-8 py-2 rounded-xl border border-rose-200 bg-rose-50/30 focus:outline-none focus:ring-2 focus:ring-rose-400 tabular-nums"
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-rose-400 font-medium">
                    {profile.unit}
                  </span>
                </div>
              ))}
              <button
                onClick={handleSaveWeight}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors cursor-pointer"
              >
                {t('saveWeight', lang)}
              </button>
            </div>
          </div>

          {/* Water Tracker */}
          <WaterTracker
            currentMl={currentLog?.waterIntake || 0}
            targetMl={currentLog?.waterTarget || profile.dailyWaterTarget}
            lang={lang}
            onChange={(newMl) => {
              const updated: DailyLog = {
                ...(currentLog || { date: selectedDate, meals: [] }),
                date: selectedDate,
                waterIntake: newMl,
              };
              onSaveLog(updated);
            }}
          />

          {/* Body Measurements */}
          <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold text-rose-900 uppercase tracking-wider">
              {t('tapeMeasurements', lang)} ({profile.measurementUnit})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-rose-500 block mb-1">{t('waist', lang)}</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="e.g. 72"
                  value={waistInput}
                  onChange={(e) => setWaistInput(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50/30 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
              <div>
                <label className="text-[11px] text-rose-500 block mb-1">{t('hips', lang)}</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="e.g. 98"
                  value={hipsInput}
                  onChange={(e) => setHipsInput(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50/30 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
            </div>
            <button
              onClick={handleSaveMeasurements}
              className="w-full py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
            >
              {t('updateMeasurements', lang)}
            </button>
          </div>

          {/* Daily Reflections & Ratings */}
          <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs space-y-4">
            <h3 className="text-xs font-semibold text-rose-900 uppercase tracking-wider">
              {t('dailyReflection', lang)}
            </h3>

            {/* Adherence */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-rose-950">{t('dietAdherenceScore', lang)}</span>
                <span className="text-rose-500 font-semibold">{currentLog?.dietAdherence || 5} / 5</span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleRatingChange('dietAdherence', val)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      (currentLog?.dietAdherence || 5) >= val
                        ? 'bg-rose-500 text-white'
                        : 'bg-rose-100 text-rose-400'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Energy */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-rose-950">{t('energyLevelScore', lang)}</span>
                <span className="text-rose-500 font-semibold">{currentLog?.energyRating || 4} / 5</span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleRatingChange('energyRating', val)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      (currentLog?.energyRating || 4) >= val
                        ? 'bg-pink-400 text-white'
                        : 'bg-rose-100 text-rose-400'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-rose-950 block mb-1">
                {t('journalNotesTitle', lang)}
              </label>
              <textarea
                rows={3}
                placeholder={t('journalPlaceholder', lang)}
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                onBlur={handleSaveNotes}
                className="w-full text-xs p-2.5 rounded-xl border border-rose-200 bg-rose-50/20 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
              />
              <button
                onClick={handleSaveNotes}
                className="mt-1 text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
              >
                {t('saveNotes', lang)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
