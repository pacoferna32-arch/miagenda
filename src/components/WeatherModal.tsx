import React, { useState, useEffect, useRef } from 'react';
import {
  WeatherLocation,
  WeatherData,
  DailyForecastDay,
  POPULAR_CITIES,
  CategorizedCity,
  LocationMode,
  getWeatherConditionInfo,
  searchCities,
  checkGeolocationPermission,
  getRecentLocations,
  saveRecentLocation,
} from '../utils/weather';
import { WeatherIcon } from './WeatherIcon';
import {
  X,
  MapPin,
  Search,
  RefreshCw,
  Navigation,
  Droplets,
  Wind,
  Thermometer,
  Sun,
  Sunrise,
  Sunset,
  Calendar,
  ChevronRight,
  Compass,
  AlertCircle,
  Check,
  Building2,
  Globe2,
  Sparkles,
  LocateFixed,
  Edit2,
  Sliders,
  History,
} from 'lucide-react';
import { DIAS_SEMANA, MESES } from '../utils/constants';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  weatherData: WeatherData | null;
  isLoading: boolean;
  onRefresh: () => void;
  onSelectLocation: (loc: WeatherLocation, mode?: LocationMode) => void;
  onRequestGeolocation: () => void;
  geoError: string | null;
  unit: 'C' | 'F';
  onToggleUnit: () => void;
  locationMode?: LocationMode;
  initialTab?: 'forecast' | 'locations';
}

export const WeatherModal: React.FC<WeatherModalProps> = ({
  isOpen,
  onClose,
  weatherData,
  isLoading,
  onRefresh,
  onSelectLocation,
  onRequestGeolocation,
  geoError,
  unit,
  onToggleUnit,
  locationMode = 'manual',
  initialTab = 'forecast',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WeatherLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'forecast' | 'locations'>(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'espana' | 'islas' | 'internacional'>('all');
  const [geoPermission, setGeoPermission] = useState<'granted' | 'prompt' | 'denied' | 'unsupported'>('prompt');
  const [recentLocations, setRecentLocations] = useState<WeatherLocation[]>([]);

  // Manual Coordinates drawer state
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualCoordError, setManualCoordError] = useState<string | null>(null);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      checkGeolocationPermission().then(setGeoPermission);
      setRecentLocations(getRecentLocations());
      if (weatherData?.location) {
        setManualLat(String(weatherData.location.latitude));
        setManualLon(String(weatherData.location.longitude));
        setManualName(weatherData.location.name);
      }
    }
  }, [isOpen, initialTab]);

  // Live auto-search as the user types
  const handleQueryChange = (val: string) => {
    setSearchQuery(val);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (!val.trim() || val.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchCities(val);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchCities(searchQuery);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Select location and track recent history
  const handlePickLocation = (loc: WeatherLocation, mode: LocationMode = 'manual') => {
    saveRecentLocation(loc);
    setRecentLocations(getRecentLocations());
    onSelectLocation(loc, mode);
    setActiveTab('forecast');
  };

  // Apply manual coordinates
  const handleApplyManualCoords = (e: React.FormEvent) => {
    e.preventDefault();
    setManualCoordError(null);

    const lat = parseFloat(manualLat.replace(',', '.'));
    const lon = parseFloat(manualLon.replace(',', '.'));

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setManualCoordError('La latitud debe ser un número válido entre -90 y 90 (ej. 40.4168).');
      return;
    }

    if (isNaN(lon) || lon < -180 || lon > 180) {
      setManualCoordError('La longitud debe ser un número válido entre -180 y 180 (ej. -3.7038).');
      return;
    }

    const customLoc: WeatherLocation = {
      name: manualName.trim() || `Coordenadas (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
      latitude: lat,
      longitude: lon,
      isDeviceLocation: false,
    };

    handlePickLocation(customLoc, 'manual');
  };

  if (!isOpen) return null;

  const toDisplayTemp = (celsius: number) => {
    if (unit === 'F') {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${celsius}°C`;
  };

  const current = weatherData?.current;
  const daily = weatherData?.daily || [];
  const selectedDay: DailyForecastDay | undefined = daily[selectedDayIndex] || daily[0];

  const currentCondition = current
    ? getWeatherConditionInfo(current.weatherCode, current.isDay)
    : null;

  const selectedCondition = selectedDay
    ? getWeatherConditionInfo(selectedDay.weatherCode, true)
    : null;

  // Format date helper
  const formatDayName = (dateStr: string, index: number) => {
    if (index === 0) return 'Hoy';
    if (index === 1) return 'Mañana';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const dayIdx = (d.getDay() + 6) % 7;
      return DIAS_SEMANA[dayIdx];
    }
    return dateStr;
  };

  const formatShortDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = Number(parts[2]);
      const monthIdx = Number(parts[1]) - 1;
      return `${day} ${MESES[monthIdx]?.slice(0, 3).toLowerCase()}`;
    }
    return dateStr;
  };

  // Find min and max across the week for temperature range visualizer
  const weekMin = daily.length > 0 ? Math.min(...daily.map((d) => d.tempMin)) : 0;
  const weekMax = daily.length > 0 ? Math.max(...daily.map((d) => d.tempMax)) : 30;
  const rangeSpan = Math.max(1, weekMax - weekMin);

  // Filter popular cities by selected category
  const filteredCities = POPULAR_CITIES.filter((city) => {
    if (selectedCategory === 'all') return true;
    return city.category === selectedCategory;
  });

  const isCurrentDevice = locationMode === 'device' || weatherData?.location.isDeviceLocation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-[#151722] border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden">
        {/* Header with Title, Location Status and Quick Switchers */}
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3 bg-gradient-to-r from-sky-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 dark:bg-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <Sun className="w-6 h-6 animate-[spin_20s_linear_infinite]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-bold text-neutral-900 dark:text-neutral-100">
                  El Tiempo y Previsión Semanal
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  En vivo
                </span>
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 flex-wrap">
                {isCurrentDevice ? (
                  <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold">
                    <Navigation className="w-3 h-3 shrink-0 animate-pulse" />
                    GPS Dispositivo:
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300 font-semibold">
                    <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                    Ubicación manual:
                  </span>
                )}
                <span className="font-bold text-neutral-900 dark:text-neutral-100 truncate max-w-[140px] sm:max-w-xs">
                  {weatherData?.location.name || 'Cargando ubicación...'}
                </span>

                {/* Instant Change Location button directly in the modal header */}
                <button
                  type="button"
                  onClick={() => setActiveTab('locations')}
                  className="px-2 py-0.5 rounded-lg bg-[#e8533a]/10 hover:bg-[#e8533a]/20 text-[#e8533a] font-bold text-[11px] border border-[#e8533a]/30 flex items-center gap-1 transition-all"
                  title="Cambiar localización de la previsión manualmente"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                  <span>Cambiar</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Unit Toggle */}
            <button
              type="button"
              onClick={onToggleUnit}
              className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 transition-colors"
              title="Cambiar entre Celsius y Fahrenheit"
            >
              °{unit}
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
              title="Actualizar datos del clima"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switch: Previsión vs Cambiar Localización */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-[#faf8f5] dark:bg-[#181a28] px-5 py-2 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('forecast')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'forecast'
                ? 'bg-white dark:bg-[#151722] text-[#e8533a] shadow-xs font-bold'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Previsión de la semana</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('locations')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'locations'
                ? 'bg-white dark:bg-[#151722] text-[#e8533a] shadow-xs font-bold'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-[#e8533a]" />
            <span>Cambiar localización</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {geoError && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">{geoError}</p>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                  Puedes buscar cualquier ciudad o escribir tus coordenadas manualmente a continuación.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'locations' ? (
            /* Location Selector & Manual Configuration Tab */
            <div className="space-y-6 animate-fadeIn">
              {/* Header explanation banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-transparent border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#e8533a]" />
                    <span>Configurar localización del clima manualmente</span>
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Escribe el nombre de tu ciudad, introduce coordenadas GPS o elige de la lista.
                  </p>
                </div>
              </div>

              {/* SECTION 1: Manual City Search (Real-time live autocomplete) */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 flex items-center justify-between">
                  <span>1. Buscar ciudad, pueblo o municipio</span>
                  {isSearching && (
                    <span className="text-[10px] text-sky-500 font-normal flex items-center gap-1">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Buscando...
                    </span>
                  )}
                </label>

                <form onSubmit={handleSearchSubmit} className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleQueryChange(e.target.value)}
                        placeholder="Ej. Valencia, Granada, Santiago, París, Alcalá..."
                        className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1a1c2b] text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#e8533a]"
                        autoFocus
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={isSearching || !searchQuery.trim()}
                      className="px-4 py-2.5 rounded-xl bg-[#e8533a] hover:bg-[#d4432c] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors shrink-0"
                    >
                      Buscar
                    </button>
                  </div>
                </form>

                {/* Live search results */}
                {searchResults.length > 0 && (
                  <div className="space-y-1.5 p-3 rounded-2xl bg-neutral-50 dark:bg-[#181a28] border border-neutral-200 dark:border-neutral-800">
                    <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                      Coincidencias encontradas ({searchResults.length}):
                    </span>
                    <div className="divide-y divide-neutral-200 dark:divide-neutral-700/60 rounded-xl overflow-hidden bg-white dark:bg-[#151722] border border-neutral-200 dark:border-neutral-800">
                      {searchResults.map((loc, idx) => (
                        <button
                          key={`${loc.latitude}-${loc.longitude}-${idx}`}
                          type="button"
                          onClick={() => handlePickLocation(loc, 'manual')}
                          className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
                        >
                          <div>
                            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-[#e8533a] transition-colors">
                              {loc.name}
                            </p>
                            <p className="text-xs text-neutral-400">
                              {[loc.admin1, loc.country].filter(Boolean).join(', ')} • Lat: {loc.latitude.toFixed(2)}°, Lon: {loc.longitude.toFixed(2)}°
                            </p>
                          </div>
                          <span className="text-xs text-[#e8533a] font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            Seleccionar →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: Manual GPS Coordinates Drawer */}
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#181a28] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#e8533a]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                      2. Introducir coordenadas GPS manualmente
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManualCoords(!showManualCoords)}
                    className="text-xs text-sky-700 dark:text-sky-300 font-semibold hover:underline"
                  >
                    {showManualCoords ? 'Ocultar campos' : 'Personalizar latitud/longitud'}
                  </button>
                </div>

                {showManualCoords && (
                  <form onSubmit={handleApplyManualCoords} className="pt-2 space-y-3">
                    <p className="text-xs text-neutral-500">
                      Ideal para casas rurales, montañas, campings o ubicaciones exactas donde no hay una ciudad oficial:
                    </p>

                    {manualCoordError && (
                      <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                        {manualCoordError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-500 block mb-1">
                          Latitud (-90 a 90)
                        </label>
                        <input
                          type="text"
                          value={manualLat}
                          onChange={(e) => setManualLat(e.target.value)}
                          placeholder="Ej. 40.4168"
                          className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#141622] text-xs font-mono outline-none focus:border-[#e8533a]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-neutral-500 block mb-1">
                          Longitud (-180 a 180)
                        </label>
                        <input
                          type="text"
                          value={manualLon}
                          onChange={(e) => setManualLon(e.target.value)}
                          placeholder="Ej. -3.7038"
                          className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#141622] text-xs font-mono outline-none focus:border-[#e8533a]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-neutral-500 block mb-1">
                          Nombre asignado
                        </label>
                        <input
                          type="text"
                          value={manualName}
                          onChange={(e) => setManualName(e.target.value)}
                          placeholder="Ej. Mi Finca, Sierra..."
                          className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#141622] text-xs outline-none focus:border-[#e8533a]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold transition-all shadow-xs"
                    >
                      Fijar localización por coordenadas manuales
                    </button>
                  </form>
                )}
              </div>

              {/* SECTION 3: Recent manual locations history */}
              {recentLocations.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    <History className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Ubicaciones recientes elegidas manualmente
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentLocations.map((loc, idx) => (
                      <button
                        key={`${loc.name}-${loc.latitude}-${idx}`}
                        type="button"
                        onClick={() => handlePickLocation(loc, 'manual')}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 flex items-center gap-1 transition-colors"
                      >
                        <MapPin className="w-3 h-3 text-[#e8533a]" />
                        <span>{loc.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 4: Choose from curated city list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-neutral-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                      3. O seleccionar de la lista de ciudades
                    </h3>
                  </div>
                  <span className="text-[11px] text-neutral-400">
                    {POPULAR_CITIES.length} ciudades
                  </span>
                </div>

                {/* Category filter pills for the curated city list */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0 ${
                      selectedCategory === 'all'
                        ? 'bg-[#e8533a] text-white font-bold'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    Todas ({POPULAR_CITIES.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('espana')}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0 ${
                      selectedCategory === 'espana'
                        ? 'bg-[#e8533a] text-white font-bold'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    España Peninsular
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('islas')}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0 ${
                      selectedCategory === 'islas'
                        ? 'bg-[#e8533a] text-white font-bold'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    Islas Canarias y Baleares
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('internacional')}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0 ${
                      selectedCategory === 'internacional'
                        ? 'bg-[#e8533a] text-white font-bold'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    Internacionales
                  </button>
                </div>

                {/* Grid of Cities */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredCities.map((city) => {
                    const isSelected =
                      !isCurrentDevice &&
                      weatherData?.location.name === city.name &&
                      Math.abs(weatherData.location.latitude - city.latitude) < 0.1;

                    return (
                      <button
                        key={`${city.name}-${city.latitude}`}
                        type="button"
                        onClick={() => handlePickLocation(city, 'manual')}
                        className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between gap-1 group ${
                          isSelected
                            ? 'bg-[#e8533a] border-[#e8533a] text-white shadow-sm'
                            : 'bg-white dark:bg-[#181a28] border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 dark:hover:bg-[#1f2233]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}`}>
                            {city.name}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                        </div>
                        <span className={`text-[11px] truncate ${isSelected ? 'text-white/80' : 'text-neutral-400'}`}>
                          {city.admin1 || city.country}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 5: Return to Device GPS */}
              <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <LocateFixed className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-sky-950 dark:text-sky-100">
                      ¿Prefieres ubicación automática del dispositivo?
                    </h4>
                    <p className="text-[11px] text-sky-800/80 dark:text-sky-300">
                      Toma automáticamente la posición del sensor GPS del dispositivo.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onRequestGeolocation();
                    setActiveTab('forecast');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-xs shrink-0"
                >
                  Usar GPS del dispositivo
                </button>
              </div>
            </div>
          ) : (
            /* Forecast & Daily Viewer Tab */
            <div className="space-y-6">
              {/* Daily Weather Hero Viewer */}
              {current && currentCondition && (
                <div
                  className={`p-5 sm:p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-gradient-to-br ${currentCondition.bgGradient} relative overflow-hidden shadow-xs`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                          Tiempo actual hoy
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      </div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-5xl sm:text-6xl font-bold font-serif text-neutral-900 dark:text-neutral-100 tracking-tight">
                          {toDisplayTemp(current.temperature)}
                        </span>
                        <div className="space-y-0.5">
                          <p className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
                            {currentCondition.label}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Sensación térmica {toDisplayTemp(current.apparentTemperature)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 italic pt-1 max-w-md">
                        "{currentCondition.advice}"
                      </p>

                      {/* Quick button to switch location */}
                      <button
                        type="button"
                        onClick={() => setActiveTab('locations')}
                        className="text-xs text-sky-700 dark:text-sky-300 font-semibold hover:underline flex items-center gap-1 pt-1"
                      >
                        <MapPin className="w-3 h-3 text-[#e8533a]" />
                        <span>Cambiar localización manualmente →</span>
                      </button>
                    </div>

                    <div className="flex items-center sm:flex-col items-end gap-2 shrink-0">
                      <WeatherIcon
                        code={current.weatherCode}
                        isDay={current.isDay}
                        className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md"
                      />
                      {daily[0] && (
                        <div className="text-xs text-neutral-600 dark:text-neutral-300 font-semibold bg-white/60 dark:bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-xl">
                          ↓ {toDisplayTemp(daily[0].tempMin)} / ↑ {toDisplayTemp(daily[0].tempMax)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4 Micro Metrics Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-black/5 dark:border-white/5">
                    <div className="bg-white/80 dark:bg-[#1a1c2a]/80 backdrop-blur-xs p-2.5 rounded-2xl flex items-center gap-2 border border-black/5 dark:border-white/5">
                      <Droplets className="w-4 h-4 text-cyan-500 shrink-0" />
                      <div>
                        <p className="text-[10px] text-neutral-400 font-medium">Humedad</p>
                        <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                          {current.relativeHumidity}%
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/80 dark:bg-[#1a1c2a]/80 backdrop-blur-xs p-2.5 rounded-2xl flex items-center gap-2 border border-black/5 dark:border-white/5">
                      <Droplets className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <p className="text-[10px] text-neutral-400 font-medium">Prob. lluvia</p>
                        <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                          {daily[0]?.precipitationProbability ?? 0}%
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/80 dark:bg-[#1a1c2a]/80 backdrop-blur-xs p-2.5 rounded-2xl flex items-center gap-2 border border-black/5 dark:border-white/5">
                      <Wind className="w-4 h-4 text-slate-500 shrink-0" />
                      <div>
                        <p className="text-[10px] text-neutral-400 font-medium">Viento</p>
                        <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                          {current.windSpeed} km/h
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/80 dark:bg-[#1a1c2a]/80 backdrop-blur-xs p-2.5 rounded-2xl flex items-center gap-2 border border-black/5 dark:border-white/5">
                      <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-[10px] text-neutral-400 font-medium">Índice UV máx</p>
                        <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                          {daily[0]?.uvIndexMax ?? '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Previsión de la Semana Actual (7 Días) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                    <span>Previsión de los próximos 7 días</span>
                  </h3>
                  <span className="text-[11px] text-neutral-400">
                    Semana actual
                  </span>
                </div>

                <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl bg-white dark:bg-[#151722] overflow-hidden shadow-xs">
                  {daily.map((day, idx) => {
                    const info = getWeatherConditionInfo(day.weatherCode, true);
                    const isSelected = selectedDayIndex === idx;
                    const isToday = idx === 0;

                    // Calculate range bar width & offset
                    const leftPercent = Math.max(0, Math.min(100, ((day.tempMin - weekMin) / rangeSpan) * 100));
                    const widthPercent = Math.max(10, Math.min(100 - leftPercent, ((day.tempMax - day.tempMin) / rangeSpan) * 100));

                    return (
                      <div
                        key={day.date}
                        onClick={() => setSelectedDayIndex(idx)}
                        className={`px-4 py-3 sm:py-3.5 flex items-center gap-3 sm:gap-4 transition-colors cursor-pointer hover:bg-neutral-50 dark:hover:bg-[#1a1c2b] ${
                          isSelected ? 'bg-amber-500/5 dark:bg-amber-500/10' : ''
                        }`}
                      >
                        {/* Day & Date */}
                        <div className="w-24 sm:w-28 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-sm font-bold ${isToday ? 'text-[#e8533a]' : 'text-neutral-800 dark:text-neutral-200'}`}>
                              {formatDayName(day.date, idx)}
                            </span>
                            {isToday && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#e8533a]/15 text-[#e8533a] font-bold">
                                HOY
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-neutral-400">
                            {formatShortDate(day.date)}
                          </span>
                        </div>

                        {/* Weather Icon & Label */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-[120px]">
                          <WeatherIcon code={day.weatherCode} className="w-6 h-6 shrink-0" />
                          <div className="hidden sm:block leading-tight">
                            <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-[140px]">
                              {info.label}
                            </p>
                            {day.precipitationProbability > 0 && (
                              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-0.5">
                                <Droplets className="w-2.5 h-2.5" />
                                {day.precipitationProbability}%
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Small screen rain badge */}
                        <div className="sm:hidden text-right">
                          {day.precipitationProbability > 0 ? (
                            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-0.5">
                              <Droplets className="w-2.5 h-2.5" />
                              {day.precipitationProbability}%
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-400">—</span>
                          )}
                        </div>

                        {/* Temperature Range with Visual Horizontal Bar */}
                        <div className="flex items-center gap-2 sm:gap-3 w-40 sm:w-48 justify-end">
                          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 tabular-nums w-8 text-right">
                            {toDisplayTemp(day.tempMin)}
                          </span>

                          {/* Graphical gradient bar */}
                          <div className="hidden sm:block flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full relative overflow-hidden">
                            <div
                              className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-cyan-400 via-amber-400 to-[#e8533a]"
                              style={{
                                left: `${leftPercent}%`,
                                width: `${widthPercent}%`,
                              }}
                            />
                          </div>

                          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 tabular-nums w-8 text-right">
                            {toDisplayTemp(day.tempMax)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detail drawer for selected day */}
              {selectedDay && (
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#1a1c2b] border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <WeatherIcon code={selectedDay.weatherCode} className="w-5 h-5" />
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        Detalle para {formatDayName(selectedDay.date, selectedDayIndex)} ({formatShortDate(selectedDay.date)})
                      </span>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {selectedCondition?.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white dark:bg-[#151722] p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
                      <span className="text-[10px] text-neutral-400 block">Máxima prevista</span>
                      <b className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                        {toDisplayTemp(selectedDay.tempMax)}
                      </b>
                    </div>
                    <div className="bg-white dark:bg-[#151722] p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
                      <span className="text-[10px] text-neutral-400 block">Mínima nocturna</span>
                      <b className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                        {toDisplayTemp(selectedDay.tempMin)}
                      </b>
                    </div>
                    <div className="bg-white dark:bg-[#151722] p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
                      <span className="text-[10px] text-neutral-400 block">Lluvia máxima</span>
                      <b className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                        {selectedDay.precipitationProbability}%
                      </b>
                    </div>
                    <div className="bg-white dark:bg-[#151722] p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
                      <span className="text-[10px] text-neutral-400 block">Viento máx.</span>
                      <b className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                        {selectedDay.windSpeedMax} km/h
                      </b>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="px-5 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-[#faf8f5] dark:bg-[#161824] flex items-center justify-between text-[11px] text-neutral-400">
          <span>
            Datos meteorológicos en tiempo real vía Open-Meteo
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-100 font-semibold transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
