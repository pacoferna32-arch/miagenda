import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  Cloud,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  Pill,
  Wallet,
  UtensilsCrossed,
} from 'lucide-react';

export const AuthPortal: React.FC = () => {
  const {
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    registerWithEmail,
    resetPassword,
  } = useAuth();

  const [mode, setMode] = useState<'register' | 'login' | 'forgot'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const translateFirebaseError = (err: any): string => {
    const code = err?.code || '';
    if (code.includes('auth/wrong-password') || code.includes('auth/invalid-credential')) {
      return 'El correo o la contraseña no son correctos. Por favor, inténtalo de nuevo.';
    }
    if (code.includes('auth/user-not-found')) {
      return 'No existe ninguna cuenta registrada con este correo. Por favor pulsa en «Crear Cuenta Nueva».';
    }
    if (code.includes('auth/email-already-in-use')) {
      return 'Ya existe una cuenta con este correo electrónico. Por favor, pulsa en «Iniciar Sesión».';
    }
    if (code.includes('auth/weak-password')) {
      return 'La contraseña debe tener un mínimo de 6 caracteres.';
    }
    if (code.includes('auth/invalid-email')) {
      return 'El formato del correo electrónico no es válido.';
    }
    if (code.includes('auth/popup-closed-by-user')) {
      return 'Se cerró la ventana de autenticación antes de completar el inicio de sesión.';
    }
    return err?.message || 'Error de conexión con el servicio de autenticación.';
  };

  const handleGoogle = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(translateFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await signInWithApple();
    } catch (err: any) {
      setErrorMsg(translateFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) {
          setErrorMsg('Por favor introduce tu nombre completo.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
          setLoading(false);
          return;
        }
        await registerWithEmail(email, password, name);
      } else if (mode === 'login') {
        await signInWithEmail(email, password);
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          setErrorMsg('Por favor introduce tu correo electrónico.');
          setLoading(false);
          return;
        }
        await resetPassword(email);
        setSuccessMsg('Te hemos enviado un enlace de recuperación a tu correo electrónico.');
      }
    } catch (err: any) {
      setErrorMsg(translateFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf8f5] via-[#f7f4ee] to-[#ece7df] dark:from-[#0d0e15] dark:via-[#131520] dark:to-[#171927] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Top Navbar Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#e8533a] to-amber-500 text-white flex items-center justify-center font-bold text-xl shadow-md">
            🗓️
          </div>
          <div>
            <h1 className="font-serif font-bold text-base sm:text-lg tracking-tight">
              Mi Calendario & Agenda
            </h1>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
              Sincronización Cloud Multidispositivo
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Acceso seguro cifrado</span>
        </div>
      </header>

      {/* Main Registration & Sign-in Gateway */}
      <main className="max-w-5xl mx-auto w-full my-6 sm:my-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Value Proposition & Multi-Device Sync */}
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Registro obligatorio para sincronización total</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-neutral-900 dark:text-neutral-50 leading-[1.15]">
              Tus tareas, menús y diario en todos tus dispositivos.
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Crea tu cuenta para que todas tus anotaciones, notas de voz, fotos, recordatorios y cambios se guarden en la base de datos en la nube y estén siempre visibles desde tu móvil, tablet u ordenador.
            </p>
          </div>

          {/* Sync Features List */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
            <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#161824]/70 border border-neutral-200/80 dark:border-neutral-800 backdrop-blur-xs space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                <Smartphone className="w-4 h-4 text-[#e8533a]" />
                <span>Multi-Dispositivo</span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-tight">
                Accede desde tu iPhone, Android, iPad o PC sin perder nada.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#161824]/70 border border-neutral-200/80 dark:border-neutral-800 backdrop-blur-xs space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                <Cloud className="w-4 h-4 text-sky-500" />
                <span>Base de Datos</span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-tight">
                Guardado automático instantáneo en Firebase Firestore.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#161824]/70 border border-neutral-200/80 dark:border-neutral-800 backdrop-blur-xs space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                <Lock className="w-4 h-4 text-violet-500" />
                <span>100% Privado</span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-tight">
                Tus reflexiones, finanzas y salud protegidas con tu usuario.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Registration & Sign-in Box */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-white dark:bg-[#161824] border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            {/* Mode Switcher Tabs */}
            <div className="flex rounded-2xl bg-neutral-100 dark:bg-neutral-800/90 p-1 border border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  mode === 'register'
                    ? 'bg-white dark:bg-[#1f2233] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                Crear Cuenta
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  mode === 'login'
                    ? 'bg-white dark:bg-[#1f2233] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                Iniciar Sesión
              </button>
            </div>

            {/* Social 1-Click Providers (Google & Apple) */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#1a1c2a] hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-all shadow-2xs hover:shadow-xs active:scale-98 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {mode === 'register' ? 'Registrarse con Google' : 'Continuar con Google'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleApple}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-2xl border border-neutral-800 dark:border-neutral-700 bg-neutral-900 dark:bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-98 disabled:opacity-50"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.72-.93 2.74 1 .08 2.03-.49 2.64-1.24z" />
                </svg>
                <span>
                  {mode === 'register' ? 'Registrarse con Apple' : 'Continuar con Apple'}
                </span>
              </button>
            </div>

            {/* Separator */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-neutral-200 dark:border-neutral-800 w-full" />
              <span className="bg-white dark:bg-[#161824] px-3 text-[11px] text-neutral-400 font-semibold absolute">
                o con correo electrónico
              </span>
            </div>

            {/* Error & Success Messages */}
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Tu nombre completo
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="ej. Paco Fernández"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#e8533a]/30"
                      required={mode === 'register'}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#e8533a]/30"
                    required
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Contraseña
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="text-[11px] text-[#e8533a] hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#e8533a]/30"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-[#e8533a] hover:bg-[#d4432c] text-white text-xs font-bold shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-60"
              >
                {loading ? (
                  <span>Conectando...</span>
                ) : mode === 'register' ? (
                  <>
                    <span>Crear Cuenta y Comenzar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : mode === 'login' ? (
                  <>
                    <span>Iniciar Sesión y Sincronizar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <span>Enviar enlace de recuperación</span>
                )}
              </button>
            </form>

            {/* Back button if in forgot password mode */}
            {mode === 'forgot' && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 underline"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Branding & Features */}
      <footer className="max-w-6xl mx-auto w-full pt-6 border-t border-neutral-200/60 dark:border-neutral-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
        <p>© 2026 Mi Calendario & Agenda Personal · Base de datos en la nube y sincronización segura</p>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Firestore Cloud Sync</span>
          <span>·</span>
          <span>Apple & Google OAuth</span>
          <span>·</span>
          <span>Cifrado SSL</span>
        </div>
      </footer>
    </div>
  );
};
