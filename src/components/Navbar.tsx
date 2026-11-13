import React, { useState } from 'react';
import { UserProfile } from '../types/diet';
import { Plus, Settings, Sparkles, Globe, Pencil, Check, X } from 'lucide-react';
import { Language, t } from '../utils/i18n';

export type ActiveTab = 'dashboard' | 'weeks-months' | 'analytics' | 'journal';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenQuickLog: () => void;
  onOpenSettings: () => void;
  onToggleLanguage?: () => void;
  lang: Language;
  profile?: UserProfile;
  onUpdateProfile?: (updated: UserProfile) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenQuickLog,
  onOpenSettings,
  onToggleLanguage,
  lang,
  profile,
  onUpdateProfile,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const defaultTitle = lang === 'zh' ? 'JC 饮食日记' : 'JC Diet';
  const displayTitle = profile?.customTitle?.trim() || defaultTitle;
  const [tempTitle, setTempTitle] = useState(displayTitle);

  React.useEffect(() => {
    if (!isEditingTitle) {
      setTempTitle(displayTitle);
    }
  }, [displayTitle, isEditingTitle]);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempTitle(displayTitle);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = tempTitle.trim();
    if (onUpdateProfile && profile) {
      const updated = { ...profile, customTitle: trimmed || defaultTitle };
      onUpdateProfile(updated);
    }
    setIsEditingTitle(false);
  };

  const handleCancelEdit = () => {
    setTempTitle(displayTitle);
    setIsEditingTitle(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-rose-100/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand element with custom title & inline edit */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white shadow-sm shadow-pink-500/20 text-base select-none hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title={lang === 'zh' ? '定制图标与设置' : 'Customize Icon & Settings'}
          >
            {profile?.customEmoji ? (
              <span>{profile.customEmoji}</span>
            ) : (
              <Sparkles className="w-4 h-4 text-white" />
            )}
          </button>

          {isEditingTitle ? (
            <form onSubmit={handleSaveTitle} className="flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                className="text-sm font-bold text-rose-950 font-serif px-2.5 py-1 rounded-lg border border-rose-300 bg-rose-50/50 focus:outline-none focus:ring-2 focus:ring-rose-400 max-w-[190px] sm:max-w-[240px]"
                placeholder={defaultTitle}
              />
              <button
                type="submit"
                className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors cursor-pointer shadow-2xs"
                title={lang === 'zh' ? '保存标题' : 'Save Title'}
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center hover:bg-rose-200 transition-colors cursor-pointer"
                title={lang === 'zh' ? '取消' : 'Cancel'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onSelectTab('dashboard')}
                className="text-lg sm:text-xl font-bold tracking-tight text-rose-950 font-serif hover:text-pink-600 transition-colors text-left cursor-pointer truncate max-w-[200px] sm:max-w-xs"
                title={t('editTitleTooltip', lang)}
              >
                {displayTitle}
              </button>

              <button
                type="button"
                onClick={handleStartEdit}
                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-100/70 transition-all cursor-pointer"
                title={t('editTitleTooltip', lang)}
                aria-label="Edit title"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-rose-100/70 text-rose-900 font-semibold shadow-xs'
                : 'text-rose-700/80 hover:text-rose-900 hover:bg-rose-50'
            }`}
          >
            {t('dashboard', lang)}
          </button>
          <button
            onClick={() => onSelectTab('weeks-months')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'weeks-months'
                ? 'bg-rose-100/70 text-rose-900 font-semibold shadow-xs'
                : 'text-rose-700/80 hover:text-rose-900 hover:bg-rose-50'
            }`}
          >
            {t('weeksMonths', lang)}
          </button>
          <button
            onClick={() => onSelectTab('analytics')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-rose-100/70 text-rose-900 font-semibold shadow-xs'
                : 'text-rose-700/80 hover:text-rose-900 hover:bg-rose-50'
            }`}
          >
            {t('analytics', lang)}
          </button>
          <button
            onClick={() => onSelectTab('journal')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'journal'
                ? 'bg-rose-100/70 text-rose-900 font-semibold shadow-xs'
                : 'text-rose-700/80 hover:text-rose-900 hover:bg-rose-50'
            }`}
          >
            {t('journal', lang)}
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          {onToggleLanguage && (
            <button
              onClick={onToggleLanguage}
              title={lang === 'zh' ? 'Switch to English' : '切换到简体中文'}
              className="px-2.5 py-1.5 rounded-xl border border-rose-200/80 bg-rose-50/50 hover:bg-rose-100/60 text-rose-800 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-pink-500" />
              <span>{lang === 'zh' ? 'EN' : '中'}</span>
            </button>
          )}

          <button
            onClick={onOpenQuickLog}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl hover:from-pink-600 hover:to-rose-700 shadow-sm shadow-pink-500/25 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('logToday', lang)}</span>
          </button>

          <button
            onClick={onOpenSettings}
            aria-label="Settings and Data Management"
            className="w-9 h-9 rounded-xl border border-rose-200/80 bg-rose-50/50 flex items-center justify-center text-rose-700 hover:text-rose-900 hover:bg-rose-100/60 transition-colors cursor-pointer"
            title={t('settings', lang)}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile subnav bar */}
      <div className="flex md:hidden border-t border-rose-100/60 bg-white/70 px-2 py-1.5 overflow-x-auto justify-around">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
            activeTab === 'dashboard' ? 'bg-rose-100 text-rose-900 font-semibold' : 'text-rose-700 hover:bg-rose-50'
          }`}
        >
          {t('dashboard', lang)}
        </button>
        <button
          onClick={() => onSelectTab('weeks-months')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
            activeTab === 'weeks-months' ? 'bg-rose-100 text-rose-900 font-semibold' : 'text-rose-700 hover:bg-rose-50'
          }`}
        >
          {lang === 'zh' ? '周与月' : 'Weeks/Months'}
        </button>
        <button
          onClick={() => onSelectTab('analytics')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
            activeTab === 'analytics' ? 'bg-rose-100 text-rose-900 font-semibold' : 'text-rose-700 hover:bg-rose-50'
          }`}
        >
          {lang === 'zh' ? '图表' : 'Charts'}
        </button>
        <button
          onClick={() => onSelectTab('journal')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
            activeTab === 'journal' ? 'bg-rose-100 text-rose-900 font-semibold' : 'text-rose-700 hover:bg-rose-50'
          }`}
        >
          {lang === 'zh' ? '日志' : 'Journal'}
        </button>
      </div>
    </header>
  );
};

