import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getEffectiveUserEmail } from '../admin/ImpersonationBanner';
import { useState, useEffect, useMemo } from 'react';

export function useTheme() {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setUserLoading(false));
  }, []);

  const effectiveEmail = useMemo(() => {
    if (!user || !user.email) return null;
    try {
      const email = getEffectiveUserEmail(user.email);
      return email || null;
    } catch {
      return user.email || null;
    }
  }, [user]);

  const { data: preferences, isLoading: prefsLoading } = useQuery({
    queryKey: ['preferences', effectiveEmail],
    queryFn: async () => {
      if (!effectiveEmail) return null;
      try {
        const prefs = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail }, '-updated_date');
        return prefs[0] || null;
      } catch {
        return null;
      }
    },
    enabled: !!effectiveEmail,
  });

  const primaryColor = preferences?.primary_color || '#1fd2ea';
  const accentColor = preferences?.accent_color || '#bd84f5';
  const isDark = preferences?.app_theme === 'dark';

  // Dynamic theme classes
  const bgClass = isDark 
    ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800' 
    : 'bg-gradient-to-br from-[var(--primary-color)]/5 via-white to-[var(--accent-color)]/5';
    
  const textClass = isDark ? 'text-gray-100' : 'text-gray-900';
  const subtextClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const cardBgClass = isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200';
  const inputBgClass = isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';
  const hoverClass = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const mutedBgClass = isDark ? 'bg-gray-800' : 'bg-gray-50';

  return {
    isDark,
    primaryColor,
    accentColor,
    bgClass,
    textClass,
    subtextClass,
    cardBgClass,
    inputBgClass,
    borderClass,
    hoverClass,
    mutedBgClass,
    user,
    effectiveEmail,
    preferences,
    isLoading: userLoading || (!!effectiveEmail && prefsLoading),
  };
}