import React, { useState, useRef } from 'react';
import { MealItem, MealType, DailyLog, WeightUnit } from '../types/diet';
import { processImageFile } from '../utils/imageUtils';
import { Language, t } from '../utils/i18n';
import { X, Utensils, Scale, Plus, Camera, Image as ImageIcon, Trash2 } from 'lucide-react';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  initialMealType?: MealType;
  currentLog?: DailyLog;
  onSaveLog: (log: DailyLog) => void;
  unit: WeightUnit;
  lang?: Language;
}

export const LogModal: React.FC<LogModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  initialMealType = 'breakfast',
  currentLog,
  onSaveLog,
  unit,
  lang = 'zh',
}) => {
  const [activeTab, setActiveTab] = useState<'meal' | 'weight'>('meal');

  // Meal form state
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Weight form state
  const [weight, setWeight] = useState(
    currentLog?.weight !== undefined ? String(currentLog.weight) : ''
  );
  const [weightEvening, setWeightEvening] = useState(
    currentLog?.weightEvening !== undefined ? String(currentLog.weightEvening) : ''
  );

  React.useEffect(() => {
    if (initialMealType) {
      setMealType(initialMealType);
    }
    if (currentLog?.weight !== undefined) {
      setWeight(String(currentLog.weight));
    }
    if (currentLog?.weightEvening !== undefined) {
      setWeightEvening(String(currentLog.weightEvening));
    }
  }, [initialMealType, currentLog]);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingPhoto(true);
      const compressed = await processImageFile(file, 800, 0.82);
      setPhotoUrl(compressed);
    } catch (err) {
      console.error('Failed to process image:', err);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleSaveMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim() && !photoUrl) return;

    const newMeal: MealItem = {
      id: `${selectedDate}-${Date.now()}`,
      type: mealType,
      name: foodName.trim() || t(mealType, lang),
      calories: Math.round(parseFloat(calories) || 0),
      protein: Math.round(parseFloat(protein) || 0),
      carbs: Math.round(parseFloat(carbs) || 0),
      fat: Math.round(parseFloat(fat) || 0),
      notes: notes.trim() || undefined,
      photoUrl: photoUrl || undefined,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    };

    const existingMeals = currentLog?.meals || [];
    const updated: DailyLog = {
      ...(currentLog || { date: selectedDate }),
      date: selectedDate,
      meals: [...existingMeals, newMeal],
    };

    onSaveLog(updated);
    // Reset form
    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setNotes('');
    setPhotoUrl(undefined);
    onClose();
  };

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const morning = parseFloat(weight);
    const evening = parseFloat(weightEvening);
    const hasMorning = !isNaN(morning) && morning > 0;
    const hasEvening = !isNaN(evening) && evening > 0;
    if (!hasMorning && !hasEvening) return;

    const updated: DailyLog = {
      ...(currentLog || { date: selectedDate, meals: [] }),
      date: selectedDate,
      weight: hasMorning ? morning : currentLog?.weight,
      weightEvening: hasEvening ? evening : currentLog?.weightEvening,
    };

    onSaveLog(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full border border-rose-100 shadow-xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-rose-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-rose-950 font-serif">
              {t('quickLogTitle', lang)} ({selectedDate})
            </h3>
            <p className="text-xs text-rose-500">{t('quickLogSub', lang)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-rose-100/60 text-rose-400 hover:text-rose-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-5 pt-4 shrink-0">
          <div className="grid grid-cols-2 p-1 bg-rose-50/70 rounded-xl border border-rose-100">
            <button
              onClick={() => setActiveTab('meal')}
              className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'meal'
                  ? 'bg-white text-rose-950 shadow-xs'
                  : 'text-rose-600/70 hover:text-rose-900'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>{t('logFoodTab', lang)}</span>
            </button>
            <button
              onClick={() => setActiveTab('weight')}
              className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'weight'
                  ? 'bg-white text-rose-950 shadow-xs'
                  : 'text-rose-600/70 hover:text-rose-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>{t('logWeightTab', lang)}</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto">
          {activeTab === 'meal' ? (
            <form onSubmit={handleSaveMeal} className="space-y-4">
              {/* Meal Category */}
              <div>
                <label className="text-xs font-medium text-rose-950 block mb-1">
                  {t('mealCategory', lang)}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(
                    [
                      { id: 'breakfast', label: t('breakfast', lang) },
                      { id: 'lunch', label: t('lunch', lang) },
                      { id: 'dinner', label: t('dinner', lang) },
                      { id: 'snack', label: t('snack', lang) },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMealType(m.id)}
                      className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                        mealType === m.id
                          ? 'bg-rose-500 border-rose-500 text-white font-semibold'
                          : 'bg-rose-50/40 border-rose-100 text-rose-700 hover:bg-rose-100/50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Food Name */}
              <div>
                <label className="text-xs font-medium text-rose-950 block mb-1">
                  {t('foodName', lang)}
                </label>
                <input
                  type="text"
                  placeholder={t('foodNamePlaceholder', lang)}
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/20 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              {/* Meal Picture Upload */}
              <div>
                <label className="text-xs font-medium text-rose-950 block mb-1">
                  {t('mealPictureOptional', lang)}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                
                {photoUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-rose-200 bg-rose-50/30 p-1 flex items-center gap-3">
                    <img
                      src={photoUrl}
                      alt="Meal Preview"
                      className="w-16 h-16 object-cover rounded-xl border border-rose-200"
                    />
                    <div className="flex-1 text-xs text-rose-800">
                      <p className="font-semibold">{t('photoAttached', lang)}</p>
                      <p className="text-[10px] text-rose-500">
                        {lang === 'zh' ? '已保存至本地数据库，导出 Excel 时包含照片' : 'Saved to database & exported to Excel'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhotoUrl(undefined)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-lg mr-2 transition-colors cursor-pointer"
                      title={t('removePhoto', lang)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingPhoto}
                    className="w-full py-3 px-3 border border-dashed border-rose-300 hover:border-pink-500 hover:bg-pink-50/40 rounded-2xl flex items-center justify-center gap-2 text-xs font-medium text-rose-700 transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-pink-500" />
                    <span>{isProcessingPhoto ? t('photoCompressing', lang) : t('uploadMealPhoto', lang)}</span>
                  </button>
                )}
              </div>

              <p className="text-[11px] text-rose-400 -mt-2">{t('mealNameOrPhoto', lang)}</p>

              {/* Calories & Macros */}
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <label className="text-[11px] font-medium text-rose-950 block mb-1">
                    {t('caloriesLabel', lang)}
                  </label>
                  <input
                    type="number"
                    placeholder="350"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50/20 focus:outline-none focus:ring-2 focus:ring-rose-400 tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-rose-950 block mb-1">
                    {t('proteinLabel', lang)}
                  </label>
                  <input
                    type="number"
                    placeholder="25"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50/20 focus:outline-none focus:ring-2 focus:ring-rose-400 tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-rose-950 block mb-1">
                    {t('carbsLabel', lang)}
                  </label>
                  <input
                    type="number"
                    placeholder="30"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50/20 focus:outline-none focus:ring-2 focus:ring-rose-400 tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-rose-950 block mb-1">
                    {t('fatLabel', lang)}
                  </label>
                  <input
                    type="number"
                    placeholder="12"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50/20 focus:outline-none focus:ring-2 focus:ring-rose-400 tabular-nums"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-rose-950 block mb-1">
                  {t('notesLabel', lang)}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'zh' ? '例如：全麦低糖、水波蛋、橄榄油轻煎' : 'e.g. Sourdough bread, olive oil drizzle'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/20 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  {t('cancel', lang)}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl shadow-sm hover:from-pink-600 hover:to-rose-700 transition-all cursor-pointer"
                >
                  {t('submitMeal', lang)}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSaveWeight} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: 'morningWeight', value: weight, set: setWeight },
                  { key: 'eveningWeight', value: weightEvening, set: setWeightEvening },
                ] as const).map((f) => (
                  <div key={f.key}>
                    <label className="text-xs font-medium text-rose-950 block mb-1">
                      {t(f.key, lang)} · {unit}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 64.2"
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      className="w-full text-lg font-bold text-rose-950 px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50/20 focus:outline-none focus:ring-2 focus:ring-rose-400 tabular-nums"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-rose-400">{selectedDate} · {t('weightChartHint', lang)}</p>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  {t('cancel', lang)}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl shadow-sm hover:from-pink-600 hover:to-rose-700 transition-all cursor-pointer"
                >
                  {t('submitWeight', lang)}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

