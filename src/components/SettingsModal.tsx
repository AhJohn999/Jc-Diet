import React, { useState, useRef } from 'react';
import { UserProfile, WeightUnit, LengthUnit } from '../types/diet';
import { dbService } from '../services/db';
import { Language, t } from '../utils/i18n';
import { X, Database, Download, Upload, RefreshCw, Trash2, CheckCircle2, AlertCircle, Globe, Sparkles, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onDataResetOrReload: () => void;
  lang?: Language;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onDataResetOrReload,
  lang = 'zh',
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmReloadOpen, setConfirmReloadOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setFormData(profile);
  }, [profile]);

  if (!isOpen) return null;

  const currentLang: Language = formData.language || lang;

  const handleChange = (field: keyof UserProfile, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleLanguageSwitch = (newLang: Language) => {
    const updated = { ...formData, language: newLang };
    setFormData(updated);
    onUpdateProfile(updated);
    setStatusMsg({
      type: 'success',
      text: newLang === 'zh' ? '已切换至简体中文！' : 'Language switched to English!',
    });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setStatusMsg({ type: 'success', text: t('settingsSaved', currentLang) });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleExportJSON = async () => {
    try {
      const json = await dbService.exportJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rose-diet-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMsg({ type: 'success', text: t('databaseExportedJson', currentLang) });
    } catch {
      setStatusMsg({ type: 'error', text: currentLang === 'zh' ? '导出数据库失败。' : 'Failed to export database.' });
    }
  };

  const handleExportCSV = async () => {
    try {
      const csv = await dbService.exportCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rose-diet-daily-summary-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMsg({ type: 'success', text: t('dailySummaryExportedCsv', currentLang) });
    } catch {
      setStatusMsg({ type: 'error', text: currentLang === 'zh' ? '导出 CSV 失败。' : 'Failed to export CSV.' });
    }
  };

  const handleExportMealsWithPictures = async () => {
    try {
      const csv = await dbService.exportMealsCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rose-diet-meals-with-pictures-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMsg({ type: 'success', text: t('mealsExportedExcel', currentLang) });
    } catch {
      setStatusMsg({ type: 'error', text: currentLang === 'zh' ? '导出餐食明细失败。' : 'Failed to export meals.' });
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await dbService.importJSON(content);
      if (success) {
        setStatusMsg({ type: 'success', text: t('dataRestoredSuccess', currentLang) });
        onDataResetOrReload();
      } else {
        setStatusMsg({ type: 'error', text: currentLang === 'zh' ? '无效的 JSON 备份格式。' : 'Invalid JSON backup format.' });
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmReloadDemo = async () => {
    await dbService.reloadSampleData();
    setConfirmReloadOpen(false);
    setStatusMsg({ type: 'success', text: t('demoReloadedSuccess', currentLang) });
    onDataResetOrReload();
  };

  const handleConfirmClearAll = async () => {
    await dbService.resetAll();
    setConfirmResetOpen(false);
    setStatusMsg({ type: 'success', text: t('dataResetSuccess', currentLang) });
    onDataResetOrReload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-rose-100 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-rose-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-950 font-serif">
                {t('settingsTitle', currentLang)}
              </h3>
              <p className="text-xs text-rose-500">{t('settingsSub', currentLang)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-rose-100/60 text-rose-400 hover:text-rose-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status notice */}
        {statusMsg && (
          <div
            className={`px-5 py-2.5 text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100'
                : 'bg-rose-50 text-rose-800 border-b border-rose-100'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* 1. Language Setting Switcher */}
          <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-950">
              <Globe className="w-3.5 h-3.5 text-pink-500" />
              <span>{t('languageSetting', currentLang)}</span>
            </div>
            <p className="text-[11px] text-rose-600/80">
              {currentLang === 'zh' ? '支持随时在中英文界面之间无缝切换。' : 'Switch seamlessly between Chinese and English.'}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleLanguageSwitch('zh')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  currentLang === 'zh'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                    : 'bg-white text-rose-900 border-rose-200/80 hover:bg-rose-100/50'
                }`}
              >
                <span>🇨🇳</span>
                <span>简体中文</span>
              </button>
              <button
                type="button"
                onClick={() => handleLanguageSwitch('en')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  currentLang === 'en'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                    : 'bg-white text-rose-900 border-rose-200/80 hover:bg-rose-100/50'
                }`}
              >
                <span>🇺🇸</span>
                <span>English</span>
              </button>
            </div>
          </div>

          {/* 2. Personalize Journal Title & Branding */}
          <div className="bg-gradient-to-br from-pink-50/70 via-rose-50/40 to-white p-4.5 rounded-2xl border border-rose-200/90 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-950">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span>{t('brandingSectionTitle', currentLang)}</span>
              </div>
              <span className="text-[10px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-medium">
                {currentLang === 'zh' ? '自由定制' : 'Personalizable'}
              </span>
            </div>

            <p className="text-[11px] text-rose-700/80 leading-relaxed">
              {t('brandingSectionDesc', currentLang)}
            </p>

            {/* Live Preview Box */}
            <div className="bg-white/95 rounded-xl p-3 border border-rose-100/80 flex items-center justify-between gap-3 shadow-2xs">
              <div className="min-w-0">
                <span className="text-[10px] text-rose-400 font-medium block">
                  {t('livePreview', currentLang)}
                </span>
                <div className="flex items-center gap-2 mt-0.5 truncate">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 text-white flex items-center justify-center text-sm shadow-xs shrink-0 select-none">
                    <span>{formData.customEmoji || '🌸'}</span>
                  </div>
                  <span className="text-sm font-bold text-rose-950 font-serif truncate">
                    {formData.customTitle?.trim() || (currentLang === 'zh' ? 'JC 饮食日记' : 'JC Diet')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleChange('customTitle', currentLang === 'zh' ? 'JC 饮食日记' : 'JC Diet');
                  handleChange('customEmoji', '🌸');
                }}
                className="text-[11px] text-rose-500 hover:text-rose-800 underline underline-offset-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                title={t('resetToDefaultTitle', currentLang)}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t('resetToDefaultTitle', currentLang)}</span>
              </button>
            </div>

            {/* Inputs: Title and Emoji */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-medium text-rose-950 block mb-1">
                  {t('customJournalTitle', currentLang)}
                </label>
                <input
                  type="text"
                  value={formData.customTitle ?? ''}
                  onChange={(e) => handleChange('customTitle', e.target.value)}
                  placeholder={t('customTitlePlaceholder', currentLang)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium text-rose-950 placeholder:text-rose-300 shadow-2xs"
                />
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[11px] text-rose-600 block mb-1.5 font-medium">
                  {t('quickPresetsTitle', currentLang)}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { title: currentLang === 'zh' ? 'JC 饮食日记' : 'JC Diet Journal', emoji: '🌸' },
                    { title: currentLang === 'zh' ? '我的健康饮食日记' : 'My Healthy Diet Journal', emoji: '🥗' },
                    { title: currentLang === 'zh' ? '轻盈蜕变记录' : 'Lean & Blossom Journey', emoji: '✨' },
                    { title: currentLang === 'zh' ? '减脂塑形日记' : 'Fitness & Shape Diary', emoji: '🥑' },
                    { title: currentLang === 'zh' ? '每日轻断食打卡' : 'Daily Fasting & Diet', emoji: '🍵' },
                  ].map((preset) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => {
                        handleChange('customTitle', preset.title);
                        handleChange('customEmoji', preset.emoji);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-rose-100/70 text-rose-800 border border-rose-200/80 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <span>{preset.emoji}</span>
                      <span>{preset.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Emoji Selector */}
              <div>
                <label className="text-xs font-medium text-rose-950 block mb-1">
                  {t('customIconLabel', currentLang)}
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex flex-wrap gap-1">
                    {['🌸', '✨', '🍓', '🥑', '🥗', '🎀', '🏋️‍♀️', '🍵', '🦋', '💖', '🍎', '🧁', '🌟'].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => handleChange('customEmoji', em)}
                        className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                          formData.customEmoji === em
                            ? 'bg-rose-500 text-white shadow-xs'
                            : 'bg-white border border-rose-200 hover:bg-rose-50'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.customEmoji ?? '🌸'}
                    onChange={(e) => handleChange('customEmoji', e.target.value)}
                    className="w-12 text-center text-xs px-2 py-1.5 rounded-lg border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium"
                    maxLength={4}
                    title="Custom emoji or character"
                  />
                </div>
              </div>

              {/* User display name */}
              <div>
                <label className="text-xs font-medium text-rose-950 block mb-1">
                  {t('nameInputLabel', currentLang)}
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="JC"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium text-rose-950 shadow-2xs"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  onUpdateProfile(formData);
                  setStatusMsg({ type: 'success', text: t('personalizationSaved', currentLang) });
                  setTimeout(() => setStatusMsg(null), 3000);
                }}
                className="w-full py-2 text-xs font-semibold text-rose-800 bg-white hover:bg-rose-100/70 border border-rose-300/80 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                <span>{t('savePersonalization', currentLang)}</span>
              </button>
            </div>
          </div>

          {/* Target Goals Form */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <h4 className="text-xs font-semibold text-rose-900 uppercase tracking-wider">
              {currentLang === 'zh' ? '体重与减重目标' : 'Weight & Calorie Goals'}
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-rose-950 block mb-1">
                  {t('weightUnit', currentLang)}
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value as WeightUnit)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/20 focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  <option value="kg">{currentLang === 'zh' ? '公斤 (kg)' : 'Kilograms (kg)'}</option>
                  <option value="lbs">{currentLang === 'zh' ? '磅 (lbs)' : 'Pounds (lbs)'}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-rose-950 block mb-1">
                  {t('lengthUnit', currentLang)}
                </label>
                <select
                  value={formData.measurementUnit}
                  onChange={(e) => handleChange('measurementUnit', e.target.value as LengthUnit)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/20 focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  <option value="cm">{currentLang === 'zh' ? '厘米 (cm)' : 'Centimeters (cm)'}</option>
                  <option value="in">{currentLang === 'zh' ? '英寸 (in)' : 'Inches (in)'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-rose-950 block mb-1">
                  {t('dietStartDate', currentLang)}
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50/20 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-rose-950 block mb-1">
                  {t('targetGoalDate', currentLang)}
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => handleChange('targetDate', e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50/20 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-rose-950 block mb-1">
                  {t('startingWeight', currentLang)}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.startWeight}
                  onChange={(e) => handleChange('startWeight', parseFloat(e.target.value) || 0)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50/20 focus:outline-none focus:ring-2 focus:ring-rose-400 tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-rose-950 block mb-1">
                  {t('currentWeight', currentLang)}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.currentWeight}
                  onChange={(e) => handleChange('currentWeight', parseFloat(e.target.value) || 0)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50/20 focus:outline-none focus:ring-2 focus:ring-rose-400 tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-rose-950 block mb-1">
                  {t('goalWeight', currentLang)}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.goalWeight}
                  onChange={(e) => handleChange('goalWeight', parseFloat(e.target.value) || 0)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50/20 focus:outline-none focus:ring-2 focus:ring-rose-400 tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-rose-950 block mb-1">
                  {t('dailyCalorieTarget', currentLang)}
                </label>
                <input
                  type="number"
                  value={formData.dailyCalorieTarget}
                  onChange={(e) => handleChange('dailyCalorieTarget', parseInt(e.target.value, 10) || 1500)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50/20 focus:outline-none focus:ring-2 focus:ring-rose-400 tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-rose-950 block mb-1">
                  {t('dailyWaterTarget', currentLang)}
                </label>
                <input
                  type="number"
                  step="250"
                  value={formData.dailyWaterTarget}
                  onChange={(e) => handleChange('dailyWaterTarget', parseInt(e.target.value, 10) || 2000)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50/20 focus:outline-none focus:ring-2 focus:ring-rose-400 tabular-nums"
                />
              </div>
            </div>

            {/* Macro Targets */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-medium text-rose-950 block mb-1">
                  {t('protein', currentLang)} (g)
                </label>
                <input
                  type="number"
                  value={formData.dailyProteinTarget}
                  onChange={(e) => handleChange('dailyProteinTarget', parseInt(e.target.value, 10) || 100)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50/20 focus:outline-none focus:ring-2 focus:ring-rose-400 tabular-nums"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-rose-950 block mb-1">
                  {t('carbs', currentLang)} (g)
                </label>
                <input
                  type="number"
                  value={formData.dailyCarbsTarget}
                  onChange={(e) => handleChange('dailyCarbsTarget', parseInt(e.target.value, 10) || 150)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50/20 focus:outline-none focus:ring-2 focus:ring-rose-400 tabular-nums"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-rose-950 block mb-1">
                  {t('fats', currentLang)} (g)
                </label>
                <input
                  type="number"
                  value={formData.dailyFatTarget}
                  onChange={(e) => handleChange('dailyFatTarget', parseInt(e.target.value, 10) || 45)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50/20 focus:outline-none focus:ring-2 focus:ring-rose-400 tabular-nums"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 text-xs font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl shadow-xs hover:from-pink-600 hover:to-rose-700 transition-all cursor-pointer"
            >
              {t('updateGoals', currentLang)}
            </button>
          </form>

          {/* Database & Storage Options */}
          <div className="pt-4 border-t border-rose-100 space-y-3">
            <h4 className="text-xs font-semibold text-rose-900 uppercase tracking-wider">
              {t('databaseSectionTitle', currentLang)}
            </h4>
            <p className="text-xs text-rose-600/80">
              {t('databaseSectionDesc', currentLang)}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportJSON}
                className="p-2.5 bg-rose-50/60 hover:bg-rose-100/70 border border-rose-200/80 rounded-xl text-left flex items-center gap-2 text-xs font-medium text-rose-900 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-pink-600 shrink-0" />
                <div>
                  <span className="block font-semibold">{t('exportJson', currentLang)}</span>
                  <span className="text-[10px] text-rose-500">{t('exportJsonSub', currentLang)}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="p-2.5 bg-rose-50/60 hover:bg-rose-100/70 border border-rose-200/80 rounded-xl text-left flex items-center gap-2 text-xs font-medium text-rose-900 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <span className="block font-semibold">{t('exportSummaryCsv', currentLang)}</span>
                  <span className="text-[10px] text-rose-500">{t('exportSummaryCsvSub', currentLang)}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportMealsWithPictures}
                className="p-2.5 bg-rose-50/60 hover:bg-rose-100/70 border border-rose-200/80 rounded-xl text-left flex items-center gap-2 text-xs font-medium text-rose-900 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-pink-600 shrink-0" />
                <div>
                  <span className="block font-semibold">{t('exportMealsCsv', currentLang)}</span>
                  <span className="text-[10px] text-rose-500">{t('exportMealsCsvSub', currentLang)}</span>
                </div>
              </button>
            </div>

            <div className="pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-pink-500" />
                <span>{t('restoreJson', currentLang)}</span>
              </button>
            </div>

            {/* In-modal Reset Confirmation */}
            {confirmResetOpen ? (
              <div className="p-3.5 bg-rose-100/70 rounded-2xl border border-rose-200 space-y-2">
                <p className="text-xs font-semibold text-rose-950">
                  {t('resetConfirmTitle', currentLang)}
                </p>
                <p className="text-[11px] text-rose-700">
                  {t('resetConfirmDesc', currentLang)}
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmClearAll}
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    {t('confirmResetBtn', currentLang)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmResetOpen(false)}
                    className="px-3 py-1.5 bg-white text-rose-800 hover:bg-rose-50 rounded-lg text-xs font-medium border border-rose-200 cursor-pointer"
                  >
                    {t('cancel', currentLang)}
                  </button>
                </div>
              </div>
            ) : confirmReloadOpen ? (
              <div className="p-3.5 bg-pink-100/70 rounded-2xl border border-pink-200 space-y-2">
                <p className="text-xs font-semibold text-rose-950">
                  {t('reloadConfirmTitle', currentLang)}
                </p>
                <p className="text-[11px] text-rose-700">
                  {t('reloadConfirmDesc', currentLang)}
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmReloadDemo}
                    className="flex-1 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    {t('confirmReloadBtn', currentLang)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReloadOpen(false)}
                    className="px-3 py-1.5 bg-white text-rose-800 hover:bg-rose-50 rounded-lg text-xs font-medium border border-pink-200 cursor-pointer"
                  >
                    {t('cancel', currentLang)}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmReloadOpen(true)}
                  className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100/80 text-rose-800 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-rose-500" />
                  <span>{t('reloadDemoData', currentLang)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(true)}
                  className="py-1.5 px-3 bg-white hover:bg-rose-100/50 text-rose-600 rounded-lg text-xs font-medium border border-rose-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3 text-rose-500" />
                  <span>{t('resetAllData', currentLang)}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
