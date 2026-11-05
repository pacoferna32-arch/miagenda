import React, { useState, useEffect, useId } from 'react';
import { UserSettings, PremiumSubscription } from '../types';
import {
  SUPPORTED_CURRENCIES,
  CurrencyInfo,
  calculateConvertedPrice,
  getLiveExchangeRates,
  BASE_EUR_PRICE,
} from '../utils/currencies';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  X,
  Crown,
  CreditCard,
  Building2,
  Check,
  Sparkles,
  ShieldCheck,
  Copy,
  Lock,
  ArrowRight,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onActivatePremium: (premiumData: PremiumSubscription) => Promise<void> | void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  settings,
  onActivatePremium,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('EUR');
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [loadingRates, setLoadingRates] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card');

  // Credit Card Form State
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Bank Transfer Unique Reference
  const [transferRef] = useState<string>(() => {
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `PREM-${randomHex}`;
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoadingRates(true);
      getLiveExchangeRates()
        .then((fetchedRates) => setRates(fetchedRates))
        .finally(() => setLoadingRates(false));
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPrice = calculateConvertedPrice(selectedCurrency, rates);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    sounds.playClick();
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Card formatting helpers
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (raw.length >= 2) {
      setCardExpiry(`${raw.substring(0, 2)}/${raw.substring(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  // Detect card brand
  const getCardBrand = (num: string) => {
    const clean = num.replace(/\s/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'Mastercard';
    if (/^3[47]/.test(clean)) return 'American Express';
    return 'Tarjeta';
  };

  // Process Card Payment
  const handleCardCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanNum = cardNumber.replace(/\s/g, '');
    if (cleanNum.length < 15) {
      setErrorMessage('Por favor, introduce un número de tarjeta válido (16 dígitos).');
      return;
    }
    if (!cardHolder.trim()) {
      setErrorMessage('Por favor, indica el nombre del titular como figura en la tarjeta.');
      return;
    }
    if (cardExpiry.length < 5) {
      setErrorMessage('Introduce la fecha de caducidad en formato MM/AA.');
      return;
    }
    if (cardCvv.length < 3) {
      setErrorMessage('Introduce los 3 o 4 dígitos de seguridad (CVV/CVC).');
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate real-world 3D secure payment verification delay
      await new Promise((resolve) => setTimeout(resolve, 1400));

      const premiumData: PremiumSubscription = {
        isPremium: true,
        type: 'lifetime',
        purchasedAt: new Date().toISOString(),
        paymentMethod: 'card',
        currency: selectedCurrency,
        amount: currentPrice.amount,
        transactionRef: `TX-${Date.now()}-${cleanNum.slice(-4)}`,
      };

      await onActivatePremium(premiumData);
      sounds.playCompleteChime();

      // Confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al procesar el pago. Por favor, inténtalo de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process Bank Transfer Confirmation
  const handleTransferConfirm = async () => {
    setIsProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const premiumData: PremiumSubscription = {
        isPremium: true,
        type: 'lifetime',
        purchasedAt: new Date().toISOString(),
        paymentMethod: 'transfer',
        currency: selectedCurrency,
        amount: currentPrice.amount,
        transactionRef: transferRef,
      };

      await onActivatePremium(premiumData);
      sounds.playCompleteChime();

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al registrar la confirmación de la transferencia.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#151722] text-neutral-900 dark:text-neutral-100 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-[#1a1c29] via-[#242738] to-[#161824] text-white shrink-0 overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-amber-500/20 via-[#e8533a]/20 to-transparent rounded-full blur-3xl pointer-events-none" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-[#e8533a] text-white shadow-xs">
              <Crown className="w-3.5 h-3.5" />
              <span>Suscripción Pago Único</span>
            </span>
            <span className="text-xs text-amber-300/90 font-medium">
              Acceso de por vida · Sin cuotas mensuales
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-tight">
            Desbloquea todo el potencial y elimina la publicidad
          </h2>
          <p className="text-xs sm:text-sm text-white/70 max-w-xl mt-1">
            Una única compra para disfrutar de todas las herramientas avanzadas, sincronización ilimitada y una experiencia 100% limpia sin anuncios para siempre.
          </p>

          {/* Pricing & Currency Bar */}
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-white/60 block">Precio único de por vida:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-serif font-extrabold text-amber-300">
                  {currentPrice.formatted}
                </span>
                {selectedCurrency !== 'EUR' && (
                  <span className="text-xs text-white/50">
                    (~{BASE_EUR_PRICE.toFixed(2)} € al cambio)
                  </span>
                )}
              </div>
            </div>

            {/* Currency Selector with Daily Rates */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/70 font-medium shrink-0">Moneda:</span>
              <select
                value={selectedCurrency}
                onChange={(e) => {
                  setSelectedCurrency(e.target.value);
                  sounds.playClick();
                }}
                className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
              >
                {SUPPORTED_CURRENCIES.map((cur) => (
                  <option key={cur.code} value={cur.code} className="bg-[#1a1c29] text-white">
                    {cur.flag} {cur.code} ({cur.name})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Features Benefit Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              { icon: '🚫', title: 'Cero Publicidad', desc: 'Elimina todos los anuncios y banners patrocinados' },
              { icon: '⚡', title: 'Todas las Opciones', desc: 'Acceso total a menús, finanzas, peso y habit tracker' },
              { icon: '🔔', title: 'Web Push Ilimitado', desc: 'Avisos en segundo plano para tareas y medicinas' },
              { icon: '🔒', title: 'Diario Personal con PIN', desc: 'Reflexiones y notas protegidas con cifrado' },
            ].map((f, i) => (
              <div
                key={i}
                className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-[#161824]/60 flex items-start gap-2.5"
              >
                <span className="text-lg shrink-0 mt-0.5">{f.icon}</span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">
                    {f.title}
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight mt-0.5">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Method Selector Tabs */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Selecciona tu forma de pago:
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('card');
                  sounds.playClick();
                }}
                className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'border-[#e8533a] bg-[#e8533a]/10 text-[#e8533a] shadow-xs ring-2 ring-[#e8533a]/20'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Tarjeta de Crédito / Débito</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('transfer');
                  sounds.playClick();
                }}
                className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'transfer'
                    ? 'border-[#e8533a] bg-[#e8533a]/10 text-[#e8533a] shadow-xs ring-2 ring-[#e8533a]/20'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Transferencia Bancaria</span>
              </button>
            </div>
          </div>

          {/* Error banner */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* METHOD 1: CREDIT CARD */}
          {paymentMethod === 'card' && (
            <form onSubmit={handleCardCheckout} className="space-y-4 animate-in fade-in duration-200">
              {/* Virtual Card Graphic Preview */}
              <div className="p-5 rounded-2xl bg-gradient-to-tr from-neutral-900 via-neutral-800 to-neutral-700 text-white shadow-xl relative overflow-hidden border border-neutral-700">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-7 rounded bg-amber-400/80 shadow-xs flex items-center justify-center text-[10px] text-amber-950 font-bold">
                    CHIP
                  </div>
                  <span className="text-xs font-bold tracking-widest text-white/80 uppercase">
                    {getCardBrand(cardNumber)}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="font-mono text-lg sm:text-xl tracking-widest text-white drop-shadow-sm">
                    {cardNumber || '•••• •••• •••• ••••'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs uppercase text-white/70">
                  <div>
                    <span className="text-[9px] block text-white/50">Titular</span>
                    <span className="font-semibold text-white truncate block max-w-[200px]">
                      {cardHolder || 'NOMBRE DEL TITULAR'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] block text-white/50">Caduca</span>
                    <span className="font-mono font-semibold text-white">
                      {cardExpiry || 'MM/AA'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form inputs */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-neutral-600 dark:text-neutral-400 font-medium block mb-1">
                    Número de Tarjeta
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      maxLength={19}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-[#e8533a]"
                    />
                    <CreditCard className="w-4 h-4 text-neutral-400 absolute right-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-neutral-600 dark:text-neutral-400 font-medium block mb-1">
                    Nombre completo del titular
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Juan Pérez García"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#e8533a]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-neutral-600 dark:text-neutral-400 font-medium block mb-1">
                      Fecha de caducidad
                    </label>
                    <input
                      type="text"
                      placeholder="MM/AA"
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      maxLength={5}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-[#e8533a]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-neutral-600 dark:text-neutral-400 font-medium block mb-1">
                      Código de seguridad (CVV/CVC)
                    </label>
                    <input
                      type="password"
                      placeholder="123"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                      maxLength={4}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-[#e8533a]"
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-[#e8533a] to-[#d4432c] hover:opacity-95 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Procesando pago seguro...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pagar {currentPrice.formatted} y Activar de Por Vida</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Pago cifrado de 256 bits · Activación inmediata</span>
              </div>
            </form>
          )}

          {/* METHOD 2: BANK TRANSFER */}
          {paymentMethod === 'transfer' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-[#1a1c29] border border-amber-200 dark:border-neutral-700 space-y-2">
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#e8533a]" />
                  <span>Instrucciones para Transferencia Bancaria (SEPA / Wire)</span>
                </h4>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                  Realiza la transferencia desde la app o web de tu banco con los siguientes datos. Es fundamental incluir el <b>Concepto obligatorio</b> para que el sistema identifique tu suscripción.
                </p>
              </div>

              {/* Bank Details Table */}
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-[#161824] overflow-hidden shadow-2xs">
                {/* Beneficiary */}
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Beneficiario</span>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">Mi Calendario de Tareas S.L.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('Mi Calendario de Tareas S.L.', 'beneficiary')}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title="Copiar"
                  >
                    {copiedField === 'beneficiary' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* IBAN */}
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">IBAN (Cuenta Bancaria)</span>
                    <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">
                      ES91 2100 0418 4502 0005 1332
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('ES9121000418450200051332', 'iban')}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title="Copiar IBAN"
                  >
                    {copiedField === 'iban' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* BIC/SWIFT */}
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">BIC / SWIFT (CaixaBank)</span>
                    <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">CAIXESBBXXX</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('CAIXESBBXXX', 'bic')}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title="Copiar BIC"
                  >
                    {copiedField === 'bic' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Exact Amount */}
                <div className="p-3.5 flex items-center justify-between gap-3 bg-amber-50/40 dark:bg-amber-950/20">
                  <div>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 uppercase tracking-wider block font-bold">
                      Importe exacto a transferir
                    </span>
                    <span className="text-sm font-bold text-amber-900 dark:text-amber-300">
                      {currentPrice.formatted}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(`${currentPrice.amount}`, 'amount')}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title="Copiar Importe"
                  >
                    {copiedField === 'amount' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Mandatory Concept Reference */}
                <div className="p-3.5 flex items-center justify-between gap-3 bg-orange-50/50 dark:bg-orange-950/20 border-l-4 border-orange-500">
                  <div>
                    <span className="text-[10px] text-orange-700 dark:text-orange-400 uppercase tracking-wider block font-bold">
                      Concepto / Referencia obligatoria
                    </span>
                    <span className="text-sm font-mono font-extrabold text-[#e8533a]">
                      {transferRef}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(transferRef, 'ref')}
                    className="px-2.5 py-1.5 rounded-lg bg-[#e8533a] text-white text-xs font-semibold flex items-center gap-1 shadow-xs hover:bg-[#d4432c] transition-colors"
                  >
                    {copiedField === 'ref' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'ref' ? 'Copiado' : 'Copiar referencia'}</span>
                  </button>
                </div>
              </div>

              {/* Confirm Transfer CTA */}
              <button
                type="button"
                onClick={handleTransferConfirm}
                disabled={isProcessing}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Confirmando transferencia...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>He realizado la transferencia (Activar Suscripción)</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-neutral-500 dark:text-neutral-400">
                Al pulsar el botón se activará de inmediato tu suscripción de por vida vinculada a la referencia <b>{transferRef}</b>.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-[#1a1c29]/50 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Garantía de reembolso de 14 días</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs font-semibold transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
