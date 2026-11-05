import React from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  Snowflake,
  Wind,
} from 'lucide-react';
import { getWeatherConditionInfo } from '../utils/weather';

interface WeatherIconProps {
  code?: number;
  iconName?: string;
  isDay?: boolean;
  className?: string;
  size?: number;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  code,
  iconName,
  isDay = true,
  className = 'w-5 h-5',
}) => {
  let finalName = iconName;
  let colorClass = 'text-amber-500';

  if (code !== undefined) {
    const info = getWeatherConditionInfo(code, isDay);
    finalName = info.iconName;
    colorClass = info.colorClass;
  }

  const combinedClass = `${className} ${colorClass}`;

  switch (finalName) {
    case 'Sun':
      return <Sun className={combinedClass} />;
    case 'CloudSun':
      return <CloudSun className={combinedClass} />;
    case 'Cloud':
      return <Cloud className={combinedClass} />;
    case 'CloudFog':
      return <Wind className={combinedClass} />;
    case 'CloudDrizzle':
      return <CloudDrizzle className={combinedClass} />;
    case 'CloudRain':
      return <CloudRain className={combinedClass} />;
    case 'CloudLightning':
      return <CloudLightning className={combinedClass} />;
    case 'Snowflake':
      return <Snowflake className={combinedClass} />;
    default:
      return <Sun className={combinedClass} />;
  }
};
