import React, { useState, useEffect, useCallback } from 'react';
import {
  WeatherLocation,
  WeatherData,
  LocationMode,
  DEFAULT_LOCATION,
  getSavedLocation,
  saveLocationPreference,
  getLocationMode,
  saveLocationMode,
  broadcastLocationChange,
  detectDeviceLocation,
  checkGeolocationPermission,
  fetchWeatherData,
  getWeatherConditionInfo,
} from '../utils/weather';
import { WeatherIcon } from './WeatherIcon';
import { WeatherModal } from './WeatherModal';
import {
  MapPin,
  RefreshCw,
  Calendar,
  ChevronDown,
  ChevronUp,
  Droplets,
  Sun,
  AlertCircle,
  Navigation,
  LocateFixed,
  Building2,
  Edit3,
} from 'lucide-react';
import { DIAS_SEMANA } from '../utils/constants';

interface WeatherWidgetProps {
  onOpenModal?: () => void;
  showWeekStrip?: boolean;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = () => {
  const [location, setLocation] = useState<WeatherLocation>(getSavedLocation);
  const [locationMode, setLocationMode] = useState<LocationMode>(getLocationMode);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalInitialTab, setModalInitialTab] = useState<'forecast' | 'locations'>('forecast');
  const [geoError, setGeoError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'C' | 'F'>('C');

  const loadWeather = useCallback(async (targetLoc: WeatherLocation, force: boolean = false) => {
    setIsLoading(true);
    setGeoError(null);
    try {
      const data = await fetchWeatherData(targetLoc, force);
      setWeatherData(data);
    } catch (err: any) {
      console.error('Error fetching weather:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load: if in device mode, auto-check permission and get current position
  useEffect(() => {
    const savedMode = getLocationMode();
    setLocationMode(savedMode);

    if (savedMode === 'device') {
      checkGeolocationPermission().then((permission) => {
        if (permission === 'granted') {
          detectDeviceLocation().then((res) => {
            if (res.location) {
              setLocation(res.location);
              saveLocationPreference(res.location);
              loadWeather(res.location, false);
            } else {
              loadWeather(location, false);
            }
          });
          return;
        }
        loadWeather(location, false);
      });
    } else {
      loadWeather(location, false);
    }
  }, []);

  // Listen to open_weather_modal or clima_location_changed events
  useEffect(() => {
    const handleOpenModal = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: 'forecast' | 'locations' }>;
      if (customEvent.detail?.tab) {
        setModalInitialTab(customEvent.detail.tab);
      } else {
        setModalInitialTab('forecast');
      }
      setIsModalOpen(true);
    };

    const handleLocationChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ location: WeatherLocation; mode: LocationMode }>;
      if (customEvent.detail) {
        setLocation(customEvent.detail.location);
        setLocationMode(customEvent.detail.mode);
        loadWeather(customEvent.detail.location, false);
      }
    };

    window.addEventListener('open_weather_modal', handleOpenModal);
    window.addEventListener('clima_location_changed', handleLocationChanged);
    return () => {
      window.removeEventListener('open_weather_modal', handleOpenModal);
      window.removeEventListener('clima_location_changed', handleLocationChanged);
    };
  }, [loadWeather]);

  // Request browser GPS geolocation
  const handleRequestGeolocation = async () => {
    setIsLoading(true);
    setGeoError(null);

    const result = await detectDeviceLocation();
    setIsLoading(false);

    if (result.error) {
      setGeoError(result.error);
      return;
    }

    if (result.location) {
      setLocation(result.location);
      setLocationMode('device');
      saveLocationPreference(result.location);
      saveLocationMode('device');
      broadcastLocationChange(result.location, 'device');
      loadWeather(result.location, true);
    }
  };

  const handleSelectLocation = (newLoc: WeatherLocation, mode: LocationMode = 'manual') => {
    setLocation(newLoc);
    setLocationMode(mode);
    saveLocationPreference(newLoc);
    saveLocationMode(mode);
    broadcastLocationChange(newLoc, mode);
    loadWeather(newLoc, true);
  };

  const toDisplayTemp = (celsius: number) => {
    if (unit === 'F') {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${celsius}°C`;
  };

  const current = weatherData?.current;
  const currentCondition = current
    ? getWeatherConditionInfo(current.weatherCode, current.isDay)
    : null;

  return (
    <>
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Header Weather Pill Button */}
        <button
          type="button"
          onClick={() => {
            setModalInitialTab('forecast');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-neutral-800 dark:text-neutral-200 border border-sky-300/60 dark:border-sky-800 text-xs font-medium transition-all shadow-2xs group"
          title={
            locationMode === 'device'
              ? `Ubicación GPS del dispositivo: ${location.name} · Clic para ver previsión semanal`
              : `Ciudad: ${location.name} · Clic para ver previsión semanal`
          }
        >
          {isLoading && !current ? (
            <RefreshCw className="w-4 h-4 animate-spin text-sky-500" />
          ) : (
            <WeatherIcon
              code={current?.weatherCode}
              isDay={current?.isDay}
              className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110"
            />
          )}

          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
              {current ? toDisplayTemp(current.temperature) : '—°'}
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-neutral-600 dark:text-neutral-300 font-medium truncate max-w-[100px]">
              {locationMode === 'device' ? (
                <Navigation className="w-2.5 h-2.5 text-sky-500 shrink-0" />
              ) : (
                <MapPin className="w-2.5 h-2.5 text-red-500 shrink-0" />
              )}
              <span className="truncate">{location.name}</span>
            </span>
          </div>

          <span className="hidden xl:inline text-[10px] text-sky-700 dark:text-sky-300 font-semibold bg-sky-100/80 dark:bg-sky-950/80 px-1.5 py-0.5 rounded-md">
            {currentCondition?.label || 'Clima'}
          </span>
        </button>

        {/* Dedicated "Cambiar ubicación manualmente" button in header */}
        <button
          type="button"
          onClick={() => {
            setModalInitialTab('locations');
            setIsModalOpen(true);
          }}
          className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-white dark:bg-[#161824] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-medium transition-all shadow-2xs flex items-center gap-1"
          title="Cambiar localización de la previsión manualmente (buscar ciudad, coordenadas GPS o lista)"
        >
          <MapPin className="w-3.5 h-3.5 text-[#e8533a]" />
          <span className="hidden sm:inline font-semibold text-[11px] text-[#e8533a]">Cambiar ciudad</span>
        </button>
      </div>

      {/* Weather Dialog Modal */}
      <WeatherModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        weatherData={weatherData}
        isLoading={isLoading}
        onRefresh={() => loadWeather(location, true)}
        onSelectLocation={handleSelectLocation}
        onRequestGeolocation={handleRequestGeolocation}
        geoError={geoError}
        unit={unit}
        onToggleUnit={() => setUnit((u) => (u === 'C' ? 'F' : 'C'))}
        locationMode={locationMode}
        initialTab={modalInitialTab}
      />
    </>
  );
};

// Export the strip component for showing weekly forecast above the calendar or in week views
export const WeatherWeekBanner: React.FC<{
  onOpenModal?: () => void;
}> = ({ onOpenModal }) => {
  const [location, setLocation] = useState<WeatherLocation>(getSavedLocation);
  const [locationMode, setLocationMode] = useState<LocationMode>(getLocationMode);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem('clima_banner_open_v1') !== 'false';
    } catch {
      return true;
    }
  });

  const loadData = useCallback(async (loc: WeatherLocation) => {
    try {
      const data = await fetchWeatherData(loc, false);
      setWeatherData(data);
    } catch {}
  }, []);

  useEffect(() => {
    loadData(location);
  }, [location, loadData]);

  // Synchronize immediately if location changes anywhere in the app
  useEffect(() => {
    const handleLocationChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ location: WeatherLocation; mode: LocationMode }>;
      if (customEvent.detail) {
        setLocation(customEvent.detail.location);
        setLocationMode(customEvent.detail.mode);
        loadData(customEvent.detail.location);
      }
    };

    window.addEventListener('clima_location_changed', handleLocationChanged);
    return () => {
      window.removeEventListener('clima_location_changed', handleLocationChanged);
    };
  }, [loadData]);

  const handleOpenWeatherModal = () => {
    if (onOpenModal) {
      onOpenModal();
    } else {
      window.dispatchEvent(new CustomEvent('open_weather_modal', { detail: { tab: 'forecast' } }));
    }
  };

  const handleOpenLocationPicker = () => {
    window.dispatchEvent(new CustomEvent('open_weather_modal', { detail: { tab: 'locations' } }));
  };

  if (!weatherData) return null;

  const current = weatherData.current;
  const daily = weatherData.daily || [];
  const currentCondition = getWeatherConditionInfo(current.weatherCode, current.isDay);

  const handleToggle = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    try {
      localStorage.setItem('clima_banner_open_v1', String(next));
    } catch {}
  };

  const isDevice = locationMode === 'device' || location.isDeviceLocation;

  return (
    <div className="bg-gradient-to-r from-sky-500/10 via-amber-500/5 to-transparent border border-sky-200/80 dark:border-sky-900/60 rounded-2xl p-3 sm:p-4 shadow-xs transition-all">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <WeatherIcon code={current.weatherCode} isDay={current.isDay} className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                {current.temperature}°C en {weatherData.location.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-semibold">
                {currentCondition.label}
              </span>
              {isDevice ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-0.5">
                  <Navigation className="w-2.5 h-2.5" /> GPS Dispositivo
                </span>
              ) : null}

              {/* Instant Manual Change button */}
              <button
                type="button"
                onClick={handleOpenLocationPicker}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-[#181a28] text-[#e8533a] border border-[#e8533a]/30 font-bold hover:bg-[#e8533a]/10 transition-colors flex items-center gap-1 shadow-2xs"
                title="Cambiar localización manualmente (buscar ciudad o coordenadas)"
              >
                <MapPin className="w-2.5 h-2.5" />
                <span>Cambiar ciudad</span>
              </button>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Sensación {current.apparentTemperature}°C • Humedad {current.relativeHumidity}% • Viento {current.windSpeed} km/h
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleOpenWeatherModal}
            className="text-xs text-sky-700 dark:text-sky-300 font-semibold hover:underline px-2 py-1"
          >
            Ver previsión completa →
          </button>

          <button
            type="button"
            onClick={handleToggle}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-neutral-500 transition-colors"
            title={isExpanded ? 'Ocultar previsión semanal' : 'Mostrar previsión semanal'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 7-day strip */}
      {isExpanded && daily.length > 0 && (
        <div className="mt-3 pt-3 border-t border-sky-200/50 dark:border-sky-900/40 grid grid-cols-4 sm:grid-cols-7 gap-2 overflow-x-auto">
          {daily.slice(0, 7).map((d, idx) => {
            const parts = d.date.split('-');
            const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            const dayName = idx === 0 ? 'Hoy' : idx === 1 ? 'Mañana' : DIAS_SEMANA[(dateObj.getDay() + 6) % 7];

            return (
              <div
                key={d.date}
                className="bg-white/70 dark:bg-[#151722]/80 backdrop-blur-xs p-2 rounded-xl border border-sky-100 dark:border-sky-950 text-center flex flex-col items-center justify-between"
              >
                <span className={`text-[10px] font-bold ${idx === 0 ? 'text-[#e8533a]' : 'text-neutral-500 dark:text-neutral-400'}`}>
                  {dayName}
                </span>
                <WeatherIcon code={d.weatherCode} className="w-4 h-4 my-1" />
                <div className="text-[10px] tabular-nums font-semibold text-neutral-800 dark:text-neutral-200">
                  <span className="text-neutral-400 font-normal">{d.tempMin}°</span> {d.tempMax}°
                </div>
                {d.precipitationProbability > 0 && (
                  <span className="text-[9px] text-cyan-600 dark:text-cyan-400 flex items-center gap-0.5 mt-0.5">
                    <Droplets className="w-2 h-2" />
                    {d.precipitationProbability}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
