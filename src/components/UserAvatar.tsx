import React from 'react';
import { PRESET_AVATARS } from '../utils/motivationalQuotes';

interface UserAvatarProps {
  avatar?: string;
  avatarType?: 'upload' | 'preset' | 'emoji';
  userName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBorder?: boolean;
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-2xl',
  xl: 'w-20 h-20 text-4xl',
  '2xl': 'w-28 h-28 text-5xl',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  avatarType,
  userName = 'Usuario',
  size = 'md',
  className = '',
  showBorder = true,
}) => {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const borderClass = showBorder ? 'ring-2 ring-white/20 shadow-md' : '';

  // 1. Custom uploaded image (Data URL or HTTP URL)
  if (avatar && (avatarType === 'upload' || avatar.startsWith('data:image/') || avatar.startsWith('http://') || avatar.startsWith('https://'))) {
    return (
      <img
        src={avatar}
        alt={userName}
        className={`rounded-full object-cover shrink-0 ${sizeClass} ${borderClass} ${className}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  // 2. Preset avatar
  const presetKey = avatar && avatar.startsWith('preset:') ? avatar : 'preset:sparkle';
  const foundPreset = PRESET_AVATARS.find((p) => p.id === presetKey);

  if (foundPreset) {
    return (
      <div
        className={`rounded-full bg-gradient-to-tr ${foundPreset.gradient} flex items-center justify-center shrink-0 select-none ${sizeClass} ${borderClass} ${className}`}
        title={foundPreset.label}
      >
        <span>{foundPreset.emoji}</span>
      </div>
    );
  }

  // 3. Direct emoji
  if (avatar && avatarType === 'emoji') {
    return (
      <div
        className={`rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 select-none ${sizeClass} ${borderClass} ${className}`}
      >
        <span>{avatar}</span>
      </div>
    );
  }

  // 4. Initial fallback
  const initial = (userName?.trim() || 'U').charAt(0).toUpperCase();
  return (
    <div
      className={`rounded-full bg-gradient-to-tr from-[#e8533a] to-amber-500 text-white font-bold flex items-center justify-center shrink-0 select-none ${sizeClass} ${borderClass} ${className}`}
    >
      <span>{initial}</span>
    </div>
  );
};
