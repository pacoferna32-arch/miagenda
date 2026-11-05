import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, LogIn, UserPlus, Mail, Lock, User, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredForFeature?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, requiredForFeature }) => {
  const {
    user,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    registerWithEmail,
    resetPassword,
    logout,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const translateFirebaseError = (err: any): string => {
    const code = err?.code || '';
    if (code.includes('auth/wrong-password') || code.includes('auth/invalid-credential')) {
      return 'Correo o contraseña incorrectos. Por favor, inténtalo de nuevo.';
    }
    if (code.includes('auth/user-not-found')) {
      return 'No existe ninguna cuenta registrada con este correo electrónico.';
    }
    if (code.includes('auth/email-already-in-use')) {
      return 'Ya existe una cuenta con este correo. Prueba a iniciar sesión.';
    }
    if (code.includes('auth/weak-password')) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (code.includes('auth/invalid-email')) {
      return 'El formato del correo electrónico no es válido.';
    }
    if (code.includes('auth/popup-closed-by-user')) {
      return 'Se cerró la ventana de inicio de sesión antes de completar el proceso.';
    }
    return err?.message || 'Ha ocurrido un error al conectar con el servidor de autenticación.';
  };

  const handleGoogle = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setErrorMsg(translateFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInWithApple();
      onClose();
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
      if (mode === 'login') {
        await signInWithEmail(email, password);
        onClose();
      } else if (mode === 'register') {
        if (!name.trim()) {
          setErrorMsg('Por favor, introduce tu nombre.');
          setLoading(false);
          return;
        }
        await registerWithEmail(email, password, name);
        onClose();
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMsg('Hemos enviado un enlace de recuperación a tu correo electrónico.');
      }
    } catch (err: any) {
      setErrorMsg(translateFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-[#161824] border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔐</span>
            <div>
              <h2 className="text-base font-serif font-bold text-neutral-900 dark:text-neutral-100">
                {user
                  ? 'Mi Cuenta'
                  : mode === 'login'
                  ? 'Iniciar Sesión'
                  : mode === 'register'
                  ? 'Crear Cuenta'
                  : 'Recuperar Contraseña'}
              </h2>
              {requiredForFeature && !user && (
                <p className="text-[11px] text-[#e8533a] font-medium">
                  {requiredForFeature}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {user ? (
            /* Logged in state */
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 border-2 border-[#e8533a] mx-auto flex items-center justify-center overflow-hidden shadow-sm">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Avatar'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-2xl font-serif font-bold text-neutral-800 dark:text-neutral-200">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <b className="text-base font-bold text-neutral-900 dark:text-neutral-100 block">
                  {user.displayName || 'Usuario registrado'}
                </b>
                <span className="text-xs text-neutral-500 font-mono">{user.email}</span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 text-left">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Tu cuenta está sincronizada. Todas las funciones, tareas y recordatorios se guardan en la nube.
                </span>
              </div>

              <div className="pt-2 flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold"
                >
                  Continuar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-medium hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          ) : (
            /* Logged out: Auth Forms */
            <>
              {/* Social Login Options */}
              <div className="space-y-2">
                {/* Google Button */}
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-2xs hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors disabled:opacity-50"
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
                  <span>Continuar con Google</span>
                </button>

                {/* Apple Button */}
                <button
                  type="button"
                  onClick={handleApple}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-xs flex items-center justify-center gap-2.5 shadow-2xs hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.34-.56.63-1.06 1.68-.92 2.71 1.01.08 2.03-.5 2.65-1.2" />
                  </svg>
                  <span>Continuar con Apple</span>
                </button>
              </div>

              {/* Separator */}
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-neutral-200 dark:border-neutral-800" />
                <span className="text-[10px] uppercase font-bold text-neutral-400">
                  O con correo electrónico
                </span>
                <div className="flex-1 h-px bg-neutral-200 dark:border-neutral-800" />
              </div>

              {/* Alerts */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'register' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                      Nombre completo
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu nombre (ej. Paco Fernández)"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#e8533a]/50"
                        required={mode === 'register'}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#e8533a]/50"
                      required
                    />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
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
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#e8533a]/50"
                        required
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#e8533a] hover:bg-[#d4432c] text-white text-xs font-semibold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>
                    {loading
                      ? 'Procesando...'
                      : mode === 'login'
                      ? 'Iniciar Sesión'
                      : mode === 'register'
                      ? 'Crear Cuenta'
                      : 'Enviar Enlace de Recuperación'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Mode switchers */}
              <div className="text-center pt-2">
                {mode === 'login' && (
                  <p className="text-xs text-neutral-500">
                    ¿No tienes cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[#e8533a] font-semibold hover:underline"
                    >
                      Regístrate gratis
                    </button>
                  </p>
                )}

                {mode === 'register' && (
                  <p className="text-xs text-neutral-500">
                    ¿Ya tienes una cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[#e8533a] font-semibold hover:underline"
                    >
                      Inicia sesión
                    </button>
                  </p>
                )}

                {mode === 'forgot' && (
                  <p className="text-xs text-neutral-500">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[#e8533a] font-semibold hover:underline"
                    >
                      ← Volver a Iniciar Sesión
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
