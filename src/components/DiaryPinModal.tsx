import React, { useState, useEffect } from 'react';
import { Lock, Unlock, KeyRound, Delete, X, ShieldAlert, Sparkles, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DiaryPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  savedPin?: string;
  onSaveNewPin: (pin: string) => void;
  mode?: 'unlock' | 'change';
}

export const DiaryPinModal: React.FC<DiaryPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  savedPin,
  onSaveNewPin,
  mode = 'unlock',
}) => {
  const isSettingPinFirstTime = !savedPin;
  const [internalMode, setInternalMode] = useState<'enter' | 'set_new' | 'confirm_new'>(
    isSettingPinFirstTime ? 'set_new' : 'enter'
  );

  const [enteredPin, setEnteredPin] = useState('');
  const [firstNewPin, setFirstNewPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEnteredPin('');
      setFirstNewPin('');
      setErrorMessage('');
      setSuccessNotice(false);
      setInternalMode(!savedPin ? 'set_new' : mode === 'change' ? 'set_new' : 'enter');
    }
  }, [isOpen, savedPin, mode]);

  // Support hardware keyboard numbers
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, enteredPin, internalMode, savedPin, firstNewPin]);

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setIsShaking(true);
    setTimeout(() => {
      setEnteredPin('');
      setIsShaking(false);
    }, 600);
  };

  const handleDigitPress = (digit: string) => {
    if (enteredPin.length >= 4) return;
    const nextPin = enteredPin + digit;
    setEnteredPin(nextPin);
    setErrorMessage('');

    if (nextPin.length === 4) {
      processCompletedPin(nextPin);
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const processCompletedPin = (pin: string) => {
    if (internalMode === 'enter') {
      if (pin === savedPin) {
        setSuccessNotice(true);
        setTimeout(() => {
          onSuccess();
        }, 300);
      } else {
        triggerError('Clave incorrecta. Inténtalo de nuevo.');
      }
    } else if (internalMode === 'set_new') {
      setFirstNewPin(pin);
      setEnteredPin('');
      setInternalMode('confirm_new');
    } else if (internalMode === 'confirm_new') {
      if (pin === firstNewPin) {
        onSaveNewPin(pin);
        setSuccessNotice(true);
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
        setTimeout(() => {
          onSuccess();
        }, 600);
      } else {
        triggerError('Las claves no coinciden. Vuelve a intentarlo.');
        setTimeout(() => {
          setFirstNewPin('');
          setInternalMode('set_new');
        }, 700);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`bg-white dark:bg-[#161824] border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-sm p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center relative overflow-hidden ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Cerrar y volver"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock / Diary Icon */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-md mb-4 transition-all ${
            successNotice
              ? 'bg-emerald-500 text-white scale-110'
              : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white'
          }`}
        >
          {successNotice ? <Unlock className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
        </div>

        {/* Header Titles based on mode */}
        <h3 className="font-serif font-bold text-lg text-neutral-900 dark:text-neutral-100 mb-1">
          {internalMode === 'enter'
            ? 'Diario Personal Protegido'
            : internalMode === 'set_new'
            ? 'Crea tu clave de 4 dígitos'
            : 'Confirma tu clave de 4 dígitos'}
        </h3>

        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mb-6">
          {internalMode === 'enter'
            ? 'Introduce tu clave de cuatro dígitos para desbloquear tus pensamientos y notas privadas.'
            : internalMode === 'set_new'
            ? 'Elige una clave de 4 dígitos para proteger tu diario íntimo frente a miradas indiscretas.'
            : 'Vuelve a teclear la misma clave de 4 dígitos para verificarla.'}
        </p>

        {/* 4 Digit Passcode Indicators (Circles) */}
        <div className="flex items-center justify-center gap-4 mb-4">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = index < enteredPin.length;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  isFilled
                    ? successNotice
                      ? 'bg-emerald-500 border-emerald-500 scale-110 shadow-sm'
                      : 'bg-violet-600 border-violet-600 scale-110 shadow-xs'
                    : errorMessage
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40'
                    : 'border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {errorMessage && (
          <p className="text-xs font-semibold text-rose-500 mb-3 animate-in fade-in">
            {errorMessage}
          </p>
        )}

        {/* Success message */}
        {successNotice && (
          <p className="text-xs font-semibold text-emerald-500 mb-3 flex items-center gap-1 justify-center animate-in fade-in">
            <Check className="w-4 h-4" /> Clave correcta. Desbloqueando...
          </p>
        )}

        {/* Numeric Keypad (1 to 9, 0, Delete) */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px] my-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              className="h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:border-violet-300 text-lg font-semibold text-neutral-800 dark:text-neutral-200 active:scale-92 transition-all border border-neutral-200/60 dark:border-neutral-700/60 shadow-2xs"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              if (internalMode === 'confirm_new') {
                setEnteredPin('');
                setFirstNewPin('');
                setInternalMode('set_new');
              } else {
                setEnteredPin('');
              }
            }}
            className="h-12 rounded-2xl text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center"
          >
            Borrar
          </button>

          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            className="h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:border-violet-300 text-lg font-semibold text-neutral-800 dark:text-neutral-200 active:scale-92 transition-all border border-neutral-200/60 dark:border-neutral-700/60 shadow-2xs"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-2xl text-neutral-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center justify-center"
            title="Retroceso"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Footer actions: Reset / Forgot PIN */}
        {savedPin && internalMode === 'enter' && (
          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 w-full flex items-center justify-between text-[11px] text-neutral-500">
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    '¿Deseas restablecer tu clave de 4 dígitos? Podrás configurar una nueva ahora mismo.'
                  )
                ) {
                  onSaveNewPin('');
                  setEnteredPin('');
                  setFirstNewPin('');
                  setInternalMode('set_new');
                }
              }}
              className="text-neutral-400 hover:text-violet-600 transition-colors underline"
            >
              Restablecer clave
            </button>

            <span className="text-neutral-400">Teclado numérico activo</span>
          </div>
        )}
      </div>
    </div>
  );
};
