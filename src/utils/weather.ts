export interface WeatherLocation {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  isDeviceLocation?: boolean;
}

export type LocationMode = 'device' | 'manual';

export interface CategorizedCity extends WeatherLocation {
  category: 'espana' | 'islas' | 'internacional';
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  relativeHumidity: number;
  weatherCode: number;
  windSpeed: number;
  precipitation: number;
  isDay: boolean;
  time: string;
}

export interface DailyForecastDay {
  date: string; // YYYY-MM-DD
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
  windSpeedMax: number;
  uvIndexMax?: number;
  sunrise?: string;
  sunset?: string;
}

export interface WeatherData {
  location: WeatherLocation;
  current: CurrentWeather;
  daily: DailyForecastDay[];
  lastUpdated: number; // timestamp
}

export interface WeatherConditionInfo {
  label: string;
  description: string;
  iconName: 'Sun' | 'CloudSun' | 'Cloud' | 'CloudFog' | 'CloudDrizzle' | 'CloudRain' | 'CloudLightning' | 'Snowflake';
  colorClass: string;
  bgGradient: string;
  advice: string;
}

export const POPULAR_CITIES: CategorizedCity[] = [
  // España Peninsular
  { name: 'Madrid', country: 'España', admin1: 'Comunidad de Madrid', latitude: 40.4168, longitude: -3.7038, category: 'espana' },
  { name: 'Barcelona', country: 'España', admin1: 'Cataluña', latitude: 41.3879, longitude: 2.1699, category: 'espana' },
  { name: 'Valencia', country: 'España', admin1: 'Comunitat Valenciana', latitude: 39.4699, longitude: -0.3763, category: 'espana' },
  { name: 'Sevilla', country: 'España', admin1: 'Andalucía', latitude: 37.3891, longitude: -5.9845, category: 'espana' },
  { name: 'Zaragoza', country: 'España', admin1: 'Aragón', latitude: 41.6488, longitude: -0.8891, category: 'espana' },
  { name: 'Málaga', country: 'España', admin1: 'Andalucía', latitude: 36.7213, longitude: -4.4214, category: 'espana' },
  { name: 'Bilbao', country: 'España', admin1: 'País Vasco', latitude: 43.2630, longitude: -2.9350, category: 'espana' },
  { name: 'Alicante', country: 'España', admin1: 'Comunitat Valenciana', latitude: 38.3452, longitude: -0.4810, category: 'espana' },
  { name: 'Córdoba', country: 'España', admin1: 'Andalucía', latitude: 37.8882, longitude: -4.7794, category: 'espana' },
  { name: 'Valladolid', country: 'España', admin1: 'Castilla y León', latitude: 41.6523, longitude: -4.7245, category: 'espana' },
  { name: 'Vigo', country: 'España', admin1: 'Galicia', latitude: 42.2406, longitude: -8.7207, category: 'espana' },
  { name: 'Gijón', country: 'España', admin1: 'Asturias', latitude: 43.5357, longitude: -5.6615, category: 'espana' },
  { name: 'Granada', country: 'España', admin1: 'Andalucía', latitude: 37.1773, longitude: -3.5986, category: 'espana' },
  { name: 'Murcia', country: 'España', admin1: 'Región de Murcia', latitude: 37.9922, longitude: -1.1307, category: 'espana' },
  { name: 'Santander', country: 'España', admin1: 'Cantabria', latitude: 43.4623, longitude: -3.8099, category: 'espana' },
  { name: 'Oviedo', country: 'España', admin1: 'Asturias', latitude: 43.3619, longitude: -5.8494, category: 'espana' },
  { name: 'A Coruña', country: 'España', admin1: 'Galicia', latitude: 43.3623, longitude: -8.4115, category: 'espana' },
  { name: 'Salamanca', country: 'España', admin1: 'Castilla y León', latitude: 40.9701, longitude: -5.6635, category: 'espana' },
  { name: 'San Sebastián', country: 'España', admin1: 'País Vasco', latitude: 43.3183, longitude: -1.9812, category: 'espana' },
  { name: 'Toledo', country: 'España', admin1: 'Castilla-La Mancha', latitude: 39.8628, longitude: -4.0273, category: 'espana' },

  // Islas Canarias y Baleares
  { name: 'Palma de Mallorca', country: 'España', admin1: 'Islas Baleares', latitude: 39.5696, longitude: 2.6502, category: 'islas' },
  { name: 'Las Palmas de Gran Canaria', country: 'España', admin1: 'Canarias', latitude: 28.1235, longitude: -15.4363, category: 'islas' },
  { name: 'Santa Cruz de Tenerife', country: 'España', admin1: 'Canarias', latitude: 28.4636, longitude: -16.2518, category: 'islas' },
  { name: 'Ibiza', country: 'España', admin1: 'Islas Baleares', latitude: 38.9067, longitude: 1.4206, category: 'islas' },
  { name: 'Mahón (Menorca)', country: 'España', admin1: 'Islas Baleares', latitude: 39.8885, longitude: 4.2658, category: 'islas' },
  { name: 'Arrecife (Lanzarote)', country: 'España', admin1: 'Canarias', latitude: 28.9630, longitude: -13.5477, category: 'islas' },

  // Internacionales y Latinoamérica
  { name: 'Ciudad de México', country: 'México', latitude: 19.4326, longitude: -99.1332, category: 'internacional' },
  { name: 'Buenos Aires', country: 'Argentina', latitude: -34.6037, longitude: -58.3816, category: 'internacional' },
  { name: 'Bogotá', country: 'Colombia', latitude: 4.7110, longitude: -74.0721, category: 'internacional' },
  { name: 'Santiago de Chile', country: 'Chile', latitude: -33.4489, longitude: -70.6693, category: 'internacional' },
  { name: 'Lima', country: 'Perú', latitude: -12.0464, longitude: -77.0428, category: 'internacional' },
  { name: 'Montevideo', country: 'Uruguay', latitude: -34.9011, longitude: -56.1645, category: 'internacional' },
  { name: 'Lisboa', country: 'Portugal', latitude: 38.7223, longitude: -9.1393, category: 'internacional' },
  { name: 'París', country: 'Francia', latitude: 48.8566, longitude: 2.3522, category: 'internacional' },
  { name: 'Roma', country: 'Italia', latitude: 41.9028, longitude: 12.4964, category: 'internacional' },
  { name: 'Londres', country: 'Reino Unido', latitude: 51.5074, longitude: -0.1278, category: 'internacional' },
  { name: 'Nueva York', country: 'Estados Unidos', latitude: 40.7128, longitude: -74.0060, category: 'internacional' },
];

export const DEFAULT_LOCATION: WeatherLocation = POPULAR_CITIES[0];

export function getWeatherConditionInfo(code: number, isDay: boolean = true): WeatherConditionInfo {
  // WMO Weather interpretation codes (WW)
  switch (code) {
    case 0:
      return {
        label: isDay ? 'Despejado' : 'Noche despejada',
        description: 'Cielo completamente limpio y despejado',
        iconName: 'Sun',
        colorClass: 'text-amber-500',
        bgGradient: 'from-amber-500/20 to-orange-500/10',
        advice: '¡Excelente día para actividades al aire libre y paseos!',
      };
    case 1:
      return {
        label: isDay ? 'Mayormente soleado' : 'Mayormente despejado',
        description: 'Cielo predominantemente despejado con pocas nubes',
        iconName: 'Sun',
        colorClass: 'text-amber-500',
        bgGradient: 'from-amber-500/20 to-yellow-500/10',
        advice: 'Ambiente agradable y soleado para cumplir tus tareas.',
      };
    case 2:
      return {
        label: 'Parcialmente nublado',
        description: 'Intervalos nubosos con periodos de sol',
        iconName: 'CloudSun',
        colorClass: 'text-sky-500',
        bgGradient: 'from-sky-500/20 to-amber-500/10',
        advice: 'Clima templado y agradable sin precipitaciones esperadas.',
      };
    case 3:
      return {
        label: 'Nublado',
        description: 'Cielo cubierto por nubes estratificadas',
        iconName: 'Cloud',
        colorClass: 'text-slate-400',
        bgGradient: 'from-slate-500/20 to-neutral-500/10',
        advice: 'Día gris pero estable. Buen momento para avanzar pendientes.',
      };
    case 45:
    case 48:
      return {
        label: 'Niebla',
        description: 'Baja visibilidad por niebla o neblina matinal',
        iconName: 'CloudFog',
        colorClass: 'text-slate-400',
        bgGradient: 'from-slate-500/20 to-sky-500/10',
        advice: 'Precaución en desplazamientos por visibilidad reducida.',
      };
    case 51:
    case 53:
    case 55:
      return {
        label: 'Llovizna',
        description: 'Precipitación muy fina de intensidad leve a moderada',
        iconName: 'CloudDrizzle',
        colorClass: 'text-cyan-500',
        bgGradient: 'from-cyan-500/20 to-blue-500/10',
        advice: 'Lleva una chaqueta impermeable o paraguas ligero.',
      };
    case 56:
    case 57:
      return {
        label: 'Llovizna helada',
        description: 'Gotas muy finas a temperaturas cercanas a la congelación',
        iconName: 'CloudDrizzle',
        colorClass: 'text-cyan-400',
        bgGradient: 'from-cyan-500/20 to-blue-500/10',
        advice: 'Cuidado con posibles superficies resbaladizas.',
      };
    case 61:
      return {
        label: 'Lluvia débil',
        description: 'Lluvia dispersa de baja intensidad',
        iconName: 'CloudRain',
        colorClass: 'text-blue-500',
        bgGradient: 'from-blue-500/20 to-indigo-500/10',
        advice: 'No olvides tu paraguas antes de salir de casa.',
      };
    case 63:
    case 65:
      return {
        label: 'Lluvia moderada',
        description: 'Precipitaciones constantes de moderadas a fuertes',
        iconName: 'CloudRain',
        colorClass: 'text-blue-600',
        bgGradient: 'from-blue-600/20 to-slate-600/15',
        advice: 'Lluvia activa. Buen momento para tareas de interior y descanso.',
      };
    case 66:
    case 67:
      return {
        label: 'Lluvia engelante',
        description: 'Lluvia que se congela al contactar con el suelo',
        iconName: 'CloudRain',
        colorClass: 'text-sky-600',
        bgGradient: 'from-sky-600/20 to-blue-700/15',
        advice: 'Precaución extrema en carretera o aceras.',
      };
    case 71:
    case 73:
    case 75:
    case 77:
      return {
        label: 'Nieve',
        description: 'Precipitación en forma de copos de nieve',
        iconName: 'Snowflake',
        colorClass: 'text-sky-300',
        bgGradient: 'from-sky-400/20 to-indigo-400/10',
        advice: 'Abrígate bien y disfruta de la nieve con precaución.',
      };
    case 80:
    case 81:
    case 82:
      return {
        label: 'Chubascos',
        description: 'Aguaceros repentinos e intermitentes',
        iconName: 'CloudRain',
        colorClass: 'text-indigo-500',
        bgGradient: 'from-indigo-500/20 to-blue-600/15',
        advice: 'Los chubascos pueden ser intensos de forma breve.',
      };
    case 85:
    case 86:
      return {
        label: 'Chubascos de nieve',
        description: 'Chubascos intermitentes de nieve',
        iconName: 'Snowflake',
        colorClass: 'text-sky-400',
        bgGradient: 'from-sky-500/20 to-blue-500/10',
        advice: 'Ambiente muy invernal. Mantente resguardado.',
      };
    case 95:
      return {
        label: 'Tormenta eléctrica',
        description: 'Actividad eléctrica con lluvia intensa',
        iconName: 'CloudLightning',
        colorClass: 'text-amber-500',
        bgGradient: 'from-amber-500/20 to-purple-600/20',
        advice: 'Evita espacios abiertos y mantente a resguardo.',
      };
    case 96:
    case 99:
      return {
        label: 'Tormenta con granizo',
        description: 'Tormenta severa acompañada de granizo',
        iconName: 'CloudLightning',
        colorClass: 'text-purple-500',
        bgGradient: 'from-purple-500/20 to-rose-600/20',
        advice: 'Protege tu vehículo y permanece en interiores.',
      };
    default:
      return {
        label: 'Tiempo variable',
        description: 'Condiciones meteorológicas variables',
        iconName: 'CloudSun',
        colorClass: 'text-neutral-400',
        bgGradient: 'from-neutral-500/20 to-slate-500/10',
        advice: 'Consulta la previsión detallada a lo largo del día.',
      };
  }
}

const STORAGE_CACHE_KEY = 'clima_cache_v1';
const STORAGE_LOCATION_KEY = 'clima_selected_location_v1';
const STORAGE_MODE_KEY = 'clima_location_mode_v1';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const STORAGE_RECENT_KEY = 'clima_recent_locations_v1';

export function getSavedLocation(): WeatherLocation {
  try {
    const raw = localStorage.getItem(STORAGE_LOCATION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_LOCATION;
}

export function saveLocationPreference(loc: WeatherLocation) {
  try {
    localStorage.setItem(STORAGE_LOCATION_KEY, JSON.stringify(loc));
  } catch {}
}

export function getRecentLocations(): WeatherLocation[] {
  try {
    const raw = localStorage.getItem(STORAGE_RECENT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveRecentLocation(loc: WeatherLocation) {
  try {
    const current = getRecentLocations().filter(
      (l) => Math.abs(l.latitude - loc.latitude) > 0.05 || Math.abs(l.longitude - loc.longitude) > 0.05
    );
    const updated = [loc, ...current].slice(0, 5);
    localStorage.setItem(STORAGE_RECENT_KEY, JSON.stringify(updated));
  } catch {}
}

export function getLocationMode(): LocationMode {
  try {
    const mode = localStorage.getItem(STORAGE_MODE_KEY);
    if (mode === 'device' || mode === 'manual') return mode;
  } catch {}
  return 'manual';
}

export function saveLocationMode(mode: LocationMode) {
  try {
    localStorage.setItem(STORAGE_MODE_KEY, mode);
  } catch {}
}

export function broadcastLocationChange(loc: WeatherLocation, mode: LocationMode) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('clima_location_changed', {
        detail: { location: loc, mode },
      })
    );
  }
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  // Try Open-Meteo reverse geocoding or BigDataCloud or Nominatim
  try {
    const bdcResp = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=es`
    );
    if (bdcResp.ok) {
      const data = await bdcResp.json();
      const city = data.city || data.locality || data.principalSubdivision;
      if (city) return city;
    }
  } catch {}

  try {
    const nomResp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12&addressdetails=1`
    );
    if (nomResp.ok) {
      const data = await nomResp.json();
      const name =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.municipality ||
        data.address?.county;
      if (name) return name;
    }
  } catch {}

  return `Ubicación GPS (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`;
}

export async function checkGeolocationPermission(): Promise<'granted' | 'prompt' | 'denied' | 'unsupported'> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return 'unsupported';
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const res = await navigator.permissions.query({ name: 'geolocation' });
      return res.state as 'granted' | 'prompt' | 'denied';
    } catch {}
  }
  return 'prompt';
}

export function detectDeviceLocation(): Promise<{ location: WeatherLocation; error?: string }> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({
        location: getSavedLocation(),
        error: 'Tu navegador o dispositivo no soporta geolocalización GPS.',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let detectedCity = 'Mi ubicación actual';
        try {
          detectedCity = await reverseGeocode(latitude, longitude);
        } catch {}

        const loc: WeatherLocation = {
          name: detectedCity,
          country: '',
          latitude,
          longitude,
          isDeviceLocation: true,
        };
        resolve({ location: loc });
      },
      (err) => {
        let msg = 'No se pudo obtener la ubicación de tu dispositivo.';
        if (err.code === 1) {
          msg = 'Permiso de ubicación denegado en el navegador o sistema. Puedes activarlo o elegir una ciudad de la lista.';
        } else if (err.code === 2) {
          msg = 'La señal GPS o red de ubicación no está disponible en este momento.';
        } else if (err.code === 3) {
          msg = 'El GPS tardó demasiado en responder (tiempo de espera agotado).';
        }
        resolve({
          location: getSavedLocation(),
          error: msg,
        });
      },
      { timeout: 10000, enableHighAccuracy: false, maximumAge: 180000 }
    );
  });
}

export function getCachedWeather(loc: WeatherLocation): WeatherData | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_CACHE_KEY}_${loc.latitude.toFixed(2)}_${loc.longitude.toFixed(2)}`);
    if (!raw) return null;
    const data: WeatherData = JSON.parse(raw);
    if (Date.now() - data.lastUpdated < CACHE_TTL_MS) {
      return data;
    }
  } catch {}
  return null;
}

export async function fetchWeatherData(
  location: WeatherLocation,
  forceRefresh: boolean = false
): Promise<WeatherData> {
  if (!forceRefresh) {
    const cached = getCachedWeather(location);
    if (cached) return cached;
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset&timezone=auto`;

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Error al consultar Open-Meteo: ${resp.status}`);
  }

  const json = await resp.json();

  const current: CurrentWeather = {
    temperature: Math.round(json.current?.temperature_2m ?? 0),
    apparentTemperature: Math.round(json.current?.apparent_temperature ?? 0),
    relativeHumidity: Math.round(json.current?.relative_humidity_2m ?? 0),
    weatherCode: json.current?.weather_code ?? 0,
    windSpeed: Math.round(json.current?.wind_speed_10m ?? 0),
    precipitation: json.current?.precipitation ?? 0,
    isDay: Boolean(json.current?.is_day ?? 1),
    time: json.current?.time || new Date().toISOString(),
  };

  const daily: DailyForecastDay[] = [];
  const times: string[] = json.daily?.time || [];
  const codes: number[] = json.daily?.weather_code || [];
  const maxTemps: number[] = json.daily?.temperature_2m_max || [];
  const minTemps: number[] = json.daily?.temperature_2m_min || [];
  const precipProbs: number[] = json.daily?.precipitation_probability_max || [];
  const windMaxs: number[] = json.daily?.wind_speed_10m_max || [];
  const uvs: number[] = json.daily?.uv_index_max || [];
  const sunrises: string[] = json.daily?.sunrise || [];
  const sunsets: string[] = json.daily?.sunset || [];

  for (let i = 0; i < times.length; i++) {
    daily.push({
      date: times[i],
      weatherCode: codes[i] ?? 0,
      tempMax: Math.round(maxTemps[i] ?? 0),
      tempMin: Math.round(minTemps[i] ?? 0),
      precipitationProbability: Math.round(precipProbs[i] ?? 0),
      windSpeedMax: Math.round(windMaxs[i] ?? 0),
      uvIndexMax: uvs[i] != null ? Math.round(uvs[i]) : undefined,
      sunrise: sunrises[i],
      sunset: sunsets[i],
    });
  }

  const result: WeatherData = {
    location,
    current,
    daily,
    lastUpdated: Date.now(),
  };

  try {
    localStorage.setItem(
      `${STORAGE_CACHE_KEY}_${location.latitude.toFixed(2)}_${location.longitude.toFixed(2)}`,
      JSON.stringify(result)
    );
  } catch {}

  return result;
}

export async function searchCities(query: string): Promise<WeatherLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    trimmed
  )}&count=6&language=es&format=json`;

  const resp = await fetch(url);
  if (!resp.ok) return [];

  const json = await resp.json();
  if (!json.results || !Array.isArray(json.results)) return [];

  return json.results.map((item: any) => ({
    name: item.name,
    country: item.country,
    admin1: item.admin1,
    latitude: item.latitude,
    longitude: item.longitude,
  }));
}
