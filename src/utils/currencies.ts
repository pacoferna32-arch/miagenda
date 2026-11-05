export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  defaultRate: number; // 1 EUR = defaultRate Currency
  decimals: number;
}

export const BASE_EUR_PRICE = 4.99;

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', defaultRate: 1.0, decimals: 2 },
  { code: 'USD', name: 'Dólar estadounidense', symbol: '$', flag: '🇺🇸', defaultRate: 1.09, decimals: 2 },
  { code: 'GBP', name: 'Libra esterlina', symbol: '£', flag: '🇬🇧', defaultRate: 0.85, decimals: 2 },
  { code: 'MXN', name: 'Peso mexicano', symbol: '$', flag: '🇲🇽', defaultRate: 21.8, decimals: 2 },
  { code: 'ARS', name: 'Peso argentino', symbol: '$', flag: '🇦🇷', defaultRate: 1180.0, decimals: 0 },
  { code: 'COP', name: 'Peso colombiano', symbol: '$', flag: '🇨🇴', defaultRate: 4520.0, decimals: 0 },
  { code: 'CLP', name: 'Peso chileno', symbol: '$', flag: '🇨🇱', defaultRate: 1040.0, decimals: 0 },
  { code: 'CHF', name: 'Franco suizo', symbol: 'CHF', flag: '🇨🇭', defaultRate: 0.96, decimals: 2 },
  { code: 'CAD', name: 'Dólar canadiense', symbol: 'CA$', flag: '🇨🇦', defaultRate: 1.48, decimals: 2 },
  { code: 'JPY', name: 'Yen japonés', symbol: '¥', flag: '🇯🇵', defaultRate: 165.0, decimals: 0 },
  { code: 'BRL', name: 'Real brasileño', symbol: 'R$', flag: '🇧🇷', defaultRate: 5.95, decimals: 2 },
];

/**
 * Cache for live rates
 */
let liveRatesCache: Record<string, number> | null = null;
let lastFetchedAt: number = 0;

/**
 * Fetch live daily exchange rates with EUR base
 */
export async function getLiveExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();
  // Cache for 1 hour
  if (liveRatesCache && now - lastFetchedAt < 3600000) {
    return liveRatesCache;
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/EUR');
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        liveRatesCache = data.rates;
        lastFetchedAt = now;
        return data.rates;
      }
    }
  } catch (e) {
    console.warn('Could not fetch external live exchange rates, using built-in rates:', e);
  }

  // Fallback to default rates
  const fallback: Record<string, number> = {};
  SUPPORTED_CURRENCIES.forEach((c) => {
    fallback[c.code] = c.defaultRate;
  });
  return fallback;
}

/**
 * Calculate converted price in target currency
 */
export function calculateConvertedPrice(
  currencyCode: string,
  rates: Record<string, number> | null
): { formatted: string; amount: number; symbol: string } {
  const currency = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];
  const rate = (rates && rates[currencyCode]) ? rates[currencyCode] : currency.defaultRate;
  const rawAmount = BASE_EUR_PRICE * rate;

  const roundedAmount = currency.decimals === 0 ? Math.round(rawAmount) : Number(rawAmount.toFixed(2));
  const formattedAmount = roundedAmount.toLocaleString('es-ES', {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  });

  return {
    amount: roundedAmount,
    formatted: `${currency.symbol} ${formattedAmount}`,
    symbol: currency.symbol,
  };
}
