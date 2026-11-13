import React, { useState, useEffect } from 'react';
import { DailyLog, UserProfile, MealType } from './types/diet';
import { DEFAULT_PROFILE } from './services/sampleData';
import { dbService } from './services/db';
import { getTodayLocalDate } from './utils/dateUtils';
import { Language, t } from './utils/i18n';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { WeeksMonthsView } from './components/WeeksMonthsView';
import { AnalyticsView } from './components/AnalyticsView';
import { DailyJournalView } from './components/DailyJournalView';
import { LogModal } from './components/LogModal';
import { SettingsModal } from './components/SettingsModal';
import { Sparkles, Heart } from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Selected date defaults to local today date
  const todayStr = getTodayLocalDate();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const lang: Language = profile.language || 'zh';

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [quickLogMealType, setQuickLogMealType] = useState<MealType>('breakfast');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Load from local database on initial mount
  const loadData = async () => {
    setLoading(true);
    try {
      const { profile: loadedProfile, logs: loadedLogs } = await dbService.initDatabase();
      setProfile(loadedProfile);
      setLogs(loadedLogs);
      if (loadedLogs.length > 0) {
        const latest = loadedLogs[loadedLogs.length - 1].date;
        setSelectedDate(latest);
      } else {
        setSelectedDate(todayStr);
      }
    } catch (err) {
      console.error('Error loading database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const defaultTitle = lang === 'zh' ? 'JC 饮食日记' : 'JC Diet';
    const appTitle = profile.customTitle?.trim() || defaultTitle;
    document.title = `${appTitle} - Diet & Progress Journal`;
  }, [profile.customTitle, lang]);

  const handleSaveLog = async (updated: DailyLog) => {
    await dbService.saveLog(updated);
    // Update local state
    setLogs((prev) => {
      const idx = prev.findIndex((l) => l.date === updated.date);
      let nextList = [...prev];
      if (idx >= 0) {
        nextList[idx] = updated;
      } else {
        nextList.push(updated);
      }
      nextList.sort((a, b) => a.date.localeCompare(b.date));
      return nextList;
    });

    // If updated log has weight, update currentWeight in profile
    if (updated.weight !== undefined) {
      const updatedProfile = { ...profile, currentWeight: updated.weight };
      setProfile(updatedProfile);
      await dbService.saveProfile(updatedProfile);
    }
  };

  const handleUpdateProfile = async (updated: UserProfile) => {
    setProfile(updated);
    await dbService.saveProfile(updated);
  };

  const handleToggleLanguage = async () => {
    const newLang: Language = lang === 'zh' ? 'en' : 'zh';
    const updated = { ...profile, language: newLang };
    setProfile(updated);
    await dbService.saveProfile(updated);
  };

  const handleOpenQuickLog = (mealType: MealType = 'breakfast') => {
    setQuickLogMealType(mealType);
    setIsLogModalOpen(true);
  };

  const currentLog = logs.find((l) => l.date === selectedDate);

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50/50 flex flex-col items-center justify-center text-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/25 animate-pulse mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-rose-950 font-serif">
          {profile.customTitle?.trim() || (lang === 'zh' ? '正在开启 JC 饮食日记' : 'Opening JC Diet')}
        </h2>
        <p className="text-xs text-rose-500 mt-1">
          {lang === 'zh' ? '正在连接浏览器本地安全数据库...' : 'Connecting to local browser database...'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-rose-50/30">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenQuickLog={() => handleOpenQuickLog('breakfast')}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onToggleLanguage={handleToggleLanguage}
        lang={lang}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            profile={profile}
            logs={logs}
            todayLog={currentLog}
            onUpdateTodayLog={handleSaveLog}
            onOpenQuickLogModal={handleOpenQuickLog}
            onSelectDate={setSelectedDate}
            selectedDate={selectedDate}
            lang={lang}
          />
        )}

        {activeTab === 'weeks-months' && (
          <WeeksMonthsView
            logs={logs}
            profile={profile}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setActiveTab('journal');
            }}
            lang={lang}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView logs={logs} profile={profile} lang={lang} />
        )}

        {activeTab === 'journal' && (
          <DailyJournalView
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            profile={profile}
            currentLog={currentLog}
            onSaveLog={handleSaveLog}
            onOpenQuickLogModal={handleOpenQuickLog}
            lang={lang}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-rose-100 bg-white/60 py-6 text-center text-xs text-rose-700/70">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-serif font-bold text-rose-950 flex items-center gap-1">
              {profile.customEmoji && <span>{profile.customEmoji}</span>}
              <span>{profile.customTitle?.trim() || (lang === 'zh' ? 'JC 饮食日记' : 'JC Diet')}</span>
            </span>
            <span>·</span>
            <span>{t('footerSecured', lang)}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-rose-500">
            <span>{t('footerCrafted', lang)}</span>
            <Heart className="w-3 h-3 text-pink-500 fill-pink-500 inline ml-0.5" />
          </div>
        </div>
      </footer>

      {/* Quick Log Modal */}
      <LogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        selectedDate={selectedDate}
        initialMealType={quickLogMealType}
        currentLog={currentLog}
        onSaveLog={handleSaveLog}
        unit={profile.unit}
        lang={lang}
      />

      {/* Settings & Database Management Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        onDataResetOrReload={loadData}
        lang={lang}
      />
    </div>
  );
}
