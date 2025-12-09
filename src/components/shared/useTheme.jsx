import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getEffectiveUserEmail } from '../admin/ImpersonationBanner';
import { useState, useEffect, useMemo } from 'react';

export function useTheme() {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  
  // Handle system theme detection - must be before any conditional returns
  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setUserLoading(false));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => setSystemDark(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } catch {
      // Ignore media query errors
    }
  }, []);

  const effectiveEmail = useMemo(() => {
    if (!user?.email) return null;
    try {
      return getEffectiveUserEmail(user.email);
    } catch {
      return user.email;
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

  const themeType = preferences?.theme_type || 'light';
  const isDark = themeType === 'dark' || (themeType === 'system' && systemDark);

  const primaryColor = preferences?.primary_color || '#1fd2ea';
  const accentColor = preferences?.accent_color || '#bd84f5';

  // Common class names for easy use
  const bgClass = isDark 
    ? 'bg-[#1f1f23]' 
    : 'bg-gradient-to-br from-teal-50 via-purple-50 to-blue-50';
  
  const textClass = isDark ? 'text-gray-100' : 'text-gray-800';
  const subtextClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const cardBgClass = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white';
  const inputBgClass = isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';
  const hoverClass = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const mutedBgClass = isDark ? 'bg-gray-700/50' : 'bg-gray-50';

  return {
    isDark,
    themeType,
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