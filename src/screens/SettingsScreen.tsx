import React, { useState } from 'react';
import {
  ArrowRight,
  Shield,
  Bell,
  Globe,
  Trash2,
  LogOut,
  Moon,
  Sun,
  Palette,
  Volume2,
  Lock,
  Download,
  AlertTriangle,
  FileText,
  UserX,
  Share2,
} from 'lucide-react';
import { storage } from '../lib/storage';
import { notificationManager } from '../lib/notifications';
import { User, AppLanguage, ThemeMode } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { getT } from '../lib/translations';

interface SettingsScreenProps {
  currentUser: User;
  onBack: () => void;
  onLogout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  currentUser,
  onBack,
  onLogout,
}) => {
  const [appLanguage, setAppLanguage] = useState<AppLanguage>(storage.getLanguage());
  const t = getT(appLanguage);

  const [themeMode, setThemeMode] = useState<ThemeMode>(storage.getThemeMode());
  const [soundEnabled, setSoundEnabled] = useState(storage.isSoundEnabled());
  const [vibrationEnabled, setVibrationEnabled] = useState(storage.isVibrationEnabled());
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    storage.isPushNotificationEnabled()
  );
  const [privacyLock, setPrivacyLock] = useState(storage.isPrivacyLockEnabled());

  // Password Change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Dialogs
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
  const [showBlockedUsersModal, setShowBlockedUsersModal] = useState(false);

  const blockedUsers = storage.getBlockedUsers(currentUser.id);

  const handleToggleTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    storage.applyTheme(mode);
  };

  const handleToggleLanguage = (lang: AppLanguage) => {
    setAppLanguage(lang);
    storage.setLanguage(lang);
  };

  const handleToggleNotifications = async () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    storage.setPushNotificationEnabled(next);
    if (next) {
      await notificationManager.requestPermission();
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    storage.setSoundEnabled(next);
  };

  const handleToggleVibration = () => {
    const next = !vibrationEnabled;
    setVibrationEnabled(next);
    storage.setVibrationEnabled(next);
  };

  const handleTogglePrivacyLock = () => {
    const next = !privacyLock;
    setPrivacyLock(next);
    storage.setPrivacyLockEnabled(next);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError(t.passwordValidation);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمتا المرور غير متطابقتين');
      return;
    }

    const res = storage.changePassword(currentUser.id, oldPassword, newPassword);
    if (res.success) {
      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowPasswordChange(false), 1500);
    } else {
      setPasswordError(res.error || 'فشل تحديث كلمة المرور');
    }
  };

  const handleExportData = () => {
    const data = storage.exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NT_MASSAGE_BACKUP_${currentUser.username}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearCache = () => {
    storage.clearAllData();
    onLogout();
  };

  const handleDeleteAccount = () => {
    storage.deleteAccount(currentUser.id);
    onLogout();
  };

  return (
    <div id="settings-screen" className="min-h-screen bg-black text-white flex flex-col select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full hover:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
        >
          <ArrowRight size={20} />
        </button>
        <h2 className="font-bold text-base">{t.settingsTitle}</h2>
      </header>

      {/* Main Settings List */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 space-y-6 pb-16">
        {/* Section: Theme Mode (Monochrome White / Black) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
            <Palette size={14} />
            <span>مظهر وثيم التطبيق (Theme)</span>
          </label>
          <div className="grid grid-cols-2 gap-2 bg-zinc-950 border border-zinc-800 rounded-2xl p-1.5">
            <button
              id="theme-dark-btn"
              onClick={() => handleToggleTheme('DARK')}
              className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                themeMode === 'DARK'
                  ? 'bg-zinc-900 text-white border border-zinc-700 shadow-md ring-1 ring-white/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Moon size={16} />
              <span>الأسود (Dark / Black)</span>
            </button>
            <button
              id="theme-light-btn"
              onClick={() => handleToggleTheme('LIGHT')}
              className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                themeMode === 'LIGHT'
                  ? 'bg-white text-black border border-zinc-300 shadow-md ring-2 ring-black/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sun size={16} />
              <span>الأبيض (Light / White)</span>
            </button>
          </div>
        </div>

        {/* Section: Language */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
            <Globe size={14} />
            <span>{t.language}</span>
          </label>
          <div className="grid grid-cols-2 bg-zinc-950 border border-zinc-800 rounded-2xl p-1">
            <button
              onClick={() => handleToggleLanguage('ARABIC')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                appLanguage === 'ARABIC' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              العربية (Default)
            </button>
            <button
              onClick={() => handleToggleLanguage('ENGLISH')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                appLanguage === 'ENGLISH' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Section: Notifications & Alerts */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
            <Bell size={14} />
            <span>{t.notifications}</span>
          </label>
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl divide-y divide-zinc-900 overflow-hidden">
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <p className="font-bold text-xs text-white">{t.enablePushNotifications}</p>
                <p className="text-[10px] text-zinc-500">إشعارات الرسائل والمكالمات في الخلفية</p>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={handleToggleNotifications}
                className="w-4 h-4 accent-white cursor-pointer"
              />
            </div>
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 size={16} className="text-zinc-400" />
                <div>
                  <p className="font-bold text-xs text-white">{t.soundEffects}</p>
                  <p className="text-[10px] text-zinc-500">أصوات النغمات والإرسال والاستقبال</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={handleToggleSound}
                className="w-4 h-4 accent-white cursor-pointer"
              />
            </div>
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <p className="font-bold text-xs text-white">{t.vibration}</p>
                <p className="text-[10px] text-zinc-500">الاهتزاز عند ورود اتصال أو تنبيه</p>
              </div>
              <input
                type="checkbox"
                checked={vibrationEnabled}
                onChange={handleToggleVibration}
                className="w-4 h-4 accent-white cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section: Privacy & Security */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
            <Shield size={14} />
            <span>{t.privacy}</span>
          </label>
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl divide-y divide-zinc-900 overflow-hidden">
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-zinc-400" />
                <div>
                  <p className="font-bold text-xs text-white">قفل الخصوصية الحساس</p>
                  <p className="text-[10px] text-zinc-500">إخفاء المعاينة عند مغادرة التطبيق</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={privacyLock}
                onChange={handleTogglePrivacyLock}
                className="w-4 h-4 accent-white cursor-pointer"
              />
            </div>

            <button
              onClick={() => setShowBlockedUsersModal(true)}
              className="w-full text-right p-3.5 hover:bg-zinc-900 flex items-center justify-between text-xs font-bold text-zinc-200 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <UserX size={16} className="text-zinc-400" />
                <span>{t.blockedUsers}</span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">({blockedUsers.length})</span>
            </button>

            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="w-full text-right p-3.5 hover:bg-zinc-900 flex items-center justify-between text-xs font-bold text-zinc-200 cursor-pointer"
            >
              <span>{t.changePassword}</span>
              <span className="text-xs text-zinc-500 font-mono">••••••••</span>
            </button>
          </div>
        </div>

        {/* Change Password Collapsible Box */}
        {showPasswordChange && (
          <form
            onSubmit={handlePasswordSubmit}
            className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3 animate-in fade-in"
          >
            <h4 className="font-bold text-xs text-white border-b border-zinc-800 pb-2">
              {t.changePassword}
            </h4>

            {passwordError && (
              <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 font-semibold">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 font-semibold">
                {t.passwordChangedSuccess}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                {t.currentPassword}
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">{t.newPassword}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6 أحرف أو أرقام على الأقل"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                {t.confirmNewPassword}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-white text-black font-bold text-xs rounded-xl hover:bg-zinc-200 cursor-pointer shadow-md"
            >
              {t.save}
            </button>
          </form>
        )}

        {/* Section: Data & Backup */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
            <Download size={14} />
            <span>{t.backupAndData}</span>
          </label>
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl divide-y divide-zinc-900 overflow-hidden">
            <button
              onClick={handleExportData}
              className="w-full text-right p-3.5 hover:bg-zinc-900 flex items-center justify-between text-xs font-bold text-zinc-200 cursor-pointer"
            >
              <span>{t.exportChatHistory}</span>
              <Download size={15} className="text-zinc-400" />
            </button>
            <button
              onClick={() => setShowClearDataConfirm(true)}
              className="w-full text-right p-3.5 hover:bg-red-500/10 text-red-400 flex items-center justify-between text-xs font-bold cursor-pointer"
            >
              <span>{t.clearCache}</span>
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Section: Account & Sign out */}
        <div className="pt-2 space-y-2">
          <button
            id="logout-btn"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            <span>{t.logout}</span>
          </button>

          <button
            onClick={() => setShowDeleteAccountConfirm(true)}
            className="w-full py-3 bg-transparent hover:bg-red-500/10 text-red-400 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <AlertTriangle size={15} />
            <span>{t.deleteAccount}</span>
          </button>
        </div>

        <div className="text-center pt-4 text-zinc-600 text-[10px] font-mono">
          NT MASSAGE • Version 2.5 Monochrome Release
        </div>
      </main>

      {/* Blocked Users Modal */}
      {showBlockedUsersModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-4 max-h-[80vh] flex flex-col animate-in zoom-in-95">
            <h3 className="font-bold text-sm text-center border-b border-zinc-800 pb-2">
              {t.blockedUsers}
            </h3>
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
              {blockedUsers.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6">لا يوجد مستخدمين محظورين</p>
              ) : (
                blockedUsers.map((bu) => (
                  <div key={bu.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-white">{bu.displayName}</p>
                      <p className="text-[10px] text-zinc-500">@{bu.username}</p>
                    </div>
                    <button
                      onClick={() => {
                        storage.toggleBlockUser(currentUser.id, bu.id);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-bold text-white cursor-pointer"
                    >
                      {t.unblock}
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setShowBlockedUsersModal(false)}
              className="w-full py-2 bg-white text-black font-bold text-xs rounded-xl cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title={t.logout}
        message={t.logoutConfirm}
        confirmText={t.logout}
        cancelText={t.cancel}
        isDestructive={true}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Delete Account Confirmation */}
      <ConfirmModal
        isOpen={showDeleteAccountConfirm}
        title={t.deleteAccount}
        message={t.deleteAccountConfirm}
        confirmText={t.deleteAccount}
        cancelText={t.cancel}
        isDestructive={true}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteAccountConfirm(false)}
      />

      {/* Clear Cache Confirmation */}
      <ConfirmModal
        isOpen={showClearDataConfirm}
        title={t.clearCache}
        message="هل أنت متأكد من رغبتك في مسح كافة البيانات المؤقتة؟ سيتم تسجيل خروجك."
        confirmText="مسح البيانات"
        cancelText={t.cancel}
        isDestructive={true}
        onConfirm={handleClearCache}
        onCancel={() => setShowClearDataConfirm(false)}
      />
    </div>
  );
};
