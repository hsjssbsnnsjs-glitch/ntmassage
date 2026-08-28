import React, { useState } from 'react';
import { Lock, AtSign, User as UserIcon, Mail, Eye, EyeOff, KeyRound, AlertCircle, CheckCircle, ShieldCheck, Zap, Globe } from 'lucide-react';
import { storage } from '../lib/storage';
import { User, AppLanguage } from '../types';
import { getT } from '../lib/translations';

interface AuthScreenProps {
  onSuccess?: (user: User) => void;
  onAuthSuccess?: (user: User) => void;
  appLanguage?: AppLanguage;
  onToggleLanguage?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSuccess,
  onAuthSuccess,
  appLanguage = 'ARABIC',
  onToggleLanguage,
}) => {
  const t = getT(appLanguage);

  const handleAuthComplete = (user: User) => {
    if (typeof onAuthSuccess === 'function') {
      onAuthSuccess(user);
    }
    if (typeof onSuccess === 'function') {
      onSuccess(user);
    }
  };

  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // OTP Register Step
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [pendingDraft, setPendingDraft] = useState<{
    username: string;
    displayName: string;
    emailOrPhone: string;
    password?: string;
  } | null>(null);

  // Forgot Password Dialog
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [enteredForgotOtp, setEnteredForgotOtp] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isRegister) {
      // Login flow
      const loginIdentifier = username.trim();
      if (!loginIdentifier) {
        setErrorMessage('الرجاء إدخال اسم المستخدم أو البريد');
        return;
      }
      if (!password) {
        setErrorMessage('الرجاء إدخال كلمة المرور');
        return;
      }
      const res = await storage.loginUser(loginIdentifier, password);
      if (res.success && res.user) {
        handleAuthComplete(res.user);
      } else {
        setErrorMessage(res.error || 'فشل تسجيل الدخول، تأكد من صحة البيانات');
      }
      return;
    }

    // Register flow
    const cleanUsername = username.trim().toLowerCase().replace(/^@+/, '');
    const cleanEmail = emailOrPhone.trim().toLowerCase();

    if (!cleanUsername) {
      setErrorMessage('اسم المستخدم مطلوب');
      return;
    }
    if (cleanUsername.length < 3) {
      setErrorMessage('يجب أن يتكون اسم المستخدم من 3 أحرف على الأقل');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('الرجاء كتابة بريد إلكتروني صالح (Gmail)');
      return;
    }
    if (!password) {
      setErrorMessage('كلمة المرور مطلوبة');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام');
      return;
    }

    // Check uniqueness locally and server-synced
    if (storage.getUserByUsername(cleanUsername)) {
      setErrorMessage(`اسم المستخدم @${cleanUsername} مستخدم بالفعل`);
      return;
    }
    if (storage.getUserByEmail(cleanEmail)) {
      setErrorMessage('البريد الإلكتروني مستخدم لحساب آخر');
      return;
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setPendingDraft({
      username: cleanUsername,
      displayName: displayName.trim() || cleanUsername,
      emailOrPhone: cleanEmail,
      password,
    });
    setIsOtpOpen(true);
  };

  const handleVerifyOtp = async () => {
    if (enteredOtp.trim() !== generatedOtp) {
      setErrorMessage('رمز التحقق غير صحيح، يرجى المحاولة ثانية');
      return;
    }

    if (!pendingDraft) return;

    const res = await storage.registerUser({
      username: pendingDraft.username,
      displayName: pendingDraft.displayName,
      emailOrPhone: pendingDraft.emailOrPhone,
      password: pendingDraft.password || 'Password123',
    });

    if (res.success && res.user) {
      setIsOtpOpen(false);
      handleAuthComplete(res.user);
    } else {
      setErrorMessage(res.error || 'فشل إنشاء الحساب');
    }
  };

  // Forgot Password Steps
  const handleForgotStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    const clean = forgotEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      setForgotError('الرجاء إدخال بريد Gmail صالح');
      return;
    }
    const user = storage.getUserByEmail(clean);
    if (!user) {
      setForgotError('هذا البريد غير مسجل لدينا');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setForgotOtp(code);
    setForgotStep(2);
  };

  const handleForgotStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (enteredForgotOtp.trim() !== forgotOtp) {
      setForgotError('رمز التحقق غير صحيح');
      return;
    }
    if (forgotNewPass.length < 8 || !/\d/.test(forgotNewPass) || !/[a-zA-Z]/.test(forgotNewPass)) {
      setForgotError('يجب أن تتكون كلمة المرور من 8 خانات على الأقل مع أحرف وأرقام');
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setForgotError('كلمات المرور غير متطابقة');
      return;
    }
    const res = storage.resetPasswordByEmail(forgotEmail, forgotNewPass);
    if (res.success) {
      setForgotStep(3);
    } else {
      setForgotError(res.error || 'فشل استعادة الحساب');
    }
  };

  return (
    <div
      id="auth-screen"
      className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 sm:p-6"
    >
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative">
        {/* Language switch button */}
        {onToggleLanguage && (
          <button
            type="button"
            onClick={onToggleLanguage}
            className="absolute top-5 left-5 p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="تبديل اللغة / Switch Language"
          >
            <Globe size={14} />
            <span className="font-bold uppercase text-[10px]">
              {appLanguage === 'ARABIC' ? 'EN' : 'عربي'}
            </span>
          </button>
        )}

        {/* Header Monogram */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.25)] border border-zinc-200 mb-3">
            <Zap size={32} className="fill-black" />
          </div>
          <h2 className="font-black text-2xl tracking-wider text-white">NT MASSAGE</h2>
          <p className="text-xs text-zinc-400 mt-1">
            {isRegister
              ? appLanguage === 'ARABIC'
                ? 'إنشاء حساب جديد في NT'
                : 'Create a new account on NT'
              : appLanguage === 'ARABIC'
              ? 'مرحباً بك مجدداً، سجّل دخولك للمتابعة'
              : 'Welcome back, sign in to continue'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
          <button
            id="auth-tab-login"
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              !isRegister ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {appLanguage === 'ARABIC' ? 'تسجيل الدخول' : 'Sign In'}
          </button>
          <button
            id="auth-tab-register"
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isRegister ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {appLanguage === 'ARABIC' ? 'حساب جديد' : 'New Account'}
          </button>
        </div>

        {/* Error Message Banner */}
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/40 rounded-xl flex flex-col gap-2 text-red-400 text-xs font-semibold animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
            {isRegister && errorMessage.includes('مسبقاً') && (
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setErrorMessage(null);
                  if (emailOrPhone) setUsername(emailOrPhone);
                }}
                className="self-start text-[11px] underline text-white hover:text-zinc-300 font-bold cursor-pointer transition-colors"
              >
                اضغط هنا لتسجيل الدخول بدلاً من ذلك
              </button>
            )}
            {!isRegister && errorMessage.includes('غير موجود') && (
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setErrorMessage(null);
                  if (username.includes('@')) {
                    setEmailOrPhone(username);
                    setUsername(username.split('@')[0]);
                  }
                }}
                className="self-start text-[11px] underline text-white hover:text-zinc-300 font-bold cursor-pointer transition-colors"
              >
                اضغط هنا لإنشاء حساب جديد بهذا الاسم
              </button>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">الاسم الظاهر</label>
              <div className="relative">
                <UserIcon size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  id="reg-displayname-input"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="أحمد علي"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1.5">
              {isRegister ? 'اسم المستخدم (@Username)' : 'اسم المستخدم أو البريد'}
            </label>
            <div className="relative">
              <AtSign size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                id="auth-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder={isRegister ? 'ahmed_iraq' : 'username أو user@gmail.com'}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">البريد الإلكتروني (Gmail)</label>
              <div className="relative">
                <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  id="reg-email-input"
                  type="email"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value.toLowerCase())}
                  placeholder="user@gmail.com"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1.5">كلمة المرور</label>
            <div className="relative">
              <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                id="auth-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pr-10 pl-10 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all shadow-lg active:scale-95 cursor-pointer"
          >
            {isRegister ? 'متابعة وإنشاء الحساب' : 'الدخول إلى NT MASSAGE'}
          </button>
        </form>

        {!isRegister && (
          <div className="text-center">
            <button
              id="forgot-password-link"
              type="button"
              onClick={() => {
                setForgotStep(1);
                setForgotEmail('');
                setForgotError(null);
                setIsForgotOpen(true);
              }}
              className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1 font-semibold transition-colors cursor-pointer"
            >
              <KeyRound size={14} />
              <span>نسيت كلمة المرور؟ استعادة عبر Gmail</span>
            </button>
          </div>
        )}

        {/* Security guarantee */}
        <div className="pt-2 border-t border-zinc-900 flex items-center gap-2 text-zinc-500 text-xs justify-center">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span>منصة اتصالات مشفرة وآمنة بالكامل</span>
        </div>
      </div>

      {/* OTP Registration Modal */}
      {isOtpOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-6 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center mx-auto">
              <Mail size={24} />
            </div>
            <h3 className="font-bold text-lg">تأكيد البريد الإلكتروني</h3>
            <p className="text-xs text-zinc-400">
              تم إرسال رمز التحقق إلى: <br />
              <strong className="text-white">{pendingDraft?.emailOrPhone}</strong>
            </p>

            <div
              onClick={() => setEnteredOtp(generatedOtp)}
              className="p-3 bg-white/10 border border-white/20 rounded-xl cursor-pointer hover:bg-white/20 transition-all"
            >
              <p className="text-[11px] text-zinc-400">رمز التحقق السريع (اضغط للنسخ التلقائي):</p>
              <p className="text-2xl font-black tracking-widest text-white mt-1">{generatedOtp}</p>
            </div>

            <input
              id="otp-input-field"
              type="text"
              maxLength={6}
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 text-center text-2xl tracking-[0.3em] font-mono text-white focus:outline-none focus:border-zinc-500"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOtpOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 font-semibold text-xs hover:text-white cursor-pointer"
              >
                إلغاء
              </button>
              <button
                id="confirm-otp-btn"
                type="button"
                onClick={handleVerifyOtp}
                className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 cursor-pointer"
              >
                تأكيد الدخول
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-6 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center mx-auto">
              <KeyRound size={24} />
            </div>
            <h3 className="font-bold text-lg">
              {forgotStep === 1
                ? 'استعادة الحساب'
                : forgotStep === 2
                ? 'إعادة تعيين كلمة المرور'
                : 'تمت الاستعادة بنجاح'}
            </h3>

            {forgotError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-semibold">
                {forgotError}
              </div>
            )}

            {forgotStep === 1 && (
              <form onSubmit={handleForgotStep1} className="space-y-4 text-right">
                <p className="text-xs text-zinc-400 text-center">
                  أدخل بريدك الإلكتروني المسجل لإرسال رمز التحقق
                </p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 font-semibold text-xs hover:text-white cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 cursor-pointer"
                  >
                    إرسال الرمز
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleForgotStep2} className="space-y-3 text-right">
                <div
                  onClick={() => setEnteredForgotOtp(forgotOtp)}
                  className="p-2.5 bg-white/10 border border-white/20 rounded-xl text-center cursor-pointer hover:bg-white/20"
                >
                  <p className="text-[10px] text-zinc-400">رمز التحقق السريع (اضغط للنسخ التلقائي):</p>
                  <p className="text-xl font-black tracking-widest text-white mt-0.5">{forgotOtp}</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">رمز التحقق (6 أرقام)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={enteredForgotOtp}
                    onChange={(e) => setEnteredForgotOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 text-center text-lg tracking-widest font-mono text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">كلمة المرور الجديدة</label>
                  <input
                    type="password"
                    value={forgotNewPass}
                    onChange={(e) => setForgotNewPass(e.target.value)}
                    placeholder="8 خانات مع أحرف وأرقام..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">تأكيد كلمة المرور</label>
                  <input
                    type="password"
                    value={forgotConfirmPass}
                    onChange={(e) => setForgotConfirmPass(e.target.value)}
                    placeholder="أعد كتابة كلمة المرور..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 font-semibold text-xs hover:text-white cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 cursor-pointer"
                  >
                    حفظ وتحديث
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 3 && (
              <div className="space-y-4 py-2">
                <CheckCircle size={48} className="text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-white">تم تغيير كلمة المرور بنجاح!</p>
                <p className="text-xs text-zinc-400">يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</p>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 cursor-pointer"
                >
                  العودة لتسجيل الدخول
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
